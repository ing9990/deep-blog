# mini-coupang ML Service

Python gRPC service that generates embeddings (bge-m3) and manages the Qdrant vector index for mini-coupang's hybrid search.

Spring Boot calls this service via gRPC (port 50051) whenever product registration or search needs vector operations. The Spring Boot side never touches Qdrant directly.

## Local development

Requires Python 3.12.

```bash
# Create venv + install dev dependencies
python -m venv .venv
source .venv/bin/activate
make install-dev

# Generate proto stubs (run once, and after every proto change)
make proto-gen

# Start the gRPC server
make run

# Run tests
make test
```

## Directory

```
mini-coupang/ml/
  requirements.txt        # Runtime dependencies
  requirements-dev.txt    # Runtime + dev (pytest, grpcio-tools)
  Makefile                # install / proto-gen / run / test
  src/embed_service/
    __init__.py
    server.py             # gRPC server entrypoint (skeleton)
    embedder.py           # bge-m3 embedding wrapper (C4)
    qdrant_store.py       # Qdrant upsert / search (C5)
    servicer.py           # gRPC service implementation (C6)
    proto_gen/            # generated from ../shared/proto/embed.proto (gitignored)
```

## Contract

Proto definition: [`../shared/proto/embed.proto`](../shared/proto/embed.proto).

- `EmbedAndIndex` — called by Spring Boot on product registration.
- `SearchByQuery` — called on product search (query text to top-K hits).
- `FindSimilar` — called on "similar products" recommendation.
- `RemoveFromIndex` — called on product deletion / deactivation.
