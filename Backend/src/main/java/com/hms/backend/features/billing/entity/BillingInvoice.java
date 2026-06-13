package com.hms.backend.features.billing.entity;

import lombok.Data;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.List;

@Data
@Document(collection = "billing_invoices")
@CompoundIndexes({
    @CompoundIndex(name = "patient_unpaid_bills", def = "{'patientId': 1, 'paymentStatus': 1}"),
    @CompoundIndex(name = "invoice_overdue_check", def = "{'dueDate': 1, 'paymentStatus': 1}")
})
public class BillingInvoice {
    @Id
    private ObjectId id;

    @Indexed(unique = true)
    @Field("invoice_id")
    private String invoiceId;

    @Field("patient_id")
    private ObjectId patientId;

    @Field("encounter_ref_id")
    private ObjectId encounterRefId;

    @Field("encounter_type")
    private String encounterType; // CONSULTATION, ADMISSION, LAB_TEST

    @Field("invoice_date")
    private Instant invoiceDate;

    @Field("due_date")
    private Instant dueDate;

    @Field("line_items")
    private List<LineItem> lineItems;

    @Field("sub_total")
    private double subTotal;

    @Field("tax_total")
    private double taxTotal;

    @Field("discount_total")
    private double discountTotal;

    @Field("grand_total")
    private double grandTotal;

    @Field("paid_amount")
    private double paidAmount;

    @Field("outstanding_amount")
    private double outstandingAmount;

    @Field("payment_status")
    private String paymentStatus; // UNPAID, PARTIALLY_PAID, PAID

    @Field("insurance_claim")
    private InsuranceClaim insuranceClaim;

    @Field("transactions")
    private List<PaymentTransaction> transactions;

    @CreatedDate
    @Field("created_at")
    private Instant createdAt;

    @LastModifiedDate
    @Field("updated_at")
    private Instant updatedAt;

    @Data
    public static class LineItem {
        private String description;
        private int quantity;
        @Field("unit_price")
        private double unitPrice;
        private double discount;
        private double tax;
        private double total;
    }

    @Data
    public static class InsuranceClaim {
        @Field("claim_id")
        private String claimId;
        @Field("insurance_id")
        private String insuranceId;
        @Field("amount_claimed")
        private double amountClaimed;
        @Field("amount_approved")
        private double amountApproved;
        private String status; // PENDING, APPROVED, REJECTED
        @Field("rejection_reason")
        private String rejectionReason;
    }

    @Data
    public static class PaymentTransaction {
        @Field("transaction_id")
        private String transactionId;
        private double amount;
        @Field("payment_mode")
        private String paymentMode; // CARD, UPI, CASH
        @Field("reference_number")
        private String referenceNumber;
        @Field("transaction_date")
        private Instant transactionDate;
        private String status; // SUCCESS, FAILED
    }
}
