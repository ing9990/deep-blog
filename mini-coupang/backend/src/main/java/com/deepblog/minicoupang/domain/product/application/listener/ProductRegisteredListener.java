package com.deepblog.minicoupang.domain.product.application.listener;

import com.deepblog.minicoupang.domain.product.application.event.ProductRegistered;
import com.deepblog.minicoupang.domain.product.application.port.out.EmbedPort;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Forwards product registration events to the semantic search index.
 *
 * Runs after the surrounding transaction commits so a failed commit never
 * leaves the index with a phantom row. Phase 1 treats indexing as best-effort:
 * adapter failures are logged, not rethrown, so a transient ML outage does
 * not block product registration.
 *
 * Each invocation records {@code embed.index.latency} (tag outcome=success|failure)
 * so the indexing path can be observed independently of API latency.
 */
@Component
@Slf4j
public class ProductRegisteredListener {

    private final EmbedPort embedPort;
    private final Timer successTimer;
    private final Timer failureTimer;

    public ProductRegisteredListener(EmbedPort embedPort, MeterRegistry meterRegistry) {
        this.embedPort = embedPort;
        this.successTimer = Timer.builder("embed.index.latency")
            .description("Time spent indexing a product into Qdrant after commit")
            .tag("outcome", "success")
            .register(meterRegistry);
        this.failureTimer = Timer.builder("embed.index.latency")
            .tag("outcome", "failure")
            .register(meterRegistry);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(ProductRegistered event) {
        Timer.Sample sample = Timer.start();
        try {
            embedPort.indexProduct(event.toIndexCommand());
            sample.stop(successTimer);
        } catch (Exception e) {
            sample.stop(failureTimer);
            log.warn("Failed to index product {} after commit", event.productId(), e);
        }
    }
}
