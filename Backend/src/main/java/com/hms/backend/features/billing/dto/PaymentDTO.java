package com.hms.backend.features.billing.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class PaymentDTO {
    @DecimalMin(value = "0.01", message = "Payment amount must be greater than zero")
    private double amount;

    @NotBlank(message = "Payment mode is mandatory")
    @Pattern(regexp = "^(CARD|UPI|CASH)$", message = "Payment mode must be CARD, UPI, or CASH")
    private String paymentMode;

    private String referenceNumber;
}
