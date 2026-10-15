package com.VTT.V10.websocket;

import com.VTT.V10.room.RoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.util.UUID;

/**
 * Manages WebSocket connection lifecycle events, STOMP session tracking, and disconnect presence cleanup.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final RoomSessionManager sessionManager;
    private final RoomService roomService;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());

        if (accessor.getUser() != null) {
            String userEmail = accessor.getUser().getName();
            String sessionId = accessor.getSessionId();
            String roomIdStr = accessor.getFirstNativeHeader("roomId");

            if (roomIdStr != null && sessionId != null) {
                try {
                    UUID roomId = UUID.fromString(roomIdStr);
                    if (roomService.isMember(roomId, userEmail)) {
                        roomService.handleUserJoinPresence(roomId, sessionId, userEmail);
                    }
                } catch (IllegalArgumentException ignored) {
                    // Ignore malformed UUID
                }
            }
        }
    }

    @EventListener
    public void handleWebSocketSubscribeListener(SessionSubscribeEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String destination = accessor.getDestination();

        if (destination != null && destination.startsWith(WsConstants.TOPIC_ROOM_PREFIX) && destination.endsWith(WsConstants.TOPIC_USERS_SUFFIX)) {
            try {
                int prefixLength = WsConstants.TOPIC_ROOM_PREFIX.length();
                int suffixIndex = destination.lastIndexOf(WsConstants.TOPIC_USERS_SUFFIX);
                if (suffixIndex > prefixLength) {
                    String roomIdPart = destination.substring(prefixLength, suffixIndex);
                    UUID roomId = UUID.fromString(roomIdPart);
                    if (accessor.getUser() != null && roomService.isMember(roomId, accessor.getUser().getName())) {
                        sessionManager.broadcastOnlineMembers(roomId);
                    }
                }
            } catch (Exception ignored) {
            }
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        if (sessionId != null) {
            RoomSessionManager.UserSessionDetails details = sessionManager.getSessionDetails(sessionId);
            if (details != null) {
                roomService.updateGmLastSeenOnDisconnect(details.roomId(), details.userId());
            }
            sessionManager.removeSession(sessionId);
        }
    }
}