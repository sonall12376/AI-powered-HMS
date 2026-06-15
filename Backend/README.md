# AI-Powered HMS - Backend REST Services

This folder contains the **Spring Boot 3.x** backend service for the AI-Powered Hospital Management System (HMS), focusing on **Patient & Doctor Operations**.

---

## 🚀 Key Features

1. **Patient Operations (CRUD)**: Demographics, medical profiles, soft delete workflows, and automatic AI health risk score assignment.
2. **Atomic Appointment Scheduling**: Safe, race-condition-free booking verified via optimistic locking (`@Version` checking) on the `DoctorSchedule` collection.
3. **Clinical Encounters**: Vitals tracking, multi-line symptom logging, primary/secondary ICD diagnosis codes, and medication prescription arrays.
4. **AI Services Integration**:
   - **Symptom Analyzer**: Parses raw patient symptoms to output matching conditions, severity levels, and department recommendations.
   - **Appointment Assistant**: Parses scheduling requests written in natural language into structured date/time intervals.
5. **Stateless Security**: Custom JWT filters verifying authentication signatures and evaluating ownership validations for patient resource operations.

---

## 🛠️ Technology Stack

- **Framework**: Spring Boot 3.4.2 (Spring Web, Spring Security, Validation)
- **Database**: MongoDB (Spring Data MongoDB)
- **Security**: Nimbus-JOSE-JWT for HS256 stateless token encoding
- **JDK Version Compatibility**: Java 21 / Java 25 (includes `-Dnet.bytebuddy.experimental=true` configuration for Mockito compatibility on JDK 25)

---

## 📂 Packages Structure

- `com.hms.backend.config`: Database seeding and Mongo configuration.
- `com.hms.backend.controller`: REST API Controllers (Patient, Appointment, Consultation, Auth).
- `com.hms.backend.exception`: Custom exceptions mapping to RFC 7807 problem details.
- `com.hms.backend.model`: MongoDB document schema entities.
- `com.hms.backend.repository`: Spring Data MongoDB query layers.
- `com.hms.backend.security`: Filters, token validators, and security chains.
- `com.hms.backend.service`: Clinical processing logic and AI prompt executors.

---

## 🔌 Core API Endpoints

### Authentication & Public
- `POST /api/v1/auth/login` - Authenticate users and yield JWT access tokens.
- `GET /api/v1/public/health` - Simple API ping endpoint.

### Patient Operations
- `POST /api/v1/patients` - Create patient profile (Admin/Patient).
- `GET /api/v1/patients` - Query active patients list with paging & search (Admin/Doctor).
- `GET /api/v1/patients/{id}` - Fetch individual patient details (Admin/Doctor/Profile Owner).
- `PUT /api/v1/patients/{id}` - Update demographics or metrics (Admin/Doctor/Profile Owner).
- `DELETE /api/v1/patients/{id}` - Soft delete profile by setting `active=false` (Admin).

### Scheduling & Bookings
- `POST /api/v1/appointments` - Reserve doctor schedule slot atomically.
- `GET /api/v1/appointments` - List active schedule bookings.
- `PUT /api/v1/appointments/{id}/status` - Update booking status (PENDING, CONFIRMED, COMPLETED, CANCELLED).
- `POST /api/v1/appointments/ai-assist` - Parse natural speech scheduling requests.

### Consultations & Prescriptions
- `POST /api/v1/consultations` - Submit clinical notes, vitals, ICD diagnostics, and fetch AI conditions analysis (Doctor).
- `POST /api/v1/prescriptions` - Log medication dosage arrays bound to a consultation ID (Doctor).
- `GET /api/v1/consultations/patient/{patientId}` - Fetch historical records (Doctor/Patient Owner).

---

## 🏃 Setup & Running Locally

### Prerequisites
- Install **JDK 21** or **JDK 25**
- Run local **MongoDB** server at `mongodb://localhost:27017`

### Execution
1. Clone the project and navigate to `/Backend`.
2. Launch the backend server:
   ```bash
   mvn spring-boot:run
   ```

### Running Tests
Execute the JUnit unit and integration test suite:
```bash
mvn test "-Dnet.bytebuddy.experimental=true"
```
