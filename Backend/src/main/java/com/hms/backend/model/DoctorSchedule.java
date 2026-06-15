package com.hms.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.util.List;

@Document(collection = "doctor_schedules")
@CompoundIndex(def = "{'doctorId': 1, 'availableDate': 1}", unique = true)
public class DoctorSchedule {
    @Id
    private String id;

    private String doctorId;
    private LocalDate availableDate;

    private List<TimeSlot> timeSlots;

    @Version
    private Long version;

    public DoctorSchedule() {}

    public DoctorSchedule(String id, String doctorId, LocalDate availableDate, List<TimeSlot> timeSlots, Long version) {
        this.id = id;
        this.doctorId = doctorId;
        this.availableDate = availableDate;
        this.timeSlots = timeSlots;
        this.version = version;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public LocalDate getAvailableDate() { return availableDate; }
    public void setAvailableDate(LocalDate availableDate) { this.availableDate = availableDate; }

    public List<TimeSlot> getTimeSlots() { return timeSlots; }
    public void setTimeSlots(List<TimeSlot> timeSlots) { this.timeSlots = timeSlots; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }

    public static class TimeSlot {
        private String time;
        private boolean booked = false;
        private String appointmentId;

        public TimeSlot() {}
        public TimeSlot(String time, boolean booked, String appointmentId) {
            this.time = time;
            this.booked = booked;
            this.appointmentId = appointmentId;
        }

        public String getTime() { return time; }
        public void setTime(String time) { this.time = time; }

        public boolean isBooked() { return booked; }
        public void setBooked(boolean booked) { this.booked = booked; }

        public String getAppointmentId() { return appointmentId; }
        public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }
    }
}
