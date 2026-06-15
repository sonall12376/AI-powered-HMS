# AI-Powered HMS - Database Architecture

This directory outlines the MongoDB database design, collection structures, indexing logic, and default data seeds used in the Hospital Management System (HMS).

---

## 💾 MongoDB Collection Schemas

The application database is structured across the following collections:

### 1. `users`
Defines credentials and role mapping for accessing portal gateways.
- **Fields**: `id`, `username`, `passwordHash`, `email`, `role` (`ADMIN`, `DOCTOR`, `PATIENT`), `linkedEntityId`.

### 2. `patients`
Demographics and clinical constraints mapping patient profiles.
- **Fields**: `id`, `patientId`, `personalInfo` (firstName, lastName, dateOfBirth, gender, bloodGroup), `contactInfo` (email, phone, address), `emergencyContacts` (name, relationship, phone), `insuranceDetails`, `primaryDoctorId`, `aiHealthProfile` (riskScore, riskCategory), `active` (soft-delete flag), `createdAt`, `updatedAt`.
- **Indexes**: Unique index on `email`, unique index on `patientId`.

### 3. `appointments`
Details individual booking registrations and AI risk parameters.
- **Fields**: `id`, `appointmentId`, `patientId`, `doctorId`, `appointmentDate` (LocalDate), `appointmentTime` (String), `status` (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`), `reasonForVisit`, `cancellationReason`, `aiNoShowDetails` (noShowProbability, riskFactor), `createdAt`, `updatedAt`.
- **Indexes**: Compound index on `{ doctorId: 1, appointmentDate: 1 }`, unique index on `appointmentId`.

### 4. `doctor_schedules`
Manages day-by-day availability slots with locking records.
- **Fields**: `id`, `doctorId`, `availableDate` (LocalDate), `timeSlots` (List of slots: `{ time: String, booked: Boolean, appointmentId: String }`), `version` (Annotated with `@Version` for optimistic lock version checks).
- **Indexes**: Unique compound index on `{ doctorId: 1, availableDate: 1 }` preventing conflicting schedules.

### 5. `consultations`
Encounter record capturing diagnostic evaluations.
- **Fields**: `id`, `consultationId`, `appointmentId`, `patientId`, `doctorId`, `vitals` (bloodPressure, heartRate, temperature, spo2, weight, height), `symptoms` (List of Strings), `clinicalNotes`, `diagnoses` (List: `{ icdCode, description, type: PRIMARY/SECONDARY }`), `aiClinicalInsights` (possibleConditions, severityLevel, suggestedDepartment, recommendation), `createdAt`.
- **Indexes**: Unique index on `appointmentId`.

### 6. `prescriptions`
Dosage instructions linked to a clinical encounter.
- **Fields**: `id`, `prescriptionId`, `consultationId`, `medications` (List: `{ medicineName, dosage, frequency, duration, instructions }`), `createdAt`.
- **Indexes**: Unique index on `consultationId`.

---

## 🔐 Concurrency & Race-Condition Locking

To prevent double-booking conflicts (where two patients try to book the exact same slot at the same time), the `DoctorSchedule` utilizes **Optimistic Locking**:
1. Every write check pulls the document version number.
2. Saving changes increments the version.
3. If another query saves a booking first, the mismatch throws an `OptimisticLockingFailureException`.
4. The system catches this conflict and returns an RFC 7807 `409 Conflict` (ScheduleConflictException) response to the second patient, asking them to choose a different slot.

---

## 👥 Seed User Accounts

Upon starting the backend, `DatabaseInitializer` automatically validates and inserts the following mock accounts if empty:

| Username | Password | Role | Linked Entity ID |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | `ADMIN` | - |
| `doctor` | `doc123` | `DOCTOR` | `DOC-101` |
| `patient` | `pat123` | `PATIENT` | `PAT-201` |
