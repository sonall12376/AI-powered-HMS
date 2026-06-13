package com.hms.backend.features.emergency.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import lombok.Data;

@Data
public class UpdateTriageDTO {
    @NotBlank(message = "Triage level is mandatory")
    private String triageLevel; // RED, ORANGE, YELLOW, GREEN

    @Min(value = 1, message = "Triage score must be between 1 and 5")
    @Max(value = 5, message = "Triage score must be between 1 and 5")
    private int triageScore;
}
