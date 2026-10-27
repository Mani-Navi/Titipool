package com.VTT.V10.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangePasswordRequest {

    private String currentPassword;

    @NotBlank(message = "رمز عبور جدید الزامی است")
    @Size(min = 8, max = 72, message = "رمز عبور باید بین ۸ تا ۷۲ کاراکتر باشد")
    private String newPassword;
}