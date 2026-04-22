"""Tests for the Embedder.

The real bge-m3 model is ~2.3 GB, which is impractical to download every test run.
Unit tests use a small multilingual MiniLM model to verify the wrapper's behavior.
Integration tests (run separately) should exercise bge-m3.
"""
from __future__ import annotations

import numpy as np
import pytest

from embed_service.embedder import Embedder

# Small, fast multilingual model for unit tests.
TEST_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"


@pytest.fixture(scope="module")
def embedder() -> Embedder:
    return Embedder(model_name=TEST_MODEL)


def test_embedding_has_model_dimension(embedder: Embedder) -> None:
    vec = embedder.embed("hello world")
    assert len(vec) == embedder.dimension
    assert embedder.dimension > 0


def test_same_text_produces_identical_vector(embedder: Embedder) -> None:
    v1 = embedder.embed("마우스")
    v2 = embedder.embed("마우스")
    assert v1 == v2


def test_batch_embedding_is_consistent_with_single(embedder: Embedder) -> None:
    single = embedder.embed("키보드")
    batch = embedder.embed_batch(["키보드"])
    assert batch[0] == pytest.approx(single)


def test_empty_batch_returns_empty_list(embedder: Embedder) -> None:
    assert embedder.embed_batch([]) == []


def test_different_texts_produce_different_vectors(embedder: Embedder) -> None:
    v1 = np.array(embedder.embed("마우스"))
    v2 = np.array(embedder.embed("냉장고"))
    cos_sim = float(v1 @ v2 / (np.linalg.norm(v1) * np.linalg.norm(v2)))
    assert cos_sim < 0.99


def test_semantically_close_texts_are_closer_than_far_ones(embedder: Embedder) -> None:
    mouse = np.array(embedder.embed("마우스"))
    keyboard = np.array(embedder.embed("키보드"))
    refrigerator = np.array(embedder.embed("냉장고"))

    def cosine(a: np.ndarray, b: np.ndarray) -> float:
        return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))

    assert cosine(mouse, keyboard) > cosine(mouse, refrigerator)


def test_vectors_are_normalized(embedder: Embedder) -> None:
    v = np.array(embedder.embed("노트북"))
    norm = float(np.linalg.norm(v))
    assert norm == pytest.approx(1.0, abs=1e-3)


class TestComposeProductText:
    def test_name_only(self) -> None:
        assert Embedder.compose_product_text("마우스", None) == "마우스"
        assert Embedder.compose_product_text("마우스", "") == "마우스"
        assert Embedder.compose_product_text("마우스", "   ") == "마우스"

    def test_name_with_description(self) -> None:
        text = Embedder.compose_product_text("마우스", "무선 게이밍 마우스")
        assert "마우스" in text
        assert "무선 게이밍 마우스" in text
        assert "\n\n" in text

    def test_name_trimmed(self) -> None:
        assert Embedder.compose_product_text("  마우스  ", None) == "마우스"
