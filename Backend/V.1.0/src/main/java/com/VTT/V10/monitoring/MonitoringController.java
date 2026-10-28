package com.VTT.V10.monitoring;

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

/**
 * Observability controller providing real-time server health snapshots and ingesting frontend crash reports.
 */
@Slf4j
@RestController
@RequestMapping("/api/monitoring")
@RequiredArgsConstructor
public class MonitoringController {

    private final VttMetricsService metricsService;

    /**
     * Returns an instant JSON snapshot of online rooms, users, JVM memory, and cache sizes.
     */
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "دسترسی غیرمجاز");
        }
        return ResponseEntity.ok(metricsService.getSystemSnapshot());
    }

    /**
     * Ingests client-side ErrorBoundary crashes (Canvas/WebGL or Route errors) into the server log stream.
     */
    @PostMapping("/client-error")
    public ResponseEntity<Void> reportClientError(
            @Valid @RequestBody ClientErrorReport report,
            Authentication authentication
    ) {
        String user = (authentication != null && authentication.isAuthenticated())
                ? authentication.getName()
                : "anon";

        log.error("CLIENT_CRASH [component={}] [url={}] [user={}]: {} | stack={}",
                report.getComponent(),
                report.getUrl(),
                user,
                report.getMessage(),
                report.getStack());

        return ResponseEntity.accepted().build();
    }

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