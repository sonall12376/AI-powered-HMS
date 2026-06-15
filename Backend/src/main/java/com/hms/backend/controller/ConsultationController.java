package com.hms.backend.controller;

import com.hms.backend.exception.ResourceNotFoundException;
import com.hms.backend.model.Consultation;
import com.hms.backend.model.Prescription;
import com.hms.backend.repository.ConsultationRepository;
import com.hms.backend.repository.PrescriptionRepository;
import com.hms.backend.service.ConsultationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class ConsultationController {

    private final ConsultationService consultationService;
    private final ConsultationRepository consultationRepository;
    private final PrescriptionRepository prescriptionRepository;

    public ConsultationController(ConsultationService consultationService,
                                  ConsultationRepository consultationRepository,
                                  PrescriptionRepository prescriptionRepository) {
        this.consultationService = consultationService;
        this.consultationRepository = consultationRepository;
        this.prescriptionRepository = prescriptionRepository;
    }

    @PostMapping("/consultations")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Consultation> createConsultation(@Valid @RequestBody Consultation consultation) {
        Consultation completed = consultationService.createConsultation(consultation);
        return ResponseEntity.status(HttpStatus.CREATED).body(completed);
    }

    @PostMapping("/prescriptions")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Prescription> createPrescription(@Valid @RequestBody Prescription prescription) {
        Prescription saved = consultationService.createPrescription(prescription);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/consultations/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<List<Consultation>> getPatientConsultationHistory(@PathVariable String patientId) {
        validateOwnershipOrRole(patientId, "ADMIN", "DOCTOR");

        List<Consultation> consultations = consultationRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
        return ResponseEntity.ok(consultations);
    }

    @GetMapping("/consultations/appointment/{appointmentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<Consultation> getConsultationByAppointment(@PathVariable String appointmentId) {
        Consultation consultation = consultationRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found for appointment: " + appointmentId));

        validateOwnershipOrRole(consultation.getPatientId(), "ADMIN", "DOCTOR");

        return ResponseEntity.ok(consultation);
    }

    @GetMapping("/prescriptions/consultation/{consultationId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<Prescription> getPrescriptionByConsultation(@PathVariable String consultationId) {
        Consultation consultation = consultationRepository.findByConsultationId(consultationId)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found for id: " + consultationId));

        validateOwnershipOrRole(consultation.getPatientId(), "ADMIN", "DOCTOR");

        Prescription prescription = prescriptionRepository.findByConsultationId(consultationId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found for consultation: " + consultationId));

        return ResponseEntity.ok(prescription);
    }

    private void validateOwnershipOrRole(String patientId, String... allowedRoles) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            throw new AccessDeniedException("Access denied");
        }

        boolean hasAllowedRole = auth.getAuthorities().stream()
                .anyMatch(authority -> {
                    String roleName = authority.getAuthority().replace("ROLE_", "");
                    for (String allowed : allowedRoles) {
                        if (allowed.equals(roleName)) {
                            return true;
                        }
                    }
                    return false;
                });

        if (hasAllowedRole) {
            return;
        }

        Object detailsObj = auth.getDetails();
        if (detailsObj instanceof Map) {
            Map<?, ?> details = (Map<?, ?>) detailsObj;
            String userLinkedEntityId = (String) details.get("linkedEntityId");
            if (patientId.equals(userLinkedEntityId)) {
                return;
            }
        }

        throw new AccessDeniedException("Access Denied: You do not have permissions for this medical history record.");
    }
}
