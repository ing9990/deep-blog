# Build context expected to be mini-coupang/ (see docker-compose.yml).
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# grpcio, sentence-transformers native wheels 빌드에 필요
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential \
 && rm -rf /var/lib/apt/lists/*

# 의존성 먼저 복사 → 레이어 캐시 최대화
COPY ml/requirements.txt /tmp/requirements.txt
RUN pip install -r /tmp/requirements.txt \
 && pip install grpcio-tools

# proto + 소스
COPY shared/proto /proto
COPY ml/src /app/src

# proto codegen + 패키지 상대 import 보정 (Makefile의 proto-gen 동일)
RUN mkdir -p /app/src/embed_service/proto_gen \
 && touch /app/src/embed_service/proto_gen/__init__.py \
 && python -m grpc_tools.protoc \
      -I/proto \
      --python_out=/app/src/embed_service/proto_gen \
      --grpc_python_out=/app/src/embed_service/proto_gen \
      --pyi_out=/app/src/embed_service/proto_gen \
      /proto/embed.proto \
 && python -c "import pathlib; p = pathlib.Path('/app/src/embed_service/proto_gen/embed_pb2_grpc.py'); p.write_text(p.read_text().replace('\nimport embed_pb2 as', '\nfrom . import embed_pb2 as'))"

ENV PYTHONPATH=/app/src
EXPOSE 50051

CMD ["python", "-m", "embed_service.server"]
