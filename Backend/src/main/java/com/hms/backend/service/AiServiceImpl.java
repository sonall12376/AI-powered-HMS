package com.hms.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hms.backend.exception.AiProcessingException;
import com.hms.backend.model.Appointment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.*;

@Service
public class AiServiceImpl implements AiService {

    private static final Logger log = LoggerFactory.getLogger(AiServiceImpl.class);

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.url:}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public SymptomAnalysisResult analyzeSymptoms(List<String> symptoms) {
        String symptomsJoined = String.join(", ", symptoms);
        log.info("Analyzing symptoms: {}", symptomsJoined);

        if (!StringUtils.hasText(apiKey)) {
            log.info("Gemini API Key missing. Using local mock generator for symptom analysis.");
            return generateMockSymptomAnalysis(symptoms);
        }

        String prompt = "You are an expert AI clinical system. Analyze the following list of symptoms: [" + symptomsJoined + "].\n" +
                "Respond ONLY with a JSON object in this exact structure: \n" +
                "{\n" +
                "  \"possibleConditions\": [\"Condition A\", \"Condition B\"],\n" +
                "  \"severityLevel\": \"LOW\" or \"MEDIUM\" or \"HIGH\" or \"CRITICAL\",\n" +
                "  \"suggestedDepartment\": \"Department Name\",\n" +
                "  \"recommendation\": \"Detailed patient guidance.\"\n" +
                "}\n" +
                "Do not include any markdown format tags like ```json or ```. Return pure JSON.";

        try {
            String jsonResponse = callGeminiApi(prompt);
            return objectMapper.readValue(jsonResponse, SymptomAnalysisResult.class);
        } catch (Exception e) {
            log.error("Failed to analyze symptoms via Gemini API, falling back to mock", e);
            return generateMockSymptomAnalysis(symptoms);
        }
    }

    @Override
    public AppointmentAssistantResult parseAppointmentRequest(String requestText) {
        log.info("Parsing appointment request: {}", requestText);

        if (!StringUtils.hasText(apiKey)) {
            log.info("Gemini API Key missing. Using local mock parser for appointment requests.");
            return generateMockAppointmentParsing(requestText);
        }

        String todayDate = LocalDate.now().toString();
        String prompt = "You are an AI Hospital Scheduling Assistant. Today's date is " + todayDate + ".\n" +
                "Parse the following free-text scheduling request: \"" + requestText + "\".\n" +
                "Respond ONLY with a JSON object in this exact structure:\n" +
                "{\n" +
                "  \"appointmentDate\": \"YYYY-MM-DD\",\n" +
                "  \"appointmentTime\": \"HH:MM\",\n" +
                "  \"department\": \"Suggested Department (e.g. Cardiology, Pediatrics, General Medicine, Neurology)\",\n" +
                "  \"reason\": \"Summary of visit reason\"\n" +
                "}\n" +
                "If the date or time is relative, calculate the exact date based on today's date (" + todayDate + ").\n" +
                "If date/time is not specified, default to today's date and time 09:00.\n" +
                "Do not include any markdown format tags like ```json or ```. Return pure JSON.";

        try {
            String jsonResponse = callGeminiApi(prompt);
            return objectMapper.readValue(jsonResponse, AppointmentAssistantResult.class);
        } catch (Exception e) {
            log.error("Failed to parse appointment request via Gemini API, falling back to mock", e);
            return generateMockAppointmentParsing(requestText);
        }
    }

    @Override
    public Appointment.AiNoShowDetails predictNoShow(String patientId, LocalDate appointmentDate, String appointmentTime) {
        double probability = 0.05;
        
        if (appointmentDate.getDayOfWeek().getValue() >= 6) {
            probability += 0.15;
        }
        if (appointmentTime.compareTo("17:00") > 0) {
            probability += 0.10;
        }
        
        int hash = Math.abs((patientId + appointmentDate.toString()).hashCode()) % 100;
        probability += (hash / 500.0);
        
        probability = Math.min(0.95, probability);
        
        String riskFactor = "LOW";
        if (probability > 0.4) {
            riskFactor = "HIGH";
        } else if (probability > 0.15) {
            riskFactor = "MEDIUM";
        }
        
        return new Appointment.AiNoShowDetails(
                Math.round(probability * 100.0) / 100.0,
                riskFactor
        );
    }

    private String callGeminiApi(String prompt) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", prompt);

            Map<String, Object> parts = new HashMap<>();
            parts.put("parts", Collections.singletonList(textPart));

            Map<String, Object> contents = new HashMap<>();
            contents.put("contents", Collections.singletonList(parts));

            String requestBody = objectMapper.writeValueAsString(contents);
            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

            String urlWithKey = apiUrl + "?key=" + apiKey;
            String response = restTemplate.postForObject(urlWithKey, entity, String.class);

            JsonNode rootNode = objectMapper.readTree(response);
            JsonNode candidate = rootNode.path("candidates").get(0);
            String textResponse = candidate.path("content").path("parts").get(0).path("text").asText();
            
            textResponse = textResponse.replaceAll("```json", "");
            textResponse = textResponse.replaceAll("```", "");
            return textResponse.trim();
        } catch (Exception e) {
            throw new AiProcessingException("Error calling Gemini API: " + e.getMessage(), e);
        }
    }

    private SymptomAnalysisResult generateMockSymptomAnalysis(List<String> symptoms) {
        String input = String.join(" ", symptoms).toLowerCase();
        List<String> conditions = new ArrayList<>();
        String severity = "LOW";
        String department = "General Medicine";
        String recommendation = "Rest, stay hydrated, and monitor symptoms. Consult a doctor if they persist.";

        if (input.contains("chest pain") || input.contains("shortness of breath") || input.contains("heart")) {
            conditions.addAll(Arrays.asList("Angina", "Myocardial Infarction Suspect", "Gastroesophageal Reflux"));
            severity = "CRITICAL";
            department = "Cardiology";
            recommendation = "IMMEDIATE ACTION REQUIRED: Seek emergency medical care immediately. Do not drive yourself to the hospital.";
        } else if (input.contains("fever") || input.contains("cough") || input.contains("throat")) {
            conditions.addAll(Arrays.asList("Acute Viral Upper Respiratory Infection", "Influenza", "Pharyngitis"));
            severity = "MEDIUM";
            department = "General Medicine";
            recommendation = "Rest, take paracetamol for fever as directed, keep well hydrated. Visit clinic if fever stays above 101°F for 3 days.";
        } else if (input.contains("headache") || input.contains("migraine") || input.contains("dizzy")) {
            conditions.addAll(Arrays.asList("Migraine", "Tension Headache", "Dehydration"));
            severity = "MEDIUM";
            department = "Neurology";
            recommendation = "Rest in a quiet, dark room. Sip water. Avoid screens. Over-the-counter pain relievers may help.";
        } else if (input.contains("abdominal") || input.contains("stomach") || input.contains("nausea") || input.contains("vomit")) {
            conditions.addAll(Arrays.asList("Gastroenteritis", "Acid Dyspepsia", "Food Poisoning"));
            severity = "MEDIUM";
            department = "Gastroenterology";
            recommendation = "Eat bland foods, avoid dairy/spicy items, sip oral rehydration solutions. See physician if vomiting continues for 24 hours.";
        } else {
            conditions.addAll(Arrays.asList("Undifferentiated Somatic Symptoms", "Viral Prodrome"));
        }

        return new SymptomAnalysisResult(conditions, severity, department, recommendation);
    }

    private AppointmentAssistantResult generateMockAppointmentParsing(String requestText) {
        String input = requestText.toLowerCase();
        LocalDate targetDate = LocalDate.now();
        String targetTime = "10:00";
        String department = "General Medicine";
        String reason = "General checkup";

        if (input.contains("heart") || input.contains("cardio") || input.contains("chest")) {
            department = "Cardiology";
            reason = "Cardiology consultation";
        } else if (input.contains("child") || input.contains("kid") || input.contains("pediatric")) {
            department = "Pediatrics";
            reason = "Pediatric visit";
        } else if (input.contains("brain") || input.contains("neuro") || input.contains("head")) {
            department = "Neurology";
            reason = "Neurology checkup";
        } else if (input.contains("stomach") || input.contains("gastric") || input.contains("belly")) {
            department = "Gastroenterology";
            reason = "Gastroenterology consultation";
        }

        if (input.contains("tomorrow")) {
            targetDate = targetDate.plusDays(1);
        } else if (input.contains("next monday")) {
            int currentDay = targetDate.getDayOfWeek().getValue();
            int daysToAdd = (8 - currentDay) % 7;
            if (daysToAdd == 0) daysToAdd = 7;
            targetDate = targetDate.plusDays(daysToAdd);
        } else if (input.contains("next week")) {
            targetDate = targetDate.plusDays(7);
        } else if (input.contains("today")) {
            // keep today
        } else {
            String[] days = {"monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"};
            for (int i = 0; i < days.length; i++) {
                if (input.contains("next " + days[i]) || input.contains("on " + days[i])) {
                    int targetDayIndex = i + 1;
                    int currentDay = targetDate.getDayOfWeek().getValue();
                    int daysToAdd = (targetDayIndex - currentDay + 7) % 7;
                    if (daysToAdd == 0) daysToAdd = 7;
                    targetDate = targetDate.plusDays(daysToAdd);
                    break;
                }
            }
        }

        if (input.contains("9 am") || input.contains("9:00")) {
            targetTime = "09:00";
        } else if (input.contains("10 am") || input.contains("10:00")) {
            targetTime = "10:00";
        } else if (input.contains("11 am") || input.contains("11:00")) {
            targetTime = "11:00";
        } else if (input.contains("12 pm") || input.contains("12:00") || input.contains("noon")) {
            targetTime = "12:00";
        } else if (input.contains("2 pm") || input.contains("14:00")) {
            targetTime = "14:00";
        } else if (input.contains("3 pm") || input.contains("15:00")) {
            targetTime = "15:00";
        } else if (input.contains("4 pm") || input.contains("16:00")) {
            targetTime = "16:00";
        }

        return new AppointmentAssistantResult(targetDate.toString(), targetTime, department, reason);
    }
}
