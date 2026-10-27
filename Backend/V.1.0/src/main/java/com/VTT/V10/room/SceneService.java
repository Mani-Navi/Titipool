package com.VTT.V10.room;

import com.VTT.V10.asset.Asset;
import com.VTT.V10.asset.AssetRepository;
import com.VTT.V10.config.CacheConfig;
import com.VTT.V10.room.dto.CreateSceneRequest;
import com.VTT.V10.room.dto.SceneResponse;
import com.VTT.V10.room.dto.SceneStateResponse;
import com.VTT.V10.room.dto.TokenResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service managing canvas scenes, map attachments, and scene lifecycle transitions.
 */
@Service
@RequiredArgsConstructor
public class SceneService {

    private final SceneRepository sceneRepository;
    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final AssetRepository assetRepository;
    private final TokenService tokenService;
    private final TokenRepository tokenRepository;
    private final DrawingService drawingService;
    private final DrawingRepository drawingRepository;
    private final FogService fogService;
    private final FogRegionRepository fogRegionRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final CacheManager cacheManager;

    @Transactional
    public SceneResponse createScene(CreateSceneRequest request, String userEmail) {
        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "اتاق یافت نشد"));

        validateGMRole(room.getId(), userEmail);

        Asset asset = null;
        if (request.getAssetId() != null) {
            asset = assetRepository.findById(request.getAssetId()).orElse(null);
        }

        String mapUrl = request.getMapUrl();
        if ((mapUrl == null || mapUrl.isBlank()) && asset != null) {
            mapUrl = asset.getFileUrl();
        }

        long sceneCount = sceneRepository.countByRoomId(room.getId());
        boolean shouldBeActive = sceneCount == 0 || Boolean.TRUE.equals(request.getIsActive());

        if (shouldBeActive) {
            sceneRepository.deactivateAllScenesInRoom(room.getId());
        }

        Scene scene = Scene.builder()
                .room(room)
                .backgroundAsset(asset)
                .mapUrl(mapUrl)
                .name(request.getName().trim())
                .isActive(shouldBeActive)
                .mapWidth(2000)
                .mapHeight(1500)
                .gridSize(60)
                .gridColor("#000000")
                .gridOpacity(0.35)
                .availableConditions(new ArrayList<>())
                .isFogRevealed(false)
                .fogFilled(false)
                .build();

        sceneRepository.save(scene);
        evictScenesCache(room.getId());

        SceneResponse response = convertToResponse(scene);

        broadcastToRoom(room.getId(), "SCENE_CREATED", Map.of("scene", response, "sceneId", scene.getId().toString()));
        if (shouldBeActive) {
            broadcastToRoom(room.getId(), "SCENE_ACTIVATED", Map.of("sceneId", scene.getId().toString()));
        }

        return response;
    }

    @Transactional
    public SceneResponse renameScene(UUID sceneId, String newName, String userEmail) {
        Scene scene = sceneRepository.findById(sceneId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "صحنه یافت نشد"));

        UUID roomId = scene.getRoom().getId();
        validateGMRole(roomId, userEmail);

        if (newName != null && !newName.trim().isEmpty()) {
            scene.setName(newName.trim());
            sceneRepository.save(scene);
            evictScenesCache(roomId);
        }

        SceneResponse response = convertToResponse(scene);
        broadcastToRoom(roomId, "SCENE_RENAME", Map.of("sceneId", scene.getId().toString(), "name", scene.getName()));
        return response;
    }

    @Transactional
    public SceneResponse updateSceneMap(UUID sceneId, Map<String, Object> payload, String userEmail) {
        Scene scene = sceneRepository.findById(sceneId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "صحنه یافت نشد"));

        UUID roomId = scene.getRoom().getId();
        validateGMRole(roomId, userEmail);

        if (payload != null) {
            if (payload.containsKey("mapUrl") && payload.get("mapUrl") != null) {
                scene.setMapUrl(payload.get("mapUrl").toString());
            }

            if (payload.containsKey("assetId") && payload.get("assetId") != null) {
                try {
                    UUID assetId = UUID.fromString(payload.get("assetId").toString());
                    assetRepository.findById(assetId).ifPresent(scene::setBackgroundAsset);
                } catch (Exception ignored) {}
            }

            if (payload.containsKey("name") && payload.get("name") != null) {
                String nameStr = payload.get("name").toString().trim();
                if (!nameStr.isEmpty()) {
                    scene.setName(nameStr);
                }
            }
        }

        sceneRepository.save(scene);
        evictScenesCache(roomId);

        SceneResponse response = convertToResponse(scene);
        broadcastToRoom(roomId, "SCENE_UPDATED", Map.of("sceneId", scene.getId().toString(), "mapUrl", response.getMapUrl(), "assetUrl", response.getMapUrl()));
        return response;
    }

    @Transactional
    public SceneResponse activateScene(UUID sceneId, String userEmail) {
        Scene scene = sceneRepository.findById(sceneId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "صحنه یافت نشد"));

        UUID roomId = scene.getRoom().getId();
        validateGMRole(roomId, userEmail);

        sceneRepository.deactivateAllScenesInRoom(roomId);
        scene.setIsActive(true);
        sceneRepository.save(scene);
        evictScenesCache(roomId);

        SceneResponse response = convertToResponse(scene);
        broadcastToRoom(roomId, "SCENE_ACTIVATED", Map.of("sceneId", scene.getId().toString()));
        return response;
    }

    @Cacheable(value = CacheConfig.CACHE_SCENES, key = "#roomId")
    @Transactional(readOnly = true)
    public List<SceneResponse> getRoomScenes(UUID roomId, String userEmail) {
        validateMembership(roomId, userEmail);
        return sceneRepository.findByRoomId(roomId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SceneStateResponse getFullSceneState(UUID sceneId, String userEmail) {
        Scene scene = sceneRepository.findById(sceneId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "صحنه یافت نشد"));

        UUID roomId = scene.getRoom().getId();
        validateMembership(roomId, userEmail);

        boolean isGM = isUserGM(roomId, userEmail);

        List<TokenResponse> tokenResponses = tokenRepository.findBySceneId(sceneId).stream()
                .filter(t -> isGM || !Boolean.TRUE.equals(t.getIsHidden()))
                .map(t -> tokenService.convertToResponse(t, isGM))
                .collect(Collectors.toList());

        return SceneStateResponse.builder()
                .scene(convertToResponse(scene))
                .tokens(tokenResponses)
                .drawings(drawingService.getByScene(sceneId, isGM))
                .fogRegions(fogService.getFogByScene(sceneId))
                .build();
    }

    @Transactional
    public void deleteScene(UUID sceneId, String userEmail) {
        Scene scene = sceneRepository.findById(sceneId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "صحنه یافت نشد"));

        UUID roomId = scene.getRoom().getId();
        validateGMRole(roomId, userEmail);

        tokenRepository.deleteBySceneId(sceneId);
        fogRegionRepository.deleteBySceneId(sceneId);
        drawingRepository.deleteBySceneId(sceneId);
        sceneRepository.delete(scene);

        UUID nextActiveId = null;
        if (Boolean.TRUE.equals(scene.getIsActive())) {
            List<Scene> remaining = sceneRepository.findByRoomId(roomId);
            if (!remaining.isEmpty()) {
                Scene newActive = remaining.get(0);
                newActive.setIsActive(true);
                sceneRepository.save(newActive);
                nextActiveId = newActive.getId();
            }
        }

        evictScenesCache(roomId);
        broadcastToRoom(roomId, "SCENE_DELETE", Map.of("sceneId", sceneId.toString(), "activeSceneId", nextActiveId != null ? nextActiveId.toString() : ""));
    }

    private void evictScenesCache(UUID roomId) {
        if (cacheManager == null || roomId == null) return;
        Cache cache = cacheManager.getCache(CacheConfig.CACHE_SCENES);
        if (cache != null) {
            cache.evict(roomId);
        }
    }

    private void broadcastToRoom(UUID roomId, String action, Object data) {
        try {
            Map<String, Object> payload = Map.of(
                    "roomId", roomId.toString(),
                    "action", action,
                    "data", data
            );
            messagingTemplate.convertAndSend("/topic/room/" + roomId, payload);
        } catch (Exception ignored) {}
    }

    private void validateMembership(UUID roomId, String email) {
        boolean isMember = roomMemberRepository.findByRoomIdAndUserEmail(roomId, email).isPresent() ||
                roomRepository.findById(roomId).filter(r -> r.getOwner() != null && r.getOwner().getEmail().equalsIgnoreCase(email)).isPresent();

        if (!isMember) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "شما عضو این اتاق نیستید");
        }
    }

    private boolean isUserGM(UUID roomId, String email) {
        boolean isOwner = roomRepository.findById(roomId)
                .filter(r -> r.getOwner() != null && r.getOwner().getEmail().equalsIgnoreCase(email))
                .isPresent();

        boolean isGM = roomMemberRepository.findByRoomIdAndUserEmail(roomId, email)
                .filter(m -> m.getRole() == RoomMember.Role.ADMIN || m.getRole() == RoomMember.Role.GM)
                .isPresent();

        return isOwner || isGM;
    }

    private void validateGMRole(UUID roomId, String email) {
        if (!isUserGM(roomId, email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "تنها دانجن‌مستر (GM) اجازه این عملیات را دارد");
        }
    }

    private SceneResponse convertToResponse(Scene scene) {
        UUID assetId = (scene.getBackgroundAsset() != null) ? scene.getBackgroundAsset().getId() : null;
        String finalUrl = (scene.getMapUrl() != null && !scene.getMapUrl().isBlank())
                ? scene.getMapUrl()
                : (scene.getBackgroundAsset() != null ? scene.getBackgroundAsset().getFileUrl() : "");

        return SceneResponse.builder()
                .id(scene.getId())
                .name(scene.getName())
                .isActive(scene.getIsActive())
                .assetId(assetId)
                .assetUrl(finalUrl)
                .mapUrl(finalUrl)
                .mapWidth(scene.getMapWidth() != null ? scene.getMapWidth() : 2000)
                .mapHeight(scene.getMapHeight() != null ? scene.getMapHeight() : 1500)
                .gridSize(scene.getGridSize())
                .gridColor(scene.getGridColor())
                .gridOpacity(scene.getGridOpacity())
                .availableConditions(scene.getAvailableConditions() != null ? scene.getAvailableConditions() : new ArrayList<>())
                .isFogRevealed(scene.getIsFogRevealed() != null ? scene.getIsFogRevealed() : false)
                .fogFilled(scene.getFogFilled() != null ? scene.getFogFilled() : false)
                .build();
    }
}