package com.hms.backend.features.admission.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdmitPatientDTO {
    @NotBlank(message = "Patient ID is mandatory")
    private String patientId;

    @NotBlank(message = "Admitting physician ID is mandatory")
    private String admittingDoctorId;

    @NotBlank(message = "Reason for admission is mandatory")
    private String reasonForAdmission;

    @NotBlank(message = "Ward type is mandatory")
    private String wardType; // GENERAL, ICU, PEDIATRIC, PRIVATE

    @NotBlank(message = "Bed ID is mandatory")
    private String bedId;
}
