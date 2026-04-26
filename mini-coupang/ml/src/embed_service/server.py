"""gRPC server entrypoint for the EmbedService (asyncio).

Wires up Embedder + EmbedBatcher + QdrantStore + EmbedServiceServicer and
starts the gRPC asyncio server on port 50051 (default).

한국어 메모:
- 2026-04-25 asyncio 전환: `grpc.server(ThreadPoolExecutor)` → `grpc.aio.server()`.
  동기 스레드풀 모델에서 GIL+CUDA 단일 스트림의 직렬화가 문제였는데, asyncio
  이벤트 루프 + EmbedBatcher로 concurrent 요청을 GPU 배치로 묶어 throughput을
  올린다.
- 부팅 순서: Embedder 로드 → vector_dim 확정 → QdrantStore 생성 → ensure_collection
  (async) → EmbedBatcher 시작 → gRPC servicer 등록 → listen. Embedder의
  `dimension`을 먼저 읽는 이유는 두 가지다.
  (1) 첫 gRPC 요청이 모델 로드 비용(수 초)을 떠안지 않도록 cold start를
      부팅 단계로 옮긴다.
  (2) vector_dim을 Qdrant 컬렉션 스펙에 넘겨야 임베딩과 컬렉션의 차원이
      어긋나는 상황이 발생하지 않는다.
- 셧다운: POSIX면 loop.add_signal_handler로 SIGINT/SIGTERM을 잡고, Windows면
  KeyboardInterrupt만 처리된다. 어느 경로든 try/finally가 gRPC server, batcher,
  qdrant client를 순서대로 정리한다.
- `main`은 환경변수로 설정을 주입받는다. 기본값은 기존 로컬 실행과 호환.
  EMBED_BATCH_SIZE, EMBED_BATCH_WAIT_MS로 배치 파라미터 조정 가능.
"""
from __future__ import annotations

import asyncio
import logging
import os
import signal
import sys

import grpc

from embed_service.batcher import EmbedBatcher
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
DEFAULT_BATCH_SIZE = 32
DEFAULT_BATCH_WAIT_MS = 10


async def serve(
    port: int = DEFAULT_PORT,
    model_name: str = DEFAULT_MODEL,
    qdrant_host: str = DEFAULT_HOST,
    qdrant_grpc_port: int = DEFAULT_GRPC_PORT,
    collection_name: str = DEFAULT_COLLECTION,
    batch_size: int = DEFAULT_BATCH_SIZE,
    batch_wait_ms: int = DEFAULT_BATCH_WAIT_MS,
) -> None:
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
    await store.ensure_collection()
    logger.info(
        "qdrant collection '%s' ready at %s:%d",
        collection_name, qdrant_host, qdrant_grpc_port,
    )

    batcher = EmbedBatcher(
        embed_batch_fn=embedder.embed_batch,
        max_batch=batch_size,
        max_wait_ms=batch_wait_ms,
    )
    await batcher.start()
    logger.info("embed batcher started (max_batch=%d, max_wait_ms=%d)", batch_size, batch_wait_ms)

    server = grpc.aio.server()
    embed_pb2_grpc.add_EmbedServiceServicer_to_server(
        EmbedServiceServicer(batcher=batcher, store=store),
        server,
    )
    server.add_insecure_port(f"[::]:{port}")

    await server.start()
    logger.info("gRPC server listening on port %d", port)

    # POSIX signal wiring. Windows는 loop.add_signal_handler 미지원이라 skip.
    stop_event = asyncio.Event()
    loop = asyncio.get_running_loop()
    if sys.platform != "win32":
        for sig in (signal.SIGINT, signal.SIGTERM):
            loop.add_signal_handler(sig, stop_event.set)

    try:
        if sys.platform != "win32":
            await stop_event.wait()
        else:
            # Windows: KeyboardInterrupt가 asyncio.run() 바깥으로 새면서 종료 유도.
            await server.wait_for_termination()
    except (KeyboardInterrupt, asyncio.CancelledError):
        pass
    finally:
        logger.info("shutting down (grace=%ds)", GRACE_SECONDS)
        await server.stop(grace=GRACE_SECONDS)
        await batcher.stop()
        await store.close()
        logger.info("shutdown complete")


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    try:
        asyncio.run(serve(
            port=int(os.getenv("EMBED_PORT", DEFAULT_PORT)),
            qdrant_host=os.getenv("QDRANT_HOST", DEFAULT_HOST),
            qdrant_grpc_port=int(os.getenv("QDRANT_GRPC_PORT", DEFAULT_GRPC_PORT)),
            collection_name=os.getenv("QDRANT_COLLECTION", DEFAULT_COLLECTION),
            model_name=os.getenv("EMBED_MODEL", DEFAULT_MODEL),
            batch_size=int(os.getenv("EMBED_BATCH_SIZE", DEFAULT_BATCH_SIZE)),
            batch_wait_ms=int(os.getenv("EMBED_BATCH_WAIT_MS", DEFAULT_BATCH_WAIT_MS)),
        ))
    except KeyboardInterrupt:
        pass  # finally 블록이 이미 정리를 마침


if __name__ == "__main__":
    main()
