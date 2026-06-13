package com.hms.backend.features.ai.repository;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.hms.backend.features.ai.entity.OperationalInsight;

public interface OperationalInsightRepository extends MongoRepository<OperationalInsight, ObjectId> {
    // TODO: Define repository methods for operational insights
}
