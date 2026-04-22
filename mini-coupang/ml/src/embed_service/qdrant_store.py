"""Qdrant store for product vectors.

Wraps the Qdrant client so the rest of the service (gRPC servicer, tests)
doesn't leak Qdrant-specific types. Replacing the vector DB later means
rewriting only this module.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Sequence

from qdrant_client import QdrantClient
from qdrant_client.http import models as qm

logger = logging.getLogger(__name__)

DEFAULT_HOST = "localhost"
DEFAULT_GRPC_PORT = 6334
DEFAULT_COLLECTION = "products"
DEFAULT_VECTOR_DIM = 1024  # bge-m3 dimension


@dataclass(frozen=True)
class ProductPayload:
    category_id: int
    base_price: int
    status: str  # ACTIVE / INACTIVE / DELETED
    seller_id: int


@dataclass(frozen=True)
class SearchHit:
    product_id: int
    score: float


@dataclass(frozen=True)
class SearchFilter:
    category_id: int | None = None
    min_price: int | None = None
    max_price: int | None = None
    status: str | None = None  # defaults to "ACTIVE" at query time


class QdrantStore:
    """Typed wrapper around QdrantClient for the products collection."""

    def __init__(
        self,
        host: str = DEFAULT_HOST,
        grpc_port: int = DEFAULT_GRPC_PORT,
        collection_name: str = DEFAULT_COLLECTION,
        vector_dim: int = DEFAULT_VECTOR_DIM,
    ) -> None:
        self.collection_name = collection_name
        self.vector_dim = vector_dim
        self._client = QdrantClient(host=host, grpc_port=grpc_port, prefer_grpc=True)

    # -------------------------------------------------------------------------
    # Collection lifecycle
    # -------------------------------------------------------------------------

    def ensure_collection(self) -> None:
        """Create the collection and payload indexes if they don't exist."""
        existing = {c.name for c in self._client.get_collections().collections}
        if self.collection_name in existing:
            return

        logger.info("creating collection %s (dim=%d)", self.collection_name, self.vector_dim)
        self._client.create_collection(
            collection_name=self.collection_name,
            vectors_config=qm.VectorParams(
                size=self.vector_dim,
                distance=qm.Distance.COSINE,
            ),
        )
        # Payload indexes so SearchFilter can run without full scan.
        self._client.create_payload_index(
            collection_name=self.collection_name,
            field_name="category_id",
            field_schema=qm.PayloadSchemaType.INTEGER,
        )
        self._client.create_payload_index(
            collection_name=self.collection_name,
            field_name="status",
            field_schema=qm.PayloadSchemaType.KEYWORD,
        )
        self._client.create_payload_index(
            collection_name=self.collection_name,
            field_name="base_price",
            field_schema=qm.PayloadSchemaType.INTEGER,
        )

    # -------------------------------------------------------------------------
    # Writes
    # -------------------------------------------------------------------------

    def upsert(
        self,
        product_id: int,
        vector: Sequence[float],
        payload: ProductPayload,
    ) -> None:
        self._client.upsert(
            collection_name=self.collection_name,
            points=[
                qm.PointStruct(
                    id=product_id,
                    vector=list(vector),
                    payload={
                        "category_id": payload.category_id,
                        "base_price": payload.base_price,
                        "status": payload.status,
                        "seller_id": payload.seller_id,
                    },
                )
            ],
        )

    def delete(self, product_id: int) -> None:
        self._client.delete(
            collection_name=self.collection_name,
            points_selector=qm.PointIdsList(points=[product_id]),
        )

    # -------------------------------------------------------------------------
    # Reads
    # -------------------------------------------------------------------------

    def search(
        self,
        vector: Sequence[float],
        limit: int = 10,
        filter_: SearchFilter | None = None,
        exclude_ids: Sequence[int] = (),
    ) -> list[SearchHit]:
        q_filter = self._build_filter(filter_, exclude_ids)
        response = self._client.search(
            collection_name=self.collection_name,
            query_vector=list(vector),
            query_filter=q_filter,
            limit=limit,
        )
        return [SearchHit(product_id=int(p.id), score=float(p.score)) for p in response]

    def get_vector(self, product_id: int) -> list[float] | None:
        """Return the stored vector for a product, or None if not present."""
        response = self._client.retrieve(
            collection_name=self.collection_name,
            ids=[product_id],
            with_vectors=True,
        )
        if not response:
            return None
        vector = response[0].vector
        if vector is None or isinstance(vector, dict):
            return None
        return list(vector)

    # -------------------------------------------------------------------------
    # Filter building
    # -------------------------------------------------------------------------

    def _build_filter(
        self,
        filter_: SearchFilter | None,
        exclude_ids: Sequence[int],
    ) -> qm.Filter | None:
        must: list[qm.FieldCondition] = []
        must_not: list[qm.HasIdCondition] = []

        status = (filter_.status if filter_ and filter_.status else "ACTIVE")
        must.append(
            qm.FieldCondition(key="status", match=qm.MatchValue(value=status))
        )

        if filter_ is not None:
            if filter_.category_id is not None:
                must.append(
                    qm.FieldCondition(
                        key="category_id",
                        match=qm.MatchValue(value=filter_.category_id),
                    )
                )
            if filter_.min_price is not None or filter_.max_price is not None:
                must.append(
                    qm.FieldCondition(
                        key="base_price",
                        range=qm.Range(
                            gte=filter_.min_price,
                            lte=filter_.max_price,
                        ),
                    )
                )

        if exclude_ids:
            must_not.append(qm.HasIdCondition(has_id=list(exclude_ids)))

        return qm.Filter(must=must, must_not=must_not or None)
