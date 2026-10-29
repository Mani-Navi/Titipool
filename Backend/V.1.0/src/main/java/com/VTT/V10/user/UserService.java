package com.VTT.V10.user;

import com.VTT.V10.auth.AuthService;
import com.VTT.V10.auth.JwtService;
import com.VTT.V10.auth.dto.AuthResponse;
import com.VTT.V10.auth.dto.UserDto;
import com.VTT.V10.mail.EmailService;
import com.VTT.V10.room.RoomMemberRepository;
import com.VTT.V10.user.dto.ChangeEmailRequest;
import com.VTT.V10.user.dto.ChangePasswordRequest;
import com.VTT.V10.user.dto.UpdateProfileRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoomMemberRepository roomMemberRepository;
    private final JwtService jwtService;
    private final EmailService emailService;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Transactional(readOnly = true)
    public UserDto getProfile(String userEmail) {
        User user = getByEmail(userEmail);
        return toDto(user);
    }

    @Transactional
    public UserDto updateProfile(String userEmail, UpdateProfileRequest request) {
        User user = getByEmail(userEmail);

        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            String trimmedUsername = request.getUsername().trim();
            if (!trimmedUsername.equalsIgnoreCase(user.getUsername())) {
                Optional<User> existingUser = userRepository.findByUsername(trimmedUsername);
                if (existingUser.isPresent() && !existingUser.get().getId().equals(user.getId())) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "این نام کاربری قبلاً انتخاب شده است");
                }
                user.setUsername(trimmedUsername);
            }
        }

        if (request.getAvatarUrl() != null && !request.getAvatarUrl().isBlank()) {
            user.setAvatarUrl(request.getAvatarUrl().trim());
        }

        user = userRepository.save(user);
        return toDto(user);
    }

    /**
     * Supports both initial password provisioning for OAuth-only users (no currentPassword needed)
     * and standard password rotation for users who already have a password.
     */
    @Transactional
    public UserDto changePassword(String userEmail, ChangePasswordRequest request) {
        User user = getByEmail(userEmail);
        boolean alreadyHasPassword = AuthService.hasUsablePassword(user);

        if (alreadyHasPassword) {
            if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "وارد کردن رمز عبور فعلی الزامی است");
            }
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "رمز عبور فعلی اشتباه است");
            }
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user = userRepository.save(user);
        return toDto(user);
    }

    @Transactional
    public AuthResponse changeEmail(String userEmail, ChangeEmailRequest request) {
        User user = getByEmail(userEmail);

        if (!AuthService.hasUsablePassword(user)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "لطفاً ابتدا از تب «امنیت و پسورد» برای حساب خود یک رمز عبور تعیین کنید"
            );
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "رمز عبور نادرست است");
        }

        String targetEmail = request.getNewEmail().trim().toLowerCase();
        if (targetEmail.equalsIgnoreCase(user.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ایمیل جدید با ایمیل فعلی یکسان است");
        }

        if (userRepository.existsByEmail(targetEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "این ایمیل قبلاً ثبت شده است");
        }

        user.setEmail(targetEmail);
        user.setEmailVerified(false);
        user.setVerificationCode(null);
        user.setVerificationExpiry(null);
        user = userRepository.save(user);

        String newToken = jwtService.generateToken(user);
        UserDto userDto = toDto(user);

        return AuthResponse.builder()
                .token(newToken)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .user(userDto)
                .build();
    }

    @Transactional
    public void sendVerificationCode(String userEmail) {
        User user = getByEmail(userEmail);

        if (user.getVerificationExpiry() != null &&
                LocalDateTime.now().isBefore(user.getVerificationExpiry().minusSeconds(60))) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "لطفاً پیش از درخواست مجدد یک دقیقه صبر کنید");
        }

        int randomInt = SECURE_RANDOM.nextInt(1_000_000);
        String code = String.format("%06d", randomInt);

        user.setVerificationCode(code);
        user.setVerificationExpiry(LocalDateTime.now().plusMinutes(2));
        userRepository.save(user);

        log.info("Dispatching OTP verification code for user: {}", user.getId());
        emailService.sendOtpCode(user.getEmail(), code);
    }

    @Transactional
    public UserDto verifyCode(String userEmail, String code) {
        User user = getByEmail(userEmail);

        if (user.getVerificationCode() == null || user.getVerificationExpiry() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "کد تاییدی ارسال نشده است");
        }

        if (LocalDateTime.now().isAfter(user.getVerificationExpiry())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "کد تایید منقضی شده است. لطفاً کد جدید دریافت کنید");
        }

        if (!user.getVerificationCode().equals(code.trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "کد وارد شده اشتباه است");
        }

        user.setEmailVerified(true);
        user.setVerificationCode(null);
        user.setVerificationExpiry(null);
        user = userRepository.save(user);

        return toDto(user);
    }

    @Transactional(readOnly = true)
    public User getByEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ایمیل نامعتبر است");
        }
        return userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "کاربر یافت نشد"));
    }

    private UserDto toDto(User user) {
        long rooms = roomMemberRepository.countByUserId(user.getId());

        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .isEmailVerified(user.isEmailVerified())
                .isPremium(user.isPremium())
                .hasPassword(AuthService.hasUsablePassword(user))
                .hasGoogle(user.getGoogleId() != null && !user.getGoogleId().isBlank())
                .roomsCount(rooms)
                .createdAt(user.getCreatedAt())
                .build();
    }
}