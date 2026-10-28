package com.VTT.V10.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.SimpleAsyncTaskExecutor;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Asynchronous executor configurations leveraging Java 21 Virtual Threads (Project Loom)
 * for ultra-lightweight, non-blocking WebSocket state persistence and background tasks.
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    /**
     * Dedicated virtual-thread executor for handling asynchronous WebSocket state writes
     * with minimal memory footprint and zero OS thread contention.
     */
    @Bean("wsTaskExecutor")
    public TaskExecutor wsTaskExecutor() {
        SimpleAsyncTaskExecutor executor = new SimpleAsyncTaskExecutor("ws-persist-");
        executor.setVirtualThreads(true);
        executor.setConcurrencyLimit(64);
        return executor;
    }

    /**
     * General virtual-thread executor for background tasks, OTP email dispatch, and maintenance routines.
     */
    @Bean("generalTaskExecutor")
    public TaskExecutor generalTaskExecutor() {
        SimpleAsyncTaskExecutor executor = new SimpleAsyncTaskExecutor("general-async-");
        executor.setVirtualThreads(true);
        executor.setConcurrencyLimit(32);
        return executor;
    }
}