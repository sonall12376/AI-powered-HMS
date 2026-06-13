package com.hms.backend.features.emergency.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LogERTreatmentDTO {
    @NotBlank(message = "Treatment description is mandatory")
    private String treatment;

    @NotBlank(message = "Administered by ID is mandatory")
    private String administeredBy; // staffId / userId
}
