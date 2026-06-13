package com.hms.backend.features.reports.service;

import com.hms.backend.features.reports.entity.DailyAnalyticsSnapshot;
import com.hms.backend.features.reports.repository.DailyAnalyticsSnapshotRepository;
import com.hms.backend.features.admission.repository.AdmissionRepository;
import com.hms.backend.features.admission.repository.BedRepository;
import com.hms.backend.features.billing.repository.BillingInvoiceRepository;
import com.hms.backend.features.emergency.repository.EmergencyCaseRepository;
import com.hms.backend.features.admission.entity.Admission;
import com.hms.backend.features.admission.entity.Bed;
import com.hms.backend.features.billing.entity.BillingInvoice;
import com.hms.backend.features.emergency.entity.EmergencyCase;
import org.springframework.stereotype.Service;

import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportsService {

    private final DailyAnalyticsSnapshotRepository snapshotRepository;
    private final AdmissionRepository admissionRepository;
    private final BedRepository bedRepository;
    private final BillingInvoiceRepository billingInvoiceRepository;
    private final EmergencyCaseRepository emergencyCaseRepository;

    public ReportsService(DailyAnalyticsSnapshotRepository snapshotRepository,
                          AdmissionRepository admissionRepository,
                          BedRepository bedRepository,
                          BillingInvoiceRepository billingInvoiceRepository,
                          EmergencyCaseRepository emergencyCaseRepository) {
        this.snapshotRepository = snapshotRepository;
        this.admissionRepository = admissionRepository;
        this.bedRepository = bedRepository;
        this.billingInvoiceRepository = billingInvoiceRepository;
        this.emergencyCaseRepository = emergencyCaseRepository;
    }

    public DailyAnalyticsSnapshot computeSnapshotForDate(LocalDate date) {
        Instant start = date.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant end = date.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        // 1. Active Admissions (admitted before 'end' and either not discharged or discharged after 'start')
        List<Admission> allAdmissions = admissionRepository.findAll();
        int activeAdmissions = (int) allAdmissions.stream()
                .filter(a -> a.getAdmissionDate() != null && a.getAdmissionDate().isBefore(end))
                .filter(a -> a.getDischargeDate() == null || a.getDischargeDate().isAfter(start))
                .count();

        // 2. Bed Occupancy Rates by Ward Name
        List<Bed> allBeds = bedRepository.findAll();
        Map<String, List<Bed>> bedsByWard = allBeds.stream()
                .collect(Collectors.groupingBy(Bed::getWardName));

        Map<String, Double> occupancyRates = new HashMap<>();
        for (Map.Entry<String, List<Bed>> entry : bedsByWard.entrySet()) {
            long total = entry.getValue().size();
            long occupied = entry.getValue().stream().filter(Bed::isOccupied).count();
            double rate = total == 0 ? 0.0 : (double) occupied / total;
            occupancyRates.put(entry.getKey(), Math.round(rate * 100.0) / 100.0);
        }

        // 3. Billing Revenue
        List<BillingInvoice> invoices = billingInvoiceRepository.findAll().stream()
                .filter(inv -> inv.getInvoiceDate() != null && 
                               inv.getInvoiceDate().isAfter(start) && 
                               inv.getInvoiceDate().isBefore(end))
                .collect(Collectors.toList());

        double totalRevenue = invoices.stream().mapToDouble(BillingInvoice::getGrandTotal).sum();
        totalRevenue = Math.round(totalRevenue * 100.0) / 100.0;

        Map<String, Double> revenueByDept = invoices.stream()
                .filter(inv -> inv.getEncounterType() != null)
                .collect(Collectors.groupingBy(
                        BillingInvoice::getEncounterType,
                        Collectors.summingDouble(BillingInvoice::getGrandTotal)
                ));
        // Round values
        revenueByDept.replaceAll((k, v) -> Math.round(v * 100.0) / 100.0);

        // 4. ER Cases
        List<EmergencyCase> erCases = emergencyCaseRepository.findAll().stream()
                .filter(ec -> ec.getArrivedAt() != null && 
                              ec.getArrivedAt().isAfter(start) && 
                              ec.getArrivedAt().isBefore(end))
                .collect(Collectors.toList());

        int erCasesCount = erCases.size();

        double erAverageWaitTime = 0.0;
        double totalWaitTime = 0.0;
        int triagedWithTreatmentCount = 0;

        for (EmergencyCase ec : erCases) {
            if (ec.getTreatmentsAdministered() != null && !ec.getTreatmentsAdministered().isEmpty()) {
                Instant firstTreatmentTime = ec.getTreatmentsAdministered().get(0).getTimestamp();
                if (firstTreatmentTime != null && ec.getArrivedAt() != null) {
                    long waitMinutes = Duration.between(ec.getArrivedAt(), firstTreatmentTime).toMinutes();
                    if (waitMinutes >= 0) {
                        totalWaitTime += waitMinutes;
                        triagedWithTreatmentCount++;
                    }
                }
            }
        }
        if (triagedWithTreatmentCount > 0) {
            erAverageWaitTime = totalWaitTime / triagedWithTreatmentCount;
            erAverageWaitTime = Math.round(erAverageWaitTime * 10.0) / 10.0;
        }

        DailyAnalyticsSnapshot snapshot = new DailyAnalyticsSnapshot();
        snapshot.setDate(date);
        snapshot.setActiveAdmissions(activeAdmissions);
        snapshot.setBedOccupancyRates(occupancyRates);
        snapshot.setTotalRevenue(totalRevenue);
        snapshot.setRevenueByDepartment(revenueByDept);
        snapshot.setErCasesCount(erCasesCount);
        snapshot.setErAverageWaitTimeMinutes(erAverageWaitTime);

        return snapshot;
    }

    public DailyAnalyticsSnapshot saveSnapshotForDate(LocalDate date) {
        DailyAnalyticsSnapshot calculated = computeSnapshotForDate(date);
        Optional<DailyAnalyticsSnapshot> existing = snapshotRepository.findByDate(date);
        existing.ifPresent(dailyAnalyticsSnapshot -> calculated.setId(dailyAnalyticsSnapshot.getId()));
        return snapshotRepository.save(calculated);
    }

    public List<DailyAnalyticsSnapshot> getSnapshotsRange(LocalDate start, LocalDate end) {
        return snapshotRepository.findByDateBetween(start, end).stream()
                .sorted(Comparator.comparing(DailyAnalyticsSnapshot::getDate))
                .collect(Collectors.toList());
    }

    public Map<String, Object> getLiveOperationalSummary() {
        List<Admission> admissions = admissionRepository.findByStatus("ADMITTED");
        admissions.addAll(admissionRepository.findByStatus("TRANSFERRED"));
        int activeAdmissions = admissions.size();

        List<Bed> beds = bedRepository.findAll();
        long totalBeds = beds.size();
        long occupiedBeds = beds.stream().filter(Bed::isOccupied).count();

        List<EmergencyCase> activeERCases = emergencyCaseRepository.findAll().stream()
                .filter(ec -> !"STABILIZED".equals(ec.getStatus()) && !"TRANSFERRED".equals(ec.getStatus()))
                .collect(Collectors.toList());
        int erCount = activeERCases.size();

        LocalDate today = LocalDate.now();
        Instant start = today.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant end = today.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        double todayRevenue = billingInvoiceRepository.findAll().stream()
                .filter(inv -> inv.getInvoiceDate() != null && 
                               inv.getInvoiceDate().isAfter(start) && 
                               inv.getInvoiceDate().isBefore(end))
                .mapToDouble(BillingInvoice::getGrandTotal)
                .sum();
        todayRevenue = Math.round(todayRevenue * 100.0) / 100.0;

        Map<String, Object> summary = new HashMap<>();
        summary.put("activeAdmissions", activeAdmissions);
        summary.put("occupiedBeds", occupiedBeds);
        summary.put("totalBeds", totalBeds);
        summary.put("activeERCases", erCount);
        summary.put("todayRevenue", todayRevenue);

        return summary;
    }

    public void seedDemoData() {
        LocalDate today = LocalDate.now();
        Random rand = new Random();

        // Check if data is already seeded to prevent bloat, but we overwrite for demo
        for (int i = 30; i >= 1; i--) {
            LocalDate date = today.minusDays(i);

            DailyAnalyticsSnapshot snapshot = new DailyAnalyticsSnapshot();
            snapshot.setDate(date);

            // Generate realistic stats with weekly cycle (Mondays busier)
            int dayOfWeekMultiplier = date.getDayOfWeek() == DayOfWeek.MONDAY ? 2 : 1;
            int admissions = 5 + rand.nextInt(15) * dayOfWeekMultiplier;
            snapshot.setActiveAdmissions(admissions);

            Map<String, Double> bedRates = new HashMap<>();
            bedRates.put("General Ward", Math.round((0.4 + rand.nextDouble() * 0.4) * 100.0) / 100.0);
            bedRates.put("ICU-South", Math.round((0.5 + rand.nextDouble() * 0.45) * 100.0) / 100.0);
            bedRates.put("Pediatric Ward", Math.round((0.2 + rand.nextDouble() * 0.5) * 100.0) / 100.0);
            snapshot.setBedOccupancyRates(bedRates);

            double consRev = 1000 + rand.nextInt(3000) * dayOfWeekMultiplier;
            double admRev = 2000 + rand.nextInt(8000) * (bedRates.get("ICU-South") > 0.8 ? 1.5 : 1.0);
            double labRev = 500 + rand.nextInt(2000);
            double total = consRev + admRev + labRev;

            snapshot.setTotalRevenue(Math.round(total * 100.0) / 100.0);

            Map<String, Double> deptRev = new HashMap<>();
            deptRev.put("CONSULTATION", Math.round(consRev * 100.0) / 100.0);
            deptRev.put("ADMISSION", Math.round(admRev * 100.0) / 100.0);
            deptRev.put("LAB_TEST", Math.round(labRev * 100.0) / 100.0);
            snapshot.setRevenueByDepartment(deptRev);

            int erCases = 3 + rand.nextInt(12) * dayOfWeekMultiplier;
            snapshot.setErCasesCount(erCases);

            double avgWait = 10 + rand.nextDouble() * 45;
            snapshot.setErAverageWaitTimeMinutes(Math.round(avgWait * 10.0) / 10.0);

            snapshotRepository.save(snapshot);
        }
    }
}
