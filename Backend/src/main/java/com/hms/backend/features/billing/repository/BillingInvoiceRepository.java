package com.hms.backend.features.billing.repository;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.hms.backend.features.billing.entity.BillingInvoice;

public interface BillingInvoiceRepository extends MongoRepository<BillingInvoice, ObjectId> {
    // TODO: Define repository methods for billing invoices
}
