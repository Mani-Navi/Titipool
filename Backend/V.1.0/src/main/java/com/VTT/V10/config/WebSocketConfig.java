package com.VTT.V10.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Arrays;
import java.util.List;

/**
 * WebSocket broker configuration with dedicated heartbeat scheduler and STOMP channels.
 */
@Configuration
@EnableWebSocketMessageBroker
@EnableScheduling
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthenticationInterceptor authInterceptor;

    @Value("${cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
    private String allowedOriginsConfig;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        ThreadPoolTaskScheduler heartbeatScheduler = new ThreadPoolTaskScheduler();
        heartbeatScheduler.setPoolSize(2);
        heartbeatScheduler.setThreadNamePrefix("ws-heartbeat-thread-");
        heartbeatScheduler.initialize();

        config.enableSimpleBroker("/topic")
                .setHeartbeatValue(new long[]{5000, 5000})
                .setTaskScheduler(heartbeatScheduler);

        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        List<String> origins = Arrays.stream(allowedOriginsConfig.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();

        String[] originArray = origins.isEmpty()
                ? new String[]{"http://localhost:3000", "http://localhost:5173"}
                : origins.toArray(new String[0]);

        registry.addEndpoint("/ws")
                .setAllowedOrigins(originArray);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(authInterceptor);
    }
}