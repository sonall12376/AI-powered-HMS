package com.hms.backend.features.ai.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GeminiService {

    @Value("${gemini.api.key:mock-key}")
    private String apiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent}")
    private String apiUrl;

    private final RestTemplate restTemplate;
    private final Map<String, TokenBucket> rateLimiters = new ConcurrentHashMap<>();

    public GeminiService() {
        this.restTemplate = new RestTemplate();
    }

    // Token Bucket class for rate limiting
    public static class TokenBucket {
        private final int capacity = 5;
        private final double refillRatePerSecond = 5.0 / 60.0; // 5 tokens per minute
        private double tokens = 5;
        private long lastRefillTime = System.currentTimeMillis();

        public synchronized boolean tryConsume() {
            refill();
            if (tokens >= 1.0) {
                tokens -= 1.0;
                return true;
            }
            return false;
        }

        private void refill() {
            long now = System.currentTimeMillis();
            double delta = (now - lastRefillTime) / 1000.0;
            tokens = Math.min(capacity, tokens + delta * refillRatePerSecond);
            lastRefillTime = now;
        }
    }

    private boolean tryConsume(String patientId) {
        return rateLimiters.computeIfAbsent(patientId, k -> new TokenBucket()).tryConsume();
    }

    public String explainPrescription(String patientId, String prescriptionDetails) {
        // Enforce rate limit (5 requests per minute)
        if (!tryConsume(patientId)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, 
                    "Rate limit exceeded. You can only make 5 prescription analysis requests per minute.");
        }

        // Format system instructions and user details
        String prompt = "You are CareFlow AI, a clinical pharmacologist. Your task is to explain the provided prescription details in plain language to the patient.\n\n"
                + "Prescription Details:\n" + prescriptionDetails + "\n\n"
                + "Safety Rules:\n"
                + "1. Explain dosages, medication schedules, food instructions, and possible side effects.\n"
                + "2. Under no circumstances should you recommend or prescribe new medications.\n"
                + "3. If the patient asks for alternative treatments or complains of severe symptoms, instruct them to contact their primary care physician immediately.\n"
                + "4. Keep explanations clear, structured, and easy to understand for laypeople.\n\n"
                + "Explanation:";

        if ("mock-key".equalsIgnoreCase(apiKey) || apiKey == null || apiKey.trim().isEmpty()) {
            return generateMockPrescriptionExplanation(prescriptionDetails);
        }

        return callGeminiAPI(prompt);
    }

    public String generateOperationalAnalysis(String snapshotDataJson) {
        String prompt = "You are an Enterprise Healthcare Operations Analyst. Analyze the following operational snapshot data and identify bottlenecks, occupancy risks, and resource misallocations.\n\n"
                + "Data Input (JSON Snapshots):\n" + snapshotDataJson + "\n\n"
                + "Tasks:\n"
                + "1. Calculate the projected ICU capacity risk for the next 48 hours.\n"
                + "2. Identify pharmacy stock items or resource bottlenecks.\n"
                + "3. Highlight peak emergency room arrival periods and suggest staff scheduling updates.\n"
                + "4. Provide actionable recommendations to improve operational efficiency.\n\n"
                + "Respond ONLY with a valid JSON array of objects representing insights in this format:\n"
                + "[\n"
                + "  {\n"
                + "    \"insightType\": \"CAPACITY_WARNING\",\n"
                + "    \"severity\": \"HIGH\",\n"
                + "    \"description\": \"ICU occupancy rate has reached 94%. Projected arrivals suggest capacity limit will be exceeded within 24 hours.\",\n"
                + "    \"actionableSteps\": [\n"
                + "      \"Initiate discharge clearances for patients in recovery.\",\n"
                + "      \"Redirect non-emergency surgical admissions to semi-private rooms.\"\n"
                + "    ]\n"
                + "  }\n"
                + "]\n"
                + "Response:";

        if ("mock-key".equalsIgnoreCase(apiKey) || apiKey == null || apiKey.trim().isEmpty()) {
            return generateMockOperationalAnalysis(snapshotDataJson);
        }

        try {
            String rawResponse = callGeminiAPI(prompt);
            // Clean markdown blocks if Gemini returned them
            return cleanJsonMarkdown(rawResponse);
        } catch (Exception e) {
            System.err.println("Gemini API call failed, falling back to local analysis generator: " + e.getMessage());
            return generateMockOperationalAnalysis(snapshotDataJson);
        }
    }

    private String callGeminiAPI(String prompt) {
        try {
            String url = apiUrl + "?key=" + apiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Construct payload: { "contents": [{ "parts": [{"text": prompt}] }] }
            Map<String, Object> requestBody = new HashMap<>();
            List<Map<String, Object>> contents = new ArrayList<>();
            Map<String, Object> contentMap = new HashMap<>();
            List<Map<String, Object>> parts = new ArrayList<>();
            Map<String, Object> partMap = new HashMap<>();
            partMap.put("text", prompt);
            parts.add(partMap);
            contentMap.put("parts", parts);
            contents.add(contentMap);
            requestBody.put("contents", contents);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map body = response.getBody();
                List candidates = (List) body.get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map firstCandidate = (Map) candidates.get(0);
                    Map content = (Map) firstCandidate.get("content");
                    if (content != null) {
                        List responseParts = (List) content.get("parts");
                        if (responseParts != null && !responseParts.isEmpty()) {
                            Map firstPart = (Map) responseParts.get(0);
                            return (String) firstPart.get("text");
                        }
                    }
                }
            }
            throw new RuntimeException("Unexpected response payload structure from Gemini API");
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Gemini API execution error: " + e.getMessage());
        }
    }

    private String cleanJsonMarkdown(String raw) {
        if (raw == null) return "[]";
        String cleaned = raw.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        return cleaned.trim();
    }

    private String generateMockPrescriptionExplanation(String prescriptionDetails) {
        String detailLower = prescriptionDetails.toLowerCase();
        StringBuilder sb = new StringBuilder();
        sb.append("### CareFlow AI - Prescription Explanation\n\n");
        sb.append("Here is an explanation of the prescription medications and instructions you provided:\n\n");

        if (detailLower.contains("amoxicillin") || detailLower.contains("antibiotic")) {
            sb.append("#### 💊 Amoxicillin (Antibiotic)\n");
            sb.append("- **Purpose:** Used to treat bacterial infections. It will not work for viral infections like flu or common colds.\n");
            sb.append("- **Instructions:** Complete the full course of treatment as prescribed, even if you feel better. Stopping early can allow bacteria to grow back.\n");
            sb.append("- **Guidelines:** Take with or without food. If it causes stomach upset, taking it with a meal can help.\n");
            sb.append("- **Side Effects:** Mild diarrhea, stomach pain, or nausea. Seek emergency care if you experience a rash, hives, or swelling.\n\n");
        }
        if (detailLower.contains("paracetamol") || detailLower.contains("acetaminophen") || detailLower.contains("crocin")) {
            sb.append("#### 💊 Paracetamol / Acetaminophen (Analgesic/Antipyretic)\n");
            sb.append("- **Purpose:** Used for temporary relief of mild-to-moderate pain and reduction of fever.\n");
            sb.append("- **Instructions:** Do not exceed the maximum daily dosage (usually 4000mg or 8 tablets of 500mg in 24 hours) to avoid severe liver damage.\n");
            sb.append("- **Guidelines:** Allow at least 4 to 6 hours between doses.\n");
            sb.append("- **Side Effects:** Generally safe when taken correctly. Avoid other drugs containing acetaminophen and limit alcohol consumption.\n\n");
        }
        if (detailLower.contains("ibuprofen") || detailLower.contains("advil") || detailLower.contains("painkiller")) {
            sb.append("#### 💊 Ibuprofen (NSAID Pain Reliever)\n");
            sb.append("- **Purpose:** Reduces hormones that cause pain and inflammation in the body.\n");
            sb.append("- **Instructions:** Take strictly after meals to prevent irritation of the stomach lining or ulcers.\n");
            sb.append("- **Side Effects:** Heartburn, mild dizziness, or bloating. Contact a doctor if you experience dark, tarry stools.\n\n");
        }
        if (sb.length() < 100) {
            // General explanation fallback
            sb.append("#### 📋 General Medication Guidelines\n");
            sb.append("- **Purpose:** Based on your prescription details, please adhere strictly to the written timings.\n");
            sb.append("- **Dosages:** Take the quantity prescribed. Do not double doses if you miss one.\n");
            sb.append("- **Side Effects:** Be alert for common symptoms such as dizziness, drowsiness, or dry mouth. If these worsen, consult your physician.\n\n");
        }

        sb.append("⚠️ **Safety Warning:** This explanation is for educational purposes only. Do not stop or alter your medication regimen without consulting your prescribing doctor. If you develop a fever, breathing difficulties, or critical symptoms, contact emergency medical services immediately.");

        return sb.toString();
    }

    private String generateMockOperationalAnalysis(String snapshotDataJson) {
        // Look for values in snapshot data if possible, otherwise build standard high-fidelity recommendations
        boolean highICU = snapshotDataJson.contains("ICU") && (snapshotDataJson.contains("0.9") || snapshotDataJson.contains("0.85") || snapshotDataJson.contains("0.8"));
        boolean highWait = snapshotDataJson.contains("wait") && (snapshotDataJson.contains("3") || snapshotDataJson.contains("4") || snapshotDataJson.contains("5"));

        return "[\n"
                + "  {\n"
                + "    \"insightType\": \"CAPACITY_WARNING\",\n"
                + "    \"severity\": \"" + (highICU ? "HIGH" : "MEDIUM") + "\",\n"
                + "    \"description\": \"ICU bed occupancy has risen sharply. Projected incoming trauma arrivals estimate ward capacity limits will be exceeded shortly.\",\n"
                + "    \"actionableSteps\": [\n"
                + "      \"Initiate prompt discharge reviews for ICU patients currently in recovery phases.\",\n"
                + "      \"Put on-call specialty intensive care nursing staff on active standby.\",\n"
                + "      \"Co-ordinate with inpatient ward supervisors to redirect incoming stable admissions.\"\n"
                + "    ]\n"
                + "  },\n"
                + "  {\n"
                + "    \"insightType\": \"ER_WAIT_TIME\",\n"
                + "    \"severity\": \"" + (highWait ? "HIGH" : "MEDIUM") + "\",\n"
                + "    \"description\": \"Emergency room triage average wait times show peaks between 4:00 PM and 8:00 PM due to overlapping shift rotations.\",\n"
                + "    \"actionableSteps\": [\n"
                + "      \"Overlap ER doctor shift handovers by 30 minutes to eliminate coverage gaps.\",\n"
                + "      \"Deploy an additional triage nurse to the ER intake area during peak evening hours.\",\n"
                + "      \"Utilize CareFlow AI emergency priority estimator to speed up basic registration fields.\"\n"
                + "    ]\n"
                + "  },\n"
                + "  {\n"
                + "    \"insightType\": \"REVENUE_DROP\",\n"
                + "    \"severity\": \"LOW\",\n"
                + "    \"description\": \"Laboratory diagnostic test revenues show a slight 5% decrease over the last week compared to outpatient consultations.\",\n"
                + "    \"actionableSteps\": [\n"
                + "      \"Verify diagnostic machine scheduling software is working correctly.\",\n"
                + "      \"Audit lab results dispatch latency times to ensure prompt service.\"\n"
                + "    ]\n"
                + "  }\n"
                + "]";
    }
}
