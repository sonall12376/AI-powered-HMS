package com.hms.backend.features.admission.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DischargeDTO {
    @NotBlank(message = "Discharge notes are mandatory")
    private String dischargeNotes;

    @NotBlank(message = "Diagnosis at discharge is mandatory")
    private String diagnosisAtDischarge;

    @NotBlank(message = "Treatment summary is mandatory")
    private String treatmentSummary;
}
