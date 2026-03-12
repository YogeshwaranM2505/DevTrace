package com.devtrace.controller;

import com.devtrace.model.Dto;
import com.devtrace.model.LogEntry;
import com.devtrace.service.LogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor

public class LogController {

    private final LogService logService;

    /**
     * POST /logs — Ingest a log entry from any application
     */
    @PostMapping("/logs")
    public ResponseEntity<Dto.ApiResponse<LogEntry>> ingestLog(
            @RequestBody @Valid Dto.LogIngestRequest request) {
        try {
            var entry = logService.ingestLog(request);
            log.info("Ingested log: [{}] {} from {}", entry.getLevel(), entry.getErrorType(), entry.getService());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Dto.ApiResponse.ok(entry));
        } catch (IOException e) {
            log.error("Failed to ingest log: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Dto.ApiResponse.error("Failed to store log: " + e.getMessage()));
        }
    }

    /**
     * GET /errors — List all error logs (paginated)
     */
    @GetMapping("/errors")
    public ResponseEntity<Dto.ApiResponse<List<LogEntry>>> getErrors(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            var errors = logService.getErrors(page, size);
            return ResponseEntity.ok(Dto.ApiResponse.ok(errors));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Dto.ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * GET /errors/top — Top occurring error types today
     */
    @GetMapping("/errors/top")
    public ResponseEntity<Dto.ApiResponse<List<Dto.ErrorSummary>>> getTopErrors(
            @RequestParam(defaultValue = "10") int limit) {
        try {
            var topErrors = logService.getTopErrors(limit);
            return ResponseEntity.ok(Dto.ApiResponse.ok(topErrors));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Dto.ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * GET /errors/timeline — Error frequency over time
     */
    @GetMapping("/errors/timeline")
    public ResponseEntity<Dto.ApiResponse<List<Dto.TimelinePoint>>> getTimeline(
            @RequestParam(defaultValue = "24") int hours) {
        try {
            var timeline = logService.getTimeline(hours);
            return ResponseEntity.ok(Dto.ApiResponse.ok(timeline));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Dto.ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * GET /logs/search — Full-text search across logs
     */
    @GetMapping("/logs/search")
    public ResponseEntity<Dto.ApiResponse<Dto.SearchResult>> searchLogs(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String service,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            var request = Dto.SearchRequest.builder()
                    .query(q)
                    .level(level)
                    .service(service)
                    .from(from != null ? Instant.parse(from) : null)
                    .to(to != null ? Instant.parse(to) : null)
                    .page(page)
                    .size(size)
                    .build();

            var result = logService.searchLogs(request);
            return ResponseEntity.ok(Dto.ApiResponse.ok(result));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Dto.ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * GET /dashboard — Aggregated stats for the main dashboard
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Dto.ApiResponse<Dto.DashboardStats>> getDashboard() {
        try {
            var stats = logService.getDashboardStats();
            return ResponseEntity.ok(Dto.ApiResponse.ok(stats));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Dto.ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * GET /health — Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<Dto.ApiResponse<String>> health() {
        return ResponseEntity.ok(Dto.ApiResponse.ok("DevTrace API is running"));
    }
}
