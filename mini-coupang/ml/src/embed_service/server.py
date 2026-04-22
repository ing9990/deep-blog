"""gRPC server entrypoint for the EmbedService.

Wires up Embedder + QdrantStore + EmbedServiceServicer and starts the
gRPC server on port 50051 (default).
"""
from __future__ import annotations

import logging
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


def serve(port: int = DEFAULT_PORT) -> None:
    server = build_server(port=port)
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
    serve()


if __name__ == "__main__":
    main()
