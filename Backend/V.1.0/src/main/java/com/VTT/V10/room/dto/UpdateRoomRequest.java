package com.VTT.V10.room.dto;

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
public class UpdateRoomRequest {

    @NotBlank(message = "نام اتاق الزامی است")
    @Size(min = 2, max = 100, message = "نام اتاق باید بین ۲ تا ۱۰۰ کاراکتر باشد")
    private String name;

    @Size(max = 500, message = "توضیحات اتاق حداکثر ۵۰۰ کاراکتر است")
    private String description;

    private String password;
}