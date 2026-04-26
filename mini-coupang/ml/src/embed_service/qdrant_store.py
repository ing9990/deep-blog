"""Qdrant store for product vectors (hybrid: dense + sparse, named vectors).

Wraps the Qdrant async client so the rest of the service (gRPC servicer, tests)
doesn't leak Qdrant-specific types. Replacing the vector DB later means
rewriting only this module.

한국어 메모:
- 컬렉션은 named vectors 두 개:
    "dense"  : 1024-dim cosine. bge-m3 dense 출력
    "sparse" : SparseVector. bge-m3 sparse(lexical) 출력
  Qdrant 1.10+ 의 Query API + Prefetch + FusionQuery(RRF) 로 두 표현을
  single round-trip 에 융합한다. Java 메모리에서 RRF 하던 구조는 폐기.
- `hybrid_search` 가 핵심. dense kNN top-N + sparse top-N 을 prefetch 로
  돌리고 FusionQuery(RRF) 로 합산해 상위 limit 개를 반환한다.
- payload 인덱스 (category_id / status / base_price) 는 그대로 유지.
  search filter 는 prefetch 양쪽에 같이 적용되도록 query_filter 로 넘긴다.
- `get_vectors` 는 FindSimilar 경로용. named vectors 모드라 응답이
  {"dense": [...], "sparse": SparseVector(...)} 형태의 dict 로 온다.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Sequence

from qdrant_client import AsyncQdrantClient
from qdrant_client.http import models as qm

logger = logging.getLogger(__name__)

DEFAULT_HOST = "localhost"
DEFAULT_GRPC_PORT = 6334
DEFAULT_COLLECTION = "products"
DEFAULT_VECTOR_DIM = 1024  # bge-m3 dense dim

# Named vector keys. 컬렉션 생성과 검색 모두 이 이름으로 일관되게 참조한다.
DENSE_VECTOR = "dense"
SPARSE_VECTOR = "sparse"


@dataclass(frozen=True)
class ProductPayload:
    category_id: int
    base_price: int
    status: str        # ACTIVE / INACTIVE / DELETED
    seller_id: int


@dataclass(frozen=True)
class SearchHit:
    product_id: int
    score: float       # FusionQuery(RRF) 후 합산 점수


@dataclass(frozen=True)
class SearchFilter:
    category_id: int | None = None
    min_price: int | None = None
    max_price: int | None = None
    status: str | None = None  # None 이면 노출 상태 제약 없음


@dataclass(frozen=True)
class HybridVector:
    """servicer ↔ store 사이를 흐르는 hybrid 벡터 묶음."""

    dense: list[float]
    sparse_indices: list[int]
    sparse_values: list[float]


class QdrantStore:
    """Typed async wrapper around AsyncQdrantClient with named vectors hybrid."""

    def __init__(
        self,
        host: str = DEFAULT_HOST,
        grpc_port: int = DEFAULT_GRPC_PORT,
        collection_name: str = DEFAULT_COLLECTION,
        vector_dim: int = DEFAULT_VECTOR_DIM,
    ) -> None:
        self.collection_name = collection_name
        self.vector_dim = vector_dim
        # AsyncQdrantClient.__init__ 은 동기. 첫 코루틴 호출에서 실제 연결.
        self._client = AsyncQdrantClient(host=host, grpc_port=grpc_port, prefer_grpc=True)

    # -------------------------------------------------------------------------
    # Collection lifecycle
    # -------------------------------------------------------------------------

    async def ensure_collection(self) -> None:
        """Create the collection (named vectors + payload indexes) if absent."""
        collections = await self._client.get_collections()
        existing = {c.name for c in collections.collections}
        if self.collection_name in existing:
            return

        logger.info(
            "creating collection %s (dense=%d-dim cosine + sparse)",
            self.collection_name, self.vector_dim,
        )
        await self._client.create_collection(
            collection_name=self.collection_name,
            vectors_config={
                DENSE_VECTOR: qm.VectorParams(
                    size=self.vector_dim,
                    distance=qm.Distance.COSINE,
                ),
            },
            sparse_vectors_config={
                SPARSE_VECTOR: qm.SparseVectorParams(
                    index=qm.SparseIndexParams(on_disk=False),
                ),
            },
        )
        # Payload indexes so SearchFilter doesn't full-scan.
        await self._client.create_payload_index(
            collection_name=self.collection_name,
            field_name="category_id",
            field_schema=qm.PayloadSchemaType.INTEGER,
        )
        await self._client.create_payload_index(
            collection_name=self.collection_name,
            field_name="status",
            field_schema=qm.PayloadSchemaType.KEYWORD,
        )
        await self._client.create_payload_index(
            collection_name=self.collection_name,
            field_name="base_price",
            field_schema=qm.PayloadSchemaType.INTEGER,
        )

    async def close(self) -> None:
        await self._client.close()

    # -------------------------------------------------------------------------
    # Writes
    # -------------------------------------------------------------------------

    async def upsert(
        self,
        product_id: int,
        vector: HybridVector,
        payload: ProductPayload,
    ) -> None:
        await self._client.upsert(
            collection_name=self.collection_name,
            points=[
                qm.PointStruct(
                    id=product_id,
                    vector={
                        DENSE_VECTOR: list(vector.dense),
                        SPARSE_VECTOR: qm.SparseVector(
                            indices=list(vector.sparse_indices),
                            values=list(vector.sparse_values),
                        ),
                    },
                    payload={
                        "category_id": payload.category_id,
                        "base_price": payload.base_price,
                        "status": payload.status,
                        "seller_id": payload.seller_id,
                    },
                )
            ],
        )

    async def delete(self, product_id: int) -> None:
        await self._client.delete(
            collection_name=self.collection_name,
            points_selector=qm.PointIdsList(points=[product_id]),
        )

    # -------------------------------------------------------------------------
    # Reads
    # -------------------------------------------------------------------------

    async def hybrid_search(
        self,
        vector: HybridVector,
        limit: int = 10,
        pool_size: int = 100,
        filter_: SearchFilter | None = None,
        exclude_ids: Sequence[int] = (),
    ) -> list[SearchHit]:
        """Single round-trip hybrid: prefetch dense + sparse → RRF fuse.

        - `pool_size` 는 각 prefetch 채널이 회수할 후보 수. 기본 100. RRF 가
          제대로 효과를 보려면 `pool_size > limit` 가 필요하다.
        - filter 는 두 prefetch 와 최종 query 모두에 자동 적용된다 (Qdrant 가
          query_filter 를 prefetch 에 propagate).
        """
        q_filter = self._build_filter(filter_, exclude_ids)
        response = await self._client.query_points(
            collection_name=self.collection_name,
            prefetch=[
                qm.Prefetch(
                    query=list(vector.dense),
                    using=DENSE_VECTOR,
                    limit=pool_size,
                    filter=q_filter,
                ),
                qm.Prefetch(
                    query=qm.SparseVector(
                        indices=list(vector.sparse_indices),
                        values=list(vector.sparse_values),
                    ),
                    using=SPARSE_VECTOR,
                    limit=pool_size,
                    filter=q_filter,
                ),
            ],
            query=qm.FusionQuery(fusion=qm.Fusion.RRF),
            limit=limit,
            query_filter=q_filter,
            with_payload=False,
            with_vectors=False,
        )
        return [
            SearchHit(product_id=int(p.id), score=float(p.score))
            for p in response.points
        ]

    async def get_vectors(self, product_id: int) -> HybridVector | None:
        """Return the stored dense + sparse for a product, or None if absent.

        FindSimilar 경로 전용. 저장된 두 표현을 그대로 다시 hybrid_search 에
        넣어 자기 자신을 source 로 쓰면서 exclude_ids 로 제외한다.
        """
        response = await self._client.retrieve(
            collection_name=self.collection_name,
            ids=[product_id],
            with_vectors=True,
        )
        if not response:
            return None
        vec = response[0].vector
        if not isinstance(vec, dict):
            # named vectors 모드면 항상 dict. 단일 vector 모드 호환은 고려 안 함.
            return None
        dense = vec.get(DENSE_VECTOR)
        sparse = vec.get(SPARSE_VECTOR)
        if dense is None or sparse is None:
            return None
        return HybridVector(
            dense=list(dense),
            sparse_indices=list(sparse.indices),
            sparse_values=list(sparse.values),
        )

    # -------------------------------------------------------------------------
    # Filter building (pure, sync)
    # -------------------------------------------------------------------------

    def _build_filter(
        self,
        filter_: SearchFilter | None,
        exclude_ids: Sequence[int],
    ) -> qm.Filter | None:
        """Build a Qdrant filter from optional domain criteria.

        None fields mean "no constraint on this axis" — including status. The
        caller is responsible for restricting to visible statuses (e.g. ACTIVE
        only) via an explicit SearchFilter.
        """
        must: list[qm.FieldCondition] = []
        must_not: list[qm.HasIdCondition] = []

        if filter_ is not None:
            if filter_.status is not None:
                must.append(qm.FieldCondition(
                    key="status",
                    match=qm.MatchValue(value=filter_.status),
                ))
            if filter_.category_id is not None:
                must.append(qm.FieldCondition(
                    key="category_id",
                    match=qm.MatchValue(value=filter_.category_id),
                ))
            if filter_.min_price is not None or filter_.max_price is not None:
                must.append(qm.FieldCondition(
                    key="base_price",
                    range=qm.Range(
                        gte=filter_.min_price,
                        lte=filter_.max_price,
                    ),
                ))

        if exclude_ids:
            must_not.append(qm.HasIdCondition(has_id=list(exclude_ids)))

        if not must and not must_not:
            return None
        return qm.Filter(must=must or None, must_not=must_not or None)
