package com.hms.backend.features.reports.controller;

import com.hms.backend.dto.SuccessResponse;
import com.hms.backend.features.reports.entity.DailyAnalyticsSnapshot;
import com.hms.backend.features.reports.service.ReportsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportsController {

    private final ReportsService reportsService;

    public ReportsController(ReportsService reportsService) {
        this.reportsService = reportsService;
    }

    @GetMapping("/summary")
    public ResponseEntity<SuccessResponse<Map<String, Object>>> getSummary() {
        Map<String, Object> summary = reportsService.getLiveOperationalSummary();
        SuccessResponse<Map<String, Object>> response = new SuccessResponse<>("Live operational summary retrieved.", summary);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/snapshots")
    public ResponseEntity<SuccessResponse<List<DailyAnalyticsSnapshot>>> getSnapshots(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        if (endDate == null) {
            endDate = LocalDate.now();
        }
        if (startDate == null) {
            startDate = endDate.minusDays(30);
        }

        List<DailyAnalyticsSnapshot> snapshots = reportsService.getSnapshotsRange(startDate, endDate);
        SuccessResponse<List<DailyAnalyticsSnapshot>> response = new SuccessResponse<>("Historical snapshots retrieved.", snapshots);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/seed")
    public ResponseEntity<SuccessResponse<String>> seedData() {
        reportsService.seedDemoData();
        SuccessResponse<String> response = new SuccessResponse<>("Demo snapshots data seeded successfully.", "Data generated.");
        return ResponseEntity.ok(response);
    }
}
