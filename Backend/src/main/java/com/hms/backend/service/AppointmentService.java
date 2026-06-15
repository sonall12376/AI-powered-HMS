package com.hms.backend.service;

import com.hms.backend.exception.ResourceNotFoundException;
import com.hms.backend.exception.ScheduleConflictException;
import com.hms.backend.model.Appointment;
import com.hms.backend.model.DoctorSchedule;
import com.hms.backend.repository.AppointmentRepository;
import com.hms.backend.repository.DoctorScheduleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class AppointmentService {

    private static final Logger log = LoggerFactory.getLogger(AppointmentService.class);

    private final AppointmentRepository appointmentRepository;
    private final DoctorScheduleRepository doctorScheduleRepository;
    private final AiService aiService;

    // Explicit constructor injection instead of Lombok's RequiredArgsConstructor
    public AppointmentService(AppointmentRepository appointmentRepository, 
                              DoctorScheduleRepository doctorScheduleRepository, 
                              AiService aiService) {
        this.appointmentRepository = appointmentRepository;
        this.doctorScheduleRepository = doctorScheduleRepository;
        this.aiService = aiService;
    }

    /**
     * Book an appointment. Validates schedule availability and updates it atomically using optimistic locking.
     */
    public Appointment bookAppointment(Appointment appointment) {
        if (appointment.getAppointmentId() == null || appointment.getAppointmentId().isEmpty()) {
            appointment.setAppointmentId("APT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }

        String doctorId = appointment.getDoctorId();
        LocalDate date = appointment.getAppointmentDate();
        String time = appointment.getAppointmentTime();

        DoctorSchedule schedule = doctorScheduleRepository.findByDoctorIdAndAvailableDate(doctorId, date)
                .orElseGet(() -> {
                    List<DoctorSchedule.TimeSlot> slots = new ArrayList<>();
                    slots.add(new DoctorSchedule.TimeSlot("09:00", false, null));
                    slots.add(new DoctorSchedule.TimeSlot("10:00", false, null));
                    slots.add(new DoctorSchedule.TimeSlot("11:00", false, null));
                    slots.add(new DoctorSchedule.TimeSlot("12:00", false, null));
                    slots.add(new DoctorSchedule.TimeSlot("14:00", false, null));
                    slots.add(new DoctorSchedule.TimeSlot("15:00", false, null));
                    slots.add(new DoctorSchedule.TimeSlot("16:00", false, null));
                    slots.add(new DoctorSchedule.TimeSlot("17:00", false, null));

                    return new DoctorSchedule(null, doctorId, date, slots, null);
                });

        DoctorSchedule.TimeSlot matchedSlot = null;
        for (DoctorSchedule.TimeSlot slot : schedule.getTimeSlots()) {
            if (slot.getTime().equals(time)) {
                matchedSlot = slot;
                break;
            }
        }

        if (matchedSlot == null) {
            throw new ScheduleConflictException("Time slot " + time + " is not available for booking.");
        }

        if (matchedSlot.isBooked()) {
            throw new ScheduleConflictException("Time slot " + time + " is already booked.");
        }

        matchedSlot.setBooked(true);
        matchedSlot.setAppointmentId(appointment.getAppointmentId());

        try {
            doctorScheduleRepository.save(schedule);
        } catch (OptimisticLockingFailureException e) {
            log.warn("Optimistic locking conflict during scheduling slot {} for doctor {} on {}", time, doctorId, date);
            throw new ScheduleConflictException("The selected time slot was booked by another user. Please choose another slot.");
        }

        Appointment.AiNoShowDetails noShowDetails = aiService.predictNoShow(appointment.getPatientId(), date, time);
        appointment.setAiNoShowDetails(noShowDetails);
        appointment.setStatus(Appointment.Status.CONFIRMED);

        return appointmentRepository.save(appointment);
    }

    /**
     * Transition appointment status with role validations.
     */
    public Appointment transitionStatus(String id, Appointment.Status newStatus, String cancellationReason, String userRole, String linkedEntityId) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));

        if ("PATIENT".equals(userRole)) {
            if (!appointment.getPatientId().equals(linkedEntityId)) {
                throw new org.springframework.security.access.AccessDeniedException("You cannot modify other patients' appointments");
            }
            if (newStatus != Appointment.Status.CANCELLED) {
                throw new IllegalArgumentException("Patients can only cancel appointments.");
            }
        } else if ("DOCTOR".equals(userRole)) {
            if (!appointment.getDoctorId().equals(linkedEntityId)) {
                throw new org.springframework.security.access.AccessDeniedException("You cannot modify appointments for other doctors");
            }
        }

        Appointment.Status oldStatus = appointment.getStatus();
        appointment.setStatus(newStatus);
        
        if (newStatus == Appointment.Status.CANCELLED) {
            appointment.setCancellationReason(cancellationReason != null ? cancellationReason : "Cancelled by user");
            releaseTimeSlot(appointment.getDoctorId(), appointment.getAppointmentDate(), appointment.getAppointmentTime());
        }

        Appointment updated = appointmentRepository.save(appointment);
        log.info("Transitioned appointment {} from {} to {}", id, oldStatus, newStatus);
        return updated;
    }

    private void releaseTimeSlot(String doctorId, LocalDate date, String time) {
        Optional<DoctorSchedule> scheduleOpt = doctorScheduleRepository.findByDoctorIdAndAvailableDate(doctorId, date);
        if (scheduleOpt.isPresent()) {
            DoctorSchedule schedule = scheduleOpt.get();
            for (DoctorSchedule.TimeSlot slot : schedule.getTimeSlots()) {
                if (slot.getTime().equals(time)) {
                    slot.setBooked(false);
                    slot.setAppointmentId(null);
                    break;
                }
            }
            doctorScheduleRepository.save(schedule);
        }
    }
}
