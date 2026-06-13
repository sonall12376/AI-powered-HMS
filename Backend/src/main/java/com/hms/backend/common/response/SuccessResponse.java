package com.hms.backend.common.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SuccessResponse<T> {
    private boolean success = true;
    private Instant timestamp = Instant.now();
    private String message;
    private T data;

    public SuccessResponse(T data) {
        this.success = true;
        this.timestamp = Instant.now();
        this.message = "Operation completed successfully.";
        this.data = data;
    }

    public SuccessResponse(String message, T data) {
        this.success = true;
        this.timestamp = Instant.now();
        this.message = message;
        this.data = data;
    }
}
