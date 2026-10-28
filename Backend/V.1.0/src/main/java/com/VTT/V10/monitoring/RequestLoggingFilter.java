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
 * High-speed observability filter populating MDC context (traceId, user, IP),
 * detecting slow HTTP endpoints (>300ms), and logging security audit events.
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE - 10)
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
        return path.startsWith("/uploads/") || path.startsWith("/actuator/health");
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

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String principal = (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName()))
                ? auth.getName()
                : "anon";

        MDC.put("traceId", traceId);
        MDC.put("ip", clientIp);
        MDC.put("user", principal);
        response.setHeader(TRACE_HEADER, traceId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = (System.nanoTime() - startNano) / 1_000_000L;
            int status = response.getStatus();
            String method = request.getMethod();
            String uri = request.getRequestURI();

            // ۱. ثبت درخواست‌های کند در کانال پرفورمنس
            if (durationMs >= SLOW_REQUEST_THRESHOLD_MS) {
                PERF_LOG.warn("SLOW_API: {} {} -> status={} duration={}ms", method, uri, status, durationMs);
                metricsService.incrementSlowRequest();
            }

            // ۲. ثبت رخدادهای امنیتی (ورود، تغییر رمز، خطاهای ۴۰۱، ۴۰۳ و ۴۲۹)
            if (status == 401 || status == 403 || status == 429) {
                SEC_LOG.warn("SECURITY_REJECT: {} {} -> status={} duration={}ms", method, uri, status, durationMs);
                metricsService.incrementSecurityEvent("HTTP_" + status);
            } else if (uri.startsWith("/api/auth/") || uri.startsWith("/api/user/change-")) {
                SEC_LOG.info("AUTH_AUDIT: {} {} -> status={} duration={}ms", method, uri, status, durationMs);
            }

            MDC.clear();
        }
    }

    private String resolveOrGenerateTraceId(HttpServletRequest request) {
        String incoming = request.getHeader(TRACE_HEADER);
        if (incoming != null && incoming.length() >= 6 && incoming.length() <= 36) {
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