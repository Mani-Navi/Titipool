package com.VTT.V10.monitoring;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Ultra-low-overhead observability filter running ahead of Spring Security to guarantee
 * MDC traceId/IP propagation and capture all security rejections (401/403/429) and slow endpoints (>300ms).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
@RequiredArgsConstructor
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger PERF_LOG = LoggerFactory.getLogger("PERFORMANCE_MONITOR");
    private static final Logger SEC_LOG = LoggerFactory.getLogger("SECURITY_AUDIT");

    private static final long SLOW_REQUEST_THRESHOLD_MS = 300L;
    private static final String TRACE_HEADER = "X-Trace-Id";

    private final VttMetricsService metricsService;

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/uploads/")
                || path.startsWith("/actuator/")
                || path.startsWith("/ws");
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        long startNano = System.nanoTime();
        String traceId = resolveOrGenerateTraceId(request);
        String clientIp = extractClientIp(request);

        MDC.put("traceId", traceId);
        MDC.put("ip", clientIp);
        response.setHeader(TRACE_HEADER, traceId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = (System.nanoTime() - startNano) / 1_000_000L;
            int status = response.getStatus();
            String uri = request.getRequestURI();

            boolean isSlow = durationMs >= SLOW_REQUEST_THRESHOLD_MS;
            boolean isSecurityStatus = (status == 401 || status == 403 || status == 429);
            boolean isSensitiveAuthAction = uri.startsWith("/api/auth/login")
                    || uri.startsWith("/api/auth/register")
                    || uri.startsWith("/api/auth/google")
                    || uri.startsWith("/api/user/change-");

            if (isSlow || isSecurityStatus || isSensitiveAuthAction) {
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
                    MDC.put("user", auth.getName());
                }

                String method = request.getMethod();

                if (isSlow) {
                    PERF_LOG.warn("SLOW_API: {} {} -> status={} duration={}ms", method, uri, status, durationMs);
                    metricsService.incrementSlowRequest();
                }

                if (isSecurityStatus) {
                    SEC_LOG.warn("SECURITY_REJECT: {} {} -> status={} duration={}ms", method, uri, status, durationMs);
                    metricsService.incrementSecurityEvent("HTTP_" + status);
                } else if (isSensitiveAuthAction) {
                    SEC_LOG.info("AUTH_AUDIT: {} {} -> status={} duration={}ms", method, uri, status, durationMs);
                }
            }

            MDC.clear();
        }
    }

    private String resolveOrGenerateTraceId(HttpServletRequest request) {
        String incoming = request.getHeader(TRACE_HEADER);
        if (incoming != null && incoming.length() >= 6 && incoming.length() <= 32) {
            return incoming;
        }
        return Long.toHexString(ThreadLocalRandom.current().nextLong(0x10000000L, 0xFFFFFFFFL));
    }

    private String extractClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            int commaIdx = xff.indexOf(',');
            return (commaIdx > 0 ? xff.substring(0, commaIdx) : xff).trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}