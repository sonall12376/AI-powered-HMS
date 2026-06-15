package com.hms.backend.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;

@Document(collection = "appointments")
@CompoundIndex(def = "{'doctorId': 1, 'appointmentDate': 1}")
public class Appointment {
    @Id
    private String id;

    @Indexed(unique = true)
    private String appointmentId;

    @Indexed
    private String patientId;

    @Indexed
    private String doctorId;

    private LocalDate appointmentDate;
    private String appointmentTime;

    private Status status = Status.PENDING;

    private String reasonForVisit;
    private String cancellationReason;

    private AiNoShowDetails aiNoShowDetails;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public enum Status {
        PENDING,
        CONFIRMED,
        COMPLETED,
        CANCELLED
    }

    public Appointment() {}

    public Appointment(String id, String appointmentId, String patientId, String doctorId, 
                       LocalDate appointmentDate, String appointmentTime, Status status, 
                       String reasonForVisit, String cancellationReason, AiNoShowDetails aiNoShowDetails) {
        this.id = id;
        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.appointmentDate = appointmentDate;
        this.appointmentTime = appointmentTime;
        this.status = status;
        this.reasonForVisit = reasonForVisit;
        this.cancellationReason = cancellationReason;
        this.aiNoShowDetails = aiNoShowDetails;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAppointmentId() { return appointmentId; }
    public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public LocalDate getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(LocalDate appointmentDate) { this.appointmentDate = appointmentDate; }

    public String getAppointmentTime() { return appointmentTime; }
    public void setAppointmentTime(String appointmentTime) { this.appointmentTime = appointmentTime; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public String getReasonForVisit() { return reasonForVisit; }
    public void setReasonForVisit(String reasonForVisit) { this.reasonForVisit = reasonForVisit; }

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

    public AiNoShowDetails getAiNoShowDetails() { return aiNoShowDetails; }
    public void setAiNoShowDetails(AiNoShowDetails aiNoShowDetails) { this.aiNoShowDetails = aiNoShowDetails; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public static class AiNoShowDetails {
        private Double noShowProbability;
        private String riskFactor;

        public AiNoShowDetails() {}
        public AiNoShowDetails(Double noShowProbability, String riskFactor) {
            this.noShowProbability = noShowProbability;
            this.riskFactor = riskFactor;
        }

        public Double getNoShowProbability() { return noShowProbability; }
        public void setNoShowProbability(Double noShowProbability) { this.noShowProbability = noShowProbability; }
        public String getRiskFactor() { return riskFactor; }
        public void setRiskFactor(String riskFactor) { this.riskFactor = riskFactor; }
    }
}
