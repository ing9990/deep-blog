package com.deepblog.member;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = "com.deepblog")
@EnableScheduling
public class MemberServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(MemberServerApplication.class, args);
    }
}
