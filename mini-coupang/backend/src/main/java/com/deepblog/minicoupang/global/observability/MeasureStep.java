package com.deepblog.minicoupang.global.observability;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a method as an observable step. Invocations through the declaring
 * bean's Spring proxy are wrapped by {@link MeasureStepAspect} in a Micrometer
 * Timer whose name is {@link #value()}. Timers are registered lazily on first
 * call, so the target Micrometer name is only reserved when the step actually
 * runs.
 *
 * <p>Self-invocation bypasses the proxy (Spring AOP limitation), so annotated
 * methods must be invoked from a different bean.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface MeasureStep {
    String value();
}
