"""Tests for QdrantStore (hybrid: named vectors).

Requires a running Qdrant at localhost:6334.
랜덤 dense + 랜덤 sparse 로 hybrid 경로를 검증한다. 실제 임베딩 모델은
끌어오지 않는다.
"""
from __future__ import annotations

import random
from collections.abc import AsyncIterator

import numpy as np
import pytest
import pytest_asyncio

from embed_service.qdrant_store import (
    HybridVector,
    ProductPayload,
    QdrantStore,
    SearchFilter,
)

TEST_DIM = 384

pytestmark = pytest.mark.asyncio


@pytest_asyncio.fixture
async def store() -> AsyncIterator[QdrantStore]:
    suffix = random.randint(10_000, 99_999)
    collection = f"test_products_{suffix}"
    s = QdrantStore(collection_name=collection, vector_dim=TEST_DIM)
    await s.ensure_collection()
    try:
        yield s
    finally:
        await s._client.delete_collection(collection_name=collection)
        await s.close()


def _hybrid(seed: int, sparse_size: int = 8) -> HybridVector:
    """deterministic dense (정규화) + sparse (랜덤 token id 집합)."""
    rng = np.random.default_rng(seed)
    d = rng.normal(size=TEST_DIM)
    d /= np.linalg.norm(d)
    # sparse: 랜덤 token id 와 양수 weight
    indices = rng.choice(50_000, size=sparse_size, replace=False).tolist()
    values = rng.uniform(0.1, 1.0, size=sparse_size).tolist()
    return HybridVector(
        dense=d.tolist(),
        sparse_indices=[int(x) for x in indices],
        sparse_values=[float(v) for v in values],
    )


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


async def test_ensure_collection_is_idempotent(store: QdrantStore) -> None:
    await store.ensure_collection()  # second call → no-op
    await store.upsert(1, _hybrid(1), _payload())


async def test_upsert_and_retrieve_hybrid(store: QdrantStore) -> None:
    v = _hybrid(42)
    await store.upsert(1, v, _payload())

    retrieved = await store.get_vectors(1)
    assert retrieved is not None
    assert len(retrieved.dense) == TEST_DIM
    assert retrieved.dense == pytest.approx(v.dense, abs=1e-4)
    # sparse 는 indices 순서가 바뀔 수 있으므로 set 비교
    assert set(retrieved.sparse_indices) == set(v.sparse_indices)


async def test_hybrid_search_returns_self_first(store: QdrantStore) -> None:
    v1 = _hybrid(1)
    await store.upsert(1, v1, _payload())
    await store.upsert(2, _hybrid(2), _payload())
    await store.upsert(3, _hybrid(3), _payload())

    hits = await store.hybrid_search(vector=v1, limit=3)
    ids = [h.product_id for h in hits]
    # 자기와 동일한 dense+sparse 로 질의했으므로 1번이 1순위.
    assert ids[0] == 1


async def test_hybrid_search_filter_by_category(store: QdrantStore) -> None:
    await store.upsert(1, _hybrid(1), _payload(category_id=10))
    await store.upsert(2, _hybrid(2), _payload(category_id=20))

    hits = await store.hybrid_search(
        vector=_hybrid(1),
        limit=5,
        filter_=SearchFilter(category_id=10),
    )
    ids = [h.product_id for h in hits]
    assert 1 in ids
    assert 2 not in ids


async def test_hybrid_search_filter_by_price_range(store: QdrantStore) -> None:
    await store.upsert(1, _hybrid(1), _payload(base_price=1000))
    await store.upsert(2, _hybrid(2), _payload(base_price=5000))
    await store.upsert(3, _hybrid(3), _payload(base_price=9000))

    hits = await store.hybrid_search(
        vector=_hybrid(1),
        limit=5,
        filter_=SearchFilter(min_price=2000, max_price=6000),
    )
    ids = [h.product_id for h in hits]
    assert ids == [2]


async def test_hybrid_search_excludes_ids(store: QdrantStore) -> None:
    await store.upsert(1, _hybrid(1), _payload())
    await store.upsert(2, _hybrid(2), _payload())

    hits = await store.hybrid_search(
        vector=_hybrid(1),
        limit=5,
        exclude_ids=[1],
    )
    ids = [h.product_id for h in hits]
    assert 1 not in ids
    assert 2 in ids


async def test_explicit_status_filter(store: QdrantStore) -> None:
    await store.upsert(1, _hybrid(1), _payload(status="ACTIVE"))
    await store.upsert(2, _hybrid(2), _payload(status="INACTIVE"))

    hits = await store.hybrid_search(
        vector=_hybrid(1),
        limit=5,
        filter_=SearchFilter(status="INACTIVE"),
    )
    ids = [h.product_id for h in hits]
    assert 2 in ids
    assert 1 not in ids


async def test_delete_removes_point(store: QdrantStore) -> None:
    await store.upsert(1, _hybrid(1), _payload())
    assert await store.get_vectors(1) is not None

    await store.delete(1)
    assert await store.get_vectors(1) is None
