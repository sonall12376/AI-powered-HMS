package com.hms.backend.features.admission.service;

import com.hms.backend.exception.ResourceNotFoundException;
import com.hms.backend.features.admission.dto.AdmitPatientDTO;
import com.hms.backend.features.admission.dto.DischargeDTO;
import com.hms.backend.features.admission.dto.RecordRoundDTO;
import com.hms.backend.features.admission.dto.TransferPatientDTO;
import com.hms.backend.features.admission.entity.Admission;
import com.hms.backend.features.admission.entity.Bed;
import com.hms.backend.features.admission.repository.AdmissionRepository;
import com.hms.backend.features.admission.repository.BedRepository;
import com.hms.backend.features.billing.dto.CreateInvoiceDTO;
import com.hms.backend.features.billing.service.BillingService;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class AdmissionService {

    private final AdmissionRepository admissionRepository;
    private final BedRepository bedRepository;
    private final BillingService billingService;

    public AdmissionService(AdmissionRepository admissionRepository, BedRepository bedRepository, BillingService billingService) {
        this.admissionRepository = admissionRepository;
        this.bedRepository = bedRepository;
        this.billingService = billingService;
    }

    @Transactional
    public Admission admitPatient(AdmitPatientDTO dto) {
        // 1. Check if patient is already admitted
        List<Admission> activeAdmissions = admissionRepository.findByPatientIdAndStatus(new ObjectId(dto.getPatientId()), "ADMITTED");
        List<Admission> activeTransferredAdmissions = admissionRepository.findByPatientIdAndStatus(new ObjectId(dto.getPatientId()), "TRANSFERRED");
        if (!activeAdmissions.isEmpty() || !activeTransferredAdmissions.isEmpty()) {
            throw new IllegalArgumentException("Patient is already admitted to an active ward");
        }

        // 2. Fetch target bed
        Bed bed = bedRepository.findById(new ObjectId(dto.getBedId()))
            .orElseThrow(() -> new ResourceNotFoundException("Bed not found with ID: " + dto.getBedId()));

        if (bed.isOccupied()) {
            throw new IllegalArgumentException("Target Bed " + bed.getBedNumber() + " in Room " + bed.getRoomNumber() + " is already occupied");
        }

        // 3. Create Admission Record
        Admission admission = new Admission();
        admission.setAdmissionId("ADM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        admission.setPatientId(new ObjectId(dto.getPatientId()));
        admission.setAdmittingDoctorId(new ObjectId(dto.getAdmittingDoctorId()));
        admission.setAdmissionDate(Instant.now());
        admission.setReasonForAdmission(dto.getReasonForAdmission());
        admission.setWardType(dto.getWardType());
        admission.setStatus("ADMITTED");
        admission.setDailyRounds(new ArrayList<>());
        admission.setCreatedAt(Instant.now());

        Admission.BedDetails bedDetails = new Admission.BedDetails(
            bed.getId(),
            bed.getRoomNumber(),
            bed.getBedNumber(),
            bed.getWardName()
        );
        admission.setBedDetails(bedDetails);

        Admission savedAdmission = admissionRepository.save(admission);

        // 4. Update Bed state
        bed.setOccupied(true);
        bed.setCurrentPatientId(savedAdmission.getPatientId());
        bed.setCurrentAdmissionId(savedAdmission.getId());
        bedRepository.save(bed);

        return savedAdmission;
    }

    @Transactional
    public Admission recordRound(String id, RecordRoundDTO dto) {
        Admission admission = getAdmissionByIdOrBusinessId(id);

        if ("DISCHARGED".equalsIgnoreCase(admission.getStatus())) {
            throw new IllegalArgumentException("Cannot record clinical rounds for a discharged patient");
        }

        Admission.DailyRound round = new Admission.DailyRound();
        round.setTimestamp(Instant.now());
        round.setVisitingDoctorId(new ObjectId(dto.getVisitingDoctorId()));
        round.setNotes(dto.getNotes());
        round.setPrescribedChanges(dto.getPrescribedChanges());

        Admission.Vitals vitals = new Admission.Vitals();
        vitals.setBloodPressure(dto.getVitals().getBloodPressure());
        vitals.setHeartRate(dto.getVitals().getHeartRate());
        vitals.setTemperature(dto.getVitals().getTemperature());
        vitals.setSpo2(dto.getVitals().getSpo2());
        round.setVitals(vitals);

        if (admission.getDailyRounds() == null) {
            admission.setDailyRounds(new ArrayList<>());
        }
        admission.getDailyRounds().add(round);

        return admissionRepository.save(admission);
    }

    @Transactional
    public Admission transferPatient(String id, TransferPatientDTO dto) {
        Admission admission = getAdmissionByIdOrBusinessId(id);

        if ("DISCHARGED".equalsIgnoreCase(admission.getStatus())) {
            throw new IllegalArgumentException("Cannot transfer a discharged patient");
        }

        Bed newBed = bedRepository.findById(new ObjectId(dto.getNewBedId()))
            .orElseThrow(() -> new ResourceNotFoundException("Target Bed not found with ID: " + dto.getNewBedId()));

        if (newBed.isOccupied()) {
            throw new IllegalArgumentException("Target Bed " + newBed.getBedNumber() + " in Room " + newBed.getRoomNumber() + " is already occupied");
        }

        // 1. Free Old Bed
        if (admission.getBedDetails() != null && admission.getBedDetails().getBedId() != null) {
            bedRepository.findById(admission.getBedDetails().getBedId()).ifPresent(oldBed -> {
                oldBed.setOccupied(false);
                oldBed.setCurrentPatientId(null);
                oldBed.setCurrentAdmissionId(null);
                bedRepository.save(oldBed);
            });
        }

        // 2. Lock New Bed
        newBed.setOccupied(true);
        newBed.setCurrentPatientId(admission.getPatientId());
        newBed.setCurrentAdmissionId(admission.getId());
        bedRepository.save(newBed);

        // 3. Update Admission details
        Admission.BedDetails newBedDetails = new Admission.BedDetails(
            newBed.getId(),
            newBed.getRoomNumber(),
            newBed.getBedNumber(),
            newBed.getWardName()
        );
        admission.setBedDetails(newBedDetails);
        admission.setStatus("TRANSFERRED");

        return admissionRepository.save(admission);
    }

    @Transactional
    public Admission dischargePatient(String id, DischargeDTO dto) {
        Admission admission = getAdmissionByIdOrBusinessId(id);

        if ("DISCHARGED".equalsIgnoreCase(admission.getStatus())) {
            throw new IllegalArgumentException("Patient is already discharged");
        }

        // 1. Free Bed
        if (admission.getBedDetails() != null && admission.getBedDetails().getBedId() != null) {
            bedRepository.findById(admission.getBedDetails().getBedId()).ifPresent(bed -> {
                bed.setOccupied(false);
                bed.setCurrentPatientId(null);
                bed.setCurrentAdmissionId(null);
                bedRepository.save(bed);
            });
        }

        // 2. Fetch Bed details to compute rates (before resetting fields, or load rate)
        double hourlyRate = 50.0;
        if (admission.getBedDetails() != null && admission.getBedDetails().getBedId() != null) {
            hourlyRate = bedRepository.findById(admission.getBedDetails().getBedId())
                .map(Bed::getHourlyRate)
                .orElse(50.0);
        }

        // 3. Update Admission Record
        admission.setDischargeDate(Instant.now());
        admission.setStatus("DISCHARGED");

        Admission.DischargeSummary summary = new Admission.DischargeSummary();
        summary.setDischargeNotes(dto.getDischargeNotes());
        summary.setDiagnosisAtDischarge(dto.getDiagnosisAtDischarge());
        summary.setTreatmentSummary(dto.getTreatmentSummary());
        admission.setDischargeSummary(summary);

        Admission savedAdmission = admissionRepository.save(admission);

        // 4. Trigger Billing Event
        long hours = ChronoUnit.HOURS.between(admission.getAdmissionDate(), Instant.now());
        if (hours <= 0) {
            hours = 1; // Minimum 1 hour charge
        }

        double totalRoomCost = hours * hourlyRate;

        CreateInvoiceDTO billingDto = new CreateInvoiceDTO();
        billingDto.setPatientId(admission.getPatientId().toString());
        billingDto.setEncounterRefId(admission.getId().toString());
        billingDto.setEncounterType("ADMISSION");

        List<CreateInvoiceDTO.LineItemDTO> items = new ArrayList<>();
        
        // Add Room Charges Line Item
        CreateInvoiceDTO.LineItemDTO roomCharges = new CreateInvoiceDTO.LineItemDTO();
        roomCharges.setDescription("Inpatient Room Charges (" + hours + " hours @ $" + hourlyRate + "/hr)");
        roomCharges.setQuantity(1);
        roomCharges.setUnitPrice(totalRoomCost);
        roomCharges.setDiscount(0.0);
        roomCharges.setTax(Math.round((totalRoomCost * 0.1) * 100.0) / 100.0); // 10% tax
        items.add(roomCharges);

        // Add Consultation rounds charge if any
        int roundsCount = admission.getDailyRounds() != null ? admission.getDailyRounds().size() : 0;
        if (roundsCount > 0) {
            CreateInvoiceDTO.LineItemDTO roundsCharges = new CreateInvoiceDTO.LineItemDTO();
            roundsCharges.setDescription("Inpatient Ward Rounds (" + roundsCount + " rounds @ $100.00/round)");
            roundsCharges.setQuantity(roundsCount);
            roundsCharges.setUnitPrice(100.00);
            roundsCharges.setDiscount(0.0);
            roundsCharges.setTax(roundsCount * 10.00); // $10 tax per round
            items.add(roundsCharges);
        }

        billingDto.setLineItems(items);
        billingService.createInvoice(billingDto);

        return savedAdmission;
    }

    public List<Admission> listAdmissions(String status) {
        if (status != null && !status.trim().isEmpty()) {
            return admissionRepository.findByStatus(status);
        }
        return admissionRepository.findAll();
    }

    public Admission getAdmission(String id) {
        return getAdmissionByIdOrBusinessId(id);
    }

    public List<Admission> getAdmissionsByPatient(String patientId) {
        return admissionRepository.findByPatientId(new ObjectId(patientId));
    }

    public List<Bed> listBeds(Boolean occupied, String wardName) {
        if (occupied != null && wardName != null) {
            return bedRepository.findByOccupied(occupied).stream()
                .filter(b -> b.getWardName().equalsIgnoreCase(wardName))
                .toList();
        } else if (occupied != null) {
            return bedRepository.findByOccupied(occupied);
        } else if (wardName != null) {
            return bedRepository.findByWardName(wardName);
        }
        return bedRepository.findAll();
    }

    public List<Bed> seedBeds() {
        // Clear existing beds to avoid duplicates
        bedRepository.deleteAll();

        List<Bed> sampleBeds = new ArrayList<>();
        
        // General Ward 1 (4 beds)
        sampleBeds.add(createSampleBed("General Ward 1", "101", "A", "GENERAL_WARD", 30.0));
        sampleBeds.add(createSampleBed("General Ward 1", "101", "B", "GENERAL_WARD", 30.0));
        sampleBeds.add(createSampleBed("General Ward 1", "102", "A", "GENERAL_WARD", 30.0));
        sampleBeds.add(createSampleBed("General Ward 1", "102", "B", "GENERAL_WARD", 30.0));

        // Intensive Care Unit (ICU) (2 beds)
        sampleBeds.add(createSampleBed("Intensive Care Unit (ICU)", "201", "A", "INTENSIVE_CARE", 120.0));
        sampleBeds.add(createSampleBed("Intensive Care Unit (ICU)", "201", "B", "INTENSIVE_CARE", 120.0));

        // Private Ward (1 bed)
        sampleBeds.add(createSampleBed("Private Ward", "301", "A", "PRIVATE_ROOM", 200.0));

        // Pediatric Ward (1 bed)
        sampleBeds.add(createSampleBed("Pediatric Ward", "401", "A", "PEDIATRIC_WARD", 50.0));

        return bedRepository.saveAll(sampleBeds);
    }

    private Bed createSampleBed(String wardName, String roomNumber, String bedNumber, String bedType, double rate) {
        Bed bed = new Bed();
        bed.setWardName(wardName);
        bed.setRoomNumber(roomNumber);
        bed.setBedNumber(bedNumber);
        bed.setBedType(bedType);
        bed.setOccupied(false);
        bed.setHourlyRate(rate);
        return bed;
    }

    private Admission getAdmissionByIdOrBusinessId(String identifier) {
        return admissionRepository.findByAdmissionId(identifier)
            .or(() -> {
                try {
                    return admissionRepository.findById(new ObjectId(identifier));
                } catch (IllegalArgumentException e) {
                    return java.util.Optional.empty();
                }
            })
            .orElseThrow(() -> new ResourceNotFoundException("Admission not found with identifier: " + identifier));
    }
}
