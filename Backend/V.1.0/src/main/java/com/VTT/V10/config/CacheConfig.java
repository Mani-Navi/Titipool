package com.VTT.V10.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Central in-memory high performance Caffeine cache configuration.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    public static final String CACHE_ROOM_SETTINGS = "roomSettings";
    public static final String CACHE_SCENES        = "scenes";
    public static final String CACHE_MEMBERS       = "roomMembers";
    public static final String CACHE_PERMISSIONS   = "permissions";

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCacheNames(List.of(
                CACHE_ROOM_SETTINGS,
                CACHE_SCENES,
                CACHE_MEMBERS,
                CACHE_PERMISSIONS
        ));
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(1000)
                .expireAfterWrite(60, TimeUnit.SECONDS)
                .recordStats()
        );
        return cacheManager;
    }
}