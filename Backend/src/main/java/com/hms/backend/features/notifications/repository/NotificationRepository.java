package com.hms.backend.features.notifications.repository;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.hms.backend.features.notifications.entity.Notification;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends MongoRepository<Notification, ObjectId> {
    Optional<Notification> findByNotificationId(String notificationId);
    List<Notification> findByRecipientUserId(String recipientUserId);
    List<Notification> findByRecipientRole(String recipientRole);
    List<Notification> findByRecipientUserIdAndReadStatus(String recipientUserId, boolean readStatus);
    List<Notification> findByRecipientRoleAndReadStatus(String recipientRole, boolean readStatus);
}
