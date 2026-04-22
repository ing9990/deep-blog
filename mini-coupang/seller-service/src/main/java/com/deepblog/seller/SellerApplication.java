package com.deepblog.seller;

import com.deepblog.seller.common.auth.JwtProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = {"com.deepblog.seller", "com.deepblog.common"})
@EnableConfigurationProperties(JwtProperties.class)
@EnableJpaAuditing
@EnableScheduling
public class SellerApplication {

    public static void main(String[] args) {
        SpringApplication.run(SellerApplication.class, args);
    }
}
