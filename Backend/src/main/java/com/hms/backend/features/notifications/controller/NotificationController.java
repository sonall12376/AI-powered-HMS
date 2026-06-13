package com.hms.backend.features.notifications.controller;

import com.hms.backend.dto.SuccessResponse;
import com.hms.backend.features.notifications.dto.CreateNotificationDTO;
import com.hms.backend.features.notifications.dto.BroadcastNotificationDTO;
import com.hms.backend.features.notifications.entity.Notification;
import com.hms.backend.features.notifications.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<SuccessResponse<Notification>> createNotification(@Valid @RequestBody CreateNotificationDTO dto) {
        Notification alert = service.createNotification(dto);
        SuccessResponse<Notification> response = new SuccessResponse<>("Direct alert created successfully.", alert);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<SuccessResponse<List<Notification>>> listNotifications(
            @RequestParam(required = false) String recipientUserId,
            @RequestParam(required = false) String recipientRole,
            @RequestParam(required = false) Boolean readStatus) {
        List<Notification> alerts = service.listNotifications(recipientUserId, recipientRole, readStatus);
        SuccessResponse<List<Notification>> response = new SuccessResponse<>("Inbox notifications retrieved successfully.", alerts);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<SuccessResponse<Notification>> markAsRead(@PathVariable String id) {
        Notification alert = service.markAsRead(id);
        SuccessResponse<Notification> response = new SuccessResponse<>("Notification marked as read.", alert);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/broadcast")
    public ResponseEntity<SuccessResponse<Notification>> broadcastAlert(@Valid @RequestBody BroadcastNotificationDTO dto) {
        Notification alert = service.broadcastNotification(dto);
        SuccessResponse<Notification> response = new SuccessResponse<>("System role broadcast created successfully.", alert);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
