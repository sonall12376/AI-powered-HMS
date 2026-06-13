package com.hms.backend.features.admission.entity;

import lombok.Data;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Data
@Document(collection = "beds")
@CompoundIndexes({
    @CompoundIndex(name = "ward_room_bed_idx", def = "{'wardName': 1, 'roomNumber': 1, 'bedNumber': 1}", unique = true)
})
public class Bed {
    @Id
    private ObjectId id;

    @Field("ward_name")
    private String wardName;

    @Field("room_number")
    private String roomNumber;

    @Field("bed_number")
    private String bedNumber;

    @Field("bed_type")
    private String bedType; // INTENSIVE_CARE, GENERAL_WARD, etc.

    @Indexed
    private boolean occupied;

    @Field("current_patient_id")
    private ObjectId currentPatientId;

    @Field("current_admission_id")
    private ObjectId currentAdmissionId;

    @Field("hourly_rate")
    private double hourlyRate;
}
