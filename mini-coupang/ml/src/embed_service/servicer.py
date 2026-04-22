"""gRPC service implementation.

Dispatches the 4 RPCs to the underlying Embedder and QdrantStore.
Kept thin: business logic lives in Embedder / QdrantStore.
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
