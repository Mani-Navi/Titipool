package com.VTT.V10.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

/**
 * Validates production runtime constraints such as database health and secret minimum lengths upon initialization.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StartupValidator implements ApplicationRunner {

    private static final int MIN_JWT_SECRET_LENGTH = 32;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${livekit.url}")
    private String livekitUrl;

    @Value("${livekit.api-key}")
    private String livekitApiKey;

    @Value("${livekit.api-secret}")
    private String livekitApiSecret;

    private final DataSource dataSource;

    @Override
    public void run(ApplicationArguments args) {
        log.info("🔍 Running Production Readiness Startup Checks...");

        if (jwtSecret == null || jwtSecret.trim().length() < MIN_JWT_SECRET_LENGTH) {
            log.error("❌ Critical Failure: JWT secret too short — minimum {} characters required", MIN_JWT_SECRET_LENGTH);
            throw new IllegalStateException("JWT secret too short — min 32 chars");
        }

        if (livekitUrl == null || livekitUrl.isBlank() ||
                livekitApiKey == null || livekitApiKey.isBlank() ||
                livekitApiSecret == null || livekitApiSecret.isBlank()) {
            log.error("❌ Critical Failure: LiveKit configuration is incomplete");
            throw new IllegalStateException("LiveKit config incomplete");
        }

        try (Connection conn = dataSource.getConnection()) {
            if (!conn.isValid(2)) {
                throw new SQLException("Database connection validation check failed within 2 seconds");
            }
        } catch (SQLException e) {
            log.error("❌ Critical Failure: Database is unreachable on startup: {}", e.getMessage());
            throw new IllegalStateException("Database unreachable on startup", e);
        }

        log.info("✅ Startup validation passed: All production security and infrastructure checks are OK.");
    }
}