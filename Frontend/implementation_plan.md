# Implementation Plan - AI-Powered HMS (Member 2 Scope)

This document provides a comprehensive technical implementation plan for the **Patient & Doctor Operations (Member 2)** subsystem of the AI-Powered Hospital Management System (HMS). It covers backend service architecture, MongoDB data modeling, security configuration, REST API endpoints, Next.js frontend portal design, and AI service integration.

---

## 1. Project Overview & Scope Alignment

The Member 2 Scope focuses entirely on the operations related to Patients, Doctors, Appointments, Consultations, Prescriptions, and AI integrations. It integrates with standard stateless JWT authentication and enforces role-based and attribute-based access control (RBAC/ABAC).

### Key Subsystems to Deliver:
1. **Patient Management:** CRUD operations, medical history tracking, soft deletes.
2. **Appointments & Scheduling:** Atomically validated booking (optimistic locking), schedule lists, status transitions.
3. **Clinical Consultations & Orders:** Closing appointments, generating diagnoses and prescriptions.
4. **AI Services:** Symptom Analyzer and Natural Language Appointment Assistant using Gemini API.

---

## 2. User Review Required

> [!IMPORTANT]
> **Optimistic Locking on DoctorSchedules:** To prevent booking race conditions (multiple patients booking the same slot), we will use Spring Data's `@Version` on the `DoctorSchedules` document. Any concurrent updates will throw an `OptimisticLockingFailureException`, which we translate to a `409 Conflict` (ScheduleConflictException).
>
> **AI API Keys Configuration:** The backend will connect to the Gemini API (`gemini-1.5-flash`) using Spring's `WebClient`. In the absence of an API key in the environment, the system will fall back to a deterministic, high-quality local mockup generator to avoid application failure during local testing and development.
>
> **Stateless Security Setup:** The JWT verification is configured to intercept `/api/v1/` requests via a custom `JwtAuthenticationFilter`. We assume the token signature uses a shared HS256 secret.

---

## 3. Open Questions

No outstanding blocking questions remain. We will proceed with the detailed MongoDB collection design and endpoint mapping below.

---

## 4. Proposed Changes

We will implement the backend inside a new `backend/` folder and build the frontend directly within the existing Next.js project.

### Component 1: Database Architecture (MongoDB)

#### [NEW] `backend/src/main/java/com/hms/backend/model/Patient.java`
Represents patient demography and medical history. Soft deleted via `active = false`.
* **Fields:** `id`, `patientId`, `personalInfo` (firstName, lastName, dateOfBirth, gender, bloodGroup), `contactInfo` (email, phone, address), `emergencyContacts` (name, relationship, phone), `insuranceDetails`, `primaryDoctorId`, `aiHealthProfile` (riskScore, riskCategory), `active`, `createdAt`, `updatedAt`.
* **Indexes:** `{ email: 1 }` (Unique), `{ phone: 1 }`, `{ patientId: 1 }` (Unique).

#### [NEW] `backend/src/main/java/com/hms/backend/model/Appointment.java`
Represents an appointment booking.
* **Fields:** `id`, `appointmentId`, `patientId`, `doctorId`, `appointmentDate` (LocalDate), `appointmentTime` (String), `status` (PENDING, CONFIRMED, COMPLETED, CANCELLED), `reasonForVisit`, `cancellationReason`, `aiNoShowDetails` (noShowProbability, riskFactor), `createdAt`, `updatedAt`.
* **Indexes:** `{ patientId: 1 }`, `{ doctorId: 1, appointmentDate: 1 }` (Compound), `{ appointmentId: 1 }` (Unique).

#### [NEW] `backend/src/main/java/com/hms/backend/model/DoctorSchedule.java`
Manages doctor availability slots per day with optimistic locking.
* **Fields:** `id`, `doctorId`, `availableDate` (LocalDate), `timeSlots` (List of slot objects: { time: String, booked: Boolean, appointmentId: ObjectId }), `version` (Long, annotated with `@Version` for race-condition prevention).
* **Indexes:** `{ doctorId: 1, availableDate: 1 }` (Unique Compound).

#### [NEW] `backend/src/main/java/com/hms/backend/model/Consultation.java`
Represents clinical encounter notes, diagnoses, and AI clinical summaries.
* **Fields:** `id`, `consultationId`, `appointmentId`, `patientId`, `doctorId`, `vitals` (bloodPressure, heartRate, temperature, spo2, weight, height), `symptoms` (List of Strings), `clinicalNotes`, `diagnoses` (List of { icdCode, description, type: PRIMARY/SECONDARY }), `aiClinicalInsights` (possibleConditions, severityLevel, suggestedDepartment, recommendation), `createdAt`.
* **Indexes:** `{ appointmentId: 1 }` (Unique), `{ patientId: 1 }`, `{ doctorId: 1 }`.

#### [NEW] `backend/src/main/java/com/hms/backend/model/Prescription.java`
Binds dosage arrays directly to a consultation.
* **Fields:** `id`, `prescriptionId`, `consultationId`, `medications` (List of { medicineName, dosage, frequency, duration, instructions }), `createdAt`.
* **Indexes:** `{ consultationId: 1 }` (Unique).

