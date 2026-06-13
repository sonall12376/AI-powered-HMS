package com.hms.backend.features.billing.entity;

import lombok.Data;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;

@Data
@Document(collection = "billing_payments")
public class BillingPayment {
    @Id
    private ObjectId id;

    @Indexed(unique = true)
    @Field("transaction_id")
    private String transactionId;

    @Indexed
    @Field("invoice_id")
    private ObjectId invoiceId;

    private double amount;

    @Field("payment_mode")
    private String paymentMode; // CARD, UPI, CASH

    @Field("reference_number")
    private String referenceNumber;

    @Field("payment_status")
    private String paymentStatus; // SUCCESS, FAILED

    @CreatedDate
    @Field("created_at")
    private Instant createdAt;
}
