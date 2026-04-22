.PHONY: install install-dev proto-gen run test clean

PROTO_DIR := ../shared/proto
PROTO_OUT := src/embed_service/proto_gen

install:
	pip install -r requirements.txt

install-dev:
	pip install -r requirements-dev.txt

proto-gen:
	mkdir -p $(PROTO_OUT)
	touch $(PROTO_OUT)/__init__.py
	python -m grpc_tools.protoc \
		-I$(PROTO_DIR) \
		--python_out=$(PROTO_OUT) \
		--grpc_python_out=$(PROTO_OUT) \
		--pyi_out=$(PROTO_OUT) \
		$(PROTO_DIR)/embed.proto
	@# Rewrite absolute import to package-relative so embed_service.proto_gen works
	@python -c "import pathlib; p = pathlib.Path('$(PROTO_OUT)/embed_pb2_grpc.py'); p.write_text(p.read_text().replace('\nimport embed_pb2 as', '\nfrom . import embed_pb2 as'))"

run:
	PYTHONPATH=src python -m embed_service.server

test:
	PYTHONPATH=src pytest tests/

clean:
	rm -rf $(PROTO_OUT)
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name '*.pyc' -delete 2>/dev/null || true
