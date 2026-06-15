package com.hms.backend.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Document(collection = "consultations")
public class Consultation {
    @Id
    private String id;

    @Indexed(unique = true)
    private String consultationId;

    @Indexed(unique = true)
    private String appointmentId;

    @Indexed
    private String patientId;

    @Indexed
    private String doctorId;

    private Vitals vitals;
    private List<String> symptoms;
    private String clinicalNotes;
    private List<Diagnosis> diagnoses;
    private AiClinicalInsights aiClinicalInsights;

    @CreatedDate
    private Instant createdAt;

    public Consultation() {}

    public Consultation(String id, String consultationId, String appointmentId, String patientId, String doctorId, 
                        Vitals vitals, List<String> symptoms, String clinicalNotes, List<Diagnosis> diagnoses, 
                        AiClinicalInsights aiClinicalInsights) {
        this.id = id;
        this.consultationId = consultationId;
        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.vitals = vitals;
        this.symptoms = symptoms;
        this.clinicalNotes = clinicalNotes;
        this.diagnoses = diagnoses;
        this.aiClinicalInsights = aiClinicalInsights;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getConsultationId() { return consultationId; }
    public void setConsultationId(String consultationId) { this.consultationId = consultationId; }

    public String getAppointmentId() { return appointmentId; }
    public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public Vitals getVitals() { return vitals; }
    public void setVitals(Vitals vitals) { this.vitals = vitals; }

    public List<String> getSymptoms() { return symptoms; }
    public void setSymptoms(List<String> symptoms) { this.symptoms = symptoms; }

    public String getClinicalNotes() { return clinicalNotes; }
    public void setClinicalNotes(String clinicalNotes) { this.clinicalNotes = clinicalNotes; }

    public List<Diagnosis> getDiagnoses() { return diagnoses; }
    public void setDiagnoses(List<Diagnosis> diagnoses) { this.diagnoses = diagnoses; }

    public AiClinicalInsights getAiClinicalInsights() { return aiClinicalInsights; }
    public void setAiClinicalInsights(AiClinicalInsights aiClinicalInsights) { this.aiClinicalInsights = aiClinicalInsights; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    // Static nested classes
    public static class Vitals {
        private String bloodPressure;
        private Integer heartRate;
        private Double temperature;
        private Integer spo2;
        private Double weight;
        private Double height;

        public Vitals() {}
        public Vitals(String bloodPressure, Integer heartRate, Double temperature, Integer spo2, Double weight, Double height) {
            this.bloodPressure = bloodPressure;
            this.heartRate = heartRate;
            this.temperature = temperature;
            this.spo2 = spo2;
            this.weight = weight;
            this.height = height;
        }

        public String getBloodPressure() { return bloodPressure; }
        public void setBloodPressure(String bloodPressure) { this.bloodPressure = bloodPressure; }

        public Integer getHeartRate() { return heartRate; }
        public void setHeartRate(Integer heartRate) { this.heartRate = heartRate; }

        public Double getTemperature() { return temperature; }
        public void setTemperature(Double temperature) { this.temperature = temperature; }

        public Integer getSpo2() { return spo2; }
        public void setSpo2(Integer spo2) { this.spo2 = spo2; }

        public Double getWeight() { return weight; }
        public void setWeight(Double weight) { this.weight = weight; }

        public Double getHeight() { return height; }
        public void setHeight(Double height) { this.height = height; }
    }

    public static class Diagnosis {
        private String icdCode;
        private String description;
        private DiagnosisType type;

        public enum DiagnosisType {
            PRIMARY,
            SECONDARY
        }

        public Diagnosis() {}
        public Diagnosis(String icdCode, String description, DiagnosisType type) {
            this.icdCode = icdCode;
            this.description = description;
            this.type = type;
        }

        public String getIcdCode() { return icdCode; }
        public void setIcdCode(String icdCode) { this.icdCode = icdCode; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public DiagnosisType getType() { return type; }
        public void setType(DiagnosisType type) { this.type = type; }
    }

    public static class AiClinicalInsights {
        private List<String> possibleConditions;
        private String severityLevel;
        private String suggestedDepartment;
        private String recommendation;

        public AiClinicalInsights() {}
        public AiClinicalInsights(List<String> possibleConditions, String severityLevel, String suggestedDepartment, String recommendation) {
            this.possibleConditions = possibleConditions;
            this.severityLevel = severityLevel;
            this.suggestedDepartment = suggestedDepartment;
            this.recommendation = recommendation;
        }

        public List<String> getPossibleConditions() { return possibleConditions; }
        public void setPossibleConditions(List<String> possibleConditions) { this.possibleConditions = possibleConditions; }

        public String getSeverityLevel() { return severityLevel; }
        public void setSeverityLevel(String severityLevel) { this.severityLevel = severityLevel; }

        public String getSuggestedDepartment() { return suggestedDepartment; }
        public void setSuggestedDepartment(String suggestedDepartment) { this.suggestedDepartment = suggestedDepartment; }

        public String getRecommendation() { return recommendation; }
        public void setRecommendation(String recommendation) { this.recommendation = recommendation; }
    }
}
