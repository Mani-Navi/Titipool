package com.VTT.V10.room;

import com.VTT.V10.room.dto.FogResponse;
import com.VTT.V10.websocket.dto.FogEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/fog")
@RequiredArgsConstructor
public class FogController {

    private final FogService fogService;

    @GetMapping("/scene/{sceneId}")
    public ResponseEntity<List<FogResponse>> getFog(
            @PathVariable UUID sceneId,
            Authentication authentication
    ) {
        validateAuth(authentication);
        return ResponseEntity.ok(fogService.getFogBySceneWithAuth(sceneId, authentication.getName()));
    }

    @PostMapping("/scene/{sceneId}")
    public ResponseEntity<FogResponse> saveFogShape(
            @PathVariable UUID sceneId,
            @RequestBody FogEvent fogEvent,
            Authentication authentication
    ) {
        validateAuth(authentication);
        return ResponseEntity.ok(fogService.saveFogShapeWithAuth(sceneId, fogEvent, authentication.getName()));
    }

    @DeleteMapping("/scene/{sceneId}")
    public ResponseEntity<Void> clearFog(
            @PathVariable UUID sceneId,
            Authentication authentication
    ) {
        validateAuth(authentication);
        fogService.clearFogBySceneWithAuth(sceneId, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/scene/{sceneId}/fit")
    public ResponseEntity<Void> fitFogToMap(
            @PathVariable UUID sceneId,
            Authentication authentication
    ) {
        validateAuth(authentication);
        fogService.fitFogToMapWithAuth(sceneId, authentication.getName());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFog(
            @PathVariable String id,
            @RequestParam(required = false) UUID sceneId,
            Authentication authentication
    ) {
        validateAuth(authentication);
        fogService.deleteFogRegionWithAuth(sceneId, id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    private void validateAuth(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "دسترسی غیرمجاز");
        }
    }
}