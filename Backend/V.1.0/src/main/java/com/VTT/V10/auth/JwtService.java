package com.VTT.V10.auth;

import com.VTT.V10.user.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
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
 * High-speed stateless JWT generation and parsing service with cached cryptographic signing keys.
 */
@Slf4j
@Service
public class JwtService {

    private static final String ISSUER = "vtt-api";
    private static final String AUDIENCE = "vtt-client";

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration:900000}")
    private long jwtExpirationMs;

    private SecretKey cachedSignInKey;

    @PostConstruct
    public void initKey() {
        if (secretKey == null || secretKey.trim().length() < 32) {
            throw new IllegalStateException("تنظیمات امنیتی بحرانی: طول کلید jwt.secret باید حداقل ۳۲ کاراکتر باشد");
        }

        try {
            byte[] keyBytes = Decoders.BASE64.decode(secretKey);
            if (keyBytes.length >= 32) {
                this.cachedSignInKey = Keys.hmacShaKeyFor(keyBytes);
                return;
            }
        } catch (Exception ignored) {
            // Not a valid base64, fallback to UTF-8
        }

        byte[] utf8Bytes = secretKey.getBytes(StandardCharsets.UTF_8);
        this.cachedSignInKey = Keys.hmacShaKeyFor(utf8Bytes);
    }

    /**
     * Issues signed JWT containing standard audience, issuer, and claim properties.
     */
    public String generateToken(User user) {
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
                .issuedAt(new Date(now))
                .notBefore(new Date(now - 1000))
                .expiration(new Date(now + jwtExpirationMs))
                .signWith(getSignInKey(), Jwts.SIG.HS256)
                .compact();
    }

    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public boolean isTokenValid(String token, String userEmail) {
        try {
            final Claims claims = extractAllClaims(token);
            final String email = claims.getSubject();
            boolean isAudienceValid = claims.getAudience() != null && claims.getAudience().contains(AUDIENCE);
            boolean isIssuerValid = ISSUER.equals(claims.getIssuer());

            return (email != null
                    && email.equalsIgnoreCase(userEmail)
                    && !isTokenExpired(token)
                    && isAudienceValid
                    && isIssuerValid);
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSignInKey())
                    .requireIssuer(ISSUER)
                    .requireAudience(AUDIENCE)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            if (log.isDebugEnabled()) {
                log.debug("JWT token expired: {}", e.getMessage());
            }
            return false;
        } catch (JwtException | IllegalArgumentException e) {
            if (log.isDebugEnabled()) {
                log.debug("Invalid JWT signature/token format: {}", e.getMessage());
            }
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSignInKey())
                .requireIssuer(ISSUER)
                .requireAudience(AUDIENCE)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSignInKey() {
        return this.cachedSignInKey;
    }
}