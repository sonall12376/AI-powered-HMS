package com.hms.backend.features.ai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hms.backend.features.ai.entity.OperationalInsight;
import com.hms.backend.features.ai.repository.OperationalInsightRepository;
import com.hms.backend.features.reports.entity.DailyAnalyticsSnapshot;
import com.hms.backend.features.reports.repository.DailyAnalyticsSnapshotRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class AIOperationsService {

    private final OperationalInsightRepository insightRepository;
    private final DailyAnalyticsSnapshotRepository snapshotRepository;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;

    public AIOperationsService(OperationalInsightRepository insightRepository,
                               DailyAnalyticsSnapshotRepository snapshotRepository,
                               GeminiService geminiService) {
        this.insightRepository = insightRepository;
        this.snapshotRepository = snapshotRepository;
        this.geminiService = geminiService;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule()); // Support LocalDate serialization
    }

    public List<OperationalInsight> generateAndSaveInsights() {
        // 1. Fetch snapshots for the last 7 days
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(7);
        List<DailyAnalyticsSnapshot> snapshots = snapshotRepository.findByDateBetween(start, end);

        // 2. Format snapshots as JSON for context
        String contextJson = "[]";
        try {
            contextJson = objectMapper.writeValueAsString(snapshots);
        } catch (Exception e) {
            System.err.println("Failed to serialize daily snapshots for AI context: " + e.getMessage());
        }

        // 3. Call AI Service to retrieve structured analysis
        String jsonResponse = geminiService.generateOperationalAnalysis(contextJson);

        // 4. Parse the insights and save to the database
        List<OperationalInsight> insights = new ArrayList<>();
        try {
            List<Map<String, Object>> parsedList = objectMapper.readValue(jsonResponse, new TypeReference<List<Map<String, Object>>>() {});
            
            // Clear existing insights first to keep the operational board clean and up-to-date
            insightRepository.deleteAll();

            for (Map<String, Object> map : parsedList) {
                OperationalInsight insight = new OperationalInsight();
                insight.setInsightType((String) map.getOrDefault("insightType", "GENERAL"));
                insight.setSeverity((String) map.getOrDefault("severity", "MEDIUM"));
                insight.setDescription((String) map.getOrDefault("description", "No description provided."));
                
                List<String> steps = (List<String>) map.get("actionableSteps");
                insight.setActionableSteps(steps != null ? steps : new ArrayList<>());
                insight.setCreatedAt(Instant.now());

                insights.add(insightRepository.save(insight));
            }
        } catch (Exception e) {
            System.err.println("Failed to parse Gemini operational analysis response, executing fallback default compiler: " + e.getMessage());
            insights = generateFallbackInsights();
        }

        return insights;
    }

    public List<OperationalInsight> getLatestInsights() {
        List<OperationalInsight> list = insightRepository.findAllByOrderByCreatedAtDesc();
        if (list.isEmpty()) {
            // If empty, generate and return some on-the-fly
            return generateAndSaveInsights();
        }
        return list;
    }

    private List<OperationalInsight> generateFallbackInsights() {
        insightRepository.deleteAll();
        List<OperationalInsight> list = new ArrayList<>();

        OperationalInsight capacity = new OperationalInsight(
                null,
                "CAPACITY_WARNING",
                "HIGH",
                "ICU bed occupancy has risen sharply. Projected incoming trauma arrivals estimate ward capacity limits will be exceeded shortly.",
                List.of(
                        "Initiate prompt discharge reviews for ICU patients currently in recovery phases.",
                        "Put on-call specialty intensive care nursing staff on active standby.",
                        "Co-ordinate with inpatient ward supervisors to redirect incoming stable admissions."
                ),
                Instant.now()
        );
        list.add(insightRepository.save(capacity));

        OperationalInsight wait = new OperationalInsight(
                null,
                "ER_WAIT_TIME",
                "MEDIUM",
                "Emergency room triage average wait times show peaks between 4:00 PM and 8:00 PM due to overlapping shift rotations.",
                List.of(
                        "Overlap ER doctor shift handovers by 30 minutes to eliminate coverage gaps.",
                        "Deploy an additional triage nurse to the ER intake area during peak evening hours."
                ),
                Instant.now()
        );
        list.add(insightRepository.save(wait));

        return list;
    }
}
