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
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

/**
 * Intercepts incoming WebSocket CONNECT frames and authenticates STOMP connections via single-pass Bearer JWT.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthenticationInterceptor implements ChannelInterceptor {

    private static final String BEARER_PREFIX = "Bearer ";
    private static final List<GrantedAuthority> DEFAULT_AUTHORITIES =
            Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));

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
            String userEmail = jwtService.validateAndExtractEmail(token);
            if (userEmail == null) {
                log.warn("WebSocket CONNECT rejected: Invalid or expired JWT");
                throw new MessageDeliveryException("Unauthorized: Invalid STOMP token");
            }

            UsernamePasswordAuthenticationToken user = new UsernamePasswordAuthenticationToken(
                    userEmail,
                    null,
                    DEFAULT_AUTHORITIES
            );
            accessor.setUser(user);
            if (log.isDebugEnabled()) {
                log.debug("WebSocket client authenticated successfully: {}", userEmail);
            }
        }
        return message;
    }
}