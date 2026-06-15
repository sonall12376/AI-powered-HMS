package com.hms.backend.service;

import com.hms.backend.exception.ResourceNotFoundException;
import com.hms.backend.model.Appointment;
import com.hms.backend.model.Consultation;
import com.hms.backend.model.Prescription;
import com.hms.backend.repository.AppointmentRepository;
import com.hms.backend.repository.ConsultationRepository;
import com.hms.backend.repository.PrescriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ConsultationService {

    private static final Logger log = LoggerFactory.getLogger(ConsultationService.class);

    private final ConsultationRepository consultationRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;
    private final AiService aiService;

    public ConsultationService(ConsultationRepository consultationRepository,
                               PrescriptionRepository prescriptionRepository,
                               AppointmentRepository appointmentRepository,
                               AiService aiService) {
        this.consultationRepository = consultationRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.appointmentRepository = appointmentRepository;
        this.aiService = aiService;
    }

    /**
     * Complete consultation: Create consultation record, run AI analysis, and mark appointment as completed.
     */
    @Transactional
    public Consultation createConsultation(Consultation consultation) {
        Appointment appointment = appointmentRepository.findById(consultation.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + consultation.getAppointmentId()));

        if (consultation.getConsultationId() == null || consultation.getConsultationId().isEmpty()) {
            consultation.setConsultationId("CON-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }

        consultation.setPatientId(appointment.getPatientId());
        consultation.setDoctorId(appointment.getDoctorId());

        if (consultation.getSymptoms() != null && !consultation.getSymptoms().isEmpty()) {
            AiService.SymptomAnalysisResult analysisResult = aiService.analyzeSymptoms(consultation.getSymptoms());
            
            Consultation.AiClinicalInsights insights = new Consultation.AiClinicalInsights(
                    analysisResult.getPossibleConditions(),
                    analysisResult.getSeverityLevel(),
                    analysisResult.getSuggestedDepartment(),
                    analysisResult.getRecommendation()
            );
            
            consultation.setAiClinicalInsights(insights);
        }

        Consultation savedConsultation = consultationRepository.save(consultation);

        appointment.setStatus(Appointment.Status.COMPLETED);
        appointmentRepository.save(appointment);

        log.info("Consultation {} completed for appointment {}", savedConsultation.getConsultationId(), appointment.getAppointmentId());
        return savedConsultation;
    }

    /**
     * Create prescription bound to a consultation.
     */
    public Prescription createPrescription(Prescription prescription) {
        consultationRepository.findByConsultationId(prescription.getConsultationId())
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found with id: " + prescription.getConsultationId()));

        if (prescription.getPrescriptionId() == null || prescription.getPrescriptionId().isEmpty()) {
            prescription.setPrescriptionId("PR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }

        Prescription saved = prescriptionRepository.save(prescription);
        log.info("Prescription {} logged for consultation {}", saved.getPrescriptionId(), saved.getConsultationId());
        return saved;
    }
}
