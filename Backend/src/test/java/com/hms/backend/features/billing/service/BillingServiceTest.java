package com.hms.backend.features.billing.service;

import com.hms.backend.features.billing.dto.CreateInvoiceDTO;
import com.hms.backend.features.billing.dto.InsuranceClaimDTO;
import com.hms.backend.features.billing.dto.PaymentDTO;
import com.hms.backend.features.billing.entity.BillingInvoice;
import com.hms.backend.features.billing.entity.BillingPayment;
import com.hms.backend.features.billing.repository.BillingInvoiceRepository;
import com.hms.backend.features.billing.repository.BillingPaymentRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class BillingServiceTest {

    private BillingService billingService;

    @Mock
    private BillingInvoiceRepository invoiceRepository;

    @Mock
    private BillingPaymentRepository paymentRepository;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        billingService = new BillingService(invoiceRepository, paymentRepository);
    }

    @Test
    public void testCreateInvoice_CalculatesTotalsCorrectly() {
        // Arrange
        CreateInvoiceDTO dto = new CreateInvoiceDTO();
        dto.setPatientId(new ObjectId().toString());
        dto.setEncounterRefId(new ObjectId().toString());
        dto.setEncounterType("CONSULTATION");

        CreateInvoiceDTO.LineItemDTO item = new CreateInvoiceDTO.LineItemDTO();
        item.setDescription("Physician Consultation Fee");
        item.setQuantity(2);
        item.setUnitPrice(50.0);
        item.setTax(10.0);
        item.setDiscount(5.0);

        dto.setLineItems(Collections.singletonList(item));

        when(invoiceRepository.save(any(BillingInvoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        BillingInvoice result = billingService.createInvoice(dto);

        // Assert
        assertNotNull(result);
        assertEquals("UNPAID", result.getPaymentStatus());
        assertEquals(100.0, result.getSubTotal()); // 2 * 50
        assertEquals(10.0, result.getTaxTotal());
        assertEquals(5.0, result.getDiscountTotal());
        assertEquals(105.0, result.getGrandTotal()); // 100 + 10 - 5
        assertEquals(105.0, result.getOutstandingAmount());
        assertEquals(0.0, result.getPaidAmount());
        verify(invoiceRepository, times(1)).save(any(BillingInvoice.class));
    }

    @Test
    public void testRecordPayment_UpdatesOutstandingAndStatus() {
        // Arrange
        String invoiceId = "INV-TEST1234";
        BillingInvoice invoice = new BillingInvoice();
        invoice.setId(new ObjectId());
        invoice.setInvoiceId(invoiceId);
        invoice.setGrandTotal(100.0);
        invoice.setPaidAmount(0.0);
        invoice.setOutstandingAmount(100.0);
        invoice.setPaymentStatus("UNPAID");
        invoice.setTransactions(new ArrayList<>());

        when(invoiceRepository.findByInvoiceId(invoiceId)).thenReturn(Optional.of(invoice));
        when(invoiceRepository.save(any(BillingInvoice.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentRepository.save(any(BillingPayment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act - 1. Record Partial Payment
        PaymentDTO partialPay = new PaymentDTO();
        partialPay.setAmount(40.0);
        partialPay.setPaymentMode("UPI");
        partialPay.setReferenceNumber("REF112233");

        BillingInvoice resPartial = billingService.recordPayment(invoiceId, partialPay);

        // Assert Partial
        assertEquals(40.0, resPartial.getPaidAmount());
        assertEquals(60.0, resPartial.getOutstandingAmount());
        assertEquals("PARTIALLY_PAID", resPartial.getPaymentStatus());
        assertEquals(1, resPartial.getTransactions().size());

        // Act - 2. Record Remaining Payment
        PaymentDTO fullPay = new PaymentDTO();
        fullPay.setAmount(60.0);
        fullPay.setPaymentMode("CARD");
        fullPay.setReferenceNumber("REF445566");

        BillingInvoice resFull = billingService.recordPayment(invoiceId, fullPay);

        // Assert Full
        assertEquals(100.0, resFull.getPaidAmount());
        assertEquals(0.0, resFull.getOutstandingAmount());
        assertEquals("PAID", resFull.getPaymentStatus());
        assertEquals(2, resFull.getTransactions().size());
        
        verify(paymentRepository, times(2)).save(any(BillingPayment.class));
        verify(invoiceRepository, times(2)).save(invoice);
    }

    @Test
    public void testFileInsuranceClaim_ApprovesAndUpdatesStatus() {
        // Arrange
        String invoiceId = "INV-CLAIM12";
        BillingInvoice invoice = new BillingInvoice();
        invoice.setId(new ObjectId());
        invoice.setInvoiceId(invoiceId);
        invoice.setGrandTotal(200.0);
        invoice.setPaidAmount(0.0);
        invoice.setOutstandingAmount(200.0);
        invoice.setPaymentStatus("UNPAID");
        invoice.setTransactions(new ArrayList<>());

        when(invoiceRepository.findByInvoiceId(invoiceId)).thenReturn(Optional.of(invoice));
        when(invoiceRepository.save(any(BillingInvoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InsuranceClaimDTO claimDTO = new InsuranceClaimDTO();
        claimDTO.setInsuranceId("BLUE-CROSS-77");
        claimDTO.setAmountClaimed(100.0);

        // Act
        BillingInvoice result = billingService.fileInsuranceClaim(invoiceId, claimDTO);

        // Assert
        assertNotNull(result.getInsuranceClaim());
        assertEquals("APPROVED", result.getInsuranceClaim().getStatus());
        assertEquals(90.0, result.getInsuranceClaim().getAmountApproved()); // 90% auto-approval rule
        assertEquals(90.0, result.getPaidAmount());
        assertEquals(110.0, result.getOutstandingAmount());
        assertEquals("PARTIALLY_PAID", result.getPaymentStatus());
    }
}
