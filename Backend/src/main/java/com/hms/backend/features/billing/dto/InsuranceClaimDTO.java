package com.hms.backend.features.billing.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InsuranceClaimDTO {
    @NotBlank(message = "Insurance ID is mandatory")
    private String insuranceId;

    @DecimalMin(value = "0.01", message = "Amount claimed must be greater than zero")
    private double amountClaimed;
}
