package com.darukaa.earth.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public class ApiError {

    private final Instant timestamp;
    private final int status;
    private final String error;
    private final String message;
    private final String path;
    private final List<String> details;

    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    private final Map<String, String> fieldErrors;

    public ApiError(int status, String error, String message, String path) {
        this(status, error, message, path, List.of(), Map.of());
    }

    public ApiError(int status, String error, String message, String path, List<String> details) {
        this(status, error, message, path, details, Map.of());
    }

    public ApiError(
            int status,
            String error,
            String message,
            String path,
            List<String> details,
            Map<String, String> fieldErrors) {
        this.timestamp = Instant.now();
        this.status = status;
        this.error = error;
        this.message = message;
        this.path = path;
        this.details = details == null ? List.of() : List.copyOf(details);
        this.fieldErrors = fieldErrors == null ? Map.of() : Map.copyOf(fieldErrors);
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public int getStatus() {
        return status;
    }

    public String getError() {
        return error;
    }

    public String getMessage() {
        return message;
    }

    public String getPath() {
        return path;
    }

    public List<String> getDetails() {
        return details;
    }

    public Map<String, String> getFieldErrors() {
        return fieldErrors;
    }
}
