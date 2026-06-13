package com.hms.backend.features.admission.repository;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.hms.backend.features.admission.entity.Admission;
import java.util.List;
import java.util.Optional;

public interface AdmissionRepository extends MongoRepository<Admission, ObjectId> {
    Optional<Admission> findByAdmissionId(String admissionId);
    List<Admission> findByPatientId(ObjectId patientId);
    List<Admission> findByStatus(String status);
    List<Admission> findByPatientIdAndStatus(ObjectId patientId, String status);
}
