package com.VTT.V10.voice;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * High-performance cryptographic signing service for LiveKit SFU access tokens.
 * Utilizes pre-initialized thread-local HMAC-SHA256 instances to eliminate instantiation overhead.
 */
@Slf4j
@Service
public class VoiceService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final LiveKitConfig config;
    private final ThreadLocal<Mac> macThreadLocal;

    public VoiceService(LiveKitConfig config) {
        this.config = config;
        this.macThreadLocal = ThreadLocal.withInitial(() -> {
            try {
                Mac mac = Mac.getInstance(HMAC_ALGORITHM);
                mac.init(config.getSecretKeySpec());
                return mac;
            } catch (Exception e) {
                throw new IllegalStateException("Failed to initialize ThreadLocal HMAC instance", e);
            }
        });
    }

    /**
     * Asynchronously generates an access token for LiveKit voice rooms.
     */
    @Async("generalTaskExecutor")
    public CompletableFuture<String> generateTokenAsync(UUID roomId, UUID userId, String username) {
        return CompletableFuture.completedFuture(generateToken(roomId, userId, username));
    }

    /**
     * Generates a signed LiveKit JWT access token compliant with LiveKit SFU claim expectations.
     *
     * @param roomId   target room UUID
     * @param userId   authenticated user UUID
     * @param username user display name in voice channel
     * @return signed JWT string
     */
    public String generateToken(UUID roomId, UUID userId, String username) {
        if (roomId == null || userId == null) {
            throw new IllegalArgumentException("roomId and userId cannot be null");
        }

        try {
            long nowSec = System.currentTimeMillis() / 1000L;
            long expSec = nowSec + (4L * 60L * 60L); // 4 hours validity

            String safeUserId = userId.toString();
            String safeUsername = (username != null && !username.isBlank())
                    ? username.replace("\\", "\\\\").replace("\"", "\\\"")
                    : "Player";
            String safeRoomId = roomId.toString();

            // 1. Standard JWT Header
            String headerJson = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";

            // 2. LiveKit RFC-7519 Payload
            String payloadJson = String.format(
                    "{\"iss\":\"%s\",\"sub\":\"%s\",\"name\":\"%s\",\"video\":{\"canPublish\":true,\"canSubscribe\":true,\"room\":\"%s\",\"roomJoin\":true},\"iat\":%d,\"nbf\":%d,\"exp\":%d}",
                    config.getApiKey(), safeUserId, safeUsername, safeRoomId, nowSec, nowSec, expSec
            );

            Base64.Encoder b64 = Base64.getUrlEncoder().withoutPadding();
            String encodedHeader = b64.encodeToString(headerJson.getBytes(StandardCharsets.UTF_8));
            String encodedPayload = b64.encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));
            String dataToSign = encodedHeader + "." + encodedPayload;

            // 3. Fast Cryptographic Signature via Cached ThreadLocal Mac
            Mac mac = macThreadLocal.get();
            mac.reset();
            byte[] signatureBytes = mac.doFinal(dataToSign.getBytes(StandardCharsets.UTF_8));
            String encodedSignature = b64.encodeToString(signatureBytes);

            if (log.isDebugEnabled()) {
                log.debug("LiveKit token issued successfully for user {} in room {}", userId, roomId);
            }

            return dataToSign + "." + encodedSignature;
        } catch (Exception e) {
            log.error("Failed to generate LiveKit voice token for room: {}", roomId);
            throw new IllegalStateException("خطا در تولید امضای دیجیتال صوتی", e);
        }
    }
}