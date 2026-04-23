package com.deepblog.minicoupang;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class MiniCoupangApplication {

    public static void main(String[] args) {
        SpringApplication.run(MiniCoupangApplication.class, args);
    }
}
