package com.hms.backend.features.billing.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateInvoiceDTO {
    @NotBlank(message = "Patient ID is mandatory")
    private String patientId;

    @NotBlank(message = "Encounter reference ID is mandatory")
    private String encounterRefId;

    @NotBlank(message = "Encounter type is mandatory")
    private String encounterType; // CONSULTATION, ADMISSION, LAB_TEST

    @NotEmpty(message = "Line items cannot be empty")
    @Valid
    private List<LineItemDTO> lineItems;

    @Data
    public static class LineItemDTO {
        @NotBlank(message = "Line item description is mandatory")
        private String description;

        @Min(value = 1, message = "Quantity must be at least 1")
        private int quantity;

        @Min(value = 0, message = "Unit price cannot be negative")
        private double unitPrice;

        @Min(value = 0, message = "Discount cannot be negative")
        private double discount;

        @Min(value = 0, message = "Tax cannot be negative")
        private double tax;
    }
}
