package com.VTT.V10.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Centralized exception translator that ensures stable JSON contract across all REST endpoints.
 */
@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(ResponseStatusException ex) {
        String reason = ex.getReason() != null ? ex.getReason() : "Request error";
        return buildResponse(reason, ex.getStatusCode().value());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
        return buildResponse("Invalid email or password", HttpStatus.UNAUTHORIZED.value());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        return buildResponse("Access denied", HttpStatus.FORBIDDEN.value());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        StringBuilder sb = new StringBuilder();
        ex.getBindingResult().getFieldErrors().forEach(err -> {
            if (!sb.isEmpty()) {
                sb.append(", ");
            }
            sb.append(err.getField()).append(": ").append(err.getDefaultMessage());
        });
        String message = sb.isEmpty() ? "Validation failed" : sb.toString();
        return buildResponse(message, HttpStatus.BAD_REQUEST.value());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        log.error("Unhandled server exception caught in GlobalExceptionHandler: ", ex);
        return buildResponse("Internal server error", HttpStatus.INTERNAL_SERVER_ERROR.value());
    }

    private ResponseEntity<Map<String, Object>> buildResponse(String errorMessage, int statusCode) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", errorMessage);
        body.put("status", statusCode);
        body.put("timestamp", Instant.now().toString());
        return ResponseEntity.status(statusCode)
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(body);
    }
}