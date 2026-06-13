package com.hms.backend.features.billing.repository;

import com.hms.backend.features.billing.entity.BillingInvoice;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillingInvoiceRepository extends MongoRepository<BillingInvoice, ObjectId> {
    Optional<BillingInvoice> findByInvoiceId(String invoiceId);
    List<BillingInvoice> findByPatientId(ObjectId patientId);
    List<BillingInvoice> findByPatientIdAndPaymentStatus(ObjectId patientId, String paymentStatus);
    List<BillingInvoice> findByPaymentStatusAndDueDateBefore(String paymentStatus, Instant now);
}
