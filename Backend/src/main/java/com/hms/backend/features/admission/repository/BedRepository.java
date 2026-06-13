package com.hms.backend.features.admission.repository;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.hms.backend.features.admission.entity.Bed;

public interface BedRepository extends MongoRepository<Bed, ObjectId> {
    // TODO: Define repository methods for beds
}
