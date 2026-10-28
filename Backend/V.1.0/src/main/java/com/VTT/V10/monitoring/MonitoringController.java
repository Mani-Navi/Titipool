package com.VTT.V10.monitoring;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Hardened observability controller providing server health snapshots and rate-limited,
 * CRLF-sanitized client crash ingestion.
 */
@Slf4j
@RestController
@RequestMapping("/api/monitoring")
@RequiredArgsConstructor
public class MonitoringController {

    private static final int MAX_CRASH_REPORTS_PER_MINUTE = 5;
    private final ConcurrentHashMap<String, RateWindow> crashRateLimiter = new ConcurrentHashMap<>();

    private final VttMetricsService metricsService;

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "دسترسی غیرمجاز");
        }
        return ResponseEntity.ok(metricsService.getSystemSnapshot());
    }

    @PostMapping("/client-error")
    public ResponseEntity<Void> reportClientError(
            @Valid @RequestBody ClientErrorReport report,
            HttpServletRequest request,
            Authentication authentication
    ) {
        String clientIp = extractIp(request);
        if (!allowCrashReport(clientIp)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }

        String user = (authentication != null && authentication.isAuthenticated())
                ? sanitizeLogString(authentication.getName(), 100)
                : "anon";

        metricsService.incrementSecurityEvent("CLIENT_CRASH");

        log.error("CLIENT_CRASH [component={}] [url={}] [user={}]: {} | stack={}",
                sanitizeLogString(report.getComponent(), 80),
                sanitizeLogString(report.getUrl(), 200),
                user,
                sanitizeLogString(report.getMessage(), 350),
                sanitizeLogString(report.getStack(), 800));

        return ResponseEntity.accepted().build();
    }

    private boolean allowCrashReport(String key) {
        long currentMinute = System.currentTimeMillis() / 60_000L;
        if (crashRateLimiter.size() > 1000) {
            crashRateLimiter.entrySet().removeIf(e -> e.getValue().minute() < currentMinute);
        }
        RateWindow window = crashRateLimiter.compute(key, (k, existing) -> {
            if (existing == null || existing.minute() != currentMinute) {
                return new RateWindow(currentMinute, new AtomicInteger(1));
            }
            existing.count().incrementAndGet();
            return existing;
        });
        return window.count().get() <= MAX_CRASH_REPORTS_PER_MINUTE;
    }

    /**
     * Strips CR/LF characters to prevent CRLF Log Injection and truncates to max length.
     */
    private String sanitizeLogString(String input, int maxLength) {
        if (input == null || input.isBlank()) return "-";
        String clean = input.replace('\r', ' ').replace('\n', ' ').replace('\t', ' ').trim();
        return clean.length() > maxLength ? clean.substring(0, maxLength) + "..." : clean;
    }

    private String extractIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            int idx = xff.indexOf(',');
            return (idx > 0 ? xff.substring(0, idx) : xff).trim();
        }
        return request.getRemoteAddr();
    }

    private record RateWindow(long minute, AtomicInteger count) {}

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClientErrorReport {
        @NotBlank
        @Size(max = 100)
        private String component;

        @NotBlank
        @Size(max = 500)
        private String message;

        @Size(max = 2000)
        private String stack;

        @Size(max = 300)
        private String url;
    }
}