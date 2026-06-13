package com.hms.backend.features.emergency.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RegisterEmergencyCaseDTO {
    private String patientId; // null or empty if unidentified patient
    private String temporaryName; // e.g. "Unknown Male 05"
    
    @NotBlank(message = "Incident details are mandatory")
    private String incidentDetails;
    
    private String incomingEMSDetails;
    
    @NotNull(message = "Vital signs at arrival are mandatory")
    @Valid
    private VitalsDTO vitalSignsAtArrival;

    @Data
    public static class VitalsDTO {
        @NotBlank(message = "Blood pressure is mandatory")
        private String bloodPressure;
        
        private int heartRate;
        private double temperature;
        private int spo2;
    }
}
