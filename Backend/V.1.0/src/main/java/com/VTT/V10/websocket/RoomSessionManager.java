package com.VTT.V10.websocket;

import com.VTT.V10.room.RoomService;
import com.VTT.V10.room.dto.RoomMemberResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * High-performance, lock-free in-memory registry for tracking online user sessions and room presence.
 * Designed with O(1) lookups to scale to millions of concurrent user sessions without coarse lock contention.
 */
@Slf4j
@Component
public class RoomSessionManager {

    private final SimpMessagingTemplate messagingTemplate;
    private final RoomService roomService;

    // RoomId -> Map<UserId, Set<SessionId>> (Supports multi-tab while preserving single-room logic)
    private final ConcurrentHashMap<UUID, ConcurrentHashMap<UUID, Set<String>>> roomOnlineUsers = new ConcurrentHashMap<>();

    // SessionId -> UserSessionDetails (O(1) session resolution)
    private final ConcurrentHashMap<String, UserSessionDetails> sessions = new ConcurrentHashMap<>();

    // UserId -> Current Active RoomId (Enforces single-active-room rule)
    private final ConcurrentHashMap<UUID, UUID> userActiveRoom = new ConcurrentHashMap<>();

    // UserId -> Set of all active SessionIds owned by this user
    private final ConcurrentHashMap<UUID, Set<String>> userSessionIndex = new ConcurrentHashMap<>();

    public RoomSessionManager(SimpMessagingTemplate messagingTemplate, @Lazy RoomService roomService) {
        this.messagingTemplate = messagingTemplate;
        this.roomService = roomService;
    }

    /**
     * Registers an incoming user session and re-allocates active room context if switched.
     *
     * @param roomId   target room identifier
     * @param sessionId active STOMP session identifier
     * @param userId   authenticated user UUID
     * @param username user display name
     * @param email    user principal email
     */
    public void addUser(UUID roomId, String sessionId, UUID userId, String username, String email) {
        if (roomId == null || sessionId == null || userId == null) {
            return;
        }

        UUID previousRoomIdToNotify = null;

        UUID previousRoomId = userActiveRoom.put(userId, roomId);
        if (previousRoomId != null && !previousRoomId.equals(roomId)) {
            ConcurrentHashMap<UUID, Set<String>> prevRoomUsers = roomOnlineUsers.get(previousRoomId);
            if (prevRoomUsers != null) {
                prevRoomUsers.remove(userId);
                if (prevRoomUsers.isEmpty()) {
                    roomOnlineUsers.remove(previousRoomId);
                }
            }

            Set<String> userSessions = userSessionIndex.get(userId);
            if (userSessions != null) {
                userSessions.removeIf(sid -> {
                    UserSessionDetails details = sessions.get(sid);
                    if (details != null && details.roomId().equals(previousRoomId)) {
                        sessions.remove(sid);
                        return true;
                    }
                    return false;
                });
            }
            previousRoomIdToNotify = previousRoomId;
        }

        UserSessionDetails details = new UserSessionDetails(sessionId, roomId, userId, username, email);
        sessions.put(sessionId, details);
        userSessionIndex.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(sessionId);

        roomOnlineUsers.computeIfAbsent(roomId, k -> new ConcurrentHashMap<>())
                .computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet())
                .add(sessionId);

        if (previousRoomIdToNotify != null) {
            broadcastOnlineMembers(previousRoomIdToNotify);
        }
        broadcastOnlineMembers(roomId);

