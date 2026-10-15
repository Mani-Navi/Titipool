package com.VTT.V10.config;

import com.VTT.V10.auth.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Collections;

/**
 * Intercepts incoming WebSocket CONNECT frames and authenticates STOMP connections via Bearer JWT.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthenticationInterceptor implements ChannelInterceptor {

    private static final String BEARER_PREFIX = "Bearer ";
    private final JwtService jwtService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader == null) {
                authHeader = accessor.getFirstNativeHeader("authorization");
            }

            if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
                log.warn("WebSocket CONNECT rejected: Missing Bearer authorization header");
                throw new MessageDeliveryException("Unauthorized: Missing or malformed STOMP Authorization header");
            }

            String token = authHeader.substring(BEARER_PREFIX.length());
            try {
                if (!jwtService.validateToken(token)) {
                    throw new AuthenticationCredentialsNotFoundException("Token validation failed");
                }

                String userEmail = jwtService.extractEmail(token);
                if (userEmail == null || !jwtService.isTokenValid(token, userEmail)) {
                    throw new AuthenticationCredentialsNotFoundException("Invalid or expired token claims");
                }

                UsernamePasswordAuthenticationToken user = new UsernamePasswordAuthenticationToken(
                        userEmail,
                        null,
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
                );
                accessor.setUser(user);
                if (log.isDebugEnabled()) {
                    log.debug("WebSocket client authenticated successfully: {}", userEmail);
                }
            } catch (Exception e) {
                log.warn("WebSocket CONNECT rejected: {}", e.getMessage());
                throw new MessageDeliveryException("Unauthorized: Invalid STOMP token - " + e.getMessage());
            }
        }
        return message;
    }
}