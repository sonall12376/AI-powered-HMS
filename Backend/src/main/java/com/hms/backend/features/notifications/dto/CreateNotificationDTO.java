package com.hms.backend.features.notifications.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateNotificationDTO {
    private String recipientUserId; // can be null for role-based targeting
    private String recipientRole; // can be null for user-specific targeting
    
    @NotBlank(message = "Title is mandatory")
    private String title;
    
    @NotBlank(message = "Message details are mandatory")
    private String message;
    
    @NotBlank(message = "Notification type is mandatory")
    private String type; // APPOINTMENT_REMINDER, PRESCRIPTION_READY, REPORT_AVAILABLE, etc.
}
