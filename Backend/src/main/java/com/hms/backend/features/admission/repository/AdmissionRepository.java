package com.hms.backend.features.admission.repository;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.hms.backend.features.admission.entity.Admission;

public interface AdmissionRepository extends MongoRepository<Admission, ObjectId> {
    // TODO: Define repository methods for admissions
}
