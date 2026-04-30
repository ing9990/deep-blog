package com.deepblog.integration.support;

import com.deepblog.integration.MsaEndpoints;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import javax.sql.DataSource;
import org.springframework.jdbc.core.JdbcTemplate;

public final class JdbcSupport {

    private JdbcSupport() {
    }

    public static JdbcTemplate jdbc(String schema) {
        return new JdbcTemplate(dataSource(schema));
    }

    public static DataSource dataSource(String schema) {
        HikariConfig cfg = new HikariConfig();
        cfg.setJdbcUrl(MsaEndpoints.mysqlJdbcUrl(schema));
        cfg.setUsername("mini");
        cfg.setPassword("mini");
        cfg.setDriverClassName("com.mysql.cj.jdbc.Driver");
        cfg.setMaximumPoolSize(4);
        cfg.setPoolName("it-" + schema);
        return new HikariDataSource(cfg);
    }
}
