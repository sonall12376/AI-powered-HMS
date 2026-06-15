package com.hms.backend.repository;

import com.hms.backend.model.Appointment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends MongoRepository<Appointment, String> {
    Optional<Appointment> findByAppointmentId(String appointmentId);
    List<Appointment> findByPatientId(String patientId);
    List<Appointment> findByDoctorId(String doctorId);
    List<Appointment> findByDoctorIdAndAppointmentDate(String doctorId, LocalDate appointmentDate);
    List<Appointment> findByPatientIdOrderByAppointmentDateDesc(String patientId);
    List<Appointment> findByDoctorIdOrderByAppointmentDateDesc(String doctorId);
}
