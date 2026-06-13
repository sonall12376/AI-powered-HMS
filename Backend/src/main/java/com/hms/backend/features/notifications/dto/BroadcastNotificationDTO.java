package com.hms.backend.features.notifications.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BroadcastNotificationDTO {
    @NotBlank(message = "Target role is mandatory (e.g. ROLE_NURSE, ROLE_DOCTOR, ROLE_HOSPITAL_ADMIN)")
    private String targetRole;

    @NotBlank(message = "Title is mandatory")
    private String title;

    @NotBlank(message = "Message details are mandatory")
    private String message;

    @NotBlank(message = "Notification type is mandatory")
    private String type; // SYSTEM_BROADCAST, EMERGENCY_ALERT, INVENTORY_ALERT
}
