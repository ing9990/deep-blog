package com.deepblog.seller.outbox.service;

import com.deepblog.seller.outbox.repository.OutboxEventRepository;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Tags;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class OutboxMetrics {

    private final OutboxEventRepository repository;
    private final MeterRegistry registry;

    @PostConstruct
    void bind() {
        registry.gauge("outbox.events.unpublished", Tags.empty(), repository,
            r -> (double) r.countByPublishedAtIsNull());
        registry.gauge("outbox.events.total", Tags.empty(), repository,
            r -> (double) r.count());
    }
}
