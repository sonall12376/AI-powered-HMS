package com.hms.backend.features.notifications.service;

import com.hms.backend.exception.ResourceNotFoundException;
import com.hms.backend.features.notifications.dto.CreateNotificationDTO;
import com.hms.backend.features.notifications.dto.BroadcastNotificationDTO;
import com.hms.backend.features.notifications.entity.Notification;
import com.hms.backend.features.notifications.repository.NotificationRepository;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {

    private final NotificationRepository repository;

    public NotificationService(NotificationRepository repository) {
        this.repository = repository;
    }

    public Notification createNotification(CreateNotificationDTO dto) {
        Notification alert = new Notification();
        alert.setNotificationId("NTF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        alert.setRecipientUserId(dto.getRecipientUserId());
        alert.setRecipientRole(dto.getRecipientRole());
        alert.setTitle(dto.getTitle());
        alert.setMessage(dto.getMessage());
        alert.setType(dto.getType().toUpperCase());
        alert.setReadStatus(false);
        alert.setCreatedAt(Instant.now());
        alert.setExpiresAt(Instant.now().plus(30, ChronoUnit.DAYS)); // TTL: 30 days

        Notification saved = repository.save(alert);

        // MOCK MULTI-CHANNEL DISPATCH INTEGRATION LOGGING
        System.out.println("------------------------------------------------------------------");
        System.out.println("[MOCK SMTP DISPATCH] Dispatching Email Alert: " + alert.getTitle());
        System.out.println("Recipient User: " + (alert.getRecipientUserId() != null ? alert.getRecipientUserId() : "Role: " + alert.getRecipientRole()));
        System.out.println("Message Payload: " + alert.getMessage());
        System.out.println("------------------------------------------------------------------");
        System.out.println("[MOCK TWILIO DISPATCH] Dispatching SMS Alert: " + alert.getTitle());
        System.out.println("Recipient Payload: " + alert.getMessage());
        System.out.println("------------------------------------------------------------------");

        return saved;
    }

    public Notification broadcastNotification(BroadcastNotificationDTO dto) {
        Notification alert = new Notification();
        alert.setNotificationId("NTF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        alert.setRecipientUserId(null); // broad targets
        
        String targetRole = dto.getTargetRole().toUpperCase();
        if (!targetRole.startsWith("ROLE_")) {
            targetRole = "ROLE_" + targetRole;
        }
        alert.setRecipientRole(targetRole);
        
        alert.setTitle(dto.getTitle());
        alert.setMessage(dto.getMessage());
        alert.setType(dto.getType().toUpperCase());
        alert.setReadStatus(false);
        alert.setCreatedAt(Instant.now());
        alert.setExpiresAt(Instant.now().plus(30, ChronoUnit.DAYS)); // TTL: 30 days

        return repository.save(alert);
    }

    public Notification markAsRead(String id) {
        Notification alert = repository.findByNotificationId(id)
            .or(() -> {
                try {
                    return repository.findById(new ObjectId(id));
                } catch (IllegalArgumentException e) {
                    return java.util.Optional.empty();
                }
            })
            .orElseThrow(() -> new ResourceNotFoundException("Notification alert not found with identifier: " + id));

        alert.setReadStatus(true);
        return repository.save(alert);
    }

    public List<Notification> listNotifications(String recipientUserId, String recipientRole, Boolean readStatus) {
        List<Notification> alertsList = new ArrayList<>();

        if (recipientUserId != null && !recipientUserId.trim().isEmpty()) {
            if (readStatus != null) {
                alertsList.addAll(repository.findByRecipientUserIdAndReadStatus(recipientUserId, readStatus));
            } else {
                alertsList.addAll(repository.findByRecipientUserId(recipientUserId));
            }
        }

        if (recipientRole != null && !recipientRole.trim().isEmpty()) {
            String roleQuery = recipientRole.toUpperCase();
            if (!roleQuery.startsWith("ROLE_")) {
                roleQuery = "ROLE_" + roleQuery;
            }
            if (readStatus != null) {
                alertsList.addAll(repository.findByRecipientRoleAndReadStatus(roleQuery, readStatus));
            } else {
                alertsList.addAll(repository.findByRecipientRole(roleQuery));
            }
        }

        // Return all notifications if no filters are supplied (Admin view)
        if ((recipientUserId == null || recipientUserId.trim().isEmpty()) && 
            (recipientRole == null || recipientRole.trim().isEmpty())) {
            alertsList.addAll(repository.findAll());
        }

        // Sort descending by creation date
        alertsList.sort((n1, n2) -> n2.getCreatedAt().compareTo(n1.getCreatedAt()));

        // De-duplicate in case user-role lists overlap (though normally recipientUserId is set or recipientRole is set, not both in database documents)
        List<Notification> cleanList = new ArrayList<>();
        List<String> idsSeen = new ArrayList<>();
        for (Notification n : alertsList) {
            if (!idsSeen.contains(n.getNotificationId())) {
                idsSeen.add(n.getNotificationId());
                cleanList.add(n);
            }
        }

        return cleanList;
    }
}
