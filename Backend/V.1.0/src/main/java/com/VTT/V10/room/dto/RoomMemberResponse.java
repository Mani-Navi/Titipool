package com.VTT.V10.room.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomMemberResponse {
    private UUID id;
    private UUID userId;
    private String username;
    private String email;
    private String avatarUrl;
    private String role;
    private String roleTitle;
    private Boolean isOwner;
    private Boolean isMuted;
    private Boolean isBanned;
    private Boolean isOnline;
    private PermissionResponse permissions;
}