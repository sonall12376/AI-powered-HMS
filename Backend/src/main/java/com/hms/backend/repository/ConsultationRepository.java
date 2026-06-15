package com.hms.backend.repository;

import com.hms.backend.model.Consultation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConsultationRepository extends MongoRepository<Consultation, String> {
    Optional<Consultation> findByConsultationId(String consultationId);
    Optional<Consultation> findByAppointmentId(String appointmentId);
    List<Consultation> findByPatientId(String patientId);
    List<Consultation> findByPatientIdOrderByCreatedAtDesc(String patientId);
    List<Consultation> findByDoctorId(String doctorId);
}
