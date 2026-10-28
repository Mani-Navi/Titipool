package com.VTT.V10.auth;

import com.VTT.V10.user.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.function.Function;

/**
 * High-speed stateless JWT generation and single-pass parsing service.
 * Pre-builds and caches the immutable {@link JwtParser} instance to eliminate per-request builder allocation
 * and performs single-pass cryptographic verification.
 */
@Slf4j
@Service
public class JwtService {

    private static final String ISSUER = "vtt-api";
    private static final String AUDIENCE = "vtt-client";

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration:86400000}")
    private long jwtExpirationMs;

    @Value("${jwt.refresh-expiration:2592000000}")
    private long refreshExpirationMs;

    private SecretKey cachedSignInKey;
    private JwtParser cachedJwtParser;

    @PostConstruct
    public void initKey() {
        if (secretKey == null || secretKey.trim().length() < 32) {
            throw new IllegalStateException("تنظیمات امنیتی بحرانی: طول کلید jwt.secret باید حداقل ۳۲ کاراکتر باشد");
        }

        SecretKey resolvedKey = null;
        try {
            byte[] keyBytes = Decoders.BASE64.decode(secretKey);
            if (keyBytes.length >= 32) {
                resolvedKey = Keys.hmacShaKeyFor(keyBytes);
            }
        } catch (Exception ignored) {
            // Not base64 encoded, fallback to UTF-8 bytes
        }

        if (resolvedKey == null) {
            byte[] utf8Bytes = secretKey.getBytes(StandardCharsets.UTF_8);
            resolvedKey = Keys.hmacShaKeyFor(utf8Bytes);
        }

        this.cachedSignInKey = resolvedKey;
        this.cachedJwtParser = Jwts.parser()
                .verifyWith(this.cachedSignInKey)
                .requireIssuer(ISSUER)
                .requireAudience(AUDIENCE)
                .build();
    }

    /**
     * Issues signed access JWT containing standard audience, issuer, and claim properties.
     */
    public String generateToken(User user) {
        return buildToken(user, jwtExpirationMs, "ACCESS");
    }

    /**
     * Issues signed long-lived refresh JWT for seamless token rotation.
     */
    public String generateRefreshToken(User user) {
        return buildToken(user, refreshExpirationMs, "REFRESH");
    }

    private String buildToken(User user, long expirationMs, String tokenType) {
        String userIdStr = user.getId() != null ? user.getId().toString() : "";
        long now = System.currentTimeMillis();

        return Jwts.builder()
                .issuer(ISSUER)
                .audience().add(AUDIENCE).and()
                .subject(user.getEmail())
                .claim("userId", userIdStr)
                .claim("username", user.getUsername())
                .claim("email", user.getEmail())
                .claim("avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : "")
                .claim("type", tokenType)
                .issuedAt(new Date(now))
                .notBefore(new Date(now - 1000))
                .expiration(new Date(now + expirationMs))
                .signWith(cachedSignInKey, Jwts.SIG.HS256)
                .compact();
    }

    public long getRefreshExpirationSeconds() {
        return refreshExpirationMs / 1000L;
    }

    /**
     * Validates signature, expiration, issuer, and audience in a single pass and returns the subject email.
     * Eliminates redundant 4x HMAC-SHA256 recalculations on every HTTP/WebSocket request.
     *
     * @param token raw JWT string
     * @return authenticated user email if valid, or {@code null} if invalid/expired
     */
    public String validateAndExtractEmail(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        try {
            Claims claims = cachedJwtParser.parseSignedClaims(token).getPayload();
            String email = claims.getSubject();
            return (email != null && !email.isBlank()) ? email : null;
        } catch (ExpiredJwtException e) {
            if (log.isDebugEnabled()) {
                log.debug("JWT token expired: {}", e.getMessage());
            }
            return null;
        } catch (JwtException | IllegalArgumentException e) {
            if (log.isDebugEnabled()) {
                log.debug("Invalid JWT token: {}", e.getMessage());
            }
            return null;
        }
    }

    public String extractEmail(String token) {
        return validateAndExtractEmail(token);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public boolean isTokenValid(String token, String userEmail) {
        String extracted = validateAndExtractEmail(token);
        return extracted != null && extracted.equalsIgnoreCase(userEmail);
    }

    public boolean validateToken(String token) {
        return validateAndExtractEmail(token) != null;
    }

    private Claims extractAllClaims(String token) {
        return cachedJwtParser.parseSignedClaims(token).getPayload();
    }
}