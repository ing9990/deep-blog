package com.deepblog.integration;

import java.io.File;
import org.testcontainers.containers.ComposeContainer;
import org.testcontainers.containers.wait.strategy.Wait;

/**
 * compose 부팅이 30~60초 걸리므로 정적 holder 로 두고 JVM 한 번에 한 번만 띄운다.
 */
public final class MsaCompose {

    private static final File COMPOSE_FILE =
        new File("../shared/docker/docker-compose.test.yml");

    private static final ComposeContainer INSTANCE;

    static {
        INSTANCE = new ComposeContainer(COMPOSE_FILE)
            .withLocalCompose(true)
            .withExposedService("mysql", 3306, Wait.forListeningPort())
            .withExposedService("redis", 6379, Wait.forListeningPort())
            .withExposedService("kafka", 9092, Wait.forListeningPort())
            .withExposedService("member-server", 8081, Wait.forHealthcheck())
            .withExposedService("product-server", 8082, Wait.forHealthcheck())
            .withExposedService("payment-server", 8083, Wait.forHealthcheck())
            .withExposedService("order-server", 8084, Wait.forHealthcheck())
            .withExposedService("notification-server", 8085, Wait.forHealthcheck());

        INSTANCE.start();
        Runtime.getRuntime().addShutdownHook(new Thread(INSTANCE::stop));
    }

    private MsaCompose() {
    }

    public static ComposeContainer instance() {
        return INSTANCE;
    }

    public static String host(String service) {
        return INSTANCE.getServiceHost(service, switch (service) {
            case "mysql" -> 3306;
            case "redis" -> 6379;
            case "kafka" -> 9092;
            case "member-server" -> 8081;
            case "product-server" -> 8082;
            case "payment-server" -> 8083;
            case "order-server" -> 8084;
            case "notification-server" -> 8085;
            default -> throw new IllegalArgumentException("Unknown service: " + service);
        });
    }

    public static int port(String service, int internalPort) {
        return INSTANCE.getServicePort(service, internalPort);
    }
}
