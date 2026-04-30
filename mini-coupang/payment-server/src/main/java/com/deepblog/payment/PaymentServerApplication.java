package com.deepblog.payment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = "com.deepblog")
@EnableScheduling
public class PaymentServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(PaymentServerApplication.class, args);
    }
}
