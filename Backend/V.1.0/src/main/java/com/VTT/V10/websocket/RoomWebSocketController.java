package com.VTT.V10.websocket;

import com.VTT.V10.room.DrawingService;
import com.VTT.V10.room.FogService;
import com.VTT.V10.room.RoomService;
import com.VTT.V10.room.RoomSettingsService;
import com.VTT.V10.room.TokenService;
import com.VTT.V10.room.dto.RoomSettingsResponse;
import com.VTT.V10.websocket.dto.ConditionPoolEvent;
import com.VTT.V10.websocket.dto.DiceRollEvent;
import com.VTT.V10.websocket.dto.DrawingEvent;
import com.VTT.V10.websocket.dto.FogEvent;
import com.VTT.V10.websocket.dto.SocketEvent;
import com.VTT.V10.websocket.dto.TokenMoveEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

/**
 * Inbound STOMP WebSocket controller engineered for zero-blocking immediate broadcasts,
 * O(1) in-memory membership verification, and decoupled asynchronous persistence.
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class RoomWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final TokenService tokenService;
    private final DrawingService drawingService;
    private final FogService fogService;
    private final RoomService roomService;
    private final RoomSettingsService roomSettingsService;

    @MessageMapping("/room/{roomId}/presence/join")
    public void handlePresenceJoin(
            @DestinationVariable UUID roomId,
            @Header("simpSessionId") String sessionId,
            Principal principal
    ) {
        if (principal == null || sessionId == null) return;
        if (!roomService.isMember(roomId, principal.getName())) {
            log.warn("Unauthorized join attempt by {} for room {}", principal.getName(), roomId);
            return;
        }
        roomService.handleUserJoinPresence(roomId, sessionId, principal.getName());
    }

    @MessageMapping("/room/{roomId}/presence/leave")
    public void handlePresenceLeave(
            @DestinationVariable UUID roomId,
            Principal principal
    ) {
        if (principal == null) return;
        roomService.handleUserLeavePresence(roomId, principal.getName());
    }

    @MessageMapping("/room/{roomId}/token/move")
    public void handleTokenMove(
            @DestinationVariable UUID roomId,
            @Payload SocketEvent<TokenMoveEvent> event,
            Principal principal
    ) {
        if (event == null || event.getData() == null || principal == null) return;

        if (!roomService.isMember(roomId, principal.getName())) {
            log.warn("Blocked unprivileged token event from {} in room {}", principal.getName(), roomId);
            return;
        }

        messagingTemplate.convertAndSend(WsConstants.TOPIC_ROOM_PREFIX + roomId, event);
        tokenService.asyncUpdateTokenFromEvent(event.getData(), principal.getName(), roomId);
    }

    @MessageMapping("/room/{roomId}/conditions")
    public void handleConditionPoolUpdate(
            @DestinationVariable UUID roomId,
            @Payload SocketEvent<ConditionPoolEvent> event,
            Principal principal
    ) {
        if (event == null || principal == null || event.getData() == null) return;

        if (roomService.isHostOrAdmin(roomId, principal.getName())) {
            messagingTemplate.convertAndSend(WsConstants.TOPIC_ROOM_PREFIX + roomId, event);
            roomService.updateSceneConditions(roomId, event.getData().getAvailableConditions());
        } else {
            log.warn("Unauthorized condition pool update attempt by {}", principal.getName());
        }
    }

    @MessageMapping("/room/{roomId}/role-title")
    public void handleRoleTitleUpdate(
            @DestinationVariable UUID roomId,
            @Payload SocketEvent<Map<String, Object>> event,
            Principal principal
    ) {
        if (event == null || principal == null || event.getData() == null) return;

        if (roomService.isHostOrAdmin(roomId, principal.getName())) {
            messagingTemplate.convertAndSend(WsConstants.TOPIC_ROOM_PREFIX + roomId, event);
            roomService.updateRoleTitle(roomId, principal.getName(), event.getData());
        }
    }

    @MessageMapping("/room/{roomId}/event")
    public void handleGenericEvent(
            @DestinationVariable UUID roomId,
            @Payload SocketEvent<Object> event,
            Principal principal
    ) {
        if (event == null || principal == null) return;

        if (!roomService.isMember(roomId, principal.getName())) {
            return;
        }

        messagingTemplate.convertAndSend(WsConstants.TOPIC_ROOM_PREFIX + roomId, event);
        roomService.updateLastActive(roomId, principal.getName());
    }

    @MessageMapping("/room/{roomId}/drawing")
    public void handleDrawing(
            @DestinationVariable UUID roomId,
            @Payload SocketEvent<DrawingEvent> event,
            Principal principal
    ) {
        if (principal == null || event == null || event.getData() == null) return;

        DrawingEvent data = event.getData();
        boolean isText = "text".equalsIgnoreCase(data.getType()) || "text".equalsIgnoreCase(data.getTool());
        String requiredPerm = isText ? WsConstants.PERM_TEXT : WsConstants.PERM_DRAWING;

        if (roomService.hasPermission(roomId, principal.getName(), requiredPerm) ||
                (isText && roomService.hasPermission(roomId, principal.getName(), WsConstants.PERM_DRAWING))) {
            messagingTemplate.convertAndSend(WsConstants.TOPIC_ROOM_PREFIX + roomId, event);
            drawingService.asyncSaveOrUpdateDrawing(roomId, data);
        } else {
            log.warn("User {} lacks permission {} for drawing in room {}", principal.getName(), requiredPerm, roomId);
        }
    }

    @MessageMapping("/room/{roomId}/drawing/delete")
    public void handleDrawingDelete(
            @DestinationVariable UUID roomId,
            @Payload SocketEvent<DrawingEvent> event,
            Principal principal
    ) {
        if (principal == null || event == null || event.getData() == null) return;

        DrawingEvent data = event.getData();
        boolean isText = "text".equalsIgnoreCase(data.getType()) || "text".equalsIgnoreCase(data.getTool());
        String requiredPerm = isText ? WsConstants.PERM_TEXT : WsConstants.PERM_DRAWING;

        if (roomService.hasPermission(roomId, principal.getName(), requiredPerm) ||
                (isText && roomService.hasPermission(roomId, principal.getName(), WsConstants.PERM_DRAWING))) {
            messagingTemplate.convertAndSend(WsConstants.TOPIC_ROOM_PREFIX + roomId, event);
            drawingService.asyncDeleteDrawing(roomId, data);
        }
    }

    @MessageMapping("/room/{roomId}/fog")
    public void handleFog(
            @DestinationVariable UUID roomId,
            @Payload SocketEvent<FogEvent> event,
            Principal principal
    ) {
        if (principal == null || event == null || event.getData() == null) return;

        if (roomService.hasPermission(roomId, principal.getName(), WsConstants.PERM_FOG)) {
            messagingTemplate.convertAndSend(WsConstants.TOPIC_ROOM_PREFIX + roomId, event);
            fogService.asyncHandleFogUpdate(roomId, event.getData());
        }
    }

    @MessageMapping("/room/{roomId}/dice")
    public void handleDiceRoll(
            @DestinationVariable UUID roomId,
            @Payload SocketEvent<DiceRollEvent> event,
            Principal principal
    ) {
        if (event == null || principal == null) return;

        if (!roomService.isMember(roomId, principal.getName())) {
            return;
        }

        messagingTemplate.convertAndSend(WsConstants.TOPIC_ROOM_PREFIX + roomId, event);
        roomService.updateLastActive(roomId, principal.getName());
    }

    @MessageMapping("/room/{roomId}/settings")
    public void handleSettingsUpdate(
            @DestinationVariable UUID roomId,
            @Payload SocketEvent<RoomSettingsResponse> event,
            Principal principal
    ) {
        if (principal == null || event == null || event.getData() == null) return;

        if (roomService.isHostOrAdmin(roomId, principal.getName())) {
            roomSettingsService.updateSettings(roomId, event.getData());
            messagingTemplate.convertAndSend(WsConstants.TOPIC_ROOM_PREFIX + roomId + WsConstants.TOPIC_SETTINGS_SUFFIX, event);
            messagingTemplate.convertAndSend(WsConstants.TOPIC_ROOM_PREFIX + roomId, event);
        }
    }

    @MessageMapping("/room/{roomId}/fog/global-reveal")
    public void handleFogGlobalReveal(
            @DestinationVariable UUID roomId,
            @Payload SocketEvent<Map<String, Object>> event,
            Principal principal
    ) {
        if (principal == null || event == null || event.getData() == null) return;

        if (roomService.hasPermission(roomId, principal.getName(), WsConstants.PERM_FOG)) {
            messagingTemplate.convertAndSend(WsConstants.TOPIC_ROOM_PREFIX + roomId, event);
            fogService.updateGlobalReveal(roomId, event.getData());
        }
    }
}