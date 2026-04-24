package com.deepblog.minicoupang.global.config;

import java.util.concurrent.ThreadPoolExecutor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

/**
 * Executors for fire-and-forget work triggered after a transaction commits.
 *
 * The {@code productIndexingExecutor} isolates gRPC calls into the ML service
 * so a slow or unavailable embedder never stretches {@code POST /api/seller/products}
 * response time. The pool is intentionally small: its job is to shave indexing
 * off the hot path, not to absorb large traffic bursts.
 *
 * {@link ThreadPoolExecutor.CallerRunsPolicy} turns queue saturation into
 * caller-side backpressure instead of silent drops, so a failing Qdrant shows
 * up as elevated API latency rather than missing search rows.
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "productIndexingExecutor")
    public ThreadPoolTaskExecutor productIndexingExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("product-idx-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }
}
