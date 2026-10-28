package com.VTT.V10.auth;

import com.VTT.V10.auth.dto.*;
import com.VTT.V10.room.RoomMemberRepository;
import com.VTT.V10.user.User;
import com.VTT.V10.user.UserRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

/**
 * Authentication service handling credentials validation, Google OAuth verification, token refresh, and account creation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Value("${google.client-id:}")
    private String googleClientId;

    private GoogleIdTokenVerifier verifier;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @PostConstruct
    public void initGoogleVerifier() {
        if (googleClientId != null && !googleClientId.isBlank()) {
            this.verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance()
            )
                    .setAudience(Collections.singletonList(googleClientId.trim()))
                    .build();
            log.info("Google Token Verifier initialized successfully with audience verification.");
        } else {
            log.warn("GOOGLE_CLIENT_ID is not configured. Google Sign-In will be disabled until set.");
        }
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String username = request.getUsername().trim();

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "این ایمیل قبلاً ثبت شده است");
        }
        if (userRepository.existsByUsername(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "این نام کاربری قبلاً انتخاب شده است");
        }

        User user = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .isEmailVerified(false)
                .isPremium(false)
                .build();

        user = userRepository.save(user);

        String token = jwtService.generateToken(user);
        UserDto userDto = buildUserDto(user);

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .user(userDto)
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "ایمیل یا رمز عبور اشتباه است"));

        if (user.getPassword() == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "ایمیل یا رمز عبور اشتباه است");
        }

        String token = jwtService.generateToken(user);
        UserDto userDto = buildUserDto(user);

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .user(userDto)
                .build();
    }

    /**
     * Validates a refresh token and issues a fresh access token.
     */
    @Transactional(readOnly = true)
    public AuthResponse refreshAccessToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank() || !jwtService.validateToken(refreshToken)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "نشست کاربری منقضی شده است، لطفاً مجدداً وارد شوید");
        }

        String email = jwtService.extractEmail(refreshToken);
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "توکن بازیابی نامعتبر است");
        }

        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "کاربر یافت نشد"));

        String newAccessToken = jwtService.generateToken(user);
        UserDto userDto = buildUserDto(user);

        return AuthResponse.builder()
                .token(newAccessToken)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .user(userDto)
                .build();
    }

    public String createRefreshTokenForEmail(String email) {
        if (email == null || email.isBlank()) return "";
        return userRepository.findByEmail(email.trim().toLowerCase())
                .map(jwtService::generateRefreshToken)
                .orElse("");
    }

    public long getRefreshMaxAgeSeconds() {
        return jwtService.getRefreshExpirationSeconds();
    }

    /**
     * Resolves or provisions user account based on verified Google OAuth ID Token.
     */
    @Transactional
    public AuthResponse loginWithGoogle(GoogleAuthRequest request) {
        if (verifier == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "ورود با گوگل در حال حاضر فعال نیست (Client ID در سرور تنظیم نشده است)");
        }

        if (request.getIdToken() == null || request.getIdToken().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "توکن گوگل نمی‌تواند خالی باشد");
        }

        try {
            GoogleIdToken idToken = verifier.verify(request.getIdToken());

            if (idToken == null) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "توکن گوگل نامعتبر یا منقضی شده است");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail().trim().toLowerCase();
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");
            String googleSub = payload.getSubject();

            Optional<User> existingUserOpt = userRepository.findByEmail(email);
            User user;

            if (existingUserOpt.isPresent()) {
                user = existingUserOpt.get();
                boolean shouldUpdate = false;

                if (user.getGoogleId() == null) {
                    user.setGoogleId(googleSub);
                    shouldUpdate = true;
                }
                if (!user.isEmailVerified()) {
                    user.setEmailVerified(true);
                    shouldUpdate = true;
                }
                if (user.getAvatarUrl() == null && pictureUrl != null) {
                    user.setAvatarUrl(pictureUrl);
                    shouldUpdate = true;
                }

                if (shouldUpdate) {
                    user = userRepository.save(user);
                }
                log.info("Google Sign-In: Existing account found for email: [{}]. Logged in successfully.", email);
            } else {
                String baseUsername = (name != null ? name.replaceAll("[^a-zA-Z0-9_]", "_").toLowerCase() : email.split("@")[0].replaceAll("[^a-zA-Z0-9_]", "_"));
                if (baseUsername.length() < 3) {
                    baseUsername = "user_" + baseUsername;
                }
                if (baseUsername.length() > 30) {
                    baseUsername = baseUsername.substring(0, 30);
                }

                String generatedUsername = baseUsername + "_" + (1000 + SECURE_RANDOM.nextInt(9000));
                if (userRepository.existsByUsername(generatedUsername)) {
                    generatedUsername = "user_" + UUID.randomUUID().toString().substring(0, 8);
                }

                User newUser = User.builder()
                        .email(email)
                        .username(generatedUsername)
                        .avatarUrl(pictureUrl)
                        .googleId(googleSub)
                        .isEmailVerified(true)
                        .isPremium(false)
                        .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                        .build();

                user = userRepository.save(newUser);
                log.info("Google Sign-In: New account created for email: [{}], username: [{}].", email, generatedUsername);
            }

            String token = jwtService.generateToken(user);
            UserDto userDto = buildUserDto(user);

            return AuthResponse.builder()
                    .token(token)
                    .userId(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .user(userDto)
                    .build();

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Google Auth verification failed: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "اعتبارسنجی حساب گوگل ناموفق بود");
        }
    }

    private UserDto buildUserDto(User user) {
        long rooms = roomMemberRepository.countByUserId(user.getId());

        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .isEmailVerified(user.isEmailVerified())
                .isPremium(user.isPremium())
                .roomsCount(rooms)
                .createdAt(user.getCreatedAt())
                .build();
    }
}