package com.hms.backend.features.admission.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TransferPatientDTO {
    @NotBlank(message = "Target Bed ID is mandatory")
    private String newBedId;
}
