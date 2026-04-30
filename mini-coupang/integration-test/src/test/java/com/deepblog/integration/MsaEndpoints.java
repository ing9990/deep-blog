package com.deepblog.integration;

/**
 * 통합 테스트가 가리키는 MSA 엔드포인트.
 *
 * <p>테스트 코드는 더 이상 docker-compose lifecycle 을 들고 있지 않다. 사용자가 직접
 * {@code shared/docker/docker-compose.test.yml + .override.yml} 을 띄워 둔 상태를 가정한다.
 * override 파일이 호스트로 expose 하는 포트 (mysql 13306, redis 16379, kafka 19092,
 * member 18081, product 18082, payment 18083, order 18084, notification 18085) 를 그대로
 * 사용한다. 서비스가 떠 있지 않으면 첫 HTTP 호출에서 ConnectException 으로 즉시 실패한다.
 *
 * <p>실행 전 필요한 명령:
 * <pre>{@code
 * cd mini-coupang/shared/docker
 * docker compose -f docker-compose.test.yml -f docker-compose.test.override.yml up -d
 * }</pre>
 */
public final class MsaEndpoints {

    private static final String HOST = "localhost";

    private MsaEndpoints() {
    }

    public static String memberServer() {
        return "http://" + HOST + ":18081";
    }

    public static String productServer() {
        return "http://" + HOST + ":18082";
    }

    public static String orderServer() {
        return "http://" + HOST + ":18084";
    }

    public static String mysqlJdbcUrl(String schema) {
        return "jdbc:mysql://" + HOST + ":13306/" + schema
            + "?serverTimezone=Asia/Seoul&allowPublicKeyRetrieval=true&useSSL=false";
    }

    public static String redisHost() {
        return HOST;
    }

    public static int redisPort() {
        return 16379;
    }
}
