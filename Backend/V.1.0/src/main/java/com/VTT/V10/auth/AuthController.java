package com.VTT.V10.auth;

import com.VTT.V10.auth.dto.AuthResponse;
import com.VTT.V10.auth.dto.GoogleAuthRequest;
import com.VTT.V10.auth.dto.LoginRequest;
import com.VTT.V10.auth.dto.RegisterRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String REFRESH_COOKIE_NAME = "refreshToken";
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        AuthResponse response = authService.register(request);
        attachRefreshCookie(httpRequest, httpResponse, response.getEmail());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        AuthResponse response = authService.login(request);
        attachRefreshCookie(httpRequest, httpResponse, response.getEmail());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(
            @Valid @RequestBody GoogleAuthRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        AuthResponse response = authService.loginWithGoogle(request);
        attachRefreshCookie(httpRequest, httpResponse, response.getEmail());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshCookie,
            @RequestHeader(name = "Authorization", required = false) String authHeader,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        String tokenToRefresh = refreshCookie;
        if ((tokenToRefresh == null || tokenToRefresh.isBlank()) && authHeader != null && authHeader.startsWith("Bearer ")) {
            tokenToRefresh = authHeader.substring(7);
        }

        AuthResponse response = authService.refreshAccessToken(tokenToRefresh);
        attachRefreshCookie(httpRequest, httpResponse, response.getEmail());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        boolean isSecure = isSecureRequest(httpRequest);
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(isSecure)
                .path("/")
                .maxAge(0)
                .sameSite(isSecure ? "None" : "Lax")
                .build();
        httpResponse.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return ResponseEntity.ok().build();
    }

    private void attachRefreshCookie(HttpServletRequest httpRequest, HttpServletResponse httpResponse, String email) {
        String refreshToken = authService.createRefreshTokenForEmail(email);
        if (refreshToken == null || refreshToken.isBlank()) return;

        boolean isSecure = isSecureRequest(httpRequest);
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, refreshToken)
                .httpOnly(true)
                .secure(isSecure)
                .path("/")
                .maxAge(authService.getRefreshMaxAgeSeconds())
                .sameSite(isSecure ? "None" : "Lax")
                .build();
        httpResponse.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private boolean isSecureRequest(HttpServletRequest request) {
        String proto = request.getHeader("X-Forwarded-Proto");
        return request.isSecure() || "https".equalsIgnoreCase(proto);
    }
}