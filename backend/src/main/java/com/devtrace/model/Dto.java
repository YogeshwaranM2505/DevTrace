package com.devtrace.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public class Dto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LogIngestRequest {
        private String level;
        private String message;
        private String service;
        private String host;
        private String environment;
        private String traceId;
        private Integer statusCode;
        private String stackTrace;
        private Instant timestamp;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ErrorSummary {
        private String errorType;
        private Long count;
        private String possibleCause;
        private String mostAffectedService;
        private Instant lastSeen;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimelinePoint {
        private String time;
        private Long errorCount;
        private Long warnCount;
        private Long infoCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DashboardStats {
        private Long totalErrorsToday;
        private Long totalLogsToday;
        private Long activeAlerts;
        private Long uniqueServicesAffected;
        private String mostFrequentError;
        private Double errorRate; // errors / total * 100
        private List<ErrorSummary> topErrors;
        private List<TimelinePoint> timeline;
        private Map<String, Long> errorsByService;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SearchRequest {
        private String query;
        private String level;
        private String service;
        private Instant from;
        private Instant to;
        private int page;
        private int size;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SearchResult {
        private List<LogEntry> logs;
        private long totalHits;
        private int page;
        private int size;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApiResponse<T> {
        private boolean success;
        private String message;
        private T data;
        private Instant timestamp;

        public static <T> ApiResponse<T> ok(T data) {
            return ApiResponse.<T>builder()
                    .success(true)
                    .data(data)
                    .timestamp(Instant.now())
                    .build();
        }

        public static <T> ApiResponse<T> error(String message) {
            return ApiResponse.<T>builder()
                    .success(false)
                    .message(message)
                    .timestamp(Instant.now())
                    .build();
        }
    }
}
