"""gRPC server entrypoint for the EmbedService.

Wires up Embedder + QdrantStore + EmbedServiceServicer and starts the
gRPC server on port 50051 (default).

한국어 메모:
- 부팅 순서: Embedder 로드 → vector_dim 확정 → QdrantStore 생성
  → ensure_collection → gRPC servicer 등록 → listen. Embedder의
  `dimension` 을 먼저 읽는 이유는 두 가지다.
  (1) 첫 gRPC 요청이 모델 로드 비용(수 초)을 떠안지 않도록 cold start를
      부팅 단계로 옮긴다.
  (2) vector_dim을 Qdrant 컬렉션 스펙에 넘겨야 임베딩과 컬렉션의 차원이
      어긋나는 상황이 발생하지 않는다.
- `_shutdown`은 SIGINT/SIGTERM 모두에 설치한다. docker stop은 SIGTERM을
  보내므로 이 핸들러가 없으면 컨테이너 종료 시 in-flight 요청이 끊긴다.
  `server.stop(grace=5)`가 진행 중이던 RPC를 최대 5초 기다려준다.
- `main`은 환경변수로 설정을 주입받는다. 기본값은 기존 로컬 실행
  (`make run`)과 호환되도록 남겨 두고, docker-compose에서는 QDRANT_HOST를
  서비스명 `qdrant`로 덮어써서 컨테이너 네트워크 DNS로 접속한다.
- gRPC ThreadPoolExecutor의 max_workers=10은 실질적으로 "동시에 임베딩을
  처리할 수 있는 요청 수" 상한이다. 모델 추론이 GIL을 잡지 않으므로
  파이썬 스레드로도 병렬화가 가능하지만, CPU 코어 수를 넘어가면 서로
  경합한다. 로컬 개발 환경 기준이라 보수적으로 10으로 둔다.
"""
from __future__ import annotations

import logging
import os
import signal
import sys
from concurrent import futures
from types import FrameType
from typing import Optional

import grpc

from embed_service.embedder import DEFAULT_MODEL, Embedder
from embed_service.proto_gen import embed_pb2_grpc
from embed_service.qdrant_store import (
    DEFAULT_COLLECTION,
    DEFAULT_GRPC_PORT,
    DEFAULT_HOST,
    QdrantStore,
)
from embed_service.servicer import EmbedServiceServicer

logger = logging.getLogger(__name__)

DEFAULT_PORT = 50051
GRACE_SECONDS = 5
MAX_WORKERS = 10


def build_server(
    port: int = DEFAULT_PORT,
    model_name: str = DEFAULT_MODEL,
    qdrant_host: str = DEFAULT_HOST,
    qdrant_grpc_port: int = DEFAULT_GRPC_PORT,
    collection_name: str = DEFAULT_COLLECTION,
) -> grpc.Server:
    """Construct the gRPC server with all dependencies wired up."""
    embedder = Embedder(model_name=model_name)
    # Force model load now so the first request doesn't pay the cold-start cost.
    vector_dim = embedder.dimension
    logger.info("embedder ready (model=%s, dim=%d)", model_name, vector_dim)

    store = QdrantStore(
        host=qdrant_host,
        grpc_port=qdrant_grpc_port,
        collection_name=collection_name,
        vector_dim=vector_dim,
    )
    store.ensure_collection()
    logger.info("qdrant collection '%s' ready at %s:%d", collection_name, qdrant_host, qdrant_grpc_port)

    server = grpc.server(futures.ThreadPoolExecutor(max_workers=MAX_WORKERS))
    embed_pb2_grpc.add_EmbedServiceServicer_to_server(
        EmbedServiceServicer(embedder=embedder, store=store),
        server,
    )
    server.add_insecure_port(f"[::]:{port}")
    return server


def serve(
    port: int = DEFAULT_PORT,
    qdrant_host: str = DEFAULT_HOST,
    qdrant_grpc_port: int = DEFAULT_GRPC_PORT,
    collection_name: str = DEFAULT_COLLECTION,
    model_name: str = DEFAULT_MODEL,
) -> None:
    server = build_server(
        port=port,
        model_name=model_name,
        qdrant_host=qdrant_host,
        qdrant_grpc_port=qdrant_grpc_port,
        collection_name=collection_name,
    )
    logger.info("gRPC server starting on port %d", port)
    server.start()

    def _shutdown(signum: int, _frame: Optional[FrameType]) -> None:
        logger.info("signal %d received, shutting down (grace=%ds)", signum, GRACE_SECONDS)
        server.stop(grace=GRACE_SECONDS)
        sys.exit(0)

    signal.signal(signal.SIGINT, _shutdown)
    signal.signal(signal.SIGTERM, _shutdown)
    server.wait_for_termination()


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    serve(
        port=int(os.getenv("EMBED_PORT", DEFAULT_PORT)),
        qdrant_host=os.getenv("QDRANT_HOST", DEFAULT_HOST),
        qdrant_grpc_port=int(os.getenv("QDRANT_GRPC_PORT", DEFAULT_GRPC_PORT)),
        collection_name=os.getenv("QDRANT_COLLECTION", DEFAULT_COLLECTION),
        model_name=os.getenv("EMBED_MODEL", DEFAULT_MODEL),
    )


if __name__ == "__main__":
    main()
