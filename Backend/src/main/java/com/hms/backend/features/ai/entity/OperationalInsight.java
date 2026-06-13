package com.hms.backend.features.ai.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "operational_insights")
public class OperationalInsight {
    @Id
    private ObjectId id;

    @Field("insight_type")
    private String insightType; // CAPACITY_WARNING, STAFF_SHORTAGE, REVENUE_DROP, ER_WAIT_TIME, GENERAL

    private String severity; // HIGH, MEDIUM, LOW

    private String description;

    @Field("actionable_steps")
    private List<String> actionableSteps;

    @Indexed(name = "insight_ttl_idx", expireAfterSeconds = 7776000) // 90 days = 90 * 24 * 3600 = 7776000
    @Field("created_at")
    private Instant createdAt;
}
