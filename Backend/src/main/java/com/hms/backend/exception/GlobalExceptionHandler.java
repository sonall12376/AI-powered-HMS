package com.hms.backend.exception;

import com.hms.backend.dto.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<ErrorResponse.ErrorDetail> details = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(err -> new ErrorResponse.ErrorDetail(err.getField(), err.getDefaultMessage()))
            .collect(Collectors.toList());

        ErrorResponse.ErrorInfo errorInfo = new ErrorResponse.ErrorInfo(
            "VALIDATION_FAILED",
            "One or more validation constraints failed.",
            details
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse(false, Instant.now(), errorInfo));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        ErrorResponse.ErrorInfo errorInfo = new ErrorResponse.ErrorInfo(
            "RESOURCE_NOT_FOUND",
            ex.getMessage(),
            null
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(false, Instant.now(), errorInfo));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        ErrorResponse.ErrorInfo errorInfo = new ErrorResponse.ErrorInfo(
            "INVALID_ARGUMENT",
            ex.getMessage(),
            null
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse(false, Instant.now(), errorInfo));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        ErrorResponse.ErrorInfo errorInfo = new ErrorResponse.ErrorInfo(
            "INTERNAL_SERVER_ERROR",
            "An unexpected error occurred.",
            null
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ErrorResponse(false, Instant.now(), errorInfo));
    }
}
