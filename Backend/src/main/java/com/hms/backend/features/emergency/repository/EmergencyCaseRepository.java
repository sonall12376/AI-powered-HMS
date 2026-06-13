package com.hms.backend.features.emergency.repository;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.hms.backend.features.emergency.entity.EmergencyCase;

import java.util.List;
import java.util.Optional;

public interface EmergencyCaseRepository extends MongoRepository<EmergencyCase, ObjectId> {
    Optional<EmergencyCase> findByEmergencyId(String emergencyId);
    List<EmergencyCase> findByStatus(String status);
    List<EmergencyCase> findByPatientId(ObjectId patientId);
}
