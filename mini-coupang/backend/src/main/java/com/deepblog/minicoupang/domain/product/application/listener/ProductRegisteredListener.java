package com.deepblog.minicoupang.domain.product.application.listener;

import com.deepblog.minicoupang.domain.product.application.event.ProductRegistered;
import com.deepblog.minicoupang.domain.product.application.port.out.EmbedPort;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import java.time.Duration;
import java.time.Instant;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
// stage 1: @Component 비활성에 따라 unused. stage 2/3 활성화 시 복구.
// import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Forwards product registration events to the semantic search index.
 *
 * Runs after the surrounding transaction commits so a failed commit never
 * leaves the index with a phantom row. Indexing is handed off to
 * {@code productIndexingExecutor} so gRPC latency to the ML service stays out
 * of the seller-facing HTTP response path. Adapter failures are logged, not
 * rethrown, so a transient ML outage does not block product registration.
 *
 * Each invocation records {@code embed.index.latency} (tag outcome=success|failure)
 * so the indexing path can be observed independently of API latency.
 */
// Stage 1 baseline: gRPC 인덱싱 비활성. @Component 를 주석 처리해 bean 등록을
// 차단하면 @TransactionalEventListener / @Async 와이어링이 끊긴다. 코드는 보존,
// stage 2 ES indexer 또는 stage 3 personalization 채널이 들어올 때 활성화한다.
// @Component
@Slf4j
public class ProductRegisteredListener {

    private final EmbedPort embedPort;
    private final Timer successTimer;
    private final Timer failureTimer;
    private final Timer queueWaitTimer;
    private final Timer e2eTimer;

    public ProductRegisteredListener(EmbedPort embedPort, MeterRegistry meterRegistry) {
        this.embedPort = embedPort;
        this.successTimer = Timer.builder("embed.index.latency")
            .description("Time spent indexing a product into Qdrant after commit")
            .tag("outcome", "success")
            .register(meterRegistry);
        this.failureTimer = Timer.builder("embed.index.latency")
            .tag("outcome", "failure")
            .register(meterRegistry);
        this.queueWaitTimer = Timer.builder("product.indexing.queue.wait")
            .description("Delay between event publication and listener execution start")
            .register(meterRegistry);
        this.e2eTimer = Timer.builder("product.indexing.e2e")
            .description("End-to-end indexing latency from commit to Qdrant upsert")
            .register(meterRegistry);
    }

    @Async("productIndexingExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(ProductRegistered event) {
        Instant enteredAt = Instant.now();
        queueWaitTimer.record(Duration.between(event.publishedAt(), enteredAt));

        Timer.Sample sample = Timer.start();
        try {
            embedPort.indexProduct(event.toIndexCommand());
            sample.stop(successTimer);
        } catch (Exception e) {
            sample.stop(failureTimer);
            log.warn("Failed to index product {} after commit", event.productId(), e);
        } finally {
            e2eTimer.record(Duration.between(event.publishedAt(), Instant.now()));
        }
    }
}
