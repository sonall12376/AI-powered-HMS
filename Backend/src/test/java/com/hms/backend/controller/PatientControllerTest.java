package com.hms.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hms.backend.model.Patient;
import com.hms.backend.repository.PatientRepository;
import com.hms.backend.security.JwtAuthenticationFilter;
import com.hms.backend.security.SecurityConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Collections;
import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    controllers = PatientController.class,
    excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        UserDetailsServiceAutoConfiguration.class
    },
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.ASSIGNABLE_TYPE,
        classes = { SecurityConfig.class, JwtAuthenticationFilter.class }
    )
)
@AutoConfigureMockMvc
public class PatientControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PatientRepository patientRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private Patient samplePatient;

    @BeforeEach
    void setUp() {
        Patient.PersonalInfo personal = new Patient.PersonalInfo("John", "Doe", LocalDate.of(1990, 5, 14), "Male", "O+");
        Patient.ContactInfo contact = new Patient.ContactInfo("john.doe@example.com", "555-0199", "123 Health Ave");
        
        samplePatient = new Patient(
                "1",
                "PAT-201",
                personal,
                contact,
                null,
                null,
                null,
                null,
                null,
                true
        );

        Authentication authentication = mock(Authentication.class);
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN")))
                .when(authentication).getAuthorities();
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void testGetPatientById_Success() throws Exception {
        when(patientRepository.findByIdAndActiveTrue("1"))
                .thenReturn(Optional.of(samplePatient));

        mockMvc.perform(get("/api/v1/patients/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patientId").value("PAT-201"))
                .andExpect(jsonPath("$.personalInfo.firstName").value("John"))
                .andExpect(jsonPath("$.contactInfo.email").value("john.doe@example.com"));

        verify(patientRepository, times(1)).findByIdAndActiveTrue("1");
    }

    @Test
    void testGetPatientById_NotFound() throws Exception {
        when(patientRepository.findByIdAndActiveTrue("2"))
                .thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/patients/2")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Resource Not Found"));

        verify(patientRepository, times(1)).findByIdAndActiveTrue("2");
    }

    @Test
    void testCreatePatient_Success() throws Exception {
        when(patientRepository.existsByPatientId(anyString())).thenReturn(false);
        when(patientRepository.save(any(Patient.class))).thenReturn(samplePatient);

        mockMvc.perform(post("/api/v1/patients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(samplePatient)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.patientId").value("PAT-201"));

        verify(patientRepository, times(1)).save(any(Patient.class));
    }
}
