package com.VTT.V10.room;

import com.VTT.V10.asset.Asset;
import com.VTT.V10.asset.AssetRepository;
import com.VTT.V10.room.dto.AddTokenRequest;
import com.VTT.V10.room.dto.TokenResponse;
import com.VTT.V10.websocket.dto.TokenMoveEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service managing canvas tokens, attributes, permissions, and asynchronous movement state persistence.
 * Optimized with single-query EntityGraphs and indexed existence checks.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TokenService {

    private final TokenRepository tokenRepository;
    private final SceneRepository sceneRepository;
    private final AssetRepository assetRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final PlayerPermissionRepository playerPermissionRepository;

    @Async("wsTaskExecutor")
    @Transactional
    public void asyncUpdateTokenFromEvent(TokenMoveEvent data, String userEmail, UUID roomId) {
        updateTokenFromEvent(data, userEmail, roomId);
    }

    @Transactional
    public TokenResponse addToken(AddTokenRequest request, String userEmail) {
        Scene scene = sceneRepository.findById(request.getSceneId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "صحنه یافت نشد"));

        Room room = scene.getRoom();

        RoomMember requester = null;
        if (userEmail != null) {
            requester = roomMemberRepository.findByRoomIdAndUserEmail(room.getId(), userEmail).orElse(null);
        }

        boolean isGM = (room.getOwner() != null && userEmail != null && room.getOwner().getEmail().equalsIgnoreCase(userEmail)) ||
                (requester != null && (requester.getRole() == RoomMember.Role.ADMIN || requester.getRole() == RoomMember.Role.GM));

        String finalControlledBy = "";

        if (requester != null && requester.getUser() != null) {
            finalControlledBy = requester.getUser().getId().toString();
            if (!isGM) {
                boolean alreadyHasToken = tokenRepository.existsBySceneIdAndControlledBy(scene.getId(), finalControlledBy);
                if (alreadyHasToken) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "هر بازیکن تنها مجاز به داشتن یک توکن اختصاصی است");
                }
            } else {
                finalControlledBy = (request.getControlledBy() != null && !request.getControlledBy().isBlank())
                        ? request.getControlledBy()
                        : requester.getUser().getId().toString();
            }
        } else if (isGM) {
            finalControlledBy = request.getControlledBy() != null ? request.getControlledBy() : "";
        }

        Asset asset = null;
        if (request.getAssetId() != null) {
            asset = assetRepository.findById(request.getAssetId()).orElse(null);
        }

        String finalAvatar = request.getAvatarUrl();
        if ((finalAvatar == null || finalAvatar.isBlank()) && asset != null) {
            finalAvatar = asset.getFileUrl();
        }

        String label = request.getLabel();
        if (label == null || label.isBlank()) {
            if (Boolean.TRUE.equals(request.getIsProp())) {
                label = "شیء جدید";
            } else {
                label = (requester != null && requester.getUser() != null) ? requester.getUser().getUsername() : "توکن جدید";
            }
        }

        try {
            Token token = Token.builder()
                    .scene(scene)
                    .asset(asset)
                    .label(label)
                    .avatarUrl(finalAvatar != null ? finalAvatar : "")
                    .x(request.getX() != null ? request.getX() : 1000.0)
                    .y(request.getY() != null ? request.getY() : 750.0)
                    .size(request.getSize() != null ? request.getSize() : (Boolean.TRUE.equals(request.getIsProp()) ? 0.5 : 1.0))
                    .rotation(0.0)
                    .hp(request.getHp() != null ? request.getHp() : 20)
                    .maxHp(request.getMaxHp() != null ? request.getMaxHp() : 20)
                    .ac(request.getAc() != null ? request.getAc() : 12)
                    .controlledBy(finalControlledBy)
                    .gmNotes(isGM ? request.getGmNotes() : null)
                    .isProp(isGM && Boolean.TRUE.equals(request.getIsProp()))
                    .goldValue(isGM && request.getGoldValue() != null ? request.getGoldValue() : 0)
                    .xpValue(isGM && request.getXpValue() != null ? request.getXpValue() : 0)
                    .isLooted(false)
                    .showHp(request.getShowHp() != null ? request.getShowHp() : true)
                    .showName(request.getShowName() != null ? request.getShowName() : true)
                    .showAc(request.getShowAc() != null ? request.getShowAc() : true)
                    .showConditions(request.getShowConditions() != null ? request.getShowConditions() : true)
                    .showNotes(isGM && Boolean.TRUE.equals(request.getShowNotes()))
                    .allowPlayerHp(isGM ? (request.getAllowPlayerHp() != null ? request.getAllowPlayerHp() : true) : true)
                    .allowPlayerConditions(isGM ? (request.getAllowPlayerConditions() != null ? request.getAllowPlayerConditions() : true) : true)
                    .allowPlayerAc(isGM ? (request.getAllowPlayerAc() != null ? request.getAllowPlayerAc() : true) : true)
                    .allowPlayerSize(isGM ? (request.getAllowPlayerSize() != null ? request.getAllowPlayerSize() : true) : true)
                    .conditions(request.getConditions() != null ? request.getConditions() : new ArrayList<>())
                    .build();

            tokenRepository.save(token);
            return convertToResponse(token, isGM);
        } catch (Exception e) {
            log.error("Fatal error saving token to database: ", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "خطا در ذخیره‌سازی توکن در پایگاه داده");
        }
    }

    @Transactional
    public void deleteTokenWithAuth(UUID tokenId, String userEmail) {
        Token token = tokenRepository.findWithSceneAndRoomById(tokenId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "توکن یافت نشد"));

        Room room = token.getScene() != null ? token.getScene().getRoom() : null;
        if (room == null) {
            tokenRepository.delete(token);
            return;
        }

        boolean isGM = room.getOwner() != null && room.getOwner().getEmail().equalsIgnoreCase(userEmail);
        boolean isOwner = false;

        if (!isGM && userEmail != null) {
            var memberOpt = roomMemberRepository.findByRoomIdAndUserEmail(room.getId(), userEmail);
            if (memberOpt.isPresent()) {
                RoomMember member = memberOpt.get();
                isGM = member.getRole() == RoomMember.Role.ADMIN || member.getRole() == RoomMember.Role.GM;
                String uid = member.getUser() != null ? member.getUser().getId().toString() : "";
                String uName = member.getUser() != null ? member.getUser().getUsername() : "";

                isOwner = (!uid.isEmpty() && uid.equalsIgnoreCase(token.getControlledBy())) ||
                        (!uName.isEmpty() && uName.equalsIgnoreCase(token.getControlledBy())) ||
                        userEmail.equalsIgnoreCase(token.getControlledBy());
            }
        }

        if (!isGM && !isOwner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "اجازه حذف این توکن را ندارید");
        }

        tokenRepository.delete(token);
    }

    @Transactional(readOnly = true)
    public List<TokenResponse> getTokensBySceneWithAuth(UUID sceneId, String userEmail) {
        Scene scene = sceneRepository.findById(sceneId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "صحنه یافت نشد"));

        Room room = scene.getRoom();
        boolean isGM = room.getOwner() != null && room.getOwner().getEmail().equalsIgnoreCase(userEmail);

        if (!isGM) {
            RoomMember member = roomMemberRepository.findByRoomIdAndUserEmail(room.getId(), userEmail)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "شما عضو این اتاق نیستید"));
            isGM = member.getRole() == RoomMember.Role.ADMIN || member.getRole() == RoomMember.Role.GM;
        }

        final boolean finalIsGM = isGM;
        return tokenRepository.findBySceneId(sceneId).stream()
                .filter(t -> finalIsGM || !Boolean.TRUE.equals(t.getIsHidden()))
                .map(t -> convertToResponse(t, finalIsGM))
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateTokenFromEvent(TokenMoveEvent data, String userEmail, UUID roomId) {
        if (data == null || data.getTokenId() == null) return;

        try {
            UUID tokenId = UUID.fromString(data.getTokenId());
            Optional<Token> tokenOpt = tokenRepository.findWithSceneAndRoomById(tokenId);
            if (tokenOpt.isEmpty()) return;

            Token token = tokenOpt.get();

            boolean isGM = false;
            boolean isOwner = false;
            boolean hasEditTokenPermission = false;

            Room room = token.getScene() != null ? token.getScene().getRoom() : null;
            if (room != null && room.getOwner() != null && userEmail != null) {
                if (room.getOwner().getEmail().equalsIgnoreCase(userEmail)) {
                    isGM = true;
                    isOwner = true;
                }
            }

            if (userEmail != null && !isGM) {
                var memberOpt = roomMemberRepository.findByRoomIdAndUserEmail(roomId, userEmail);
                if (memberOpt.isPresent()) {
                    RoomMember member = memberOpt.get();
                    isGM = member.getRole() == RoomMember.Role.ADMIN || member.getRole() == RoomMember.Role.GM;
                    String uid = member.getUser() != null ? member.getUser().getId().toString() : "";
                    String uName = member.getUser() != null ? member.getUser().getUsername() : "";

                    isOwner = token.getControlledBy() == null ||
                            token.getControlledBy().isBlank() ||
                            (!uid.isEmpty() && token.getControlledBy().equalsIgnoreCase(uid)) ||
                            (!uName.isEmpty() && token.getControlledBy().equalsIgnoreCase(uName)) ||
                            token.getControlledBy().equalsIgnoreCase(userEmail) ||
                            (token.getLabel() != null && !uName.isEmpty() && token.getLabel().equalsIgnoreCase(uName));

                    if (!isGM) {
                        var permOpt = playerPermissionRepository.findByMemberId(member.getId());
                        hasEditTokenPermission = permOpt.isPresent() && Boolean.TRUE.equals(permOpt.get().getCanEditToken());
                    }
                }
            }

            if (!isGM && !isOwner && !hasEditTokenPermission) {
                log.warn("Token update rejected: User {} lacks permission on token {}", userEmail, tokenId);
                return;
            }

            if (Boolean.TRUE.equals(data.getIsDeleted())) {
                if (isGM || isOwner) {
                    tokenRepository.deleteById(tokenId);
                }
                return;
            }

            if (data.getX() != null) token.setX(data.getX());
            if (data.getY() != null) token.setY(data.getY());
            if (data.getRotation() != null) token.setRotation(data.getRotation());

            if (data.getName() != null && !data.getName().isBlank()) {
                token.setLabel(data.getName());
            } else if (data.getLabel() != null && !data.getLabel().isBlank()) {
                token.setLabel(data.getLabel());
            }

            if (data.getAvatarUrl() != null && !data.getAvatarUrl().isBlank()) {
                token.setAvatarUrl(data.getAvatarUrl());
            }

            if (isGM || Boolean.TRUE.equals(token.getAllowPlayerHp()) || hasEditTokenPermission) {
                if (data.getHp() != null) token.setHp(data.getHp());
                if (data.getMaxHp() != null) token.setMaxHp(data.getMaxHp());
            }

            if (isGM || Boolean.TRUE.equals(token.getAllowPlayerAc()) || hasEditTokenPermission) {
                if (data.getAc() != null) token.setAc(data.getAc());
            }

            if (isGM || Boolean.TRUE.equals(token.getAllowPlayerConditions()) || hasEditTokenPermission) {
                if (data.getConditions() != null) token.setConditions(data.getConditions());
            }

            if (isGM || Boolean.TRUE.equals(token.getAllowPlayerSize()) || hasEditTokenPermission) {
                if (data.getSize() != null) token.setSize(data.getSize());
            }

            if (isGM) {
                if (data.getControlledBy() != null && !data.getControlledBy().isBlank()) {
                    token.setControlledBy(data.getControlledBy());
                }
                if (data.getGmNotes() != null) token.setGmNotes(data.getGmNotes());
                if (data.getGoldValue() != null) token.setGoldValue(data.getGoldValue());
                if (data.getXpValue() != null) token.setXpValue(data.getXpValue());
                if (data.getIsHidden() != null) token.setIsHidden(data.getIsHidden());
                if (data.getIsLocked() != null) token.setIsLocked(data.getIsLocked());

                if (data.getShowHp() != null) token.setShowHp(data.getShowHp());
                if (data.getShowName() != null) token.setShowName(data.getShowName());
                if (data.getShowAc() != null) token.setShowAc(data.getShowAc());
                if (data.getShowConditions() != null) token.setShowConditions(data.getShowConditions());
                if (data.getShowNotes() != null) token.setShowNotes(data.getShowNotes());

                if (data.getAllowPlayerHp() != null) token.setAllowPlayerHp(data.getAllowPlayerHp());
                if (data.getAllowPlayerConditions() != null) token.setAllowPlayerConditions(data.getAllowPlayerConditions());
                if (data.getAllowPlayerAc() != null) token.setAllowPlayerAc(data.getAllowPlayerAc());
                if (data.getAllowPlayerSize() != null) token.setAllowPlayerSize(data.getAllowPlayerSize());
            }

            tokenRepository.save(token);
        } catch (Exception e) {
            log.warn("Token event update error: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<TokenResponse> getTokensByScene(UUID sceneId) {
        return tokenRepository.findBySceneId(sceneId).stream()
                .map(t -> convertToResponse(t, false))
                .collect(Collectors.toList());
    }

    public TokenResponse convertToResponse(Token token) {
        return convertToResponse(token, false);
    }

    public TokenResponse convertToResponse(Token token, boolean isGM) {
        String finalUrl = token.getAvatarUrl();
        if ((finalUrl == null || finalUrl.isBlank()) && token.getAsset() != null) {
            finalUrl = token.getAsset().getFileUrl();
        }

        return TokenResponse.builder()
                .id(token.getId())
                .label(token.getLabel())
                .x(token.getX())
                .y(token.getY())
                .rotation(token.getRotation())
                .size(token.getSize() != null ? token.getSize() : 1.0)
                .assetUrl(finalUrl != null ? finalUrl : "")
                .hp(token.getHp())
                .maxHp(token.getMaxHp())
                .ac(token.getAc())
                .elevation(token.getElevation())
                .isHidden(token.getIsHidden())
                .isLocked(token.getIsLocked())
                .controlledBy(token.getControlledBy())
                .gmNotes(isGM ? token.getGmNotes() : null)
                .isProp(token.getIsProp())
                .goldValue(isGM ? token.getGoldValue() : 0)
                .xpValue(isGM ? token.getXpValue() : 0)
                .isLooted(token.getIsLooted())
                .showHp(token.getShowHp() != null ? token.getShowHp() : true)
                .showName(token.getShowName() != null ? token.getShowName() : true)
                .showAc(token.getShowAc() != null ? token.getShowAc() : true)
                .showConditions(token.getShowConditions() != null ? token.getShowConditions() : true)
                .showNotes(token.getShowNotes() != null ? token.getShowNotes() : false)
                .allowPlayerHp(token.getAllowPlayerHp() != null ? token.getAllowPlayerHp() : true)
                .allowPlayerConditions(token.getAllowPlayerConditions() != null ? token.getAllowPlayerConditions() : true)
                .allowPlayerAc(token.getAllowPlayerAc() != null ? token.getAllowPlayerAc() : true)
                .allowPlayerSize(token.getAllowPlayerSize() != null ? token.getAllowPlayerSize() : true)
                .conditions(token.getConditions() != null ? token.getConditions() : new ArrayList<>())
                .build();
    }
}