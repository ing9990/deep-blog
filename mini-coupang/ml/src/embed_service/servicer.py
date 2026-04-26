"""gRPC service implementation (asyncio, hybrid).

4개 RPC 모두 hybrid (dense + sparse) 경로를 탄다. EmbedAndIndex 는 두
표현을 한 번의 forward pass 로 얻어 named vectors 둘 다에 upsert.
SearchByQuery / FindSimilar 는 Qdrant Query API 의 prefetch +
FusionQuery(RRF) 로 single round-trip hybrid.

한국어 메모:
- 2026-04-25 hybrid 전환: Java 메모리에서 두 채널을 합치던 RRF 를 폐기
  하고 검색 책임을 Python + Qdrant 에 통째로 위임. Java 는 gRPC 한 번 +
  MySQL fetch 만 한다.
- `EmbedAndIndex` 는 예외를 gRPC 상태 코드로 던지지 않고 `success=False`
  로 응답에 담는다. AFTER_COMMIT 이후라 여기서 예외를 터뜨려도 DB 롤백 의미
  없음. 호출자가 일관된 응답 메타데이터(vector_dim, elapsed_ms)를 받는 편이
  로깅·재시도 판정에 유리.
- `FindSimilar` 는 임베딩 없이 저장된 두 표현을 그대로 다시 query 로 사용.
  `exclude_ids` 로 자기 자신을 결과에서 제외.
- `SearchByQuery` 의 `pool_size` 는 RRF 가 의미를 가지려면 limit 보다 커야
  해서 `max(100, limit)` 으로 잡는다.
"""
from __future__ import annotations

import logging
import time
from typing import Any

import grpc

from embed_service.batcher import EmbedBatcher
from embed_service.embedder import Embedder, HybridEmbedding
from embed_service.proto_gen import embed_pb2, embed_pb2_grpc
from embed_service.qdrant_store import (
    HybridVector,
    ProductPayload,
    QdrantStore,
    SearchFilter,
)

logger = logging.getLogger(__name__)

DEFAULT_POOL_SIZE = 100  # RRF prefetch 채널별 후보 수 하한


def _to_vec(emb: HybridEmbedding) -> HybridVector:
    """Embedder 의 출력 dataclass 를 store 의 입력 dataclass 로 옮긴다."""
    return HybridVector(
        dense=emb.dense,
        sparse_indices=emb.sparse_indices,
        sparse_values=emb.sparse_values,
    )


class EmbedServiceServicer(embed_pb2_grpc.EmbedServiceServicer):
    def __init__(self, batcher: EmbedBatcher, store: QdrantStore) -> None:
        self._batcher = batcher
        self._store = store

    # -------------------------------------------------------------------------
    # EmbedAndIndex
    # -------------------------------------------------------------------------

    async def EmbedAndIndex(
        self,
        request: embed_pb2.EmbedAndIndexRequest,
        context: grpc.aio.ServicerContext,
    ) -> embed_pb2.EmbedAndIndexResponse:
        start = time.perf_counter()
        try:
            text = Embedder.compose_product_text(request.name, request.description)
            embedding = await self._batcher.embed(text)
            await self._store.upsert(
                product_id=request.product_id,
                vector=_to_vec(embedding),
                payload=ProductPayload(
                    category_id=request.payload.category_id,
                    base_price=request.payload.base_price,
                    status=request.payload.status or "ACTIVE",
                    seller_id=request.payload.seller_id,
                ),
            )
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            return embed_pb2.EmbedAndIndexResponse(
                success=True,
                vector_dim=len(embedding.dense),
                elapsed_ms=elapsed_ms,
                error_message="",
            )
        except Exception as exc:
            logger.exception("EmbedAndIndex failed for product_id=%d", request.product_id)
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            return embed_pb2.EmbedAndIndexResponse(
                success=False,
                vector_dim=0,
                elapsed_ms=elapsed_ms,
                error_message=str(exc),
            )

    # -------------------------------------------------------------------------
    # SearchByQuery
    # -------------------------------------------------------------------------

    async def SearchByQuery(
        self,
        request: embed_pb2.SearchByQueryRequest,
        context: grpc.aio.ServicerContext,
    ) -> embed_pb2.SearchByQueryResponse:
        start = time.perf_counter()
        embedding = await self._batcher.embed(request.query)
        limit = request.limit or 10
        hits = await self._store.hybrid_search(
            vector=_to_vec(embedding),
            limit=limit,
            pool_size=max(DEFAULT_POOL_SIZE, limit),
            filter_=_to_filter(request),
        )
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        return embed_pb2.SearchByQueryResponse(
            hits=[embed_pb2.SearchHit(product_id=h.product_id, score=h.score) for h in hits],
            elapsed_ms=elapsed_ms,
        )

    # -------------------------------------------------------------------------
    # FindSimilar
    # -------------------------------------------------------------------------

    async def FindSimilar(
        self,
        request: embed_pb2.FindSimilarRequest,
        context: grpc.aio.ServicerContext,
    ) -> embed_pb2.FindSimilarResponse:
        start = time.perf_counter()
        source = await self._store.get_vectors(request.product_id)
        if source is None:
            await context.abort(
                grpc.StatusCode.NOT_FOUND,
                f"product_id={request.product_id} not found in index",
            )
        limit = request.limit or 10
        hits = await self._store.hybrid_search(
            vector=source,
            limit=limit,
            pool_size=max(DEFAULT_POOL_SIZE, limit),
            filter_=_to_filter(request),
            exclude_ids=[request.product_id],
        )
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        return embed_pb2.FindSimilarResponse(
            hits=[embed_pb2.SearchHit(product_id=h.product_id, score=h.score) for h in hits],
            elapsed_ms=elapsed_ms,
        )

    # -------------------------------------------------------------------------
    # RemoveFromIndex
    # -------------------------------------------------------------------------

    async def RemoveFromIndex(
        self,
        request: embed_pb2.RemoveFromIndexRequest,
        context: grpc.aio.ServicerContext,
    ) -> embed_pb2.RemoveFromIndexResponse:
        await self._store.delete(request.product_id)
        return embed_pb2.RemoveFromIndexResponse(success=True)


# ---------------------------------------------------------------------------
# Filter conversion (pure, sync)
# ---------------------------------------------------------------------------

def _to_filter(request: Any) -> SearchFilter | None:
    """Convert proto SearchFilter (all fields optional) to dataclass.

    Both SearchByQueryRequest and FindSimilarRequest carry a SearchFilter.
    """
    if not request.HasField("filter"):
        return None
    f = request.filter
    return SearchFilter(
        category_id=f.category_id if f.HasField("category_id") else None,
        min_price=f.min_price if f.HasField("min_price") else None,
        max_price=f.max_price if f.HasField("max_price") else None,
        status=f.status if f.HasField("status") else None,
    )