#### [NEW] `backend/src/main/java/com/hms/backend/model/User.java`
Simple User credential document to interface with the standard security filters.
* **Fields:** `id`, `username`, `passwordHash`, `email`, `role` (ADMIN, DOCTOR, PATIENT), `linkedEntityId` (Patient ID or Doctor ID).

---

### Component 2: Backend REST Service (Spring Boot 3.x)

We will setup a standard Spring Boot 3.x project with Maven inside `backend/`.

#### [NEW] `backend/pom.xml`
Defines dependencies: Lombok, Spring Web, Spring Data MongoDB, Spring Security 6.x, Validator, Nimbus-JWT.

#### [NEW] `backend/src/main/resources/application-dev.yml`
Development profiles configuring MongoDB connection, JWT Secret, and Gemini API keys.

#### [NEW] `backend/src/main/java/com/hms/backend/security/JwtAuthenticationFilter.java`
Extracts and validates stateless JWT access tokens from the `Authorization: Bearer <token>` header, setting up the Security Context.

#### [NEW] `backend/src/main/java/com/hms/backend/security/SecurityConfig.java`
Configures a stateless `SecurityFilterChain` permitting login/auth pre-flight checks, protecting all `/api/v1/` contexts, and enabling method-level security via `@EnableMethodSecurity`.

#### [NEW] `backend/src/main/java/com/hms/backend/controller/PatientController.java`
Endpoints:
- `POST /api/v1/patients` (Admin/Patient)
- `GET /api/v1/patients` (Admin/Doctor, paginated search)
- `GET /api/v1/patients/{id}` (Admin/Doctor/Owner-Patient)
- `PUT /api/v1/patients/{id}` (Admin/Nurse/Owner-Patient)
- `DELETE /api/v1/patients/{id}` (Admin, soft delete)

#### [NEW] `backend/src/main/java/com/hms/backend/controller/AppointmentController.java`
Endpoints:
- `POST /api/v1/appointments` (Admin/Patient, validates doctor schedule atomically)
- `GET /api/v1/appointments` (Role-filtered active schedules list)
- `PUT /api/v1/appointments/{id}/status` (Transitions appointment status)

#### [NEW] `backend/src/main/java/com/hms/backend/controller/ConsultationController.java`
Endpoints:
- `POST /api/v1/consultations` (Doctor, closes appointment and logs diagnoses)
- `POST /api/v1/prescriptions` (Doctor, saves dosage arrays bound to consultationId)
- `GET /api/v1/consultations/patient/{patientId}` (Doctor/Owner-Patient, fetches historical records)

#### [NEW] `backend/src/main/java/com/hms/backend/service/AiService.java`
Interfaces with Gemini API using WebClient or a deterministic fallback mock system:
1. **Symptom Analyzer:** Takes symptom list and returns Structured Output containing conditions, severity, and recommendations.
2. **Appointment Assistant:** Parses free-text appointment request into structured date, time, and department specialization fields.

#### [NEW] `backend/src/main/java/com/hms/backend/exception/GlobalExceptionHandler.java`
Central `@ControllerAdvice` mapping custom exceptions to RFC 7807 error envelopes:
- `ResourceNotFoundException` -> `404 Not Found`
- `ScheduleConflictException` -> `409 Conflict`
- `AiProcessingException` -> `422 Unprocessable Entity`
- `MethodArgumentNotValidException` -> `400 Bad Request` (with field validation errors)

---

### Component 3: Frontend Client (Next.js 16 + React 19)

We will modify the existing Next.js application to provide a premium web interface with glassmorphism dashboards.

#### [MODIFY] `src/app/page.tsx`
Renders a landing/portal entry screen allowing users to log in as a Patient, Doctor, or Admin (using mock accounts or connecting to backend).

#### [NEW] `src/app/dashboard/patient/page.tsx`
Patient Portal:
- Profile & Medical History section.
- Appointment Booking Panel (with Natural Language AI input assistant).
- Historical Consultations & Prescriptions list.

#### [NEW] `src/app/dashboard/doctor/page.tsx`
Doctor Portal:
- Schedule Manager: View and open daily slots.
- Active Appointments table.
- Patient File View: Details, history, and AI risk profile.
- Encounter Modal: Log vitals, run AI Symptom Analyzer, prescribe medications, and close the session.

#### [NEW] `src/components/hms/Table.tsx`
Reusable dynamic table component with built-in sorting, filtering, and pagination.

#### [NEW] `src/components/hms/GlassCard.tsx`
A premium glassmorphic UI card with modern gradients, micro-animations, and subtle borders.

---

## 5. Verification Plan

### Automated Tests
1. **Spring Boot MockMvc Tests:** Verify input validations (`@Valid`) and security authorization headers (`JwtAuthenticationFilter`).
2. **Service Tests:** Mock repository calls and verify transaction rollbacks and schedule race-condition optimistic locking.
3. **Frontend Component Tests:** Run Next.js builds (`npm run build`) to ensure TypeScript type safety.

### Manual Verification
1. **Concurrent Booking Simulation:** Trigger two parallel requests booking the same time slot for a doctor, ensuring only one succeeds (201 Created) while the other fails with a `409 Conflict`.
2. **End-to-End Walkthrough:** Log in, parse a sentence like *"Book cardiologist checkup next Monday at 10 AM"* via the AI Assistant, submit booking, log in as Doctor, write clinical encounter with AI symptom analysis, prescribe drugs, and close the consultation.
