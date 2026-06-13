package com.hms.backend.features.ai.controller;

import com.hms.backend.dto.SuccessResponse;
import com.hms.backend.features.ai.entity.OperationalInsight;
import com.hms.backend.features.ai.service.AIOperationsService;
import com.hms.backend.features.ai.service.GeminiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
public class AIController {

    private final GeminiService geminiService;
    private final AIOperationsService aiOperationsService;

    public AIController(GeminiService geminiService, AIOperationsService aiOperationsService) {
        this.geminiService = geminiService;
        this.aiOperationsService = aiOperationsService;
    }

    @PostMapping("/explain-prescription")
    public ResponseEntity<SuccessResponse<String>> explainPrescription(@RequestBody Map<String, String> payload) {
        String prescriptionDetails = payload.get("prescriptionDetails");
        String patientId = payload.getOrDefault("patientId", "anonymous-patient");

        if (prescriptionDetails == null || prescriptionDetails.trim().isEmpty()) {
            throw new IllegalArgumentException("prescriptionDetails field is mandatory.");
        }

        String explanation = geminiService.explainPrescription(patientId, prescriptionDetails);
        SuccessResponse<String> response = new SuccessResponse<>("AI prescription explanation generated.", explanation);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/insights")
    public ResponseEntity<SuccessResponse<List<OperationalInsight>>> getInsights() {
        List<OperationalInsight> insights = aiOperationsService.getLatestInsights();
        SuccessResponse<List<OperationalInsight>> response = new SuccessResponse<>("Latest operational insights retrieved.", insights);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/insights/trigger")
    public ResponseEntity<SuccessResponse<List<OperationalInsight>>> triggerInsights() {
        List<OperationalInsight> insights = aiOperationsService.generateAndSaveInsights();
        SuccessResponse<List<OperationalInsight>> response = new SuccessResponse<>("AI operational recommendation engine compiled insights.", insights);
        return ResponseEntity.ok(response);
    }
}
