package com.hms.backend.features.admission.controller;

import com.hms.backend.dto.SuccessResponse;
import com.hms.backend.features.admission.dto.AdmitPatientDTO;
import com.hms.backend.features.admission.dto.DischargeDTO;
import com.hms.backend.features.admission.dto.RecordRoundDTO;
import com.hms.backend.features.admission.dto.TransferPatientDTO;
import com.hms.backend.features.admission.entity.Admission;
import com.hms.backend.features.admission.entity.Bed;
import com.hms.backend.features.admission.service.AdmissionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admissions")
public class AdmissionController {

    private final AdmissionService admissionService;

    public AdmissionController(AdmissionService admissionService) {
        this.admissionService = admissionService;
    }

    @PostMapping
    public ResponseEntity<SuccessResponse<Admission>> admitPatient(@Valid @RequestBody AdmitPatientDTO dto) {
        Admission admission = admissionService.admitPatient(dto);
        SuccessResponse<Admission> response = new SuccessResponse<>("Patient admitted successfully.", admission);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<SuccessResponse<List<Admission>>> listAdmissions(@RequestParam(required = false) String status) {
        List<Admission> admissions = admissionService.listAdmissions(status);
        SuccessResponse<List<Admission>> response = new SuccessResponse<>("Admissions retrieved successfully.", admissions);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SuccessResponse<Admission>> getAdmission(@PathVariable String id) {
        Admission admission = admissionService.getAdmission(id);
        SuccessResponse<Admission> response = new SuccessResponse<>("Admission details retrieved successfully.", admission);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<SuccessResponse<List<Admission>>> getAdmissionsByPatient(@PathVariable String patientId) {
        List<Admission> admissions = admissionService.getAdmissionsByPatient(patientId);
        SuccessResponse<List<Admission>> response = new SuccessResponse<>("Patient admission records retrieved successfully.", admissions);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/rounds")
    public ResponseEntity<SuccessResponse<Admission>> recordRound(
            @PathVariable String id,
            @Valid @RequestBody RecordRoundDTO dto) {
        Admission admission = admissionService.recordRound(id, dto);
        SuccessResponse<Admission> response = new SuccessResponse<>("Daily clinical round recorded successfully.", admission);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/transfer")
    public ResponseEntity<SuccessResponse<Admission>> transferPatient(
            @PathVariable String id,
            @Valid @RequestBody TransferPatientDTO dto) {
        Admission admission = admissionService.transferPatient(id, dto);
        SuccessResponse<Admission> response = new SuccessResponse<>("Patient transferred successfully.", admission);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/discharge")
    public ResponseEntity<SuccessResponse<Admission>> dischargePatient(
            @PathVariable String id,
            @Valid @RequestBody DischargeDTO dto) {
        Admission admission = admissionService.dischargePatient(id, dto);
        SuccessResponse<Admission> response = new SuccessResponse<>("Patient discharged and billing compiled successfully.", admission);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/beds")
    public ResponseEntity<SuccessResponse<List<Bed>>> listBeds(
            @RequestParam(required = false) Boolean occupied,
            @RequestParam(required = false) String wardName) {
        List<Bed> beds = admissionService.listBeds(occupied, wardName);
        SuccessResponse<List<Bed>> response = new SuccessResponse<>("Beds directory retrieved successfully.", beds);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/beds/seed")
    public ResponseEntity<SuccessResponse<List<Bed>>> seedBeds() {
        List<Bed> beds = admissionService.seedBeds();
        SuccessResponse<List<Bed>> response = new SuccessResponse<>("Sample beds directory initialized successfully.", beds);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
