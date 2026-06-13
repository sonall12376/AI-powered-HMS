package com.hms.backend.features.admission.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RecordRoundDTO {
    @NotBlank(message = "Visiting doctor ID is mandatory")
    private String visitingDoctorId;

    @NotBlank(message = "Clinical notes are mandatory")
    private String notes;

    @NotNull(message = "Vitals are mandatory")
    @Valid
    private VitalsDTO vitals;

    private String prescribedChanges;

    @Data
    public static class VitalsDTO {
        @NotBlank(message = "Blood pressure is mandatory")
        private String bloodPressure;

        @NotNull(message = "Heart rate is mandatory")
        private Integer heartRate;

        @NotNull(message = "Temperature is mandatory")
        private Double temperature;

        @NotNull(message = "SpO2 is mandatory")
        private Integer spo2;
    }
}
