package com.deepblog.notification;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * common-modules 의 @Component 클래스 (JsonConverter, KafkaProducer) 도 스캔되도록
 * scanBasePackages 를 com.deepblog 로 확장한다.
 */
@SpringBootApplication(scanBasePackages = "com.deepblog")
public class NotificationServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(NotificationServerApplication.class, args);
    }
}
