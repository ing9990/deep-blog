"""Tests for EmbedServiceServicer.

Direct method invocation with a MagicMock ServicerContext. Real gRPC transport
is tested by higher-level integration tests once Spring Boot is wired in.

Requires a running Qdrant at localhost:6334. Uses the small MiniLM model
so tests don't need to download the 2.3GB bge-m3.
"""
from __future__ import annotations

import random
from collections.abc import Iterator
from unittest.mock import MagicMock

import pytest

from embed_service.embedder import Embedder
from embed_service.proto_gen import embed_pb2
from embed_service.qdrant_store import QdrantStore
from embed_service.servicer import EmbedServiceServicer

TEST_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"


@pytest.fixture(scope="module")
def embedder() -> Embedder:
    return Embedder(model_name=TEST_MODEL)


@pytest.fixture
def store(embedder: Embedder) -> Iterator[QdrantStore]:
    suffix = random.randint(10_000, 99_999)
    collection = f"test_servicer_{suffix}"
    s = QdrantStore(collection_name=collection, vector_dim=embedder.dimension)
    s.ensure_collection()
    try:
        yield s
    finally:
        s._client.delete_collection(collection_name=collection)


@pytest.fixture
def servicer(embedder: Embedder, store: QdrantStore) -> EmbedServiceServicer:
    return EmbedServiceServicer(embedder=embedder, store=store)


def _payload_msg(
    category_id: int = 10,
    base_price: int = 1000,
    status: str = "ACTIVE",
    seller_id: int = 1,
) -> embed_pb2.ProductPayload:
    return embed_pb2.ProductPayload(
        category_id=category_id,
        base_price=base_price,
        status=status,
        seller_id=seller_id,
    )


def _index(
    servicer: EmbedServiceServicer,
    product_id: int,
    name: str,
    description: str = "",
    payload: embed_pb2.ProductPayload | None = None,
) -> None:
    req = embed_pb2.EmbedAndIndexRequest(
        product_id=product_id,
        name=name,
        description=description,
        payload=payload or _payload_msg(),
    )
    response = servicer.EmbedAndIndex(req, MagicMock())
    assert response.success, f"EmbedAndIndex failed: {response.error_message}"


class TestEmbedAndIndex:
    def test_successfully_indexes_product(self, servicer: EmbedServiceServicer) -> None:
        request = embed_pb2.EmbedAndIndexRequest(
            product_id=1,
            name="무선 게이밍 마우스",
            description="인체공학적 디자인",
            payload=_payload_msg(),
        )
        response = servicer.EmbedAndIndex(request, MagicMock())

        assert response.success is True
        assert response.vector_dim > 0
        assert response.error_message == ""
        assert response.elapsed_ms >= 0

    def test_description_is_optional(self, servicer: EmbedServiceServicer) -> None:
        request = embed_pb2.EmbedAndIndexRequest(
            product_id=2,
            name="기계식 키보드",
            description="",
            payload=_payload_msg(),
        )
        response = servicer.EmbedAndIndex(request, MagicMock())
        assert response.success is True


class TestSearchByQuery:
    def test_retrieves_semantically_close_product_first(
        self, servicer: EmbedServiceServicer
    ) -> None:
        _index(servicer, 1, "무선 게이밍 마우스")
        _index(servicer, 2, "기계식 키보드")
        _index(servicer, 3, "냉장고")

        response = servicer.SearchByQuery(
            embed_pb2.SearchByQueryRequest(query="마우스", limit=3),
            MagicMock(),
        )

        ids = [h.product_id for h in response.hits]
        # 상대 순위만 검증: 마우스(1)가 냉장고(3)보다 앞에 위치해야 한다.
        # MiniLM의 한국어 단어 수준 매칭 품질 한계로 top-1 엄밀 검증은 피함.
        # 실제 런타임은 bge-m3를 쓰므로 더 정확한 결과가 나온다.
        assert ids.index(1) < ids.index(3)

    def test_category_filter_narrows_results(
        self, servicer: EmbedServiceServicer
    ) -> None:
        _index(servicer, 1, "무선 마우스", payload=_payload_msg(category_id=10))
        _index(servicer, 2, "게이밍 마우스", payload=_payload_msg(category_id=20))

        request = embed_pb2.SearchByQueryRequest(query="마우스", limit=5)
        request.filter.category_id = 10

        response = servicer.SearchByQuery(request, MagicMock())
        ids = [h.product_id for h in response.hits]
        assert 1 in ids
        assert 2 not in ids


class TestFindSimilar:
    def test_excludes_source_product(self, servicer: EmbedServiceServicer) -> None:
        _index(servicer, 1, "무선 마우스")
        _index(servicer, 2, "게이밍 마우스")
        _index(servicer, 3, "냉장고")

        response = servicer.FindSimilar(
            embed_pb2.FindSimilarRequest(product_id=1, limit=3),
            MagicMock(),
        )

        ids = [h.product_id for h in response.hits]
        assert 1 not in ids
        # 마우스 2개가 냉장고보다 가까움
        assert 2 in ids

    def test_missing_product_aborts_with_not_found(
        self, servicer: EmbedServiceServicer
    ) -> None:
        context = MagicMock()
        context.abort.side_effect = RuntimeError("aborted")

        with pytest.raises(RuntimeError, match="aborted"):
            servicer.FindSimilar(
                embed_pb2.FindSimilarRequest(product_id=999, limit=3),
                context,
            )

        import grpc

        context.abort.assert_called_once()
        status_arg = context.abort.call_args.args[0]
        assert status_arg == grpc.StatusCode.NOT_FOUND


class TestRemoveFromIndex:
    def test_removes_indexed_product(
        self,
        servicer: EmbedServiceServicer,
        store: QdrantStore,
    ) -> None:
        _index(servicer, 1, "테스트 상품")
        assert store.get_vector(1) is not None

        response = servicer.RemoveFromIndex(
            embed_pb2.RemoveFromIndexRequest(product_id=1),
            MagicMock(),
        )
        assert response.success is True
        assert store.get_vector(1) is None
