package com.hms.backend.features.emergency.controller;

import com.hms.backend.dto.SuccessResponse;
import com.hms.backend.features.emergency.dto.RegisterEmergencyCaseDTO;
import com.hms.backend.features.emergency.dto.UpdateTriageDTO;
import com.hms.backend.features.emergency.dto.LogERTreatmentDTO;
import com.hms.backend.features.emergency.dto.EscalateToAdmissionDTO;
import com.hms.backend.features.emergency.entity.EmergencyCase;
import com.hms.backend.features.emergency.service.EmergencyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/emergency-cases")
public class EmergencyController {

    private final EmergencyService service;

    public EmergencyController(EmergencyService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<SuccessResponse<EmergencyCase>> registerCase(@Valid @RequestBody RegisterEmergencyCaseDTO dto) {
        EmergencyCase ec = service.registerEmergencyCase(dto);
        SuccessResponse<EmergencyCase> response = new SuccessResponse<>("Emergency arrival registered and triaged.", ec);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<SuccessResponse<List<EmergencyCase>>> listCases(@RequestParam(required = false) String status) {
        List<EmergencyCase> cases = service.listEmergencyCases(status);
        SuccessResponse<List<EmergencyCase>> response = new SuccessResponse<>("Emergency queue retrieved.", cases);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SuccessResponse<EmergencyCase>> getCase(@PathVariable String id) {
        EmergencyCase ec = service.getEmergencyCase(id);
        SuccessResponse<EmergencyCase> response = new SuccessResponse<>("Emergency case details retrieved.", ec);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/triage")
    public ResponseEntity<SuccessResponse<EmergencyCase>> updateTriage(
            @PathVariable String id,
            @Valid @RequestBody UpdateTriageDTO dto) {
        EmergencyCase ec = service.updateTriage(id, dto);
        SuccessResponse<EmergencyCase> response = new SuccessResponse<>("Emergency triage score updated.", ec);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/treatments")
    public ResponseEntity<SuccessResponse<EmergencyCase>> logTreatment(
            @PathVariable String id,
            @Valid @RequestBody LogERTreatmentDTO dto) {
        EmergencyCase ec = service.logTreatment(id, dto);
        SuccessResponse<EmergencyCase> response = new SuccessResponse<>("Trauma treatment logged.", ec);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/assign-staff")
    public ResponseEntity<SuccessResponse<EmergencyCase>> assignStaff(
            @PathVariable String id,
            @RequestBody Map<String, List<String>> payload) {
        List<String> staffIds = payload.get("staffIds");
        if (staffIds == null) {
            throw new IllegalArgumentException("staffIds payload list is mandatory");
        }
        EmergencyCase ec = service.assignStaff(id, staffIds);
        SuccessResponse<EmergencyCase> response = new SuccessResponse<>("Medical staff assigned to case.", ec);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/escalate")
    public ResponseEntity<SuccessResponse<EmergencyCase>> escalateCase(
            @PathVariable String id,
            @Valid @RequestBody EscalateToAdmissionDTO dto) {
        EmergencyCase ec = service.escalateToInpatient(id, dto);
        SuccessResponse<EmergencyCase> response = new SuccessResponse<>("Patient escalated to inpatient module and bed reserved.", ec);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<SuccessResponse<EmergencyCase>> closeCase(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> payload) {
        String notes = payload != null ? payload.get("dischargeNotes") : "Stabilized and discharged from ER.";
        EmergencyCase ec = service.closeCase(id, notes);
        SuccessResponse<EmergencyCase> response = new SuccessResponse<>("Emergency case stabilized and closed.", ec);
        return ResponseEntity.ok(response);
    }
}
