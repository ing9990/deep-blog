package com.deepblog.payment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.deepblog")
public class PaymentServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(PaymentServerApplication.class, args);
    }
}
