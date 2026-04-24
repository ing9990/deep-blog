"""gRPC service implementation.

Dispatches the 4 RPCs to the underlying Embedder and QdrantStore.
Kept thin: business logic lives in Embedder / QdrantStore.

한국어 메모:
- 이 파일은 "얇은 디스패처"다. 임베딩 방식이나 벡터 DB 선택 같은 결정은
  각각 embedder/qdrant_store에 있고, 여기서는 proto 메시지를 도메인
  자료형으로 변환하고 호출 경과 시간(elapsed_ms)을 재는 역할만 한다.
- `EmbedAndIndex`는 예외를 gRPC 상태 코드로 던지지 않고 `success=False`로
  응답에 담아 돌려준다. 상품 등록 트랜잭션은 백엔드에서 이미 commit된
  상태(AFTER_COMMIT)로 호출되므로 여기서 예외를 터뜨려도 DB는 롤백되지
  않는다. 호출자가 일관된 응답 메타데이터(vector_dim, elapsed_ms)를
  받는 편이 로깅과 재시도 판정에 유리하다.
- `FindSimilar`는 소스 상품 자신을 결과에서 빼려고 `exclude_ids`로
  product_id를 넘긴다. 그렇지 않으면 source 벡터가 본인과 cosine=1.0으로
  매칭되어 첫 결과를 차지한다.
- `SearchByQuery`와 `FindSimilar`의 filter는 같은 proto 메시지를 공유한다.
  `_to_filter`가 proto optional 필드(HasField 체크)를 dataclass None으로
  바꾼다. proto3 기본값(0, "")과 "미지정"을 구분하려면 HasField가 필수다.
- status 기본값 "ACTIVE"는 EmbedAndIndex 안에서만 적용된다(저장 경로).
  검색 경로에서는 호출자가 명시적으로 지정하거나 빈 값으로 둔다.
"""
from __future__ import annotations

import logging
import time
from typing import Any

import grpc

from embed_service.embedder import Embedder
from embed_service.proto_gen import embed_pb2, embed_pb2_grpc
from embed_service.qdrant_store import (
    ProductPayload,
    QdrantStore,
    SearchFilter,
)

logger = logging.getLogger(__name__)


class EmbedServiceServicer(embed_pb2_grpc.EmbedServiceServicer):
    def __init__(self, embedder: Embedder, store: QdrantStore) -> None:
        self._embedder = embedder
        self._store = store

    # -------------------------------------------------------------------------
    # EmbedAndIndex
    # -------------------------------------------------------------------------

    def EmbedAndIndex(
        self,
        request: embed_pb2.EmbedAndIndexRequest,
        context: grpc.ServicerContext,
    ) -> embed_pb2.EmbedAndIndexResponse:
        start = time.perf_counter()
        try:
            text = Embedder.compose_product_text(request.name, request.description)
            vector = self._embedder.embed(text)
            self._store.upsert(
                product_id=request.product_id,
                vector=vector,
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
                vector_dim=len(vector),
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

    def SearchByQuery(
        self,
        request: embed_pb2.SearchByQueryRequest,
        context: grpc.ServicerContext,
    ) -> embed_pb2.SearchByQueryResponse:
        start = time.perf_counter()
        vector = self._embedder.embed(request.query)
        hits = self._store.search(
            vector=vector,
            limit=request.limit or 10,
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

    def FindSimilar(
        self,
        request: embed_pb2.FindSimilarRequest,
        context: grpc.ServicerContext,
    ) -> embed_pb2.FindSimilarResponse:
        start = time.perf_counter()
        source_vector = self._store.get_vector(request.product_id)
        if source_vector is None:
            context.abort(
                grpc.StatusCode.NOT_FOUND,
                f"product_id={request.product_id} not found in index",
            )
        hits = self._store.search(
            vector=source_vector,
            limit=request.limit or 10,
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

    def RemoveFromIndex(
        self,
        request: embed_pb2.RemoveFromIndexRequest,
        context: grpc.ServicerContext,
    ) -> embed_pb2.RemoveFromIndexResponse:
        self._store.delete(request.product_id)
        return embed_pb2.RemoveFromIndexResponse(success=True)


# ---------------------------------------------------------------------------
# Filter conversion
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
