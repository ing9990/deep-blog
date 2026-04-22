package com.deepblog.seller.common.idempotency;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class IdempotencyAspect {

    static final String HEADER = "Idempotency-Key";
    static final String KEY_PREFIX = "idem:seller:";
    static final Duration TTL = Duration.ofHours(24);

    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;

    @Around("@annotation(com.deepblog.seller.common.idempotency.Idempotent)")
    public Object around(ProceedingJoinPoint pjp) throws Throwable {
        HttpServletRequest request = currentRequest();
        if (request == null) {
            return pjp.proceed();
        }
        String headerValue = request.getHeader(HEADER);
        if (!StringUtils.hasText(headerValue)) {
            return pjp.proceed();
        }
        String redisKey = KEY_PREFIX + request.getMethod() + ":" + request.getRequestURI()
            + ":" + headerValue;

        String cached = redis.opsForValue().get(redisKey);
        if (cached != null) {
            log.info("idempotent replay key={}", redisKey);
            CachedResponse cr = objectMapper.readValue(cached, CachedResponse.class);
            return ResponseEntity.status(cr.status()).body(cr.body());
        }

        Object result = pjp.proceed();
        if (result instanceof ResponseEntity<?> re) {
            try {
                CachedResponse cr = new CachedResponse(re.getStatusCode().value(), re.getBody());
                redis.opsForValue().set(redisKey, objectMapper.writeValueAsString(cr), TTL);
            } catch (Exception e) {
                log.warn("failed to cache idempotent response key={}", redisKey, e);
            }
        }
        return result;
    }

    private HttpServletRequest currentRequest() {
        ServletRequestAttributes attrs =
            (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attrs == null ? null : attrs.getRequest();
    }

    record CachedResponse(int status, Object body) {
    }
}
