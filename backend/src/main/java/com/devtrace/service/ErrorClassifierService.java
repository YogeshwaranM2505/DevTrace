package com.devtrace.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.regex.Pattern;

/**
 * Classifies log messages into error types and suggests root causes.
 */
@Service
public class ErrorClassifierService {

    private static final Map<String, String[]> ERROR_PATTERNS = Map.of(
        "NullPointerException",
                new String[]{"NullPointerException", "NPE", "null pointer", "Cannot invoke.*null"},
        "DatabaseConnectionException",
                new String[]{"DatabaseConnectionException", "Connection refused", "JDBC", "SQL", "DataSource",
                             "could not connect", "connection pool exhausted", "ORA-", "MySQL.*error"},
        "TimeoutException",
                new String[]{"TimeoutException", "Read timed out", "Connection timed out", "SocketTimeoutException",
                             "timeout", "Timeout", "deadline exceeded"},
        "OutOfMemoryError",
                new String[]{"OutOfMemoryError", "GC overhead", "heap space", "Java heap"},
        "HTTP500Error",
                new String[]{"500", "Internal Server Error", "HTTP 500", "status=500"},
        "AuthenticationException",
                new String[]{"AuthenticationException", "Unauthorized", "401", "403", "Forbidden",
                             "JWT", "token expired", "invalid credentials"},
        "FileNotFoundException",
                new String[]{"FileNotFoundException", "No such file", "file not found", "ENOENT"},
        "StackOverflowError",
                new String[]{"StackOverflowError", "stack overflow", "recursive"}
    );

    private static final Map<String, String> ROOT_CAUSE_MAP = Map.of(
        "NullPointerException",
                "Uninitialized object reference. Check for null before accessing object methods or fields. " +
                "Consider using Optional<T> or adding null guards.",
        "DatabaseConnectionException",
                "Database unreachable or connection pool exhausted. Verify DB host/port, check network rules, " +
                "increase connection pool size, or inspect DB server logs.",
        "TimeoutException",
                "External service or DB query exceeded timeout threshold. Check network latency, optimize slow " +
                "queries, or increase timeout configuration.",
        "OutOfMemoryError",
                "JVM heap exhausted. Increase -Xmx, profile for memory leaks, check for large object retention, " +
                "or reduce cache sizes.",
        "HTTP500Error",
                "Unhandled server-side exception. Check application logs for the underlying exception, verify " +
                "input validation, and add proper error handling.",
        "AuthenticationException",
                "Invalid credentials or expired token. Verify token expiry settings, check auth service health, " +
                "ensure client is sending correct headers.",
        "FileNotFoundException",
                "Expected file or resource not found. Verify file paths in configuration, check file system " +
                "permissions, or ensure required resources are bundled.",
        "StackOverflowError",
                "Infinite or deeply nested recursion. Check recursive method termination conditions and " +
                "consider iterative approaches."
    );

    public String classify(String message) {
        if (message == null) return "UnknownError";

        for (var entry : ERROR_PATTERNS.entrySet()) {
            for (String pattern : entry.getValue()) {
                if (Pattern.compile(pattern, Pattern.CASE_INSENSITIVE).matcher(message).find()) {
                    return entry.getKey();
                }
            }
        }
        return "UnknownError";
    }

    public String getRootCause(String errorType) {
        return ROOT_CAUSE_MAP.getOrDefault(errorType,
                "Unknown error type. Review stack trace and application logs for details.");
    }

    public String getSeverity(String level, String errorType) {
        if ("ERROR".equalsIgnoreCase(level)) {
            return switch (errorType) {
                case "OutOfMemoryError", "StackOverflowError", "DatabaseConnectionException" -> "CRITICAL";
                case "NullPointerException", "HTTP500Error", "TimeoutException" -> "HIGH";
                default -> "MEDIUM";
            };
        } else if ("WARN".equalsIgnoreCase(level)) {
            return "LOW";
        }
        return "INFO";
    }
}
