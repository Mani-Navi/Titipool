package com.VTT.V10.room.dto;

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
public class RoomResponse {
    private UUID id;
    private String code;
    private String name;
    private String description;
    private String type;
    private String ownerUsername;
    private String role;
    private boolean isProtected;

    @Builder.Default
    private String hostRoleTitle = "میزبان";

    @Builder.Default
    private String playerRoleTitle = "بازیکن";

    @JsonProperty("is_owner")
    private Boolean isOwner;

    @JsonProperty("permissions")
    private UserPermissionDto permissions;

    @JsonProperty("is_active")
    @Builder.Default
    private Boolean isActive = true;

    @JsonProperty("player_count")
    @Builder.Default
    private Integer playerCount = 1;

    @JsonProperty("expires_at")
    private LocalDateTime expiresAt;

    @JsonProperty("template_id")
    private UUID templateId;

    @JsonProperty("roomId")
    public UUID getRoomId() {
        return this.id;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserPermissionDto {
        private Boolean canAssets;
        private Boolean canText;
        private Boolean canFog;
        private Boolean canDrawing;
        private Boolean canScene;

        @JsonProperty("canMap")
        public Boolean getCanMap() {
            return this.canScene;
        }

        private Boolean canRuler;
        private Boolean canEditToken;
    }
}