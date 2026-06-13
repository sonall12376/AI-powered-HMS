package com.hms.backend.features.notifications.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
@CompoundIndexes({
    @CompoundIndex(name = "recipient_inbox_idx", def = "{'recipientUserId': 1, 'readStatus': 1}"),
    @CompoundIndex(name = "role_inbox_idx", def = "{'recipientRole': 1, 'readStatus': 1}")
})
public class Notification {
    @Id
    private ObjectId id;

    @Indexed(unique = true)
    @Field("notification_id")
    private String notificationId; // e.g. NTF-XXXXXX

    @Field("recipient_user_id")
    private String recipientUserId; // username e.g. "john.doe"

    @Field("recipient_role")
    private String recipientRole; // targeted role e.g. "ROLE_DOCTOR"

    private String title;
    private String message;
    private String type; // APPOINTMENT_REMINDER, PRESCRIPTION_READY, etc.

    @Field("read_status")
    private boolean readStatus; // true = read, false = unread

    @CreatedDate
    @Field("created_at")
    private Instant createdAt;

    @Indexed(name = "ttl_expiration_idx", expireAfterSeconds = 0)
    @Field("expires_at")
    private Instant expiresAt; // Time when document expires (30 days from creation)
}
