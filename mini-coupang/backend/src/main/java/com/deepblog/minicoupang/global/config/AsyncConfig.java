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
 * response time. Pool 크기는 Python ML이 asyncio + MicroBatcher로 전환된
 * 이후 throughput을 끌어올리려고 늘린다. 배치가 제대로 채워지려면
 * 동시 gRPC 호출이 충분히 쏟아져야 하기 때문.
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
        executor.setCorePoolSize(8);
        executor.setMaxPoolSize(16);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("product-idx-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }
}
