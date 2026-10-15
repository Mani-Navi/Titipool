package com.VTT.V10.room;

import com.VTT.V10.config.CacheConfig;
import com.VTT.V10.room.dto.PermissionResponse;
import com.VTT.V10.room.dto.UpdatePermissionRequest;
import com.VTT.V10.user.User;
import com.VTT.V10.user.UserRepository;
import com.VTT.V10.websocket.WsConstants;
import com.VTT.V10.websocket.dto.SocketEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

/**
 * Service managing contextual participant permissions inside tactical rooms.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PlayerPermissionService {

    private final PlayerPermissionRepository permissionRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void createDefaultPermissions(Room room, RoomMember member) {
        if (member == null || room == null) return;
        Optional<PlayerPermission> existing = permissionRepository.findByMemberId(member.getId());
        if (existing.isPresent()) return;

        PlayerPermission permission = PlayerPermission.builder()
                .room(room)
                .member(member)
                .canAssets(false)
                .canText(false)
                .canFog(false)
                .canDrawing(false)
                .canScene(false)
                .canRuler(true)
                .canEditToken(false)
                .build();
        permissionRepository.save(permission);
    }

    @Transactional
    public PermissionResponse updatePermissionsWithAuthCheck(UpdatePermissionRequest request, String userEmail) {
        if (request == null || request.getMemberId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "شناسه عضو الزامی است");
        }

        RoomMember targetMember = roomMemberRepository.findById(request.getMemberId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "عضو مورد نظر یافت نشد"));

        UUID roomId = targetMember.getRoom().getId();

        boolean isOwner = false;
        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        Optional<Room> roomOpt = roomRepository.findById(roomId);
        if (userOpt.isPresent() && roomOpt.isPresent() && roomOpt.get().getOwner() != null) {
            isOwner = roomOpt.get().getOwner().getId().equals(userOpt.get().getId());
        }

        Optional<RoomMember> requesterOpt = roomMemberRepository.findByRoomIdAndUserEmail(roomId, userEmail);
        boolean isAdmin = requesterOpt.isPresent() && (requesterOpt.get().getRole() == RoomMember.Role.ADMIN || requesterOpt.get().getRole() == RoomMember.Role.GM);

        if (!isOwner && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "تنها GM اتاق اجازه تغییر دسترسی بازیکنان را دارد");
        }

        PermissionResponse updated = updatePermissions(request);

        messagingTemplate.convertAndSend(
                WsConstants.TOPIC_ROOM_PREFIX + roomId,
                SocketEvent.<PermissionResponse>builder()
                        .roomId(roomId)
                        .action("PERMISSION_UPDATED")
                        .data(updated)
                        .build()
        );

        return updated;
    }

    @CacheEvict(value = CacheConfig.CACHE_PERMISSIONS, key = "#request.memberId")
    @Transactional
    public PermissionResponse updatePermissions(UpdatePermissionRequest request) {
        if (request == null || request.getMemberId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "شناسه عضو الزامی است");
        }

        UUID memberId = request.getMemberId();
        PlayerPermission perm = permissionRepository.findByMemberId(memberId).orElseGet(() -> {
            RoomMember member = roomMemberRepository.findById(memberId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "عضو اتاق یافت نشد"));

            return PlayerPermission.builder()
                    .room(member.getRoom())
                    .member(member)
                    .canAssets(false)
                    .canText(false)
                    .canFog(false)
                    .canDrawing(false)
                    .canScene(false)
                    .canRuler(true)
                    .canEditToken(false)
                    .build();
        });

        if (request.getCanAssets() != null) perm.setCanAssets(request.getCanAssets());
        if (request.getCanFog() != null) perm.setCanFog(request.getCanFog());
        if (request.getCanDrawing() != null) perm.setCanDrawing(request.getCanDrawing());
        if (request.getCanScene() != null) perm.setCanScene(request.getCanScene());
        if (request.getCanText() != null) perm.setCanText(request.getCanText());
        if (request.getCanRuler() != null) perm.setCanRuler(request.getCanRuler());
        if (request.getCanEditToken() != null) perm.setCanEditToken(request.getCanEditToken());

        permissionRepository.save(perm);
        return convertToResponse(perm);
    }

    @Transactional(readOnly = true)
    public PermissionResponse getMemberPermissionsWithAuthCheck(UUID memberId, String requesterEmail) {
        RoomMember targetMember = roomMemberRepository.findById(memberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "عضو یافت نشد"));

        UUID roomId = targetMember.getRoom().getId();
        boolean isMember = roomMemberRepository.findByRoomIdAndUserEmail(roomId, requesterEmail).isPresent() ||
                roomRepository.findById(roomId).filter(r -> r.getOwner() != null && r.getOwner().getEmail().equalsIgnoreCase(requesterEmail)).isPresent();

        if (!isMember) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "شما عضو اتاقی که این کاربر در آن حضور دارد نیستید");
        }

        return getMemberPermissions(memberId);
    }

    @Cacheable(value = CacheConfig.CACHE_PERMISSIONS, key = "#memberId")
    @Transactional(readOnly = true)
    public PermissionResponse getMemberPermissions(UUID memberId) {
        PlayerPermission perm = permissionRepository.findByMemberId(memberId).orElseGet(() -> {
            RoomMember member = roomMemberRepository.findById(memberId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "عضو اتاق یافت نشد"));

            return PlayerPermission.builder()
                    .room(member.getRoom())
                    .member(member)
                    .canAssets(false)
                    .canText(false)
                    .canFog(false)
                    .canDrawing(false)
                    .canScene(false)
                    .canRuler(true)
                    .canEditToken(false)
                    .build();
        });

        return convertToResponse(perm);
    }

    public PermissionResponse convertToResponse(PlayerPermission p) {
        return PermissionResponse.builder()
                .memberId(p.getMember().getId())
                .username(p.getMember().getUser() != null ? p.getMember().getUser().getUsername() : "")
                .role(p.getMember().getRole() == RoomMember.Role.ADMIN || p.getMember().getRole() == RoomMember.Role.GM ? "GM" : "Player")
                .canAssets(Boolean.TRUE.equals(p.getCanAssets()))
                .canDrawing(Boolean.TRUE.equals(p.getCanDrawing()))
                .canFog(Boolean.TRUE.equals(p.getCanFog()))
                .canScene(Boolean.TRUE.equals(p.getCanScene()))
                .canText(Boolean.TRUE.equals(p.getCanText()))
                .canRuler(p.getCanRuler() == null || Boolean.TRUE.equals(p.getCanRuler()))
                .canEditToken(Boolean.TRUE.equals(p.getCanEditToken()))
                .build();
    }
}