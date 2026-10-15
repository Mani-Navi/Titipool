package com.VTT.V10.voice;

import com.VTT.V10.room.RoomService;
import com.VTT.V10.user.User;
import com.VTT.V10.user.UserService;
import com.VTT.V10.voice.dto.VoiceTokenResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Controller providing verified access tokens for LiveKit SFU voice communication.
 */
@Slf4j
@RestController
@RequestMapping("/api/voice")
@RequiredArgsConstructor
public class VoiceController {

    private final VoiceService voiceService;
    private final LiveKitConfig config;
    private final UserService userService;
    private final RoomService roomService;

    // Rate Limiting: Max 10 requests per minute per user
    private static final int MAX_REQUESTS_PER_MINUTE = 10;
    private final Map<UUID, UserRateLimitWindow> rateLimiters = new ConcurrentHashMap<>();

    /**
     * Generates a single-use LiveKit voice room token for verified room members.
     *
     * @param roomId         room identifier
     * @param authentication current user security context
     * @return VoiceTokenResponse containing JWT and SFU connection URL
     */
    @GetMapping("/token")
    public ResponseEntity<VoiceTokenResponse> getToken(
            @RequestParam(required = false) UUID roomId,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "کاربر احراز هویت نشده است");
        }
        if (roomId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "شناسه اتاق (roomId) الزامی است");
        }

        User user = userService.getByEmail(authentication.getName());

        // 1. Verify membership
        if (!roomService.isUserMemberOfRoom(roomId, user.getId())) {
            log.warn("Security Alert: User {} attempted to access voice in unjoined room {}", user.getId(), roomId);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "شما عضو این اتاق نیستید");
        }

        // 2. Enforce Rate Limiting with automatic eviction
        checkRateLimit(user.getId());

        // 3. Issue Token
        String token = voiceService.generateToken(roomId, user.getId(), user.getUsername());
        return ResponseEntity.ok(new VoiceTokenResponse(token, config.getUrl()));
    }

    private void checkRateLimit(UUID userId) {
        long currentMinute = System.currentTimeMillis() / 60000L;

        // Periodic light eviction if map scales over 2000 active keys
        if (rateLimiters.size() > 2000) {
            rateLimiters.entrySet().removeIf(entry -> entry.getValue().minuteWindow() < currentMinute);
        }

        UserRateLimitWindow window = rateLimiters.compute(userId, (k, existing) -> {
            if (existing == null || existing.minuteWindow() != currentMinute) {
                return new UserRateLimitWindow(currentMinute, new AtomicInteger(1));
            }
            existing.counter().incrementAndGet();
            return existing;
        });

        if (window.counter().get() > MAX_REQUESTS_PER_MINUTE) {
            log.warn("Rate limit exceeded for user: {}", userId);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "تعداد درخواست‌های بیش از حد مجاز (حداکثر ۱۰ درخواست در دقیقه)");
        }
    }

    private record UserRateLimitWindow(long minuteWindow, AtomicInteger counter) {}
}