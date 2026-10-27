package com.VTT.V10.room;

import com.VTT.V10.room.dto.AddTokenRequest;
import com.VTT.V10.room.dto.TokenResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tokens")
@RequiredArgsConstructor
public class TokenController {

    private final TokenService tokenService;

    @GetMapping("/scene/{sceneId}")
    public ResponseEntity<List<TokenResponse>> getTokensByScene(
            @PathVariable UUID sceneId,
            Authentication authentication
    ) {
        validateAuth(authentication);
        return ResponseEntity.ok(tokenService.getTokensBySceneWithAuth(sceneId, authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<TokenResponse> addToken(
            @Valid @RequestBody AddTokenRequest request,
            Authentication authentication
    ) {
        validateAuth(authentication);
        return ResponseEntity.ok(tokenService.addToken(request, authentication.getName()));
    }

    @DeleteMapping("/{tokenId}")
    public ResponseEntity<Void> deleteToken(
            @PathVariable UUID tokenId,
            Authentication authentication
    ) {
        validateAuth(authentication);
        tokenService.deleteTokenWithAuth(tokenId, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    private void validateAuth(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "دسترسی غیرمجاز");
        }
    }
}