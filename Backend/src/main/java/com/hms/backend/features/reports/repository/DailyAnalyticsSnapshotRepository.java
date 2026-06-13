package com.hms.backend.features.reports.repository;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.hms.backend.features.reports.entity.DailyAnalyticsSnapshot;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailyAnalyticsSnapshotRepository extends MongoRepository<DailyAnalyticsSnapshot, ObjectId> {
    Optional<DailyAnalyticsSnapshot> findByDate(LocalDate date);
    List<DailyAnalyticsSnapshot> findByDateBetween(LocalDate start, LocalDate end);
}
