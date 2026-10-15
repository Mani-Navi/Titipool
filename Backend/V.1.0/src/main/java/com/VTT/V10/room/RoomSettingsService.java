package com.VTT.V10.room;

import com.VTT.V10.config.CacheConfig;
import com.VTT.V10.room.dto.RoomSettingsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * Service managing room settings with Caffeine cache integration.
 */
@Service
@RequiredArgsConstructor
public class RoomSettingsService {

    private final RoomSettingsRepository repository;
    private final RoomRepository roomRepository;
    private final RoomMemberRepository memberRepository;

    @Cacheable(value = CacheConfig.CACHE_ROOM_SETTINGS, key = "#roomId")
    @Transactional(readOnly = true)
    public RoomSettingsResponse getSettings(UUID roomId, String userEmail) {
        validateMembership(roomId, userEmail);

        RoomSettings settings = repository.findById(roomId)
                .orElseGet(() -> createDefaultSettings(roomId));
        return convertToResponse(settings);
    }

    @Transactional
    public RoomSettings createDefaultSettings(UUID roomId) {
        RoomSettings settings = RoomSettings.builder()
                .roomId(roomId)
                .zoomSensitivity(1.0)
                .overlayEffect("GLASS")
                .gmFogBlend(0.5)
                .colorTheme("DARK")
                .inputMode("AUTO")
                .shapeSnapSensitivity(0.5)
                .gridSnapSensitivity(0.5)
                .gridType("square")
                .lineType("solid")
                .measurementType("dnd5e_5105")
                .gridSize(60)
                .gridOpacity(0.35)
                .lineWidth(1.5)
                .gridColor("#000000")
                .isGridSnapping(true)
                .build();

        return repository.save(settings);
    }

    @CacheEvict(value = CacheConfig.CACHE_ROOM_SETTINGS, key = "#roomId")
    @Transactional
    public RoomSettingsResponse updateSettings(UUID roomId, RoomSettingsResponse request, String userEmail) {
        validateGMRole(roomId, userEmail);
        return updateSettings(roomId, request);
    }

    @CacheEvict(value = CacheConfig.CACHE_ROOM_SETTINGS, key = "#roomId")
    @Transactional
    public RoomSettingsResponse updateSettings(UUID roomId, RoomSettingsResponse request) {
        RoomSettings settings = repository.findById(roomId)
                .orElseGet(() -> createDefaultSettings(roomId));

        if (request != null) {
            if (request.getZoomSensitivity() != null) settings.setZoomSensitivity(request.getZoomSensitivity());
            if (request.getOverlayEffect() != null) settings.setOverlayEffect(request.getOverlayEffect());
            if (request.getGmFogBlend() != null) settings.setGmFogBlend(request.getGmFogBlend());
            if (request.getColorTheme() != null) settings.setColorTheme(request.getColorTheme());
            if (request.getInputMode() != null) settings.setInputMode(request.getInputMode());
            if (request.getShapeSnapSensitivity() != null) settings.setShapeSnapSensitivity(request.getShapeSnapSensitivity());
            if (request.getGridSnapSensitivity() != null) settings.setGridSnapSensitivity(request.getGridSnapSensitivity());

            if (request.getGridType() != null) settings.setGridType(request.getGridType());
            if (request.getLineType() != null) settings.setLineType(request.getLineType());
            if (request.getMeasurementType() != null) settings.setMeasurementType(request.getMeasurementType());
            if (request.getGridSize() != null) settings.setGridSize(request.getGridSize());
            if (request.getGridOpacity() != null) settings.setGridOpacity(request.getGridOpacity());
            if (request.getLineWidth() != null) settings.setLineWidth(request.getLineWidth());
            if (request.getGridColor() != null) settings.setGridColor(request.getGridColor());
            if (request.getIsGridSnapping() != null) settings.setIsGridSnapping(request.getIsGridSnapping());
        }

        RoomSettings saved = repository.save(settings);
        return convertToResponse(saved);
    }

    @CacheEvict(value = CacheConfig.CACHE_ROOM_SETTINGS, key = "#roomId")
    @Transactional
    public RoomSettingsResponse resetToDefault(UUID roomId, String userEmail) {
        validateGMRole(roomId, userEmail);

        RoomSettings settings = RoomSettings.builder()
                .roomId(roomId)
                .zoomSensitivity(1.0)
                .overlayEffect("GLASS")
                .gmFogBlend(0.5)
                .colorTheme("DARK")
                .inputMode("AUTO")
                .shapeSnapSensitivity(0.5)
                .gridSnapSensitivity(0.5)
                .gridType("square")
                .lineType("solid")
                .measurementType("dnd5e_5105")
                .gridSize(60)
                .gridOpacity(0.35)
                .lineWidth(1.5)
                .gridColor("#000000")
                .isGridSnapping(true)
                .build();

        return convertToResponse(repository.save(settings));
    }

    private void validateMembership(UUID roomId, String email) {
        if (memberRepository.findByRoomIdAndUserEmail(roomId, email).isEmpty() &&
                roomRepository.findById(roomId).filter(r -> r.getOwner() != null && r.getOwner().getEmail().equalsIgnoreCase(email)).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "شما عضو این اتاق نیستید");
        }
    }

    private void validateGMRole(UUID roomId, String email) {
        boolean isOwner = roomRepository.findById(roomId)
                .filter(r -> r.getOwner() != null && r.getOwner().getEmail().equalsIgnoreCase(email))
                .isPresent();

        boolean isGM = memberRepository.findByRoomIdAndUserEmail(roomId, email)
                .filter(m -> m.getRole() == RoomMember.Role.ADMIN || m.getRole() == RoomMember.Role.GM)
                .isPresent();

        if (!isOwner && !isGM) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "تنها دانجن‌مستر (GM) اجازه تغییر تنظیمات را دارد");
        }
    }

    private RoomSettingsResponse convertToResponse(RoomSettings s) {
        return RoomSettingsResponse.builder()
                .roomId(s.getRoomId())
                .zoomSensitivity(s.getZoomSensitivity())
                .overlayEffect(s.getOverlayEffect())
                .gmFogBlend(s.getGmFogBlend())
                .colorTheme(s.getColorTheme())
                .inputMode(s.getInputMode())
                .shapeSnapSensitivity(s.getShapeSnapSensitivity())
                .gridSnapSensitivity(s.getGridSnapSensitivity())
                .gridType(s.getGridType())
                .lineType(s.getLineType())
                .measurementType(s.getMeasurementType())
                .gridSize(s.getGridSize())
                .gridOpacity(s.getGridOpacity())
                .lineWidth(s.getLineWidth())
                .gridColor(s.getGridColor())
                .isGridSnapping(s.getIsGridSnapping())
                .build();
    }
}