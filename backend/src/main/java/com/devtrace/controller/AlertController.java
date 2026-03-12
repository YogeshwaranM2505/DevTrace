package com.devtrace.controller;
import com.devtrace.model.Alert;
import com.devtrace.model.Dto;
import com.devtrace.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    @GetMapping
    public ResponseEntity<Dto.ApiResponse<List<Alert>>> getActiveAlerts() {
        try {
            return ResponseEntity.ok(Dto.ApiResponse.ok(alertService.getActiveAlerts()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Dto.ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<Dto.ApiResponse<String>> resolveAlert(@PathVariable String id) {
        try {
            alertService.resolveAlert(id);
            return ResponseEntity.ok(Dto.ApiResponse.ok("Alert resolved"));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Dto.ApiResponse.error(e.getMessage()));
        }
    }
}
