package com.hms.backend.repository;

import com.hms.backend.model.Prescription;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PrescriptionRepository extends MongoRepository<Prescription, String> {
    Optional<Prescription> findByPrescriptionId(String prescriptionId);
    Optional<Prescription> findByConsultationId(String consultationId);
}
