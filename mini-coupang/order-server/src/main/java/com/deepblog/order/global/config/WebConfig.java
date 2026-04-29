package com.deepblog.order.global.config;

import com.deepblog.order.global.auth.AuthInterceptor;
import com.deepblog.order.global.auth.LoginAccountIdArgumentResolver;
import com.deepblog.order.global.auth.LoginAuthContextArgumentResolver;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final AuthInterceptor authInterceptor;
    private final LoginAccountIdArgumentResolver loginAccountIdArgumentResolver;
    private final LoginAuthContextArgumentResolver loginAuthContextArgumentResolver;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor);
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(loginAccountIdArgumentResolver);
        resolvers.add(loginAuthContextArgumentResolver);
    }
}
