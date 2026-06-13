package com.hms.backend.features.emergency.repository;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.hms.backend.features.emergency.entity.EmergencyCase;

public interface EmergencyCaseRepository extends MongoRepository<EmergencyCase, ObjectId> {
    // TODO: Define repository methods for emergency cases
}
