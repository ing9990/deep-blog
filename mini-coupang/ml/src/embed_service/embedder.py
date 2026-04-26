"""Hybrid (dense + sparse) text embedding via BAAI/bge-m3.

bge-m3 의 한 forward pass에서 dense (1024-dim, MTEB) 와 lexical sparse
(token-weight dict) 두 표현을 같이 얻는다. 우리는 이 두 표현을 그대로
Qdrant 의 named vectors(`dense` / `sparse`)에 넣고, 검색 시 Qdrant
Query API + Prefetch + FusionQuery(RRF) 로 single round-trip hybrid를
한다. Java 쪽에서 두 채널을 받아 메모리 RRF 하던 구조를 폐기한 결과다.

한국어 메모:
- 기존 sentence-transformers 래퍼는 dense만 노출했다. 같은 모델로
  sparse도 같이 받으려면 FlagEmbedding 의 `BGEM3FlagModel` 이 자연스럽다.
- `HybridEmbedding`은 dense 벡터와 sparse(indices/values) 두 표현을 묶는
  값 객체. servicer ↔ store 사이 의존을 좁힌다.
- sparse weight 의 키는 bge-m3 토크나이저의 token id. FlagEmbedding 버전에
  따라 str 또는 int 로 나오는데, 우리는 항상 int 로 정규화해 Qdrant
  SparseVector 의 `indices` 필드에 그대로 박는다.
- 모델 로드는 lazy. `dimension` property 가 첫 접근 시 probe encode 한 번
  돌려 dense 차원(1024)을 확정한다. 부팅 시각에 server.py 가 이 차원을
  먼저 강제 로드해 cold-start 비용을 부팅 단계로 옮긴다.
"""
from __future__ import annotations  # PEP 563: int | None 등 PEP 604 문법

import logging
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Sequence

from FlagEmbedding import BGEM3FlagModel  # bge-m3 전용 wrapper. dense + sparse 동시 출력 지원

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "BAAI/bge-m3"  # 다국어 + dense/sparse 동시 출력 가능한 1024-dim 모델


@dataclass(frozen=True)
class HybridEmbedding:
    """한 텍스트의 dense + sparse 두 표현을 묶은 값 객체."""

    dense: list[float]                # 1024-dim cosine 정규화된 dense 벡터
    sparse_indices: list[int]         # 활성 토큰 id 목록 (오름차순일 필요는 없음)
    sparse_values: list[float]        # 같은 길이의 weight 목록 (BM25-like)


class Embedder:
    """bge-m3 hybrid 임베딩 래퍼."""

    def __init__(
        self,
        model_name: str = DEFAULT_MODEL,           # 모델 ID. 실험·A/B에서 덮어쓰기 가능
        cache_folder: Path | str | None = None,    # FlagEmbedding/HF 모델 캐시 디렉터리
        use_fp16: bool = True,                     # GPU에서 fp16 로 inference. CPU에선 자동 무시
    ) -> None:
        self.model_name = model_name
        self._cache_folder = str(cache_folder) if cache_folder else None
        self._use_fp16 = use_fp16
        self._model: BGEM3FlagModel | None = None  # lazy load
        self._dim: int | None = None               # dense 차원. probe 후 캐시

    @property
    def model(self) -> BGEM3FlagModel:
        if self._model is None:
            start = time.perf_counter()
            logger.info("loading embedding model: %s", self.model_name)
            self._model = BGEM3FlagModel(
                self.model_name,
                use_fp16=self._use_fp16,
                cache_dir=self._cache_folder,
            )
            elapsed = time.perf_counter() - start
            logger.info("model loaded in %.2fs", elapsed)
        return self._model

    @property
    def dimension(self) -> int:
        """dense 벡터 차원. 첫 호출 시 probe encode 로 확정."""
        if self._dim is None:
            out = self.model.encode(["probe"], return_dense=True, return_sparse=False)
            self._dim = int(len(out["dense_vecs"][0]))
            logger.info("embedder dim probed: %d", self._dim)
        return self._dim

    def embed_batch(self, texts: Sequence[str]) -> list[HybridEmbedding]:
        """배치 텍스트 → HybridEmbedding 리스트.

        한 forward pass 로 dense 와 sparse 를 모두 얻는다 (bge-m3 의 핵심 효율).
        gRPC servicer 에서 EmbedBatcher 의 worker 가 이 함수를 run_in_executor
        로 호출하므로, 본 함수 자체는 CPU/GPU bound 동기 함수다.
        """
        if not texts:
            return []
        out = self.model.encode(
            list(texts),
            return_dense=True,
            return_sparse=True,
            return_colbert_vecs=False,    # multi-vector 표현은 현재 미사용 (RRF 두 채널만)
        )
        denses = out["dense_vecs"]        # numpy.ndarray shape=(n, 1024)
        sparses = out["lexical_weights"]  # list[defaultdict[token_id_str_or_int, float]]

        results: list[HybridEmbedding] = []
        for d, s in zip(denses, sparses):
            # sparse 키를 항상 int 로 정규화해 Qdrant SparseVector 가 그대로 받게 한다.
            indices: list[int] = []
            values: list[float] = []
            for k, v in s.items():
                indices.append(int(k))
                values.append(float(v))
            results.append(HybridEmbedding(
                dense=d.tolist(),
                sparse_indices=indices,
                sparse_values=values,
            ))
        return results

    @staticmethod
    def compose_product_text(name: str, description: str | None) -> str:
        """상품 임베딩 입력 텍스트.

        name 을 앞에, description 을 빈 줄로 분리해 뒤에 붙인다. 모델이 앞쪽
        토큰에 더 큰 가중을 두는 경향이 있어 상품명 신호가 살아남는다.
        """
        name = (name or "").strip()
        if description and description.strip():
            return f"{name}\n\n{description.strip()}"
        return name
