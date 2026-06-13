package com.hms.backend.features.billing.repository;

import com.hms.backend.features.billing.entity.BillingPayment;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BillingPaymentRepository extends MongoRepository<BillingPayment, ObjectId> {
    List<BillingPayment> findByInvoiceId(ObjectId invoiceId);
    Optional<BillingPayment> findByTransactionId(String transactionId);
}
