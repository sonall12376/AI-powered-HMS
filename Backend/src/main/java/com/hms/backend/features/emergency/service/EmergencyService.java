package com.hms.backend.features.emergency.service;

import com.hms.backend.exception.ResourceNotFoundException;
import com.hms.backend.features.admission.dto.AdmitPatientDTO;
import com.hms.backend.features.admission.service.AdmissionService;
import com.hms.backend.features.emergency.dto.RegisterEmergencyCaseDTO;
import com.hms.backend.features.emergency.dto.UpdateTriageDTO;
import com.hms.backend.features.emergency.dto.LogERTreatmentDTO;
import com.hms.backend.features.emergency.dto.EscalateToAdmissionDTO;
import com.hms.backend.features.emergency.entity.EmergencyCase;
import com.hms.backend.features.emergency.repository.EmergencyCaseRepository;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class EmergencyService {

    private final EmergencyCaseRepository repository;
    private final AdmissionService admissionService;

    public EmergencyService(EmergencyCaseRepository repository, AdmissionService admissionService) {
        this.repository = repository;
        this.admissionService = admissionService;
    }

    public EmergencyCase registerEmergencyCase(RegisterEmergencyCaseDTO dto) {
        EmergencyCase ec = new EmergencyCase();
        ec.setEmergencyId("ER-" + Instant.now().toString().substring(2, 4) + "-" + UUID.randomUUID().toString().substring(0, 5).toUpperCase());
        
        if (dto.getPatientId() != null && !dto.getPatientId().trim().isEmpty()) {
            ec.setPatientId(new ObjectId(dto.getPatientId()));
        } else {
            ec.setPatientId(null);
            ec.setTemporaryName(dto.getTemporaryName() != null ? dto.getTemporaryName() : "Unknown Patient " + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        }

        ec.setIncidentDetails(dto.getIncidentDetails());
        ec.setArrivedAt(Instant.now());
        ec.setIncomingEMSDetails(dto.getIncomingEMSDetails());
        ec.setTreatmentsAdministered(new ArrayList<>());
        ec.setAssignedStaff(new ArrayList<>());
        ec.setStatus("TRIAGED");
        ec.setCreatedAt(Instant.now());
        ec.setUpdatedAt(Instant.now());

        // Set vitals
        EmergencyCase.Vitals vitals = new EmergencyCase.Vitals(
            dto.getVitalSignsAtArrival().getBloodPressure(),
            dto.getVitalSignsAtArrival().getHeartRate(),
            dto.getVitalSignsAtArrival().getTemperature(),
            dto.getVitalSignsAtArrival().getSpo2()
        );
        ec.setVitalSignsAtArrival(vitals);

        // Run AI Triage engine
        EmergencyCase.AITriage aiSupport = runAITriageEngine(vitals, dto.getIncidentDetails());
        ec.setAiTriageSupport(aiSupport);
        ec.setTriageLevel(aiSupport.getSuggestedTriageLevel());
        ec.setTriageScore(getTriageScoreByLevel(aiSupport.getSuggestedTriageLevel()));

        return repository.save(ec);
    }

    public List<EmergencyCase> listEmergencyCases(String status) {
        if (status != null && !status.trim().isEmpty()) {
            return repository.findByStatus(status);
        }
        return repository.findAll();
    }

    public EmergencyCase getEmergencyCase(String id) {
        return getCaseByIdOrBusinessId(id);
    }

    public EmergencyCase updateTriage(String id, UpdateTriageDTO dto) {
        EmergencyCase ec = getCaseByIdOrBusinessId(id);
        ec.setTriageLevel(dto.getTriageLevel().toUpperCase());
        ec.setTriageScore(dto.getTriageScore());
        ec.setUpdatedAt(Instant.now());
        return repository.save(ec);
    }

    public EmergencyCase logTreatment(String id, LogERTreatmentDTO dto) {
        EmergencyCase ec = getCaseByIdOrBusinessId(id);
        
        EmergencyCase.ERTreatment treatment = new EmergencyCase.ERTreatment(
            dto.getTreatment(),
            new ObjectId(dto.getAdministeredBy()),
            Instant.now()
        );
        
        if (ec.getTreatmentsAdministered() == null) {
            ec.setTreatmentsAdministered(new ArrayList<>());
        }
        ec.getTreatmentsAdministered().add(treatment);
        
        // Transition status to active treatment on first treatment logged
        if ("TRIAGED".equalsIgnoreCase(ec.getStatus())) {
            ec.setStatus("ACTIVE_TREATMENT");
        }
        
        ec.setUpdatedAt(Instant.now());
        return repository.save(ec);
    }

    public EmergencyCase assignStaff(String id, List<String> staffIds) {
        EmergencyCase ec = getCaseByIdOrBusinessId(id);
        List<ObjectId> staffObjectIds = new ArrayList<>();
        for (String staffId : staffIds) {
            staffObjectIds.add(new ObjectId(staffId));
        }
        ec.setAssignedStaff(staffObjectIds);
        ec.setUpdatedAt(Instant.now());
        return repository.save(ec);
    }

    public EmergencyCase escalateToInpatient(String id, EscalateToAdmissionDTO dto) {
        EmergencyCase ec = getCaseByIdOrBusinessId(id);

        // 1. Resolve Identity if previously unknown
        ec.setPatientId(new ObjectId(dto.getPatientId()));
        ec.setTemporaryName(null);

        // 2. Trigger Admission Module to claim bed and register active inpatient Stay
        AdmitPatientDTO admitDto = new AdmitPatientDTO();
        admitDto.setPatientId(dto.getPatientId());
        admitDto.setAdmittingDoctorId(dto.getAdmittingDoctorId());
        admitDto.setReasonForAdmission(dto.getReasonForAdmission() + " (Transferred from Emergency ID: " + ec.getEmergencyId() + ")");
        admitDto.setWardType(dto.getWardType());
        admitDto.setBedId(dto.getBedId());

        // This reserves the bed and creates the admission stay
        admissionService.admitPatient(admitDto);

        // 3. Mark ER Case closed as Transferred
        ec.setStatus("TRANSFERRED");
        ec.setUpdatedAt(Instant.now());
        
        return repository.save(ec);
    }

    public EmergencyCase closeCase(String id, String dischargeNotes) {
        EmergencyCase ec = getCaseByIdOrBusinessId(id);
        ec.setStatus("STABILIZED");
        ec.setUpdatedAt(Instant.now());
        return repository.save(ec);
    }

    private EmergencyCase.AITriage runAITriageEngine(EmergencyCase.Vitals vitals, String notes) {
        String level = "GREEN";
        double severity = 0.15;
        List<String> actions = new ArrayList<>();

        // Vitals Assessment
        int spo2 = vitals.getSpo2();
        int hr = vitals.getHeartRate();
        double temp = vitals.getTemperature();
        int systolic = 120; // default normal

        try {
            if (vitals.getBloodPressure() != null && vitals.getBloodPressure().contains("/")) {
                systolic = Integer.parseInt(vitals.getBloodPressure().split("/")[0].trim());
            }
        } catch (Exception ignored) {}

        // Evaluate worst vital parameters first (Max severity logic)
        if (spo2 < 90 || hr > 130 || hr < 40 || systolic < 80 || systolic > 200) {
            level = "RED";
            severity = 0.92;
        } else if ((spo2 >= 90 && spo2 <= 94) || (hr >= 120 && hr <= 129) || (hr >= 40 && hr <= 49) || (systolic >= 80 && systolic <= 89) || (systolic >= 180 && systolic <= 199) || temp > 40.0 || temp < 35.0) {
            level = "ORANGE";
            severity = 0.76;
        } else if ((hr >= 100 && hr <= 119) || (systolic >= 140 && systolic <= 179) || (temp >= 38.5 && temp <= 40.0) || (temp >= 35.0 && temp < 36.0)) {
            level = "YELLOW";
            severity = 0.48;
        }

        // Incident notes text matching keyword upgrades
        String lowerNotes = notes.toLowerCase();
        if (lowerNotes.contains("arrest") || lowerNotes.contains("unresponsive") || lowerNotes.contains("unconscious") || lowerNotes.contains("gunshot") || lowerNotes.contains("stab") || lowerNotes.contains("stroke") || lowerNotes.contains("seizure") || lowerNotes.contains("amputation") || lowerNotes.contains("severe burn")) {
            level = "RED";
            severity = Math.max(severity, 0.95);
        } else if (lowerNotes.contains("chest pain") || lowerNotes.contains("dyspnea") || lowerNotes.contains("fracture") || lowerNotes.contains("bleeding") || lowerNotes.contains("poison")) {
            if (!"RED".equals(level)) {
                level = "ORANGE";
                severity = Math.max(severity, 0.78);
            }
        }

        // Setup actions checklist
        if ("RED".equals(level)) {
            actions.addAll(Arrays.asList("Immediate airway management / oxygen supply", "Continuous ECG telemetry monitoring", "Establish dual large-bore IV access", "Call Emergency Trauma Surgeon", "Order stat lab work & blood crossmatch"));
        } else if ("ORANGE".equals(level)) {
            actions.addAll(Arrays.asList("Continuous pulse oximetry monitoring", "Administer supplementary oxygen support", "Establish IV access line", "Urgent physician evaluation (within 10 mins)"));
        } else if ("YELLOW".equals(level)) {
            actions.addAll(Arrays.asList("Re-check vitals every 30 mins", "Establish IV saline lock", "Routine emergency panel lab tests", "Physician evaluation (within 30 mins)"));
        } else {
            actions.addAll(Arrays.asList("Check vital signs every 60 mins", "Provide oral symptomatic medications", "Redirection to outpatient desk if stable"));
        }

        return new EmergencyCase.AITriage(level, severity, actions);
    }

    private int getTriageScoreByLevel(String level) {
        switch (level) {
            case "RED": return 1;
            case "ORANGE": return 2;
            case "YELLOW": return 3;
            case "GREEN": return 4;
            default: return 5;
        }
    }

    private EmergencyCase getCaseByIdOrBusinessId(String identifier) {
        return repository.findByEmergencyId(identifier)
            .or(() -> {
                try {
                    return repository.findById(new ObjectId(identifier));
                } catch (IllegalArgumentException e) {
                    return java.util.Optional.empty();
                }
            })
            .orElseThrow(() -> new ResourceNotFoundException("Emergency case not found with identifier: " + identifier));
    }
}
