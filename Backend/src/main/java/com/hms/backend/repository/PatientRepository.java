package com.hms.backend.repository;

import com.hms.backend.model.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientRepository extends MongoRepository<Patient, String> {
    Optional<Patient> findByPatientIdAndActiveTrue(String patientId);
    Optional<Patient> findByIdAndActiveTrue(String id);
    
    Page<Patient> findAllByActiveTrue(Pageable pageable);

    @Query("{ 'active': true, $or: [ " +
           "{ 'personalInfo.firstName': { $regex: ?0, $options: 'i' } }, " +
           "{ 'personalInfo.lastName': { $regex: ?0, $options: 'i' } }, " +
           "{ 'patientId': { $regex: ?0, $options: 'i' } } " +
           "] }")
    Page<Patient> searchPatients(String searchTerm, Pageable pageable);

    boolean existsByPatientId(String patientId);
    boolean existsByContactInfoEmail(String email);
}
