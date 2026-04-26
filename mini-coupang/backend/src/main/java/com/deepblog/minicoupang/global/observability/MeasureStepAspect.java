package com.deepblog.minicoupang.global.observability;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import java.util.concurrent.ConcurrentHashMap;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

/**
 * Wraps every {@link MeasureStep}-annotated proxy call in a Micrometer Timer.
 * The Timer name comes from the annotation; Timers are cached so each name is
 * registered once per JVM.
 */
@Aspect
@Component
public class MeasureStepAspect {

    private final MeterRegistry registry;
    private final ConcurrentHashMap<String, Timer> timers = new ConcurrentHashMap<>();

    public MeasureStepAspect(MeterRegistry registry) {
        this.registry = registry;
    }

    @Around("@annotation(step)")
    public Object measure(ProceedingJoinPoint pjp, MeasureStep step) throws Throwable {
        Timer timer = timers.computeIfAbsent(step.value(),
            name -> Timer.builder(name).register(registry));
        Timer.Sample sample = Timer.start(registry);
        try {
            return pjp.proceed();
        } finally {
            sample.stop(timer);
        }
    }
}
