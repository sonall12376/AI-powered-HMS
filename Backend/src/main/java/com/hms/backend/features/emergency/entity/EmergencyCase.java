package com.hms.backend.features.emergency.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.List;

@Data
@Document(collection = "emergency_cases")
@CompoundIndexes({
    @CompoundIndex(name = "status_triage_idx", def = "{'status': 1, 'triageLevel': 1}"),
    @CompoundIndex(name = "location_2dsphere_idx", def = "{'currentLocation': '2dsphere'}")
})
public class EmergencyCase {
    @Id
    private ObjectId id;

    @Indexed(unique = true)
    @Field("emergency_id")
    private String emergencyId; // business key e.g. ER-2026-0001

    @Field("patient_id")
    private ObjectId patientId; // null if unidentified

    @Field("temporary_name")
    private String temporaryName; // e.g. "Unknown Male 05"

    @Field("triage_level")
    private String triageLevel; // RED, ORANGE, YELLOW, GREEN

    @Field("triage_score")
    private int triageScore; // 1 (highest) to 5 (lowest)

    @Field("incident_details")
    private String incidentDetails;

    @Field("arrived_at")
    private Instant arrivedAt;

    @Field("incoming_ems_details")
    private String incomingEMSDetails;

    @Field("vital_signs_at_arrival")
    private Vitals vitalSignsAtArrival;

    @Field("treatments_administered")
    private List<ERTreatment> treatmentsAdministered;

    @Field("assigned_staff")
    private List<ObjectId> assignedStaff;

    @Field("current_location")
    private GeoJsonPoint currentLocation; // geospatial coordinate for inbound tracking

    private String status; // TRIAGED, ACTIVE_TREATMENT, STABILIZED, TRANSFERRED

    @Field("ai_triage_support")
    private AITriage aiTriageSupport;

    @CreatedDate
    @Field("created_at")
    private Instant createdAt;

    @Field("updated_at")
    private Instant updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Vitals {
        @Field("blood_pressure")
        private String bloodPressure;

        @Field("heart_rate")
        private int heartRate;

        private double temperature;
        private int spo2;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ERTreatment {
        private String treatment;

        @Field("administered_by")
        private ObjectId administeredBy; // doctor or nurse ID

        private Instant timestamp;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AITriage {
        @Field("suggested_triage_level")
        private String suggestedTriageLevel;

        @Field("severity_index")
        private double severityIndex; // e.g. 0.0 to 1.0

        @Field("recommended_actions")
        private List<String> recommendedActions;
    }
}
