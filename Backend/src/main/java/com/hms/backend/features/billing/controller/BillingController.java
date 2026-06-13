package com.hms.backend.features.billing.controller;

import com.hms.backend.dto.SuccessResponse;
import com.hms.backend.features.billing.dto.CreateInvoiceDTO;
import com.hms.backend.features.billing.dto.InsuranceClaimDTO;
import com.hms.backend.features.billing.dto.PaymentDTO;
import com.hms.backend.features.billing.entity.BillingInvoice;
import com.hms.backend.features.billing.entity.BillingPayment;
import com.hms.backend.features.billing.service.BillingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/billing")
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    @PostMapping("/invoices")
    public ResponseEntity<SuccessResponse<BillingInvoice>> createInvoice(@Valid @RequestBody CreateInvoiceDTO dto) {
        BillingInvoice invoice = billingService.createInvoice(dto);
        SuccessResponse<BillingInvoice> response = new SuccessResponse<>("Invoice generated successfully.", invoice);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/invoices")
    public ResponseEntity<SuccessResponse<List<BillingInvoice>>> listInvoices() {
        List<BillingInvoice> invoices = billingService.listInvoices();
        SuccessResponse<List<BillingInvoice>> response = new SuccessResponse<>("Invoices retrieved successfully.", invoices);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/invoices/{id}")
    public ResponseEntity<SuccessResponse<BillingInvoice>> getInvoice(@PathVariable String id) {
        BillingInvoice invoice = billingService.getInvoice(id);
        SuccessResponse<BillingInvoice> response = new SuccessResponse<>("Invoice retrieved successfully.", invoice);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/invoices/patient/{patientId}")
    public ResponseEntity<SuccessResponse<List<BillingInvoice>>> getInvoicesByPatient(@PathVariable String patientId) {
        List<BillingInvoice> invoices = billingService.getInvoicesByPatient(patientId);
        SuccessResponse<List<BillingInvoice>> response = new SuccessResponse<>("Patient invoices retrieved successfully.", invoices);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/invoices/{id}/payments")
    public ResponseEntity<SuccessResponse<BillingInvoice>> recordPayment(
            @PathVariable String id,
            @Valid @RequestBody PaymentDTO dto) {
        BillingInvoice invoice = billingService.recordPayment(id, dto);
        SuccessResponse<BillingInvoice> response = new SuccessResponse<>("Payment recorded successfully.", invoice);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/invoices/{id}/claims")
    public ResponseEntity<SuccessResponse<BillingInvoice>> fileInsuranceClaim(
            @PathVariable String id,
            @Valid @RequestBody InsuranceClaimDTO dto) {
        BillingInvoice invoice = billingService.fileInsuranceClaim(id, dto);
        SuccessResponse<BillingInvoice> response = new SuccessResponse<>("Insurance claim processed successfully.", invoice);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/invoices/{id}/payments")
    public ResponseEntity<SuccessResponse<List<BillingPayment>>> getPaymentsByInvoice(@PathVariable String id) {
        List<BillingPayment> payments = billingService.getPaymentsByInvoice(id);
        SuccessResponse<List<BillingPayment>> response = new SuccessResponse<>("Payment history retrieved successfully.", payments);
        return ResponseEntity.ok(response);
    }
}
