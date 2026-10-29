package com.VTT.V10.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private UUID id;
    private String username;
    private String email;
    private String avatarUrl;

    @JsonProperty("isEmailVerified")
    private boolean isEmailVerified;

    @JsonProperty("isPremium")
    private boolean isPremium;

    @JsonProperty("hasPassword")
    @Builder.Default
    private boolean hasPassword = true;

    @JsonProperty("hasGoogle")
    @Builder.Default
    private boolean hasGoogle = false;

    private long roomsCount;
    private LocalDateTime createdAt;
}