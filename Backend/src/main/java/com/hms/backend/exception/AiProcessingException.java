package com.hms.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
public class AiProcessingException extends RuntimeException {
    public AiProcessingException(String message) {
        super(message);
    }
    
    public AiProcessingException(String message, Throwable cause) {
        super(message, cause);
    }
}
