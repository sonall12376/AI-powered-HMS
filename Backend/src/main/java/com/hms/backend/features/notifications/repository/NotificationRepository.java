package com.hms.backend.features.notifications.repository;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.hms.backend.features.notifications.entity.Notification;

public interface NotificationRepository extends MongoRepository<Notification, ObjectId> {
    // TODO: Define repository methods for notifications
}
