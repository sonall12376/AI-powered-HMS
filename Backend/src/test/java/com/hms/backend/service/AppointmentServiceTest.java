package com.hms.backend.service;

import com.hms.backend.exception.ScheduleConflictException;
import com.hms.backend.model.Appointment;
import com.hms.backend.model.DoctorSchedule;
import com.hms.backend.repository.AppointmentRepository;
import com.hms.backend.repository.DoctorScheduleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.OptimisticLockingFailureException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AppointmentServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private DoctorScheduleRepository doctorScheduleRepository;

    @Mock
    private AiService aiService;

    @InjectMocks
    private AppointmentService appointmentService;

    private Appointment appointment;
    private DoctorSchedule schedule;

    @BeforeEach
    void setUp() {
        appointment = new Appointment(
                null,
                null,
                "PAT-201",
                "DOC-101",
                LocalDate.now().plusDays(2),
                "10:00",
                Appointment.Status.PENDING,
                "Routine Cardiologist follow up",
                null,
                null
        );

        List<DoctorSchedule.TimeSlot> slots = new ArrayList<>();
        slots.add(new DoctorSchedule.TimeSlot("10:00", false, null));
        slots.add(new DoctorSchedule.TimeSlot("11:00", false, null));

        schedule = new DoctorSchedule(
                null,
                "DOC-101",
                LocalDate.now().plusDays(2),
                slots,
                1L
        );
    }

    @Test
    void testBookAppointment_Success() {
        when(doctorScheduleRepository.findByDoctorIdAndAvailableDate(any(), any()))
                .thenReturn(Optional.of(schedule));
        when(aiService.predictNoShow(any(), any(), any()))
                .thenReturn(new Appointment.AiNoShowDetails(0.08, "LOW"));
        when(appointmentRepository.save(any(Appointment.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(doctorScheduleRepository.save(any(DoctorSchedule.class)))
                .thenReturn(schedule);

        Appointment result = appointmentService.bookAppointment(appointment);

        assertNotNull(result);
        assertEquals(Appointment.Status.CONFIRMED, result.getStatus());
        assertEquals("LOW", result.getAiNoShowDetails().getRiskFactor());
        assertTrue(schedule.getTimeSlots().get(0).isBooked());
        verify(doctorScheduleRepository, times(1)).save(any(DoctorSchedule.class));
        verify(appointmentRepository, times(1)).save(any(Appointment.class));
    }

    @Test
    void testBookAppointment_AlreadyBooked() {
        schedule.getTimeSlots().get(0).setBooked(true);

        when(doctorScheduleRepository.findByDoctorIdAndAvailableDate(any(), any()))
                .thenReturn(Optional.of(schedule));

        assertThrows(ScheduleConflictException.class, () -> {
            appointmentService.bookAppointment(appointment);
        });

        verify(doctorScheduleRepository, never()).save(any(DoctorSchedule.class));
        verify(appointmentRepository, never()).save(any(Appointment.class));
    }

    @Test
    void testBookAppointment_OptimisticLockingFailure() {
        when(doctorScheduleRepository.findByDoctorIdAndAvailableDate(any(), any()))
                .thenReturn(Optional.of(schedule));
        
        when(doctorScheduleRepository.save(any(DoctorSchedule.class)))
                .thenThrow(new OptimisticLockingFailureException("Concurrent write conflict"));

        ScheduleConflictException ex = assertThrows(ScheduleConflictException.class, () -> {
            appointmentService.bookAppointment(appointment);
        });

        assertTrue(ex.getMessage().contains("selected time slot was booked by another user"));
        verify(appointmentRepository, never()).save(any(Appointment.class));
    }
}
