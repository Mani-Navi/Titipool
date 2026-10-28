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
import java.lang.management.ThreadMXBean;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.LongAdder;

/**
 * Central real-time telemetry and metrics registry for Titipool VTT.
 * Protected against metric cardinality explosion and lock contention.
 */
@Service
@RequiredArgsConstructor
public class VttMetricsService {

    private static final Set<String> ALLOWED_WS_ACTIONS = Set.of(
            "MOVE", "ADD", "DELETE", "UPDATE",
            "DICE_ROLL", "DICE_SETTLED", "DICE_RETHROW",
            "FOG_UPDATE", "FOG_CLEAR", "FOG_GLOBAL_REVEAL",
            "SETTINGS_UPDATED", "VIEWPORT_SYNC", "CONDITION_POOL_UPDATE", "ROLE_TITLE_UPDATE"
    );

    private static final Set<String> ALLOWED_SECURITY_TYPES = Set.of(
            "HTTP_401", "HTTP_403", "HTTP_429", "WS_UNAUTHORIZED", "CLIENT_CRASH"
    );

    private final MeterRegistry meterRegistry;
    private final RoomSessionManager sessionManager;
    private final CacheManager cacheManager;

    private final MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
    private final RuntimeMXBean runtimeBean = ManagementFactory.getRuntimeMXBean();
    private final ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();

    private final LongAdder slowRequestsCount = new LongAdder();
    private final ConcurrentHashMap<String, Counter> securityCounters = new ConcurrentHashMap<>(8);
    private final ConcurrentHashMap<String, Counter> wsEventCounters = new ConcurrentHashMap<>(16);

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
        if (type == null) return;
        String safeType = ALLOWED_SECURITY_TYPES.contains(type) ? type : "OTHER";
        securityCounters.computeIfAbsent(safeType, k ->
                Counter.builder("vtt.security.events")
                        .tag("type", k)
                        .register(meterRegistry)
        ).increment();
    }

    public void incrementWsEvent(String action) {
        if (action == null) return;
        String upper = action.toUpperCase();
        String safeAction = ALLOWED_WS_ACTIONS.contains(upper) ? upper : "OTHER";
        wsEventCounters.computeIfAbsent(safeAction, k ->
                Counter.builder("vtt.ws.events")
                        .tag("action", k)
                        .register(meterRegistry)
        ).increment();
    }

    /**
     * Builds an instant, lock-free O(1) system health, memory, cache, and presence snapshot.
     */
    public Map<String, Object> getSystemSnapshot() {
        long heapUsedMb = memoryBean.getHeapMemoryUsage().getUsed() / (1024 * 1024);
        long heapMaxMb = memoryBean.getHeapMemoryUsage().getMax() / (1024 * 1024);
        long uptimeSeconds = runtimeBean.getUptime() / 1000L;

        Map<String, Object> presence = new LinkedHashMap<>(4);
        presence.put("onlineRooms", sessionManager.getActiveOnlineRoomsCount());
        presence.put("onlineUsers", sessionManager.getTotalOnlineUsersCount());
        presence.put("activeStompSessions", sessionManager.getTotalActiveSessionsCount());

        Map<String, Object> jvm = new LinkedHashMap<>(6);
        jvm.put("heapUsedMb", heapUsedMb);
        jvm.put("heapMaxMb", heapMaxMb);
        jvm.put("heapUsagePercent", heapMaxMb > 0 ? Math.round((heapUsedMb * 100.0) / heapMaxMb) : 0);
        jvm.put("activeThreads", threadBean.getThreadCount());
        jvm.put("uptimeSeconds", uptimeSeconds);

        Map<String, Object> caches = new LinkedHashMap<>(4);
        if (cacheManager != null) {
            for (String cacheName : cacheManager.getCacheNames()) {
                Cache cache = cacheManager.getCache(cacheName);
                if (cache instanceof CaffeineCache caffeineCache) {
                    caches.put(cacheName, caffeineCache.getNativeCache().estimatedSize());
                }
            }
        }

        Map<String, Object> snapshot = new LinkedHashMap<>(6);
        snapshot.put("status", "UP");
        snapshot.put("timestamp", Instant.now().toString());
        snapshot.put("presence", presence);
        snapshot.put("jvm", jvm);
        snapshot.put("caches", caches);
        snapshot.put("slowRequestsTotal", slowRequestsCount.sum());
        return snapshot;
    }
}