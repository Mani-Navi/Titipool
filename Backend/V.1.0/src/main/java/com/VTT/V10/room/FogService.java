package com.VTT.V10.room;

import com.VTT.V10.room.dto.FogResponse;
import com.VTT.V10.websocket.dto.FogEvent;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FogService {

    private final FogRegionRepository fogRepository;
    private final SceneRepository sceneRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final RoomRepository roomRepository;
    private final PlayerPermissionRepository permissionRepository;
    private final ObjectMapper objectMapper;

    // قفل همگام‌سازی در سطح صحنه برای جلوگیری از Race Condition بین دستورات متوالی CLEAR_ALL و HIDE/REVEAL
    private final ConcurrentHashMap<UUID, Object> sceneLocks = new ConcurrentHashMap<>();

    private Object getSceneLock(UUID sceneId) {
        return sceneLocks.computeIfAbsent(sceneId, k -> new Object());
    }

    @Async("wsTaskExecutor")
    @Transactional
    public void asyncHandleFogUpdate(UUID roomId, FogEvent event) {
        try {
            if (event.getSceneId() == null) {
                var activeScene = sceneRepository.findByRoomIdAndIsActiveTrue(roomId);
                activeScene.ifPresent(scene -> event.setSceneId(scene.getId()));
            }
            if (event.getSceneId() != null) {
                synchronized (getSceneLock(event.getSceneId())) {
                    handleFogUpdate(event);
                }
            }
        } catch (Exception e) {
            log.error("Async Fog update error: {}", e.getMessage(), e);
        }
    }

    @Transactional
    public void updateGlobalReveal(UUID roomId, Map<String, Object> data) {
        try {
            Boolean isRevealed = (Boolean) data.get("isRevealed");
            String sceneIdStr = (String) data.get("sceneId");

            if (sceneIdStr != null && isRevealed != null) {
                UUID sceneId = UUID.fromString(sceneIdStr);
                sceneRepository.findById(sceneId).ifPresent(scene -> {
                    scene.setIsFogRevealed(isRevealed);
                    sceneRepository.save(scene);
                });
            }
        } catch (Exception e) {
            log.warn("Error saving global reveal in DB: {}", e.getMessage());
        }
    }

    @Transactional
    public FogResponse saveFogShapeWithAuth(UUID sceneId, FogEvent event, String userEmail) {
        Scene scene = sceneRepository.findById(sceneId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "صحنه یافت نشد"));

        validateFogPermission(scene.getRoom().getId(), userEmail);
        event.setSceneId(sceneId);
        if (event.getType() == null) {
            event.setType("HIDE");
        }
        synchronized (getSceneLock(sceneId)) {
            handleFogUpdate(event);
        }
        List<FogResponse> regions = getFogByScene(sceneId);
        return regions.isEmpty() ? null : regions.get(regions.size() - 1);
    }

    @Transactional
    public void clearFogBySceneWithAuth(UUID sceneId, String userEmail) {
        Scene scene = sceneRepository.findById(sceneId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "صحنه یافت نشد"));

        validateFogPermission(scene.getRoom().getId(), userEmail);
        synchronized (getSceneLock(sceneId)) {
            fogRepository.deleteBySceneId(sceneId);
            scene.setFogFilled(false);
            sceneRepository.saveAndFlush(scene);
        }
    }

    @Transactional
    public void fitFogToMapWithAuth(UUID sceneId, String userEmail) {
        Scene scene = sceneRepository.findById(sceneId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "صحنه یافت نشد"));

        validateFogPermission(scene.getRoom().getId(), userEmail);
        synchronized (getSceneLock(sceneId)) {
            fogRepository.deleteBySceneId(sceneId);
            scene.setFogFilled(true);
            sceneRepository.saveAndFlush(scene);
        }
    }

    @Transactional
    public void deleteFogRegionWithAuth(UUID sceneId, String targetId, String userEmail) {
        if (sceneId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "شناسه صحنه الزامی است");
        }
        Scene scene = sceneRepository.findById(sceneId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "صحنه یافت نشد"));

        validateFogPermission(scene.getRoom().getId(), userEmail);
        synchronized (getSceneLock(sceneId)) {
            deleteFogRegion(sceneId, targetId);
        }
    }

    @Transactional
    public void deleteFogRegion(UUID sceneId, String targetId) {
        if (targetId == null || targetId.isBlank()) return;

        List<FogRegion> existing = sceneId != null
                ? fogRepository.findBySceneId(sceneId)
                : fogRepository.findAll();

        for (FogRegion r : existing) {
            boolean match = false;
            if (r.getId() != null && r.getId().toString().equalsIgnoreCase(targetId)) {
                match = true;
            } else if (r.getPoints() != null && r.getPoints().has("id")) {
                if (r.getPoints().get("id").asText().equalsIgnoreCase(targetId)) {
                    match = true;
                }
            }

            if (match) {
                fogRepository.delete(r);
                fogRepository.flush();
                return;
            }
        }

        try {
            UUID uuid = UUID.fromString(targetId);
            fogRepository.deleteById(uuid);
            fogRepository.flush();
        } catch (IllegalArgumentException ignored) {}
    }

    @Transactional
    public void handleFogUpdate(FogEvent event) {
        if (event == null || event.getType() == null || event.getSceneId() == null) return;

        Scene scene = sceneRepository.findById(event.getSceneId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "صحنه یافت نشد"));

        String eventType = event.getType().trim();

        if ("CLEAR_ALL".equalsIgnoreCase(eventType)) {
            fogRepository.deleteBySceneId(event.getSceneId());
            scene.setFogFilled(false);
            sceneRepository.saveAndFlush(scene);
            return;
        }

        if ("FILL_ALL".equalsIgnoreCase(eventType) || "fill_all".equalsIgnoreCase(eventType)) {
            fogRepository.deleteBySceneId(event.getSceneId());
            scene.setFogFilled(true);
            sceneRepository.saveAndFlush(scene);
            return;
        }

        JsonNode pointsNode = null;
        if (event.getPoints() instanceof JsonNode jn) {
            pointsNode = jn;
        } else if (event.getPoints() != null) {
            try {
                pointsNode = objectMapper.valueToTree(event.getPoints());
            } catch (Exception ex) {
                log.warn("Could not convert fog points to JsonNode: {}", ex.getMessage());
            }
        }

        String incomingId = null;
        if (pointsNode != null && pointsNode.has("id")) {
            incomingId = pointsNode.get("id").asText();
        }

        if ("DELETE".equalsIgnoreCase(eventType) || "REMOVE".equalsIgnoreCase(eventType) || "FOG_DELETE".equalsIgnoreCase(eventType)) {
            deleteFogRegion(event.getSceneId(), incomingId);
            return;
        }

        if (pointsNode == null) {
            return;
        }

        FogRegion.FogType fogType;
        try {
            fogType = FogRegion.FogType.valueOf(eventType.toUpperCase());
        } catch (IllegalArgumentException e) {
            fogType = FogRegion.FogType.HIDE;
        }

        List<FogRegion> existingRegions = fogRepository.findBySceneId(event.getSceneId());
        FogRegion matchedRegion = null;

        if (incomingId != null && !incomingId.isBlank()) {
            for (FogRegion r : existingRegions) {
                if (r.getId() != null && r.getId().toString().equalsIgnoreCase(incomingId)) {
                    matchedRegion = r;
                    break;
                }
                if (r.getPoints() != null && r.getPoints().has("id")) {
                    String storedId = r.getPoints().get("id").asText();
                    if (storedId.equalsIgnoreCase(incomingId)) {
                        matchedRegion = r;
                        break;
                    }
                }
            }
        }

        if (matchedRegion != null) {
            matchedRegion.setPoints(pointsNode);
            matchedRegion.setType(fogType);
            fogRepository.saveAndFlush(matchedRegion);
            return;
        }

        FogRegion newRegion = FogRegion.builder()
                .scene(scene)
                .points(pointsNode)
                .type(fogType)
                .build();

        fogRepository.saveAndFlush(newRegion);
    }

    @Transactional(readOnly = true)
    public List<FogResponse> getFogBySceneWithAuth(UUID sceneId, String userEmail) {
        Scene scene = sceneRepository.findById(sceneId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "صحنه یافت نشد"));

        validateRoomMembership(scene.getRoom().getId(), userEmail);
        return getFogByScene(sceneId);
    }

    @Transactional(readOnly = true)
    public List<FogResponse> getFogByScene(UUID sceneId) {
        return fogRepository.findBySceneId(sceneId).stream()
                .map(region -> FogResponse.builder()
                        .id(region.getId())
                        .type(region.getType().name())
                        .points(region.getPoints())
                        .build())
                .collect(Collectors.toList());
    }

    private void validateRoomMembership(UUID roomId, String email) {
        boolean isMember = roomMemberRepository.findByRoomIdAndUserEmail(roomId, email).isPresent() ||
                roomRepository.findById(roomId).filter(r -> r.getOwner() != null && r.getOwner().getEmail().equalsIgnoreCase(email)).isPresent();

        if (!isMember) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "شما عضو این اتاق نیستید");
        }
    }

    private void validateFogPermission(UUID roomId, String email) {
        boolean isOwner = roomRepository.findById(roomId)
                .filter(r -> r.getOwner() != null && r.getOwner().getEmail().equalsIgnoreCase(email))
                .isPresent();

        var memberOpt = roomMemberRepository.findByRoomIdAndUserEmail(roomId, email);
        boolean isGM = memberOpt.filter(m -> m.getRole() == RoomMember.Role.ADMIN || m.getRole() == RoomMember.Role.GM).isPresent();

        boolean hasPerm = memberOpt.flatMap(m -> permissionRepository.findByMemberId(m.getId()))
                .map(p -> Boolean.TRUE.equals(p.getCanFog()))
                .orElse(false);

        if (!isOwner && !isGM && !hasPerm) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "دسترسی مدیریت مه جنگی را ندارید");
        }
    }
}