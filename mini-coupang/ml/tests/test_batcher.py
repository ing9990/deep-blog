"""Tests for EmbedBatcher.

Uses a fake embed_batch_fn (echoes input size + index) so tests don't
depend on a real model or GPU.
"""
from __future__ import annotations

import asyncio

import pytest

from embed_service.batcher import EmbedBatcher

pytestmark = pytest.mark.asyncio


def fake_embed_batch(texts: list[str]) -> list[list[float]]:
    """Return deterministic fake vectors. `len(texts)`로 실제 배치 크기 검증 가능."""
    # 각 텍스트에 대해 (len(batch), index, hash(text)) 형태의 짧은 벡터를 낸다.
    return [[float(len(texts)), float(i), float(hash(t) % 1000)] for i, t in enumerate(texts)]


async def test_single_request_passes_through() -> None:
    b = EmbedBatcher(fake_embed_batch, max_batch=4, max_wait_ms=5)
    await b.start()
    try:
        v = await b.embed("hello")
        # 단건이라도 batch 크기 1로 처리됐음이 vector[0]에 실려있다.
        assert v[0] == 1.0
        assert v[1] == 0.0
    finally:
        await b.stop()


async def test_concurrent_requests_share_batch() -> None:
    """동시에 들어온 요청들이 하나의 배치로 묶여야 한다."""
    b = EmbedBatcher(fake_embed_batch, max_batch=8, max_wait_ms=50)
    await b.start()
    try:
        # 동시에 6개 요청을 쏜다. max_wait=50ms 안에 다 모여야 한다.
        texts = [f"item-{i}" for i in range(6)]
        results = await asyncio.gather(*[b.embed(t) for t in texts])

        # 모든 결과의 vector[0]에 찍힌 batch size가 같아야 한다 (같은 배치).
        batch_sizes = {r[0] for r in results}
        assert batch_sizes == {6.0}, f"expected single batch of 6, got sizes {batch_sizes}"
    finally:
        await b.stop()


async def test_batch_caps_at_max_batch() -> None:
    """max_batch을 넘기면 다음 배치로 나뉜다."""
    b = EmbedBatcher(fake_embed_batch, max_batch=4, max_wait_ms=100)
    await b.start()
    try:
        texts = [f"item-{i}" for i in range(10)]
        results = await asyncio.gather(*[b.embed(t) for t in texts])

        # 10개가 max_batch=4이므로 4+4+2 또는 유사하게 쪼개진다.
        # 어느 배치든 크기는 <= 4.
        batch_sizes = [r[0] for r in results]
        assert max(batch_sizes) <= 4.0
        assert len(results) == 10
    finally:
        await b.stop()


async def test_stop_cancels_pending() -> None:
    b = EmbedBatcher(fake_embed_batch, max_batch=4, max_wait_ms=10)
    await b.start()
    # 아직 요청이 없으면 워커만 idle. stop만 하면 된다.
    await b.stop()
    # 다시 시작 가능
    await b.start()
    v = await b.embed("restart-test")
    assert v[0] == 1.0
    await b.stop()


async def test_errors_propagate_per_request() -> None:
    """embed_batch가 예외를 던지면 해당 배치의 모든 Future가 같은 예외를 받는다."""
    def raising_embed(_: list[str]) -> list[list[float]]:
        raise RuntimeError("gpu oom")

    b = EmbedBatcher(raising_embed, max_batch=4, max_wait_ms=5)
    await b.start()
    try:
        with pytest.raises(RuntimeError, match="gpu oom"):
            await b.embed("will fail")
    finally:
        await b.stop()
