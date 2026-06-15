package com.hms.backend.repository;

import com.hms.backend.model.DoctorSchedule;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorScheduleRepository extends MongoRepository<DoctorSchedule, String> {
    Optional<DoctorSchedule> findByDoctorIdAndAvailableDate(String doctorId, LocalDate availableDate);
    List<DoctorSchedule> findByDoctorId(String doctorId);
}
