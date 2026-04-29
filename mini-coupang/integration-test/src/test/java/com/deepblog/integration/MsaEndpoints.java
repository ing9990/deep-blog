package com.deepblog.integration;

public final class MsaEndpoints {

    private MsaEndpoints() {
    }

    public static String memberServer() {
        return "http://" + MsaCompose.host("member-server") + ":" + MsaCompose.port("member-server", 8081);
    }

    public static String orderServer() {
        return "http://" + MsaCompose.host("order-server") + ":" + MsaCompose.port("order-server", 8084);
    }

    public static String productServer() {
        return "http://" + MsaCompose.host("product-server") + ":" + MsaCompose.port("product-server", 8082);
    }

    public static String mysqlJdbcUrl(String schema) {
        return "jdbc:mysql://"
            + MsaCompose.host("mysql") + ":" + MsaCompose.port("mysql", 3306)
            + "/" + schema
            + "?serverTimezone=Asia/Seoul&allowPublicKeyRetrieval=true&useSSL=false";
    }

    public static String redisHost() {
        return MsaCompose.host("redis");
    }

    public static int redisPort() {
        return MsaCompose.port("redis", 6379);
    }
}
