package com.VTT.V10.monitoring;

import com.VTT.V10.websocket.RoomSessionManager;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.stereotype.Service;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.RuntimeMXBean;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.LongAdder;

/**
 * Central real-time telemetry and metrics registry for Titipool VTT.
 * Exposes O(1) lock-free gauges to Micrometer/Prometheus and provides an instant JSON health snapshot.
 */
@Service
@RequiredArgsConstructor
public class VttMetricsService {

    private final MeterRegistry meterRegistry;
    private final RoomSessionManager sessionManager;
    private final CacheManager cacheManager;

    private final LongAdder slowRequestsCount = new LongAdder();
    private final ConcurrentHashMap<String, Counter> securityCounters = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Counter> wsEventCounters = new ConcurrentHashMap<>();

    @PostConstruct
    public void registerGauges() {
        Gauge.builder("vtt.rooms.online", sessionManager, RoomSessionManager::getActiveOnlineRoomsCount)
                .description("Number of active rooms with at least one online player")
                .register(meterRegistry);

        Gauge.builder("vtt.users.online", sessionManager, RoomSessionManager::getTotalOnlineUsersCount)
                .description("Total number of unique online users across all rooms")
                .register(meterRegistry);

        Gauge.builder("vtt.sessions.stomp", sessionManager, RoomSessionManager::getTotalActiveSessionsCount)
                .description("Total active STOMP WebSocket sessions")
                .register(meterRegistry);
    }

    public void incrementSlowRequest() {
        slowRequestsCount.increment();
    }

    public void incrementSecurityEvent(String type) {
        securityCounters.computeIfAbsent(type, k ->
                Counter.builder("vtt.security.events")
                        .tag("type", k)
                        .register(meterRegistry)
        ).increment();
    }

    public void incrementWsEvent(String action) {
        if (action == null) return;
        wsEventCounters.computeIfAbsent(action, k ->
                Counter.builder("vtt.ws.events")
                        .tag("action", k)
                        .register(meterRegistry)
        ).increment();
    }

    /**
     * Builds an instant O(1) system health, memory, cache, and presence snapshot.
     */
    public Map<String, Object> getSystemSnapshot() {
        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
        RuntimeMXBean runtimeBean = ManagementFactory.getRuntimeMXBean();

        long heapUsedMb = memoryBean.getHeapMemoryUsage().getUsed() / (1024 * 1024);
        long heapMaxMb = memoryBean.getHeapMemoryUsage().getMax() / (1024 * 1024);
        long uptimeSeconds = runtimeBean.getUptime() / 1000L;

        Map<String, Object> presence = new LinkedHashMap<>();
        presence.put("onlineRooms", sessionManager.getActiveOnlineRoomsCount());
        presence.put("onlineUsers", sessionManager.getTotalOnlineUsersCount());
        presence.put("activeStompSessions", sessionManager.getTotalActiveSessionsCount());

        Map<String, Object> jvm = new LinkedHashMap<>();
        jvm.put("heapUsedMb", heapUsedMb);
        jvm.put("heapMaxMb", heapMaxMb);
        jvm.put("heapUsagePercent", heapMaxMb > 0 ? Math.round((heapUsedMb * 100.0) / heapMaxMb) : 0);
        jvm.put("activeThreads", Thread.activeCount());
        jvm.put("uptimeSeconds", uptimeSeconds);

        Map<String, Object> caches = new LinkedHashMap<>();
        if (cacheManager != null) {
            for (String cacheName : cacheManager.getCacheNames()) {
                Cache cache = cacheManager.getCache(cacheName);
                if (cache instanceof CaffeineCache caffeineCache) {
                    caches.put(cacheName, Map.of(
                            "estimatedSize", caffeineCache.getNativeCache().estimatedSize()
                    ));
                }
            }
        }

        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("status", "UP");
        snapshot.put("timestamp", Instant.now().toString());
        snapshot.put("presence", presence);
        snapshot.put("jvm", jvm);
        snapshot.put("caches", caches);
        snapshot.put("slowRequestsTotal", slowRequestsCount.sum());
        return snapshot;
    }
}