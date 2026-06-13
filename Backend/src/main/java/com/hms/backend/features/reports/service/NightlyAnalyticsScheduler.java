package com.hms.backend.features.reports.service;

import com.hms.backend.features.ai.service.AIOperationsService;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class NightlyAnalyticsScheduler {

    private final ReportsService reportsService;
    private final AIOperationsService aiOperationsService;

    // Use @Lazy for AI service to prevent circular dependencies in case AI service references ReportsService
    public NightlyAnalyticsScheduler(ReportsService reportsService, @Lazy AIOperationsService aiOperationsService) {
        this.reportsService = reportsService;
        this.aiOperationsService = aiOperationsService;
    }

    // Runs every night at 1:00 AM
    @Scheduled(cron = "0 0 1 * * ?")
    public void generateNightlySnapshot() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        reportsService.saveSnapshotForDate(yesterday);
        
        // Trigger AI analysis based on the newly saved data
        try {
            aiOperationsService.generateAndSaveInsights();
        } catch (Exception e) {
            // Log warning but don't crash the reports scheduler
            System.err.println("Failed to generate nightly AI operational insights: " + e.getMessage());
        }
    }
}
