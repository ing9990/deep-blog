"""Tests for QdrantStore.

Requires a running Qdrant at localhost:6334 (see docker-compose.yml).
Each test uses a unique collection name so parallel test runs don't conflict.
"""
from __future__ import annotations

import random
from collections.abc import Iterator

import numpy as np
import pytest

from embed_service.qdrant_store import (
    ProductPayload,
    QdrantStore,
    SearchFilter,
)

TEST_DIM = 384


@pytest.fixture
def store() -> Iterator[QdrantStore]:
    suffix = random.randint(10_000, 99_999)
    collection = f"test_products_{suffix}"
    s = QdrantStore(collection_name=collection, vector_dim=TEST_DIM)
    s.ensure_collection()
    try:
        yield s
    finally:
        s._client.delete_collection(collection_name=collection)


def _random_vector(seed: int) -> list[float]:
    rng = np.random.default_rng(seed)
    v = rng.normal(size=TEST_DIM)
    v /= np.linalg.norm(v)
    return v.tolist()


def _payload(
    category_id: int = 10,
    base_price: int = 1000,
    status: str = "ACTIVE",
    seller_id: int = 1,
) -> ProductPayload:
    return ProductPayload(
        category_id=category_id,
        base_price=base_price,
        status=status,
        seller_id=seller_id,
    )


def test_ensure_collection_is_idempotent(store: QdrantStore) -> None:
    store.ensure_collection()  # second call should be a no-op
    store.upsert(1, _random_vector(1), _payload())


def test_upsert_and_retrieve_vector(store: QdrantStore) -> None:
    vector = _random_vector(42)
    store.upsert(1, vector, _payload())

    retrieved = store.get_vector(1)
    assert retrieved is not None
    assert len(retrieved) == TEST_DIM
    assert retrieved == pytest.approx(vector, abs=1e-4)


def test_search_returns_nearest_neighbors(store: QdrantStore) -> None:
    store.upsert(1, _random_vector(1), _payload())
    store.upsert(2, _random_vector(2), _payload())
    store.upsert(3, _random_vector(3), _payload())

    hits = store.search(vector=_random_vector(1), limit=3)
    ids = [h.product_id for h in hits]
    # point 1 is identical to the query; it should come first.
    assert ids[0] == 1


def test_filter_by_category(store: QdrantStore) -> None:
    store.upsert(1, _random_vector(1), _payload(category_id=10))
    store.upsert(2, _random_vector(2), _payload(category_id=20))

    hits = store.search(
        vector=_random_vector(1),
        limit=5,
        filter_=SearchFilter(category_id=10),
    )
    ids = [h.product_id for h in hits]
    assert 1 in ids
    assert 2 not in ids


def test_filter_by_price_range(store: QdrantStore) -> None:
    store.upsert(1, _random_vector(1), _payload(base_price=1000))
    store.upsert(2, _random_vector(2), _payload(base_price=5000))
    store.upsert(3, _random_vector(3), _payload(base_price=9000))

    hits = store.search(
        vector=_random_vector(1),
        limit=5,
        filter_=SearchFilter(min_price=2000, max_price=6000),
    )
    ids = [h.product_id for h in hits]
    assert ids == [2]


def test_filter_excludes_ids(store: QdrantStore) -> None:
    store.upsert(1, _random_vector(1), _payload())
    store.upsert(2, _random_vector(2), _payload())

    hits = store.search(
        vector=_random_vector(1),
        limit=5,
        exclude_ids=[1],
    )
    ids = [h.product_id for h in hits]
    assert 1 not in ids
    assert 2 in ids


def test_default_filter_hides_inactive(store: QdrantStore) -> None:
    store.upsert(1, _random_vector(1), _payload(status="ACTIVE"))
    store.upsert(2, _random_vector(2), _payload(status="INACTIVE"))

    hits = store.search(vector=_random_vector(1), limit=5)
    ids = [h.product_id for h in hits]
    assert 1 in ids
    assert 2 not in ids


def test_explicit_status_filter(store: QdrantStore) -> None:
    store.upsert(1, _random_vector(1), _payload(status="ACTIVE"))
    store.upsert(2, _random_vector(2), _payload(status="INACTIVE"))

    hits = store.search(
        vector=_random_vector(1),
        limit=5,
        filter_=SearchFilter(status="INACTIVE"),
    )
    ids = [h.product_id for h in hits]
    assert 2 in ids
    assert 1 not in ids


def test_delete_removes_point(store: QdrantStore) -> None:
    store.upsert(1, _random_vector(1), _payload())
    assert store.get_vector(1) is not None

    store.delete(1)
    assert store.get_vector(1) is None
