package com.hms.backend.features.emergency.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EscalateToAdmissionDTO {
    @NotBlank(message = "Patient ID is mandatory (required for identity resolution if previously unknown)")
    private String patientId;

    @NotBlank(message = "Target Bed ID is mandatory")
    private String bedId;

    @NotBlank(message = "Ward type is mandatory")
    private String wardType; // GENERAL, ICU, PEDIATRIC, PRIVATE

    @NotBlank(message = "Reason for admission is mandatory")
    private String reasonForAdmission;

    @NotBlank(message = "Admitting physician ID is mandatory")
    private String admittingDoctorId;
}
