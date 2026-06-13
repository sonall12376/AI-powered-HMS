package com.hms.backend.features.ai.repository;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.hms.backend.features.ai.entity.OperationalInsight;

import java.util.List;

public interface OperationalInsightRepository extends MongoRepository<OperationalInsight, ObjectId> {
    List<OperationalInsight> findAllByOrderByCreatedAtDesc();
}
