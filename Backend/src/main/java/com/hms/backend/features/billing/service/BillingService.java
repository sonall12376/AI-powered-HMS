package com.hms.backend.features.billing.service;

import com.hms.backend.exception.ResourceNotFoundException;
import com.hms.backend.features.billing.dto.CreateInvoiceDTO;
import com.hms.backend.features.billing.dto.InsuranceClaimDTO;
import com.hms.backend.features.billing.dto.PaymentDTO;
import com.hms.backend.features.billing.entity.BillingInvoice;
import com.hms.backend.features.billing.entity.BillingPayment;
import com.hms.backend.features.billing.repository.BillingInvoiceRepository;
import com.hms.backend.features.billing.repository.BillingPaymentRepository;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class BillingService {

    private final BillingInvoiceRepository invoiceRepository;
    private final BillingPaymentRepository paymentRepository;

    public BillingService(BillingInvoiceRepository invoiceRepository, BillingPaymentRepository paymentRepository) {
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
    }

    //@Transactional
    public BillingInvoice createInvoice(CreateInvoiceDTO dto) {
        BillingInvoice invoice = new BillingInvoice();
        invoice.setInvoiceId("INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        invoice.setPatientId(new ObjectId(dto.getPatientId()));
        invoice.setEncounterRefId(new ObjectId(dto.getEncounterRefId()));
        invoice.setEncounterType(dto.getEncounterType());
        invoice.setInvoiceDate(Instant.now());
        invoice.setDueDate(Instant.now().plus(30, ChronoUnit.DAYS)); // 30 days due date

        List<BillingInvoice.LineItem> items = new ArrayList<>();
        double subTotal = 0.0;
        double taxTotal = 0.0;
        double discountTotal = 0.0;

        for (CreateInvoiceDTO.LineItemDTO itemDTO : dto.getLineItems()) {
            BillingInvoice.LineItem item = new BillingInvoice.LineItem();
            item.setDescription(itemDTO.getDescription());
            item.setQuantity(itemDTO.getQuantity());
            item.setUnitPrice(itemDTO.getUnitPrice());
            item.setDiscount(itemDTO.getDiscount());
            item.setTax(itemDTO.getTax());
            
            double itemTotal = (itemDTO.getQuantity() * itemDTO.getUnitPrice()) + itemDTO.getTax() - itemDTO.getDiscount();
            item.setTotal(itemTotal);
            items.add(item);

            subTotal += (itemDTO.getQuantity() * itemDTO.getUnitPrice());
            taxTotal += itemDTO.getTax();
            discountTotal += itemDTO.getDiscount();
        }

        invoice.setLineItems(items);
        invoice.setSubTotal(subTotal);
        invoice.setTaxTotal(taxTotal);
        invoice.setDiscountTotal(discountTotal);
        
        double grandTotal = subTotal + taxTotal - discountTotal;
        invoice.setGrandTotal(grandTotal);
        invoice.setPaidAmount(0.0);
        invoice.setOutstandingAmount(grandTotal);
        invoice.setPaymentStatus("UNPAID");
        invoice.setTransactions(new ArrayList<>());
        invoice.setCreatedAt(Instant.now());
        invoice.setUpdatedAt(Instant.now());

        return invoiceRepository.save(invoice);
    }

    @Transactional
    public BillingInvoice recordPayment(String invoiceId, PaymentDTO dto) {
        BillingInvoice invoice = invoiceRepository.findByInvoiceId(invoiceId)
            .or(() -> {
                try {
                    return invoiceRepository.findById(new ObjectId(invoiceId));
                } catch (IllegalArgumentException e) {
                    return java.util.Optional.empty();
                }
            })
            .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with identifier: " + invoiceId));

        if (invoice.getOutstandingAmount() <= 0) {
            throw new IllegalArgumentException("Invoice is already fully paid");
        }

        double paymentAmount = dto.getAmount();
        if (paymentAmount > invoice.getOutstandingAmount()) {
            throw new IllegalArgumentException("Payment amount exceeds outstanding balance of " + invoice.getOutstandingAmount());
        }

        String transactionId = "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // 1. Create and Save BillingPayment record
        BillingPayment payment = new BillingPayment();
        payment.setInvoiceId(invoice.getId());
        payment.setTransactionId(transactionId);
        payment.setAmount(paymentAmount);
        payment.setPaymentMode(dto.getPaymentMode());
        payment.setReferenceNumber(dto.getReferenceNumber());
        payment.setPaymentStatus("SUCCESS");
        payment.setCreatedAt(Instant.now());
        paymentRepository.save(payment);

        // 2. Append to BillingInvoice's transactions embedded list
        BillingInvoice.PaymentTransaction transaction = new BillingInvoice.PaymentTransaction();
        transaction.setTransactionId(transactionId);
        transaction.setAmount(paymentAmount);
        transaction.setPaymentMode(dto.getPaymentMode());
        transaction.setReferenceNumber(dto.getReferenceNumber());
        transaction.setTransactionDate(Instant.now());
        transaction.setStatus("SUCCESS");

        if (invoice.getTransactions() == null) {
            invoice.setTransactions(new ArrayList<>());
        }
        invoice.getTransactions().add(transaction);

        // 3. Update Invoice outstanding & paid totals
        double newPaidAmount = invoice.getPaidAmount() + paymentAmount;
        double newOutstandingAmount = invoice.getGrandTotal() - newPaidAmount;

        invoice.setPaidAmount(newPaidAmount);
        invoice.setOutstandingAmount(newOutstandingAmount);

        if (newOutstandingAmount <= 0.0) {
            invoice.setPaymentStatus("PAID");
        } else {
            invoice.setPaymentStatus("PARTIALLY_PAID");
        }
        invoice.setUpdatedAt(Instant.now());

        return invoiceRepository.save(invoice);
    }

    @Transactional
    public BillingInvoice fileInsuranceClaim(String invoiceId, InsuranceClaimDTO dto) {
        BillingInvoice invoice = invoiceRepository.findByInvoiceId(invoiceId)
            .or(() -> {
                try {
                    return invoiceRepository.findById(new ObjectId(invoiceId));
                } catch (IllegalArgumentException e) {
                    return java.util.Optional.empty();
                }
            })
            .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with identifier: " + invoiceId));

        if (invoice.getOutstandingAmount() <= 0) {
            throw new IllegalArgumentException("Invoice is already fully settled");
        }

        double claimAmount = dto.getAmountClaimed();
        if (claimAmount > invoice.getOutstandingAmount()) {
            throw new IllegalArgumentException("Claim amount cannot exceed outstanding balance of " + invoice.getOutstandingAmount());
        }

        // Mock claim approval process
        BillingInvoice.InsuranceClaim claim = new BillingInvoice.InsuranceClaim();
        claim.setClaimId("CLM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        claim.setInsuranceId(dto.getInsuranceId());
        claim.setAmountClaimed(claimAmount);
        
        // Auto-approve 90% of requested claim value
        double approvedAmount = Math.round((claimAmount * 0.9) * 100.0) / 100.0;
        claim.setAmountApproved(approvedAmount);
        claim.setStatus("APPROVED");
        invoice.setInsuranceClaim(claim);

        // Record as payment transaction
        String transactionId = "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        BillingInvoice.PaymentTransaction transaction = new BillingInvoice.PaymentTransaction();
        transaction.setTransactionId(transactionId);
        transaction.setAmount(approvedAmount);
        transaction.setPaymentMode("INSURANCE");
        transaction.setReferenceNumber(claim.getClaimId());
        transaction.setTransactionDate(Instant.now());
        transaction.setStatus("SUCCESS");

        if (invoice.getTransactions() == null) {
            invoice.setTransactions(new ArrayList<>());
        }
        invoice.getTransactions().add(transaction);

        // Create separate billing payment entry for reporting
        BillingPayment payment = new BillingPayment();
        payment.setInvoiceId(invoice.getId());
        payment.setTransactionId(transactionId);
        payment.setAmount(approvedAmount);
        payment.setPaymentMode("INSURANCE");
        payment.setReferenceNumber(claim.getClaimId());
        payment.setPaymentStatus("SUCCESS");
        payment.setCreatedAt(Instant.now());
        paymentRepository.save(payment);

        double newPaidAmount = invoice.getPaidAmount() + approvedAmount;
        double newOutstandingAmount = invoice.getGrandTotal() - newPaidAmount;

        invoice.setPaidAmount(newPaidAmount);
        invoice.setOutstandingAmount(newOutstandingAmount);

        if (newOutstandingAmount <= 0.0) {
            invoice.setPaymentStatus("PAID");
        } else {
            invoice.setPaymentStatus("PARTIALLY_PAID");
        }
        invoice.setUpdatedAt(Instant.now());

        return invoiceRepository.save(invoice);
    }

    public BillingInvoice getInvoice(String id) {
        return invoiceRepository.findByInvoiceId(id)
            .or(() -> {
                try {
                    return invoiceRepository.findById(new ObjectId(id));
                } catch (IllegalArgumentException e) {
                    return java.util.Optional.empty();
                }
            })
            .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with identifier: " + id));
    }

    public List<BillingInvoice> listInvoices() {
        return invoiceRepository.findAll();
    }

    public List<BillingInvoice> getInvoicesByPatient(String patientId) {
        try {
            return invoiceRepository.findByPatientId(new ObjectId(patientId));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid patient ID format");
        }
    }

    public List<BillingPayment> getPaymentsByInvoice(String invoiceId) {
        BillingInvoice invoice = getInvoice(invoiceId);
        return paymentRepository.findByInvoiceId(invoice.getId());
    }
}
