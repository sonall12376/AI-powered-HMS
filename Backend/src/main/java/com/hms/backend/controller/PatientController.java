package com.hms.backend.controller;

import com.hms.backend.exception.ResourceNotFoundException;
import com.hms.backend.model.Patient;
import com.hms.backend.repository.PatientRepository;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/patients")
public class PatientController {

    private final PatientRepository patientRepository;

    public PatientController(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PATIENT')")
    public ResponseEntity<Patient> createPatient(@Valid @RequestBody Patient patient) {
        if (patient.getPatientId() == null || patient.getPatientId().isEmpty()) {
            patient.setPatientId("PAT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }

        if (patientRepository.existsByPatientId(patient.getPatientId())) {
            return ResponseEntity.badRequest().build();
        }

        if (patient.getAiHealthProfile() == null) {
            patient.setAiHealthProfile(new Patient.AiHealthProfile(30, "LOW"));
        }

        patient.setActive(true);
        Patient savedPatient = patientRepository.save(patient);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedPatient);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<Page<Patient>> getAllPatients(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<Patient> patients;

        if (search != null && !search.isEmpty()) {
            patients = patientRepository.searchPatients(search, pageable);
        } else {
            patients = patientRepository.findAllByActiveTrue(pageable);
        }

        return ResponseEntity.ok(patients);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<Patient> getPatientById(@PathVariable String id) {
        Patient patient = patientRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));

        validateOwnershipOrRole(patient.getPatientId(), "ADMIN", "DOCTOR");

        return ResponseEntity.ok(patient);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<Patient> updatePatient(@PathVariable String id, @Valid @RequestBody Patient patientDetails) {
        Patient patient = patientRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));

        validateOwnershipOrRole(patient.getPatientId(), "ADMIN");

        patient.setPersonalInfo(patientDetails.getPersonalInfo());
        patient.setContactInfo(patientDetails.getContactInfo());
        patient.setEmergencyContacts(patientDetails.getEmergencyContacts());
        patient.setInsuranceDetails(patientDetails.getInsuranceDetails());
        patient.setPrimaryDoctorId(patientDetails.getPrimaryDoctorId());

        if (patientDetails.getAiHealthProfile() != null) {
            patient.setAiHealthProfile(patientDetails.getAiHealthProfile());
        }

        Patient updatedPatient = patientRepository.save(patient);
        return ResponseEntity.ok(updatedPatient);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deletePatient(@PathVariable String id) {
        Patient patient = patientRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));

        patient.setActive(false);
        patientRepository.save(patient);

        return ResponseEntity.ok().body(Map.of("message", "Patient deleted successfully (soft delete)"));
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

        throw new AccessDeniedException("Access Denied: You do not have permissions for this patient profile.");
    }
}
