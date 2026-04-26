"""Micro-batching embedder for asyncio servers.

여러 개의 concurrent `embed(text)` 호출을 짧은 시간 윈도(`max_wait_ms`) 동안
모아서 한 번의 GPU 배치 추론으로 처리한다. 단건 요청 당 레이턴시는
최악의 경우 `max_wait_ms`만큼 늘어나지만, 동시 요청이 많을 때 GPU
throughput이 크게 오른다.

전형적 수치(bge-m3 + RTX 3060 Ti 기준, 1024-dim):
  - batch=1  : ~50-100ms (요청 하나가 GPU를 독점)
  - batch=32 : ~150-300ms (요청 당 평균 5-10ms)

호출 흐름:
  1. 요청 측이 `await batcher.embed(text)` 호출 → 큐에 (text, Future) 적재.
  2. 워커 태스크가 큐에서 꺼내 첫 아이템 기준으로 `max_wait_ms` 동안 배치 확장.
  3. 배치가 가득 차거나 시간이 다 되면 `loop.run_in_executor(None, embed_batch, texts)`.
     GPU 호출은 블로킹이므로 스레드 풀로 던져 이벤트 루프를 막지 않는다.
  4. 결과 벡터를 각 Future에 set_result로 분배.

주의:
- 단일 워커 태스크. GPU는 단일 CUDA 스트림을 쓰므로 여러 워커가 동시에
  GPU를 건드려도 serialize되기만 한다. 배치 크기로 throughput을 올리지,
  동시 워커 수로 올리지 않는다.
- 셧다운 시 `stop()`을 await하면 큐에 남은 Future는 CancelledError가 된다.
  servicer 쪽은 일반 Exception으로 잡아 gRPC status로 내려준다.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Awaitable, Callable

logger = logging.getLogger(__name__)


# 타입 힌트: embedder가 배치 텍스트를 받아 배치 벡터를 반환하는 동기 함수.
EmbedBatchFn = Callable[[list[str]], list[list[float]]]


class EmbedBatcher:
    """Aggregates concurrent embed requests into GPU batches."""

    def __init__(
        self,
        embed_batch_fn: EmbedBatchFn,
        max_batch: int = 32,
        max_wait_ms: int = 10,
    ) -> None:
        self._embed_batch_fn = embed_batch_fn
        self._max_batch = max_batch
        self._max_wait = max_wait_ms / 1000.0
        # 큐는 start()에서 생성한다 (asyncio.Queue는 호출 시점의 running loop에 바인딩).
        self._queue: asyncio.Queue[tuple[str, asyncio.Future]] | None = None
        self._worker_task: asyncio.Task | None = None

    async def start(self) -> None:
        """이벤트 루프가 실행 중일 때 호출. 큐와 워커 태스크를 초기화한다."""
        if self._worker_task is not None:
            return  # idempotent
        self._queue = asyncio.Queue()
        self._worker_task = asyncio.create_task(self._worker(), name="embed-batcher")

    async def stop(self) -> None:
        """워커 태스크를 정지시킨다. 큐에 남은 Future는 CancelledError로 종결."""
        if self._worker_task is None:
            return
        self._worker_task.cancel()
        try:
            await self._worker_task
        except asyncio.CancelledError:
            pass
        # 큐에 남아있던 대기 요청들 정리
        if self._queue is not None:
            while not self._queue.empty():
                try:
                    _, fut = self._queue.get_nowait()
                    if not fut.done():
                        fut.cancel()
                except asyncio.QueueEmpty:
                    break
        self._worker_task = None
        self._queue = None

    async def embed(self, text: str) -> list[float]:
        """단건 임베딩 요청. 내부적으로 배치에 합쳐져서 처리된다."""
        if self._queue is None:
            raise RuntimeError("EmbedBatcher not started; call start() first")
        loop = asyncio.get_running_loop()
        fut: asyncio.Future = loop.create_future()
        await self._queue.put((text, fut))
        return await fut

    async def _worker(self) -> None:
        """무한 루프. 큐에서 꺼내 배치 확장 후 GPU 실행."""
        assert self._queue is not None  # start() 이후에만 호출되므로 안전
        loop = asyncio.get_running_loop()

        while True:
            # 1) 첫 아이템 대기 (무한 블로킹)
            try:
                text, fut = await self._queue.get()
            except asyncio.CancelledError:
                return

            batch: list[tuple[str, asyncio.Future]] = [(text, fut)]
            deadline = loop.time() + self._max_wait

            # 2) max_wait 동안 batch 확장 시도
            while len(batch) < self._max_batch:
                remaining = deadline - loop.time()
                if remaining <= 0:
                    break
                try:
                    text, fut = await asyncio.wait_for(self._queue.get(), timeout=remaining)
                    batch.append((text, fut))
                except asyncio.TimeoutError:
                    break
                except asyncio.CancelledError:
                    # 셧다운 중. 이미 수집한 batch는 버리고 cancel 시그널 전파.
                    for _, f in batch:
                        if not f.done():
                            f.cancel()
                    return

            # 3) 배치 실행 (GPU 호출은 블로킹이라 executor로)
            texts = [b[0] for b in batch]
            try:
                vectors = await loop.run_in_executor(None, self._embed_batch_fn, texts)
            except Exception as exc:
                logger.exception("embed batch failed (size=%d)", len(batch))
                for _, f in batch:
                    if not f.done():
                        f.set_exception(exc)
                continue

            # 4) 결과 fan-out
            if len(vectors) != len(batch):
                err = RuntimeError(
                    f"embed result size mismatch: expected {len(batch)}, got {len(vectors)}"
                )
                for _, f in batch:
                    if not f.done():
                        f.set_exception(err)
                continue

            for (_, f), vec in zip(batch, vectors):
                if not f.done():
                    f.set_result(vec)
