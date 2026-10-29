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

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

/**
 * Authentication service supporting hybrid Email/Password and Google OAuth accounts.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    public static final String OAUTH_NO_PASSWORD_MARKER = "OAUTH_NO_PASSWORD";

    private final UserRepository userRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Value("${google.client-id:}")
    private String googleClientId;

    private GoogleIdTokenVerifier verifier;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    public static boolean hasUsablePassword(User user) {
        if (user == null || user.getPassword() == null) return false;
        String hash = user.getPassword();
        return hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$");
    }

    @PostConstruct
    public void initGoogleVerifier() {
        if (googleClientId != null && !googleClientId.isBlank()) {
            this.verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance()
            )
                    .setAudience(Collections.singletonList(googleClientId.trim()))
                    .build();
            log.info("Google Token Verifier initialized successfully.");
        } else {
            log.warn("GOOGLE_CLIENT_ID is not configured.");
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

        if (!hasUsablePassword(user)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "این حساب با گوگل ساخته شده و هنوز رمز عبوری ندارد. لطفاً با گوگل وارد شوید و در پروفایل رمز عبور تعیین کنید."
            );
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
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

    @Transactional
    public AuthResponse loginWithGoogle(GoogleAuthRequest request) {
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "ورود با گوگل در سرور تنظیم نشده است");
        }

        if (request.getIdToken() == null || request.getIdToken().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "توکن گوگل نمی‌تواند خالی باشد");
        }

        VerifiedGoogleUser googleUser = verifyGoogleToken(request.getIdToken());
        if (googleUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "اعتبارسنجی حساب گوگل ناموفق بود");
        }

        String email = googleUser.email().trim().toLowerCase();
        Optional<User> existingUserOpt = userRepository.findByEmail(email);
        User user;

        if (existingUserOpt.isPresent()) {
            user = existingUserOpt.get();
            boolean shouldUpdate = false;

            if (user.getGoogleId() == null) {
                user.setGoogleId(googleUser.sub());
                shouldUpdate = true;
            }
            if (!user.isEmailVerified()) {
                user.setEmailVerified(true);
                shouldUpdate = true;
            }
            if (user.getAvatarUrl() == null && googleUser.picture() != null) {
                user.setAvatarUrl(googleUser.picture());
                shouldUpdate = true;
            }

            if (shouldUpdate) {
                user = userRepository.save(user);
            }
        } else {
            String baseUsername = (googleUser.name() != null
                    ? googleUser.name().replaceAll("[^a-zA-Z0-9_]", "_").toLowerCase()
                    : email.split("@")[0].replaceAll("[^a-zA-Z0-9_]", "_"));
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
                    .avatarUrl(googleUser.picture())
                    .googleId(googleUser.sub())
                    .isEmailVerified(true)
                    .isPremium(false)
                    .password(OAUTH_NO_PASSWORD_MARKER)
                    .build();

            user = userRepository.save(newUser);
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

    private VerifiedGoogleUser verifyGoogleToken(String idTokenString) {
        if (verifier != null) {
            try {
                GoogleIdToken idToken = verifier.verify(idTokenString);
                if (idToken != null) {
                    GoogleIdToken.Payload payload = idToken.getPayload();
                    return new VerifiedGoogleUser(
                            payload.getEmail(),
                            (String) payload.get("name"),
                            (String) payload.get("picture"),
                            payload.getSubject()
                    );
                }
            } catch (Exception e) {
                log.warn("GoogleIdTokenVerifier failed: {} - Attempting tokeninfo fallback...", e.getMessage());
            }
        }

        try {
            HttpRequest tokenInfoReq = HttpRequest.newBuilder()
                    .uri(URI.create("https://oauth2.googleapis.com/tokeninfo?id_token=" + idTokenString.trim()))
                    .timeout(Duration.ofSeconds(5))
                    .GET()
                    .build();

            HttpResponse<String> resp = httpClient.send(tokenInfoReq, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() == 200 && resp.body() != null) {
                String body = resp.body();
                if (body.contains("\"aud\":\"" + googleClientId.trim() + "\"") || body.contains("\"aud\": \"" + googleClientId.trim() + "\"")) {
                    String email = extractJsonField(body, "email");
                    String name = extractJsonField(body, "name");
                    String picture = extractJsonField(body, "picture");
                    String sub = extractJsonField(body, "sub");

                    if (email != null && !email.isBlank()) {
                        return new VerifiedGoogleUser(email, name, picture, sub);
                    }
                }
            }
        } catch (Exception ex) {
            log.error("Google tokeninfo fallback failed: {}", ex.getMessage());
        }

        return null;
    }

    private String extractJsonField(String json, String field) {
        String pattern = "\"" + field + "\"";
        int idx = json.indexOf(pattern);
        if (idx == -1) return null;
        int colon = json.indexOf(':', idx + pattern.length());
        if (colon == -1) return null;
        int quoteStart = json.indexOf('"', colon + 1);
        if (quoteStart == -1) return null;
        int quoteEnd = json.indexOf('"', quoteStart + 1);
        if (quoteEnd == -1) return null;
        return json.substring(quoteStart + 1, quoteEnd);
    }

    private record VerifiedGoogleUser(String email, String name, String picture, String sub) {}

    private UserDto buildUserDto(User user) {
        long rooms = roomMemberRepository.countByUserId(user.getId());

        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .isEmailVerified(user.isEmailVerified())
                .isPremium(user.isPremium())
                .hasPassword(hasUsablePassword(user))
                .hasGoogle(user.getGoogleId() != null && !user.getGoogleId().isBlank())
                .roomsCount(rooms)
                .createdAt(user.getCreatedAt())
                .build();
    }
}