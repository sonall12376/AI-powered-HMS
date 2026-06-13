package com.hms.backend.features.admission.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.List;

@Data
@Document(collection = "admissions")
@CompoundIndexes({
    @CompoundIndex(name = "occupancy_report_idx", def = "{'status': 1, 'wardType': 1}"),
    @CompoundIndex(name = "active_admission_idx", def = "{'patientId': 1, 'status': 1}")
})
public class Admission {
    @Id
    private ObjectId id;

    @Indexed(unique = true)
    @Field("admission_id")
    private String admissionId;

    @Field("patient_id")
    private ObjectId patientId;

    @Field("admitting_doctor_id")
    private ObjectId admittingDoctorId;

    @Field("admission_date")
    private Instant admissionDate;

    @Field("discharge_date")
    private Instant dischargeDate;

    @Field("reason_for_admission")
    private String reasonForAdmission;

    @Field("ward_type")
    private String wardType;

    @Field("bed_details")
    private BedDetails bedDetails;

    @Field("daily_rounds")
    private List<DailyRound> dailyRounds;

    @Field("discharge_summary")
    private DischargeSummary dischargeSummary;

    private String status; // ADMITTED, TRANSFERRED, DISCHARGED

    @CreatedDate
    @Field("created_at")
    private Instant createdAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BedDetails {
        @Field("bed_id")
        private ObjectId bedId;

        @Field("room_number")
        private String roomNumber;

        @Field("bed_number")
        private String bedNumber;

        @Field("ward_name")
        private String wardName;
    }

    @Data
    public static class DailyRound {
        private Instant timestamp;

        @Field("visiting_doctor_id")
        private ObjectId visitingDoctorId;

        private String notes;
        private Vitals vitals;

        @Field("prescribed_changes")
        private String prescribedChanges;
    }

    @Data
    public static class Vitals {
        @Field("blood_pressure")
        private String bloodPressure;

        @Field("heart_rate")
        private int heartRate;

        private double temperature;
        private int spo2;
    }

    @Data
    public static class DischargeSummary {
        @Field("discharge_notes")
        private String dischargeNotes;

        @Field("diagnosis_at_discharge")
        private String diagnosisAtDischarge;

        @Field("treatment_summary")
        private String treatmentSummary;
    }
}
