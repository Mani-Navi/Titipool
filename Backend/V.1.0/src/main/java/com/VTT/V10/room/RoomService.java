package com.VTT.V10.room;

import com.VTT.V10.config.CacheConfig;
import com.VTT.V10.room.dto.*;
import com.VTT.V10.user.User;
import com.VTT.V10.user.UserRepository;
import com.VTT.V10.websocket.RoomSessionManager;
import com.VTT.V10.websocket.WsConstants;
import com.VTT.V10.websocket.dto.SocketEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Core business service managing game rooms, lifecycle transitions, memberships, and real-time events.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final RoomMemberRepository memberRepository;
    private final RoomTemplateRepository templateRepository;
    private final JournalRepository journalRepository;
    private final PlayerPermissionService permissionService;
    private final PlayerPermissionRepository permissionRepository;
    private final RoomSettingsRepository settingsRepository;
    private final SceneRepository sceneRepository;
    private final TokenRepository tokenRepository;
    private final DrawingRepository drawingRepository;
    private final FogRegionRepository fogRegionRepository;
    private final PasswordEncoder passwordEncoder;
    private final SimpMessagingTemplate messagingTemplate;
    private final RoomSessionManager sessionManager;
    private final CacheManager cacheManager;

    private static final int GM_INACTIVITY_TIMEOUT_MINUTES = 15;

    /**
     * Scheduled job running every 30 seconds to automatically deactivate rooms where the GM has been offline beyond timeout.
     * Avoids redundant DB writes when GM is actively connected in memory.
     */
    @Scheduled(fixedRate = 30000)
    @Transactional
    public void autoDeactivateInactiveRooms() {
        LocalDateTime now = LocalDateTime.now();
        List<Room> activeRooms = roomRepository.findAllActiveRoomsWithOwner();

        for (Room room : activeRooms) {
            User owner = room.getOwner();
            if (owner == null) continue;

            Set<UUID> onlineUserIds = sessionManager.getOnlineUserIds(room.getId());
            boolean isGmOnline = onlineUserIds.contains(owner.getId());

            if (!isGmOnline) {
                LocalDateTime lastSeen = room.getGmLastSeenAt() != null ? room.getGmLastSeenAt() : room.getLastActive();
                if (lastSeen == null) {
                    lastSeen = room.getCreatedAt() != null ? room.getCreatedAt() : now;
                }

                if (lastSeen.plusMinutes(GM_INACTIVITY_TIMEOUT_MINUTES).isBefore(now)) {
                    log.info("Auto-deactivating room {} due to GM timeout", room.getId());
                    room.setIsActive(false);
                    roomRepository.save(room);

                    sessionManager.clearRoom(room.getId());

                    messagingTemplate.convertAndSend(
                            WsConstants.TOPIC_ROOM_PREFIX + room.getId(),
                            SocketEvent.<String>builder()
                                    .roomId(room.getId())
                                    .action("ROOM_CLOSED")
                                    .data("اتاق به دلیل عدم حضور طولانی‌مدت دانجن‌مستر (GM) غیرفعال شد.")
                                    .build()
                    );
                }
            }
        }
    }

    @Transactional(readOnly = true)
    public boolean isUserMemberOfRoom(UUID roomId, UUID userId) {
        if (roomId == null || userId == null) return false;
        return memberRepository.existsByRoomIdAndUserId(roomId, userId) ||
                roomRepository.findById(roomId).filter(r -> r.getOwner() != null && r.getOwner().getId().equals(userId)).isPresent();
    }

    @Transactional(readOnly = true)
    public boolean isMember(UUID roomId, String email) {
        if (roomId == null || email == null) return false;
        return memberRepository.findByRoomIdAndUserEmail(roomId, email).isPresent() ||
                roomRepository.findById(roomId)
                        .filter(r -> r.getOwner() != null && r.getOwner().getEmail().equalsIgnoreCase(email))
                        .isPresent();
    }

    @Transactional(readOnly = true)
    public boolean isHostOrAdmin(UUID roomId, String email) {
        try {
            if (roomId == null || email == null) return false;

            Optional<RoomMember> memberOpt = memberRepository.findByRoomIdAndUserEmail(roomId, email);
            if (memberOpt.isPresent()) {
                RoomMember member = memberOpt.get();
                if (member.getRole() == RoomMember.Role.ADMIN || member.getRole() == RoomMember.Role.GM) {
                    return true;
                }
                Room room = member.getRoom();
                if (room != null && room.getOwner() != null && room.getOwner().getEmail().equalsIgnoreCase(email)) {
                    return true;
                }
            }

            return roomRepository.findById(roomId)
                    .filter(r -> r.getOwner() != null && r.getOwner().getEmail().equalsIgnoreCase(email))
                    .isPresent();
        } catch (Exception e) {
            return false;
        }
    }

    @Transactional(readOnly = true)
    public boolean hasPermission(UUID roomId, String email, String action) {
        try {
            if (isHostOrAdmin(roomId, email)) return true;

            var memberOpt = memberRepository.findByRoomIdAndUserEmail(roomId, email);
            if (memberOpt.isEmpty()) return false;

            RoomMember member = memberOpt.get();
            var permOpt = permissionRepository.findByMemberId(member.getId());
            if (permOpt.isEmpty()) return false;

            PlayerPermission perm = permOpt.get();
            return switch (action) {
                case WsConstants.PERM_DRAWING -> Boolean.TRUE.equals(perm.getCanDrawing());
                case WsConstants.PERM_TEXT -> Boolean.TRUE.equals(perm.getCanText());
                case WsConstants.PERM_FOG -> Boolean.TRUE.equals(perm.getCanFog());
                case WsConstants.PERM_SCENE -> Boolean.TRUE.equals(perm.getCanScene());
                case WsConstants.PERM_ASSETS -> Boolean.TRUE.equals(perm.getCanAssets());
                case WsConstants.PERM_EDIT_TOKEN -> Boolean.TRUE.equals(perm.getCanEditToken());
                default -> false;
            };
        } catch (Exception e) {
            return false;
        }
    }

    @Transactional
    public void handleUserJoinPresence(UUID roomId, String sessionId, String userEmail) {
        userRepository.findByEmail(userEmail).ifPresent(user -> {
            sessionManager.addUser(roomId, sessionId, user.getId(), user.getUsername(), user.getEmail());
            updateLastActive(roomId, user.getUsername());
        });
    }

    @Transactional
    public void handleUserLeavePresence(UUID roomId, String userEmail) {
        userRepository.findByEmail(userEmail).ifPresent(user -> {
            updateGmLastSeenOnDisconnect(roomId, user.getId());
            sessionManager.removeUser(roomId, user.getId());
        });
    }

    @Transactional
    public void updateSceneConditions(UUID roomId, List<String> conditions) {
        var activeSceneOpt = sceneRepository.findByRoomIdAndIsActiveTrue(roomId);
        if (activeSceneOpt.isEmpty()) {
            var scenes = sceneRepository.findByRoomId(roomId);
            if (!scenes.isEmpty()) {
                activeSceneOpt = Optional.of(scenes.get(0));
            }
        }
        activeSceneOpt.ifPresent(scene -> {
            scene.setAvailableConditions(conditions);
            sceneRepository.save(scene);
        });
        evictCache(CacheConfig.CACHE_SCENES, roomId);
    }

    @Transactional
    public void updateRoleTitle(UUID roomId, String userEmail, Map<String, Object> data) {
        updateLastActive(roomId, userEmail);
        try {
            String title = (String) data.get("title");
            String targetType = (String) data.get("targetType");

            Optional<Room> roomOpt = roomRepository.findById(roomId);
            if (roomOpt.isPresent() && title != null && !title.isBlank()) {
                Room room = roomOpt.get();
                if ("HOST".equalsIgnoreCase(targetType)) {
                    room.setHostRoleTitle(title.trim());
                } else {
                    room.setPlayerRoleTitle(title.trim());
                }
                roomRepository.save(room);
            }
        } catch (Exception e) {
            log.warn("Error saving role title on room: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<RoomTemplateResponse> getAvailableTemplates() {
        return templateRepository.findAll().stream()
                .map(t -> RoomTemplateResponse.builder()
                        .id(t.getId())
                        .title(t.getTitle())
                        .description(t.getDescription())
                        .maxPlayers(t.getMaxPlayers())
                        .expireDays(t.getExpireDays())
                        .baseMapUrl(t.getBaseMapUrl())
                        .musicUrl(t.getMusicUrl())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RoomResponse> getUserRooms(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "کاربر یافت نشد"));

        List<RoomMember> memberships = memberRepository.findAllByUserId(user.getId());
        if (memberships.isEmpty()) {
            return Collections.emptyList();
        }

        List<UUID> roomIds = memberships.stream()
                .map(m -> m.getRoom().getId())
                .distinct()
                .toList();

        Map<UUID, Integer> memberCounts = new HashMap<>();
        for (Object[] row : memberRepository.countMembersByRoomIds(roomIds)) {
            memberCounts.put((UUID) row[0], ((Number) row[1]).intValue());
        }

        List<UUID> memberIds = memberships.stream().map(RoomMember::getId).toList();
        Map<UUID, PlayerPermission> permMap = permissionRepository.findAllByMemberIdIn(memberIds).stream()
                .collect(Collectors.toMap(p -> p.getMember().getId(), p -> p));

        return memberships.stream()
                .filter(m -> !Boolean.TRUE.equals(m.getIsBanned()))
                .map(member -> {
                    Room room = member.getRoom();
                    int count = memberCounts.getOrDefault(room.getId(), 1);
                    PlayerPermission perm = permMap.get(member.getId());
                    return convertToResponseFast(room, user, member, perm, count);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public RoomResponse getRoomById(UUID roomId, String userEmail) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "اتاق یافت نشد"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "کاربر یافت نشد"));

        RoomMember member = memberRepository.findByRoomIdAndUserId(roomId, user.getId())
                .orElse(null);

        boolean isGM = (room.getOwner() != null && room.getOwner().getId().equals(user.getId())) ||
                (member != null && (member.getRole() == RoomMember.Role.ADMIN || member.getRole() == RoomMember.Role.GM));

        if (member == null && !isGM) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "شما عضو این اتاق نیستید");
        }

        if (member != null && Boolean.TRUE.equals(member.getIsBanned())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "شما از این اتاق مسدود (Ban) شده‌اید");
        }

        if (isGM) {
            if (Boolean.FALSE.equals(room.getIsActive())) {
                sessionManager.clearRoom(roomId);
            }
            room.setIsActive(true);
            room.setLastActive(LocalDateTime.now());
            room.setGmLastSeenAt(LocalDateTime.now());
            roomRepository.save(room);
        } else {
            if (Boolean.FALSE.equals(room.getIsActive())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "اتاق در حال حاضر غیرفعال است و در انتظار ورود دانجن‌مستر (GM) می‌باشد");
            }
        }

        return convertToResponse(room, user);
    }

    @Transactional
    public RoomResponse createRoom(CreateRoomRequest request, String userEmail) {
        User owner = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "کاربر یافت نشد"));

        if (roomRepository.existsByOwnerIdAndNameIgnoreCase(owner.getId(), request.getName().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "شما قبلاً اتاقی با همین نام ایجاد کرده‌اید");
        }

        String encodedPassword = (request.getPassword() != null && !request.getPassword().trim().isEmpty())
                ? passwordEncoder.encode(request.getPassword().trim())
                : null;

        Room.RoomBuilder roomBuilder = Room.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .password(encodedPassword)
                .code(generateRandomCode())
                .owner(owner)
                .isActive(true)
                .expireDays(30)
                .hostRoleTitle("میزبان")
                .playerRoleTitle("بازیکن")
                .lastActive(LocalDateTime.now())
                .gmLastSeenAt(LocalDateTime.now());

        if (request.getTemplateId() != null) {
            RoomTemplate template = templateRepository.findById(request.getTemplateId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "سناریو یافت نشد"));

            roomBuilder.type(Room.RoomType.OFFICIAL)
                    .template(template)
                    .maxPlayers(template.getMaxPlayers() != null ? template.getMaxPlayers() : 10)
                    .expireDays(template.getExpireDays() != null ? template.getExpireDays() : 30)
                    .musicUrl(template.getMusicUrl());
        } else {
            roomBuilder.type(Room.RoomType.STANDARD)
                    .maxPlayers(10);
        }

        Room room = roomRepository.save(roomBuilder.build());

        RoomMember admin = RoomMember.builder()
                .room(room)
                .user(owner)
                .role(RoomMember.Role.ADMIN)
                .roleTitle("میزبان")
                .isMuted(false)
                .isBanned(false)
                .joinedAt(LocalDateTime.now())
                .build();
        RoomMember savedAdmin = memberRepository.save(admin);

        PlayerPermission adminPermission = PlayerPermission.builder()
                .room(room)
                .member(savedAdmin)
                .canAssets(true)
                .canText(true)
                .canFog(true)
                .canDrawing(true)
                .canScene(true)
                .canRuler(true)
                .canEditToken(true)
                .build();
        permissionRepository.save(adminPermission);

        String defaultMapUrl = (room.getTemplate() != null && room.getTemplate().getBaseMapUrl() != null)
                ? room.getTemplate().getBaseMapUrl()
                : null;

        Scene defaultScene = Scene.builder()
                .room(room)
                .name("صحنه خوش‌آمدگویی")
                .isActive(true)
                .mapUrl(defaultMapUrl)
                .mapWidth(2000)
                .mapHeight(1500)
                .gridSize(60)
                .gridColor("#000000")
                .gridOpacity(0.35)
                .availableConditions(new ArrayList<>())
                .build();
        sceneRepository.save(defaultScene);

        if (room.getType() == Room.RoomType.OFFICIAL && room.getTemplate() != null && room.getTemplate().getDefaultJournals() != null) {
            for (TemplateJournal tj : room.getTemplate().getDefaultJournals()) {
                Journal journal = Journal.builder()
                        .room(room)
                        .title(tj.getTitle())
                        .content(tj.getContent())
                        .isAdminOnly(tj.getIsAdminOnly())
                        .build();
                journalRepository.save(journal);
            }
        }

        return convertToResponse(room, owner);
    }

    @Transactional
    public RoomResponse updateRoom(UUID roomId, UpdateRoomRequest request, String userEmail) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "اتاق یافت نشد"));

        if (!room.getOwner().getEmail().equalsIgnoreCase(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "تنها دانجن‌مستر اجازه ویرایش مشخصات اتاق را دارد");
        }

        room.setName(request.getName().trim());
        room.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);

        if (request.getPassword() != null) {
            if (request.getPassword().trim().isEmpty()) {
                room.setPassword(null);
            } else {
                room.setPassword(passwordEncoder.encode(request.getPassword().trim()));
            }
        }

        Room updated = roomRepository.save(room);
        return convertToResponse(updated, room.getOwner());
    }

    @Transactional
    public RoomResponse joinRoom(JoinRoomRequest request, String userEmail) {
        Room room = roomRepository.findByCode(request.getRoomCode().trim().toUpperCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "اتاقی با این کد یافت نشد"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "کاربر یافت نشد"));

        boolean isOwner = room.getOwner().getId().equals(user.getId());

        if (!isOwner && Boolean.FALSE.equals(room.getIsActive())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "اتاق در حال حاضر غیرفعال است و دانجن‌مستر حضور ندارد");
        }

        Optional<RoomMember> existingMember = memberRepository.findByRoomIdAndUserId(room.getId(), user.getId());
        if (existingMember.isPresent() && Boolean.TRUE.equals(existingMember.get().getIsBanned())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "شما توسط گیم‌مستر از این اتاق مسدود شده‌اید");
        }

        if (existingMember.isEmpty()) {
            if (room.getPassword() != null && !room.getPassword().isEmpty()) {
                if (request.getPassword() == null || !passwordEncoder.matches(request.getPassword(), room.getPassword())) {
                    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "رمز عبور اتاق اشتباه است");
                }
            }

            RoomMember.Role assignedRole = isOwner ? RoomMember.Role.ADMIN : RoomMember.Role.PLAYER;
            String defaultTitle = isOwner
                    ? (room.getHostRoleTitle() != null ? room.getHostRoleTitle() : "میزبان")
                    : (room.getPlayerRoleTitle() != null ? room.getPlayerRoleTitle() : "بازیکن");

            RoomMember member = RoomMember.builder()
                    .room(room)
                    .user(user)
                    .role(assignedRole)
                    .roleTitle(defaultTitle)
                    .isMuted(false)
                    .isBanned(false)
                    .joinedAt(LocalDateTime.now())
                    .build();
            RoomMember savedMember = memberRepository.save(member);

            if (assignedRole == RoomMember.Role.ADMIN) {
                PlayerPermission adminPerm = PlayerPermission.builder()
                        .room(room)
                        .member(savedMember)
                        .canAssets(true)
                        .canText(true)
                        .canFog(true)
                        .canDrawing(true)
                        .canScene(true)
                        .canRuler(true)
                        .canEditToken(true)
                        .build();
                permissionRepository.save(adminPerm);
            } else {
                permissionService.createDefaultPermissions(room, savedMember);
            }
        }

        if (isOwner) {
            if (Boolean.FALSE.equals(room.getIsActive())) {
                sessionManager.clearRoom(room.getId());
            }
            room.setIsActive(true);
            room.setLastActive(LocalDateTime.now());
            room.setGmLastSeenAt(LocalDateTime.now());
            roomRepository.save(room);
        }

        return convertToResponse(room, user);
    }

    @Transactional
    public void closeRoom(UUID roomId, String userEmail) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "اتاق یافت نشد"));

        if (!room.getOwner().getEmail().equalsIgnoreCase(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "تنها دانجن‌مستر اجازه بستن اتاق را دارد");
        }

        room.setIsActive(false);
        roomRepository.save(room);

        sessionManager.clearRoom(roomId);

        messagingTemplate.convertAndSend(
                WsConstants.TOPIC_ROOM_PREFIX + roomId,
                SocketEvent.<String>builder()
                        .roomId(roomId)
                        .action("ROOM_CLOSED")
                        .data("اتاق توسط دانجن‌مستر (GM) بسته شد.")
                        .build()
        );
    }

    @Transactional
    public List<RoomMemberResponse> getRoomMembers(UUID roomId, String requesterEmail) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "اتاق یافت نشد"));

        ensureOwnerMembership(room);

        Set<UUID> onlineUserIds = sessionManager.getOnlineUserIds(roomId);
        List<RoomMember> members = memberRepository.findAllByRoomId(roomId);

        List<UUID> memberIds = members.stream().map(RoomMember::getId).toList();
        Map<UUID, PlayerPermission> permMap = permissionRepository.findAllByMemberIdIn(memberIds).stream()
                .collect(Collectors.toMap(p -> p.getMember().getId(), p -> p));

        return members.stream()
                .filter(m -> !Boolean.TRUE.equals(m.getIsBanned()))
                .map(m -> {
                    PlayerPermission perm = permMap.get(m.getId());
                    PermissionResponse permResp = perm != null ? permissionService.convertToResponse(perm) : null;

                    boolean isOwner = room.getOwner() != null && room.getOwner().getId().equals(m.getUser().getId());
                    UUID uId = m.getUser().getId();
                    boolean isOnline = onlineUserIds.contains(uId);

                    String roleTitle = m.getRoleTitle();
                    if (roleTitle == null || roleTitle.isBlank()) {
                        roleTitle = (m.getRole() == RoomMember.Role.ADMIN || m.getRole() == RoomMember.Role.GM)
                                ? (room.getHostRoleTitle() != null ? room.getHostRoleTitle() : "میزبان")
                                : (room.getPlayerRoleTitle() != null ? room.getPlayerRoleTitle() : "بازیکن");
                    }

                    return RoomMemberResponse.builder()
                            .id(m.getId())
                            .userId(uId)
                            .username(m.getUser().getUsername())
                            .email(m.getUser().getEmail())
                            .role((m.getRole() == RoomMember.Role.ADMIN || m.getRole() == RoomMember.Role.GM) ? "GM" : "Player")
                            .roleTitle(roleTitle)
                            .isOwner(isOwner)
                            .isMuted(Boolean.TRUE.equals(m.getIsMuted()))
                            .isBanned(Boolean.TRUE.equals(m.getIsBanned()))
                            .isOnline(isOnline)
                            .permissions(permResp)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RoomMemberResponse> getOnlineRoomMembers(UUID roomId) {
        Room room = roomRepository.findById(roomId).orElse(null);
        if (room == null) return Collections.emptyList();

        Set<UUID> onlineUserIds = sessionManager.getOnlineUserIds(roomId);
        if (onlineUserIds.isEmpty()) return Collections.emptyList();

        List<RoomMember> members = memberRepository.findAllByRoomId(roomId);
        List<UUID> memberIds = members.stream().map(RoomMember::getId).toList();
        Map<UUID, PlayerPermission> permMap = permissionRepository.findAllByMemberIdIn(memberIds).stream()
                .collect(Collectors.toMap(p -> p.getMember().getId(), p -> p));

        return members.stream()
                .filter(m -> !Boolean.TRUE.equals(m.getIsBanned()) && onlineUserIds.contains(m.getUser().getId()))
                .map(m -> {
                    PlayerPermission perm = permMap.get(m.getId());
                    PermissionResponse permResp = perm != null ? permissionService.convertToResponse(perm) : null;
                    boolean isOwner = room.getOwner() != null && room.getOwner().getId().equals(m.getUser().getId());

                    String roleTitle = m.getRoleTitle();
                    if (roleTitle == null || roleTitle.isBlank()) {
                        roleTitle = (m.getRole() == RoomMember.Role.ADMIN || m.getRole() == RoomMember.Role.GM)
                                ? (room.getHostRoleTitle() != null ? room.getHostRoleTitle() : "میزبان")
                                : (room.getPlayerRoleTitle() != null ? room.getPlayerRoleTitle() : "بازیکن");
                    }

                    return RoomMemberResponse.builder()
                            .id(m.getId())
                            .userId(m.getUser().getId())
                            .username(m.getUser().getUsername())
                            .email(m.getUser().getEmail())
                            .role((m.getRole() == RoomMember.Role.ADMIN || m.getRole() == RoomMember.Role.GM) ? "GM" : "Player")
                            .roleTitle(roleTitle)
                            .isOwner(isOwner)
                            .isMuted(Boolean.TRUE.equals(m.getIsMuted()))
                            .isBanned(false)
                            .isOnline(true)
                            .permissions(permResp)
                            .build();
                })
                .collect(Collectors.toList());
    }

    private void ensureOwnerMembership(Room room) {
        User owner = room.getOwner();
        if (owner != null && !memberRepository.existsByRoomIdAndUserId(room.getId(), owner.getId())) {
            RoomMember ownerMember = RoomMember.builder()
                    .room(room)
                    .user(owner)
                    .role(RoomMember.Role.ADMIN)
                    .roleTitle(room.getHostRoleTitle() != null ? room.getHostRoleTitle() : "میزبان")
                    .isMuted(false)
                    .isBanned(false)
                    .joinedAt(LocalDateTime.now())
                    .build();
            RoomMember savedOwner = memberRepository.save(ownerMember);

            PlayerPermission adminPermission = PlayerPermission.builder()
                    .room(room)
                    .member(savedOwner)
                    .canAssets(true)
                    .canText(true)
                    .canFog(true)
                    .canDrawing(true)
                    .canScene(true)
                    .canRuler(true)
                    .canEditToken(true)
                    .build();
            permissionRepository.save(adminPermission);
        }
    }

    @Transactional
    public void kickMember(UUID roomId, UUID memberId, String requesterEmail) {
        RoomMember requester = memberRepository.findByRoomIdAndUserEmail(roomId, requesterEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "دسترسی غیرمجاز"));

        if (requester.getRole() != RoomMember.Role.ADMIN && requester.getRole() != RoomMember.Role.GM) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "تنها GM اجازه اخراج بازیکن را دارد");
        }

        RoomMember target = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "عضو یافت نشد"));

        if (target.getUser().getId().equals(target.getRoom().getOwner().getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "امکان اخراج سازنده اصلی اتاق وجود ندارد");
        }

        UUID targetUserId = target.getUser().getId();
        String targetUsername = target.getUser().getUsername();

        permissionRepository.deleteByMemberId(memberId);
        memberRepository.delete(target);
        evictCache(CacheConfig.CACHE_PERMISSIONS, memberId);
        sessionManager.removeUser(roomId, targetUserId);

        messagingTemplate.convertAndSend(
                WsConstants.TOPIC_ROOM_PREFIX + roomId,
                SocketEvent.<Map<String, Object>>builder()
                        .roomId(roomId)
                        .action("MEMBER_KICKED")
                        .data(Map.of(
                                "memberId", memberId.toString(),
                                "userId", targetUserId.toString(),
                                "username", targetUsername
                        ))
                        .build()
        );
    }

    @Transactional
    public void banMember(UUID roomId, UUID memberId, String requesterEmail) {
        RoomMember requester = memberRepository.findByRoomIdAndUserEmail(roomId, requesterEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "دسترسی غیرمجاز"));

        if (requester.getRole() != RoomMember.Role.ADMIN && requester.getRole() != RoomMember.Role.GM) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "تنها GM اجازه مسدودسازی بازیکن را دارد");
        }

        RoomMember target = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "عضو یافت نشد"));

        if (target.getUser().getId().equals(target.getRoom().getOwner().getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "امکان مسدودسازی سازنده اصلی اتاق وجود ندارد");
        }

        target.setIsBanned(true);
        memberRepository.save(target);
        evictCache(CacheConfig.CACHE_PERMISSIONS, memberId);
        sessionManager.removeUser(roomId, target.getUser().getId());

        UUID targetUserId = target.getUser().getId();
        String targetUsername = target.getUser().getUsername();

        messagingTemplate.convertAndSend(
                WsConstants.TOPIC_ROOM_PREFIX + roomId,
                SocketEvent.<Map<String, Object>>builder()
                        .roomId(roomId)
                        .action("MEMBER_BANNED")
                        .data(Map.of(
                                "memberId", memberId.toString(),
                                "userId", targetUserId.toString(),
                                "username", targetUsername
                        ))
                        .build()
        );
    }

    @Transactional
    public RoomMemberResponse toggleMuteMember(UUID roomId, UUID memberId, String requesterEmail) {
        RoomMember requester = memberRepository.findByRoomIdAndUserEmail(roomId, requesterEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "دسترسی غیرمجاز"));

        if (requester.getRole() != RoomMember.Role.ADMIN && requester.getRole() != RoomMember.Role.GM) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "تنها GM اجازه تغییر وضعیت صدا را دارد");
        }

        RoomMember target = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "عضو یافت نشد"));

        boolean nextMuted = !Boolean.TRUE.equals(target.getIsMuted());
        target.setIsMuted(nextMuted);
        memberRepository.save(target);

        RoomMemberResponse response = RoomMemberResponse.builder()
                .id(target.getId())
                .userId(target.getUser().getId())
                .username(target.getUser().getUsername())
                .role((target.getRole() == RoomMember.Role.ADMIN || target.getRole() == RoomMember.Role.GM) ? "GM" : "Player")
                .roleTitle(target.getRoleTitle())
                .isMuted(nextMuted)
                .isBanned(target.getIsBanned())
                .build();

        messagingTemplate.convertAndSend(
                WsConstants.TOPIC_ROOM_PREFIX + roomId,
                SocketEvent.<Map<String, Object>>builder()
                        .roomId(roomId)
                        .action("MEMBER_MUTE_TOGGLED")
                        .data(Map.of(
                                "memberId", target.getId().toString(),
                                "userId", target.getUser().getId().toString(),
                                "username", target.getUser().getUsername(),
                                "isMuted", nextMuted
                        ))
                        .build()
        );

        sessionManager.broadcastOnlineMembers(roomId);
        return response;
    }

    @Transactional
    public RoomMemberResponse changeMemberRole(UUID roomId, UUID memberId, String newRole, String requesterEmail) {
        RoomMember requester = memberRepository.findByRoomIdAndUserEmail(roomId, requesterEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "دسترسی غیرمجاز"));

        if (requester.getRole() != RoomMember.Role.ADMIN && requester.getRole() != RoomMember.Role.GM) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "تنها GM اجازه تغییر نقش اعضا را دارد");
        }

        RoomMember target = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "عضو یافت نشد"));

        RoomMember.Role role = "GM".equalsIgnoreCase(newRole) ? RoomMember.Role.ADMIN : RoomMember.Role.PLAYER;
        target.setRole(role);
        memberRepository.save(target);
        evictCache(CacheConfig.CACHE_PERMISSIONS, memberId);

        RoomMemberResponse response = RoomMemberResponse.builder()
                .id(target.getId())
                .userId(target.getUser().getId())
                .username(target.getUser().getUsername())
                .role((role == RoomMember.Role.ADMIN || role == RoomMember.Role.GM) ? "GM" : "Player")
                .roleTitle(target.getRoleTitle())
                .build();

        sessionManager.broadcastOnlineMembers(roomId);
        return response;
    }

    @Transactional
    public void leaveRoom(UUID roomId, String userEmail) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "اتاق یافت نشد"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "کاربر یافت نشد"));

        if (room.getOwner().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "دانجن‌مستر نمی‌تواند از اتاق خود خارج شود");
        }

        Optional<RoomMember> member = memberRepository.findByRoomIdAndUserId(roomId, user.getId());
        member.ifPresent(m -> {
            permissionRepository.deleteByMemberId(m.getId());
            memberRepository.delete(m);
            evictCache(CacheConfig.CACHE_PERMISSIONS, m.getId());
            sessionManager.removeUser(roomId, user.getId());
        });
    }

    @Transactional
    public void deleteRoom(UUID roomId, String userEmail) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "اتاق یافت نشد"));

        if (!room.getOwner().getEmail().equalsIgnoreCase(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "تنها سازنده اتاق اجازه حذف آن را دارد");
        }

        messagingTemplate.convertAndSend(
                WsConstants.TOPIC_ROOM_PREFIX + roomId,
                SocketEvent.<String>builder()
                        .roomId(roomId)
                        .action("ROOM_DELETED")
                        .data("این اتاق توسط سازنده آن برای همیشه حذف گردید.")
                        .build()
        );

        sessionManager.clearRoom(roomId);

        List<RoomMember> members = memberRepository.findAllByRoomId(roomId);
        for (RoomMember m : members) {
            evictCache(CacheConfig.CACHE_PERMISSIONS, m.getId());
        }
        evictCache(CacheConfig.CACHE_SCENES, roomId);
        evictCache(CacheConfig.CACHE_ROOM_SETTINGS, roomId);
        evictCache(CacheConfig.CACHE_MEMBERS, roomId);

        List<Scene> scenes = sceneRepository.findByRoomId(roomId);
        for (Scene scene : scenes) {
            tokenRepository.deleteBySceneId(scene.getId());
            fogRegionRepository.deleteBySceneId(scene.getId());
            drawingRepository.deleteBySceneId(scene.getId());
        }
        sceneRepository.deleteAllInBatch(scenes);

        permissionRepository.deleteByRoomId(roomId);
        memberRepository.deleteByRoomId(roomId);
        journalRepository.deleteByRoomId(roomId);
        if (settingsRepository.existsById(roomId)) {
            settingsRepository.deleteById(roomId);
        }

        roomRepository.delete(room);
    }

    @Transactional
    public void updateLastActive(UUID roomId, String username) {
        roomRepository.touchRoomActivity(roomId, LocalDateTime.now());
    }

    @Transactional
    public void updateGmLastSeenOnDisconnect(UUID roomId, UUID userId) {
        roomRepository.findById(roomId).ifPresent(room -> {
            if (room.getOwner() != null && room.getOwner().getId().equals(userId)) {
                room.setGmLastSeenAt(LocalDateTime.now());
                roomRepository.save(room);
                if (log.isDebugEnabled()) {
                    log.debug("GM disconnected from room {}. gmLastSeenAt updated.", roomId);
                }
            }
        });
    }

    private void evictCache(String cacheName, Object key) {
        if (cacheManager == null || key == null) return;
        Cache cache = cacheManager.getCache(cacheName);
        if (cache != null) {
            cache.evict(key);
        }
    }

    private String generateRandomCode() {
        return UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    private RoomResponse convertToResponse(Room room, User currentUser) {
        int count = memberRepository.countByRoomId(room.getId());
        RoomMember member = memberRepository.findByRoomIdAndUserId(room.getId(), currentUser.getId()).orElse(null);
        PlayerPermission perm = member != null ? permissionRepository.findByMemberId(member.getId()).orElse(null) : null;
        return convertToResponseFast(room, currentUser, member, perm, count > 0 ? count : 1);
    }

    private RoomResponse convertToResponseFast(Room room, User currentUser, RoomMember member, PlayerPermission permissions, int playerCount) {
        LocalDateTime baseActiveTime = room.getLastActive() != null
                ? room.getLastActive()
                : (room.getCreatedAt() != null ? room.getCreatedAt() : LocalDateTime.now());
        int expireDays = room.getExpireDays() != null ? room.getExpireDays() : 30;
        LocalDateTime expiresAt = room.getExpiresAt() != null
                ? room.getExpiresAt()
                : baseActiveTime.plusDays(expireDays);

        boolean isOwner = room.getOwner() != null && (
                room.getOwner().getId().equals(currentUser.getId()) ||
                        room.getOwner().getEmail().equalsIgnoreCase(currentUser.getEmail())
        );

        RoomMember.Role role = RoomMember.Role.PLAYER;
        if (isOwner) {
            role = RoomMember.Role.ADMIN;
        } else if (member != null) {
            role = member.getRole();
        }

        boolean isGM = isOwner || role == RoomMember.Role.ADMIN || role == RoomMember.Role.GM;

        RoomResponse.UserPermissionDto permissionsDto;
        if (isGM) {
            permissionsDto = RoomResponse.UserPermissionDto.builder()
                    .canAssets(true)
                    .canText(true)
                    .canFog(true)
                    .canDrawing(true)
                    .canScene(true)
                    .canRuler(true)
                    .canEditToken(true)
                    .build();
        } else if (permissions != null) {
            permissionsDto = RoomResponse.UserPermissionDto.builder()
                    .canAssets(Boolean.TRUE.equals(permissions.getCanAssets()))
                    .canText(Boolean.TRUE.equals(permissions.getCanText()))
                    .canFog(Boolean.TRUE.equals(permissions.getCanFog()))
                    .canDrawing(Boolean.TRUE.equals(permissions.getCanDrawing()))
                    .canScene(Boolean.TRUE.equals(permissions.getCanScene()))
                    .canRuler(Boolean.TRUE.equals(permissions.getCanRuler()))
                    .canEditToken(Boolean.TRUE.equals(permissions.getCanEditToken()))
                    .build();
        } else {
            permissionsDto = RoomResponse.UserPermissionDto.builder()
                    .canAssets(false)
                    .canText(false)
                    .canFog(false)
                    .canDrawing(false)
                    .canScene(false)
                    .canRuler(true)
                    .canEditToken(false)
                    .build();
        }

        return RoomResponse.builder()
                .id(room.getId())
                .code(room.getCode())
                .name(room.getName())
                .description(room.getDescription())
                .type(room.getType() != null ? room.getType().name() : Room.RoomType.STANDARD.name())
                .isProtected(room.getPassword() != null && !room.getPassword().isEmpty())
                .ownerUsername(room.getOwner() != null ? room.getOwner().getUsername() : "")
                .role(isGM ? "GM" : "Player")
                .hostRoleTitle(room.getHostRoleTitle() != null ? room.getHostRoleTitle() : "میزبان")
                .playerRoleTitle(room.getPlayerRoleTitle() != null ? room.getPlayerRoleTitle() : "بازیکن")
                .isOwner(isOwner)
                .permissions(permissionsDto)
                .isActive(room.getIsActive() != null ? room.getIsActive() : false)
                .playerCount(playerCount)
                .expiresAt(expiresAt)
                .templateId(room.getTemplate() != null ? room.getTemplate().getId() : null)
                .build();
    }
}