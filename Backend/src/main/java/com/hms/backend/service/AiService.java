package com.hms.backend.service;

import com.hms.backend.model.Appointment;
import java.time.LocalDate;
import java.util.List;

public interface AiService {
    SymptomAnalysisResult analyzeSymptoms(List<String> symptoms);
    AppointmentAssistantResult parseAppointmentRequest(String requestText);
    Appointment.AiNoShowDetails predictNoShow(String patientId, LocalDate appointmentDate, String appointmentTime);

    class SymptomAnalysisResult {
        private List<String> possibleConditions;
        private String severityLevel;
        private String suggestedDepartment;
        private String recommendation;

        public SymptomAnalysisResult() {}
        public SymptomAnalysisResult(List<String> possibleConditions, String severityLevel, String suggestedDepartment, String recommendation) {
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

    class AppointmentAssistantResult {
        private String appointmentDate;
        private String appointmentTime;
        private String department;
        private String reason;

        public AppointmentAssistantResult() {}
        public AppointmentAssistantResult(String appointmentDate, String appointmentTime, String department, String reason) {
            this.appointmentDate = appointmentDate;
            this.appointmentTime = appointmentTime;
            this.department = department;
            this.reason = reason;
        }

        public String getAppointmentDate() { return appointmentDate; }
        public void setAppointmentDate(String appointmentDate) { this.appointmentDate = appointmentDate; }
        public String getAppointmentTime() { return appointmentTime; }
        public void setAppointmentTime(String appointmentTime) { this.appointmentTime = appointmentTime; }
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }
}
