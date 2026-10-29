package com.VTT.V10.user;

import com.VTT.V10.auth.dto.AuthResponse;
import com.VTT.V10.auth.dto.UserDto;
import com.VTT.V10.user.dto.ChangeEmailRequest;
import com.VTT.V10.user.dto.ChangePasswordRequest;
import com.VTT.V10.user.dto.UpdateProfileRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<UserDto> getProfile(Authentication auth) {
        validateAuth(auth);
        return ResponseEntity.ok(userService.getProfile(auth.getName()));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserDto> updateProfile(
            Authentication auth,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        validateAuth(auth);
        return ResponseEntity.ok(userService.updateProfile(auth.getName(), request));
    }

    @PostMapping("/change-password")
    public ResponseEntity<UserDto> changePassword(
            Authentication auth,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        validateAuth(auth);
        return ResponseEntity.ok(userService.changePassword(auth.getName(), request));
    }

    @PostMapping("/change-email")
    public ResponseEntity<AuthResponse> changeEmail(
            Authentication auth,
            @Valid @RequestBody ChangeEmailRequest request
    ) {
        validateAuth(auth);
        return ResponseEntity.ok(userService.changeEmail(auth.getName(), request));
    }

    @PostMapping("/send-verification-code")
    public ResponseEntity<Void> sendVerificationCode(Authentication auth) {
        validateAuth(auth);
        userService.sendVerificationCode(auth.getName());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/verify-code")
    public ResponseEntity<UserDto> verifyCode(
            Authentication auth,
            @RequestBody Map<String, String> body
    ) {
        validateAuth(auth);
        if (body == null || !body.containsKey("code") || body.get("code") == null || body.get("code").isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "کد تایید الزامی است");
        }
        String code = body.get("code").trim();
        return ResponseEntity.ok(userService.verifyCode(auth.getName(), code));
    }

    private void validateAuth(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "دسترسی غیرمجاز");
        }
    }
}