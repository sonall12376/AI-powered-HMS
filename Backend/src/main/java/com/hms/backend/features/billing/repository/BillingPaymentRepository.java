package com.hms.backend.features.billing.repository;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.hms.backend.features.billing.entity.BillingPayment;

public interface BillingPaymentRepository extends MongoRepository<BillingPayment, ObjectId> {
    // TODO: Define repository methods for billing payments
}
