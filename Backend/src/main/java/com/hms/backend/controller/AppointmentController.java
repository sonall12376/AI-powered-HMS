package com.hms.backend.controller;

import com.hms.backend.exception.ResourceNotFoundException;
import com.hms.backend.model.Appointment;
import com.hms.backend.model.DoctorSchedule;
import com.hms.backend.repository.AppointmentRepository;
import com.hms.backend.repository.DoctorScheduleRepository;
import com.hms.backend.service.AiService;
import com.hms.backend.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final AppointmentRepository appointmentRepository;
    private final DoctorScheduleRepository doctorScheduleRepository;
    private final AiService aiService;

    public AppointmentController(AppointmentService appointmentService,
                                 AppointmentRepository appointmentRepository,
                                 DoctorScheduleRepository doctorScheduleRepository,
                                 AiService aiService) {
        this.appointmentService = appointmentService;
        this.appointmentRepository = appointmentRepository;
        this.doctorScheduleRepository = doctorScheduleRepository;
        this.aiService = aiService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PATIENT')")
    public ResponseEntity<Appointment> createAppointment(@Valid @RequestBody Appointment appointment) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Map<?, ?> details = (Map<?, ?>) auth.getDetails();
        String role = (String) details.get("role");
        String linkedEntityId = (String) details.get("linkedEntityId");

        if ("PATIENT".equals(role)) {
            appointment.setPatientId(linkedEntityId);
        }

        Appointment booked = appointmentService.bookAppointment(appointment);
        return ResponseEntity.status(HttpStatus.CREATED).body(booked);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<List<Appointment>> getAppointments() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Map<?, ?> details = (Map<?, ?>) auth.getDetails();
        String role = (String) details.get("role");
        String linkedEntityId = (String) details.get("linkedEntityId");

        List<Appointment> list;
        if ("ADMIN".equals(role)) {
            list = appointmentRepository.findAll();
        } else if ("DOCTOR".equals(role)) {
            list = appointmentRepository.findByDoctorIdOrderByAppointmentDateDesc(linkedEntityId);
        } else {
            list = appointmentRepository.findByPatientIdOrderByAppointmentDateDesc(linkedEntityId);
        }

        return ResponseEntity.ok(list);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<Appointment> updateStatus(
            @PathVariable String id,
            @RequestParam Appointment.Status status,
            @RequestParam(required = false) String cancellationReason) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Map<?, ?> details = (Map<?, ?>) auth.getDetails();
        String role = (String) details.get("role");
        String linkedEntityId = (String) details.get("linkedEntityId");

        Appointment updated = appointmentService.transitionStatus(id, status, cancellationReason, role, linkedEntityId);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/ai-assist")
    @PreAuthorize("hasAnyRole('ADMIN', 'PATIENT')")
    public ResponseEntity<AiService.AppointmentAssistantResult> parseBookingText(@RequestBody Map<String, String> body) {
        String prompt = body.get("prompt");
        if (prompt == null || prompt.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        AiService.AppointmentAssistantResult parsed = aiService.parseAppointmentRequest(prompt);
        return ResponseEntity.ok(parsed);
    }

    @PostMapping("/doctor-schedules")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<DoctorSchedule> createSchedule(@RequestBody DoctorSchedule schedule) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Map<?, ?> details = (Map<?, ?>) auth.getDetails();
        String role = (String) details.get("role");
        String linkedEntityId = (String) details.get("linkedEntityId");

        if ("DOCTOR".equals(role)) {
            schedule.setDoctorId(linkedEntityId);
        }

        DoctorSchedule existing = doctorScheduleRepository.findByDoctorIdAndAvailableDate(schedule.getDoctorId(), schedule.getAvailableDate())
                .orElse(null);

        if (existing != null) {
            existing.setTimeSlots(schedule.getTimeSlots());
            return ResponseEntity.ok(doctorScheduleRepository.save(existing));
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(doctorScheduleRepository.save(schedule));
    }

    @GetMapping("/doctor-schedules")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<List<DoctorSchedule>> getSchedules(
            @RequestParam String doctorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        if (date != null) {
            DoctorSchedule schedule = doctorScheduleRepository.findByDoctorIdAndAvailableDate(doctorId, date)
                    .orElseThrow(() -> new ResourceNotFoundException("No schedule found for doctor on this date"));
            return ResponseEntity.ok(List.of(schedule));
        }

        List<DoctorSchedule> list = doctorScheduleRepository.findByDoctorId(doctorId);
        return ResponseEntity.ok(list);
    }
}
