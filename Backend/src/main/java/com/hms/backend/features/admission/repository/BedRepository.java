package com.hms.backend.features.admission.repository;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.hms.backend.features.admission.entity.Bed;
import java.util.List;
import java.util.Optional;

public interface BedRepository extends MongoRepository<Bed, ObjectId> {
    List<Bed> findByOccupied(boolean occupied);
    List<Bed> findByWardName(String wardName);
    Optional<Bed> findByWardNameAndRoomNumberAndBedNumber(String wardName, String roomNumber, String bedNumber);
}
