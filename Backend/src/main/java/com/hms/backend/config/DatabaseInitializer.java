package com.hms.backend.config;

import com.hms.backend.model.*;
import com.hms.backend.repository.DoctorScheduleRepository;
import com.hms.backend.repository.PatientRepository;
import com.hms.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
public class DatabaseInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseInitializer.class);

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorScheduleRepository doctorScheduleRepository;
    private final PasswordEncoder passwordEncoder;

    public DatabaseInitializer(UserRepository userRepository,
                               PatientRepository patientRepository,
                               DoctorScheduleRepository doctorScheduleRepository,
                               PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.doctorScheduleRepository = doctorScheduleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        log.info("Checking database state for seeding...");

        // 1. Seed Users
        if (userRepository.count() == 0) {
            log.info("Seeding default users...");

            User admin = new User(
                    null,
                    "admin",
                    passwordEncoder.encode("admin123"),
                    "admin@hms.com",
                    User.Role.ADMIN,
                    null
            );

            User doctor = new User(
                    null,
                    "doctor",
                    passwordEncoder.encode("doc123"),
                    "doctor@hms.com",
                    User.Role.DOCTOR,
                    "DOC-101"
            );

            User patient = new User(
                    null,
                    "patient",
                    passwordEncoder.encode("pat123"),
                    "patient@hms.com",
                    User.Role.PATIENT,
                    "PAT-201"
            );

            userRepository.saveAll(Arrays.asList(admin, doctor, patient));
            log.info("Seeded admin/admin123, doctor/doc123, patient/pat123");
        }

        // 2. Seed a Default Patient
        if (patientRepository.count() == 0) {
            log.info("Seeding default patient record...");
            
            Patient.PersonalInfo personal = new Patient.PersonalInfo("John", "Doe", LocalDate.of(1990, 5, 14), "Male", "O+");
            Patient.ContactInfo contact = new Patient.ContactInfo("patient@hms.com", "555-0199", "123 Health Ave, Suite 4B, Metro City");
            List<Patient.EmergencyContact> emergencies = Arrays.asList(new Patient.EmergencyContact("Jane Doe", "Spouse", "555-0123"));
            Patient.InsuranceDetails insurance = new Patient.InsuranceDetails("WellCare Health", "WC-9827361", LocalDate.now().plusYears(2));
            Patient.AiHealthProfile riskProfile = new Patient.AiHealthProfile(22, "LOW");

            Patient pat = new Patient(
                    null,
                    "PAT-201",
                    personal,
                    contact,
                    emergencies,
                    insurance,
                    "DOC-101",
                    riskProfile,
                    null,
                    true
            );

            patientRepository.save(pat);
            log.info("Seeded Patient PAT-201");
        }

        // 3. Seed Doctor Schedules
        if (doctorScheduleRepository.count() == 0) {
            log.info("Seeding doctor availability schedules...");
            String doctorId = "DOC-101";

            LocalDate today = LocalDate.now();
            LocalDate tomorrow = today.plusDays(1);
            
            int currentDay = today.getDayOfWeek().getValue();
            int daysToNextMonday = (8 - currentDay) % 7;
            if (daysToNextMonday == 0) daysToNextMonday = 7;
            LocalDate nextMonday = today.plusDays(daysToNextMonday);

            for (LocalDate date : Arrays.asList(today, tomorrow, nextMonday)) {
                List<DoctorSchedule.TimeSlot> slots = new ArrayList<>();
                slots.add(new DoctorSchedule.TimeSlot("09:00", false, null));
                slots.add(new DoctorSchedule.TimeSlot("10:00", false, null));
                slots.add(new DoctorSchedule.TimeSlot("11:00", false, null));
                slots.add(new DoctorSchedule.TimeSlot("12:00", false, null));
                slots.add(new DoctorSchedule.TimeSlot("14:00", false, null));
                slots.add(new DoctorSchedule.TimeSlot("15:00", false, null));
                slots.add(new DoctorSchedule.TimeSlot("16:00", false, null));
                slots.add(new DoctorSchedule.TimeSlot("17:00", false, null));

                DoctorSchedule schedule = new DoctorSchedule(null, doctorId, date, slots, null);
                doctorScheduleRepository.save(schedule);
                log.info("Opened doctor schedule slots for DOC-101 on {}", date);
            }
        }
    }
}
