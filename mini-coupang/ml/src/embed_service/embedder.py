"""Text embedding wrapper around sentence-transformers.

The default model is BAAI/bge-m3 (multilingual, 1024-dim).
The model is loaded lazily on first use so the gRPC server can start quickly.

한국어 메모:
- sentence-transformers를 서비스 코드에 직접 노출하지 않고 이 모듈로 감싼다.
  모델 교체(bge-m3 → 다른 모델)나 단위 테스트에서 stub 주입이 쉬워진다.
- 모델 로드는 `model` property 접근 시 1회만 수행한다. 프로세스 기동 자체는
  가볍고, `server.build_server`가 부팅 시 `embedder.dimension`을 읽어
  의도적으로 cold start 비용을 선불로 치른다(첫 요청이 느려지는 현상 방지).
- `embed_batch`는 `normalize_embeddings=True`로 L2 정규화된 벡터를 낸다.
  Qdrant는 cosine distance로 저장되므로 정규화된 벡터 간 내적이 곧 유사도다.
- `compose_product_text`는 상품명을 앞에 두고 description을 뒤에 붙인다.
  모델이 앞쪽 토큰에 더 큰 가중을 두는 경향이 있어 상품명 신호를 살린다.
"""
from __future__ import annotations

import logging
import time
from pathlib import Path
from typing import Sequence

from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "BAAI/bge-m3"


class Embedder:
    """Wraps a SentenceTransformer model for product text embedding."""

    def __init__(
        self,
        model_name: str = DEFAULT_MODEL,
        cache_folder: Path | str | None = None,
    ) -> None:
        self.model_name = model_name
        self._cache_folder = str(cache_folder) if cache_folder else None
        self._model: SentenceTransformer | None = None

    @property
    def model(self) -> SentenceTransformer:
        if self._model is None:
            start = time.perf_counter()
            logger.info("loading embedding model: %s", self.model_name)
            self._model = SentenceTransformer(
                self.model_name,
                cache_folder=self._cache_folder,
            )
            elapsed = time.perf_counter() - start
            logger.info(
                "model loaded in %.2fs (dim=%d)",
                elapsed,
                self._model.get_embedding_dimension(),
            )
        return self._model

    @property
    def dimension(self) -> int:
        return int(self.model.get_embedding_dimension())

    def embed(self, text: str) -> list[float]:
        """Embed a single text to a normalized vector (for cosine similarity)."""
        vectors = self.embed_batch([text])
        return vectors[0]

    def embed_batch(self, texts: Sequence[str]) -> list[list[float]]:
        """Embed multiple texts. Returns a list of normalized float vectors."""
        if not texts:
            return []
        vectors = self.model.encode(
            list(texts),
            normalize_embeddings=True,
            convert_to_numpy=True,
        )
        return vectors.tolist()

    @staticmethod
    def compose_product_text(name: str, description: str | None) -> str:
        """Build the input text from product fields.

        Name first, then description, separated by blank line so the encoder
        can give more weight to the name.
        """
        name = (name or "").strip()
        if description and description.strip():
            return f"{name}\n\n{description.strip()}"
        return name
