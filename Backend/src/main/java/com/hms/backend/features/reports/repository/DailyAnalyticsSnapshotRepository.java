package com.hms.backend.features.reports.repository;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.hms.backend.features.reports.entity.DailyAnalyticsSnapshot;

public interface DailyAnalyticsSnapshotRepository extends MongoRepository<DailyAnalyticsSnapshot, ObjectId> {
    // TODO: Define repository methods for analytics snapshots
}