        if (log.isDebugEnabled()) {
            log.debug("Presence: User {} ({}) is ONLINE in Room {}", username, userId, roomId);
        }
    }

    /**
     * Removes a disconnected session in O(1) time without iterating global session pools.
     *
     * @param sessionId the disconnected STOMP session identifier
     */
    public void removeSession(String sessionId) {
        if (sessionId == null) {
            return;
        }

        UserSessionDetails details = sessions.remove(sessionId);
        if (details == null) {
            return;
        }

        UUID userId = details.userId();
        UUID roomId = details.roomId();
        UUID roomIdToNotify = null;

        Set<String> userSessions = userSessionIndex.get(userId);
        if (userSessions != null) {
            userSessions.remove(sessionId);
            if (userSessions.isEmpty()) {
                userSessionIndex.remove(userId);
            }
        }

        ConcurrentHashMap<UUID, Set<String>> roomUsers = roomOnlineUsers.get(roomId);
        if (roomUsers != null) {
            Set<String> activeRoomSessionsForUser = roomUsers.get(userId);
            if (activeRoomSessionsForUser != null) {
                activeRoomSessionsForUser.remove(sessionId);
                if (activeRoomSessionsForUser.isEmpty()) {
                    roomUsers.remove(userId);
                    userActiveRoom.remove(userId, roomId);
                    roomIdToNotify = roomId;
                }
            }
            if (roomUsers.isEmpty()) {
                roomOnlineUsers.remove(roomId);
            }
        }

        if (roomIdToNotify != null) {
            broadcastOnlineMembers(roomIdToNotify);
            if (log.isDebugEnabled()) {
                log.debug("Presence: User {} ({}) is OFFLINE from Room {}", details.username(), userId, roomId);
            }
        }
    }

    /**
     * Explicitly evicts a user from a room and purges related session descriptors.
     *
     * @param roomId room identifier
     * @param userId user identifier to be evicted
     */
    public void removeUser(UUID roomId, UUID userId) {
        if (roomId == null || userId == null) {
            return;
        }

        ConcurrentHashMap<UUID, Set<String>> roomUsers = roomOnlineUsers.get(roomId);
        if (roomUsers != null) {
            Set<String> userSessions = roomUsers.remove(userId);
            if (userSessions != null) {
                for (String sid : userSessions) {
                    sessions.remove(sid);
                }
            }
            if (roomUsers.isEmpty()) {
                roomOnlineUsers.remove(roomId);
            }
        }

        userActiveRoom.remove(userId, roomId);

        Set<String> remainingSessions = userSessionIndex.get(userId);
        if (remainingSessions != null) {
            remainingSessions.removeIf(sid -> !sessions.containsKey(sid));
            if (remainingSessions.isEmpty()) {
                userSessionIndex.remove(userId);
            }
        }

        broadcastOnlineMembers(roomId);
    }

    /**
     * Purges all active sessions associated with a specified room upon teardown.
     *
     * @param roomId the room identifier
     */
    public void clearRoom(UUID roomId) {
        if (roomId == null) {
            return;
        }

        ConcurrentHashMap<UUID, Set<String>> users = roomOnlineUsers.remove(roomId);
        if (users != null) {
            for (Map.Entry<UUID, Set<String>> entry : users.entrySet()) {
                UUID userId = entry.getKey();
                userActiveRoom.remove(userId, roomId);
                for (String sid : entry.getValue()) {
                    sessions.remove(sid);
                    Set<String> uSessions = userSessionIndex.get(userId);
                    if (uSessions != null) {
                        uSessions.remove(sid);
                    }
                }
            }
        }

        broadcastOnlineMembers(roomId);
        log.info("Presence: Room {} memory cleared", roomId);
    }

    /**
     * Resolves session descriptor by its ID.
     *
     * @param sessionId STOMP session id
     * @return UserSessionDetails if found, null otherwise
     */
    public UserSessionDetails getSessionDetails(String sessionId) {
        return sessionId != null ? sessions.get(sessionId) : null;
    }

    /**
     * Returns the set of user IDs currently present in a given room.
     *
     * @param roomId room identifier
     * @return set of active user UUIDs
     */
    public Set<UUID> getOnlineUserIds(UUID roomId) {
        if (roomId == null) {
            return Collections.emptySet();
        }
        ConcurrentHashMap<UUID, Set<String>> users = roomOnlineUsers.get(roomId);
        return users == null ? Collections.emptySet() : Collections.unmodifiableSet(users.keySet());
    }

    /**
     * Dispatches the list of present members over STOMP to room participants.
     *
     * @param roomId room identifier
     */
    public void broadcastOnlineMembers(UUID roomId) {
        if (roomId == null) {
            return;
        }
        try {
            List<RoomMemberResponse> onlineMembers = roomService.getOnlineRoomMembers(roomId);
            messagingTemplate.convertAndSend(
                    WsConstants.TOPIC_ROOM_PREFIX + roomId + WsConstants.TOPIC_USERS_SUFFIX,
                    onlineMembers
            );
        } catch (Exception e) {
            log.error("Error broadcasting online members for room {}: {}", roomId, e.getMessage());
        }
    }

    /**
     * Alias method for online presence broadcast.
     *
     * @param roomId room identifier
     */
    public void broadcastOnlineUsers(UUID roomId) {
        broadcastOnlineMembers(roomId);
    }

    public record UserSessionDetails(String sessionId, UUID roomId, UUID userId, String username, String email) {}
}