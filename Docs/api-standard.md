# AI-Powered Hospital & Healthcare Management System (HMS)
## Backend REST API Standards & Specifications

This document defines the REST API standards, naming conventions, versioning, error structures, security flows, and endpoint specifications for the AI-Powered Hospital & Healthcare Management System.

---

## 1. Global REST API Standards

### A. API Naming Conventions
*   **Path Cases**: All paths must use lowercase nouns with hyphen-case (kebab-case) for multi-word paths.
*   **Pluralization**: Keep resource endpoints plural (e.g., `/api/v1/patients`, `/api/v1/lab-tests`).
*   **Query Parameters**: Use camelCase for query parameters (e.g., `/api/v1/patients?page=0&size=10&sortBy=lastName`).
*   **Path Variables**: Use camelCase for path variables (e.g., `/api/v1/patients/{patientId}/insurance-details`).
*   **Verbs in Paths**: REST endpoints represent resources. Do not use verbs in paths unless executing a non-CRUD action. Append these actions to the end of the resource path (e.g., `/api/v1/appointments/{id}/cancel`, `/api/v1/emergency-cases/{id}/triage`).

### B. Versioning Strategy
*   **URL Path Versioning**: To prevent caching issues and simplify routing at the API Gateway layer, all API endpoints must contain the version suffix:
    `https://api.hospital-system.com/api/v1/...`
*   **Version Migrations**: Backward-incompatible modifications require upgrading the segment to `v2` while maintaining `v1` for a deprecation grace period.

### C. Request Payload Format
*   **Content-Type**: Requests with bodies must use `application/json; charset=utf-8`.
*   **Body Field Naming**: CamelCase (`firstName`, `dateOfBirth`).
*   **Multipart Uploads**: Multipart requests (`multipart/form-data`) are reserved for laboratory attachments (PDF scans, DICOM images).

### D. HTTP Status Code Usage
The API gateway and microservices must adhere strictly to standard HTTP status codes:

| Code | Status Name | Usage Scenario |
| :--- | :--- | :--- |
| **200** | `OK` | Successful GET, PUT, or PATCH requests. |
| **201** | `Created` | Successful POST request resulting in resource creation. |
| **204** | `No Content` | Successful DELETE or empty response action. |
| **400** | `Bad Request` | Malformed JSON payload or generic client-side syntax error. |
| **401** | `Unauthorized` | Missing, expired, or invalid JWT access token. |
| **403** | `Forbidden` | Token is valid, but roles/permissions (RBAC/ABAC) restrict access. |
| **404** | `Not Found` | Resource ID does not exist in the database. |
| **409** | `Conflict` | Business constraint violation (e.g., booking collision, duplicate email). |
| **422** | `Unprocessable Entity` | Request is syntactically sound but violates business rules (e.g., drug interaction check failed). |
| **500** | `Internal Error` | Uncaught server exceptions, DB failure, or runtime crash. |

---

## 2. Standard Request & Response Envelopes

To establish consistent consumer integrations, every API response must follow a standard structural layout.

### A. Success Envelope (Standard Data)
```json
{
  "success": true,
  "timestamp": "2026-06-12T18:03:00Z",
  "message": "Operation completed successfully.",
  "data": {
    "id": "60b8d29a1f28b4382c8f8e04",
    "patientId": "PAT-2026-1024",
    "firstName": "Robert",
    "lastName": "Chen"
  }
}
```

### B. Success Envelope (Paginated Data)
All collection listing endpoints must include pagination headers or envelopes to limit server load:
```json
{
  "success": true,
  "timestamp": "2026-06-12T18:03:00Z",
  "data": [
    { "id": "60b8d29a1f28b4382c8f8e04", "patientId": "PAT-2026-1024" }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10,
    "totalElements": 142,
    "totalPages": 15,
    "last": false
  }
}
```

### C. Error Envelope
If a request fails, the API must return a structured error response details envelope (based on RFC 7807):
```json
{
  "success": false,
  "timestamp": "2026-06-12T18:03:00Z",
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "One or more request parameters failed validation validations.",
    "details": [
      {
        "field": "contactInfo.phone",
        "message": "Phone number must match pattern: +[1-9]{1}[0-9]{1,14}"
      }
    ]
  }
}
```

#### Common Error Codes:
*   `VALIDATION_FAILED`: Request parameters failed constraints.
*   `RESOURCE_NOT_FOUND`: Target entity was not found.
*   `INSUFFICIENT_PERMISSIONS`: RBAC/ABAC role block.
*   `CONFLICT_ENCOUNTERED`: Database concurrency or business logic collision.
*   `AI_MODEL_ERROR`: External ML inference engine timeout or formatting failure.

---

## 3. Validation & Exception Handling Patterns

### A. Spring Boot Validation Constraints
Controllers must use `jakarta.validation.constraints` annotations inside Request DTOs:
*   `@NotNull`, `@NotBlank` for mandatory parameters.
*   `@Size(min = x, max = y)` for length constraints.
*   `@Email` for validating email formats.
*   `@Pattern(regexp = "...")` for phone numbers, codes, or state enums.
*   `@Past` / `@Future` for birthdates and appointment slots.

### B. Global Exception Handler Implementation
A Spring `@RestControllerAdvice` class intercepts all exceptions, formats them, and returns the appropriate HTTP status code:

```java
package com.hms.backend.exception;

import com.hms.backend.dto.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<ErrorResponse.ErrorDetail> details = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(err -> new ErrorResponse.ErrorDetail(err.getField(), err.getDefaultMessage()))
            .collect(Collectors.toList());

        ErrorResponse.ErrorInfo errorInfo = new ErrorResponse.ErrorInfo(
            "VALIDATION_FAILED",
            "One or more validation constraints failed.",
            details
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse(false, Instant.now(), errorInfo));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        ErrorResponse.ErrorInfo errorInfo = new ErrorResponse.ErrorInfo(
            "RESOURCE_NOT_FOUND",
            ex.getMessage(),
            null
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(false, Instant.now(), errorInfo));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        ErrorResponse.ErrorInfo errorInfo = new ErrorResponse.ErrorInfo(
            "INTERNAL_SERVER_ERROR",
            "An unexpected error occurred.",
            null
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ErrorResponse(false, Instant.now(), errorInfo));
    }
}
```

---

## 4. Authentication & Authorization Flows

The system uses stateless JSON Web Token (JWT) credentials mapping users to roles.

### A. JWT Authentication Process
```
[Client]                [Auth API]
   |                        |
   |---- 1. Login --------->| (Validates credentials in MongoDB)
   |<--- 2. Tokens ---------| Returns short-lived access JWT in body
   |                        | + long-lived refresh token in HTTP-Only Cookie
   |                        |
[Client]                [Gateway / Services]
   |                        |
   |---- 3. Access App ---->| (Includes Authorization: Bearer <JWT> header)
   |<--- 4. Data -----------| (Validates JWT signature & roles)
```

1.  **Access Token (JWT)**:
    *   **Lifespan**: 15 Minutes.
    *   **Location**: Transmitted in the HTTP `Authorization: Bearer <TOKEN>` header.
    *   **Payload Signature**: Signed using HMAC SHA-256 (or RS256) containing:
        ```json
        {
          "sub": "dr.smith",
          "userId": "60b8d29a1f28b4382c8f8e01",
          "linkedEntityId": "60b8d29a1f28b4382c8f8e02",
          "roles": ["ROLE_DOCTOR"],
          "permissions": ["READ_EMR", "WRITE_PRESCRIPTION"],
          "iss": "hms-auth-service",
          "exp": 1781283600
        }
        ```

### B. Refresh Token Strategy
To prevent security leaks from stored tokens, the system implements a strict cookie rotation strategy:
1.  **Refresh Token Location**: Stored inside a cookie with the flags:
    `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/api/v1/auth/refresh`. This prevents client-side JavaScript from accessing it, mitigating Cross-Site Scripting (XSS) risks.
2.  **Lifespan**: 7 Days.
3.  **Rotation Mechanism**: When calling `/api/v1/auth/refresh`, the auth service invalidates the old refresh token in MongoDB, generates a new refresh token, updates the cookie, and returns a new 15-minute access token in the response body.
4.  **Revocation Control**: The refresh token's unique ID is tracked in MongoDB. Admin staff or logouts instantly mark the token `revoked = true` in the DB, terminating the active session.

### C. Attribute-Based Access Control (ABAC)
While Spring Security checks roles (`@PreAuthorize("hasRole('DOCTOR')")`), endpoints containing patient records must enforce resource ownership (ABAC):
*   A Patient user can only access resource endpoints matching their own `linkedEntityId`:
    `@PreAuthorize("hasRole('ADMIN') or #patientId == principal.linkedEntityId")`
*   A Doctor user can only access EMR files if they are the primary care physician or have an active consultation/admission referral linked to that patient.

---

## 5. Module-by-Module API Endpoint Specifications

---

### Module 1: Authentication & Authorization

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Public | Authenticates credentials and returns tokens (cookie + body). |
| `POST` | `/api/v1/auth/refresh` | Public | Exchanges a valid HttpOnly refresh cookie for new access/refresh tokens. |
| `POST` | `/api/v1/auth/logout` | All Roles | Revokes the current refresh session and clears the auth cookie. |
| `POST` | `/api/v1/auth/mfa/verify` | Public | Validates a TOTP code during a multi-factor login attempt. |

#### Sample payload (POST `/api/v1/auth/login`):
```json
{
  "username": "dr.smith",
  "password": "SecurePassword123!"
}
```
#### Sample response (200 OK):
```json
{
  "success": true,
  "timestamp": "2026-06-12T18:03:00Z",
  "message": "Login successful. MFA required.",
  "data": {
    "mfaRequired": true,
    "tempToken": "tmp-99881122"
  }
}
```

---

### Module 2: Patients (Patient Management)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/patients` | `ADMIN`, `DOCTOR`, `NURSE` | Retrieves a paginated list of patients. Supports search and filters. |
| `GET` | `/api/v1/patients/{id}` | `ADMIN`, `DOCTOR`, `NURSE`, `PATIENT` | Retrieves a patient's demography profile. |
| `POST` | `/api/v1/patients` | `ADMIN`, `NURSE` | Registers a new patient. |
| `PATCH` | `/api/v1/patients/{id}` | `ADMIN`, `NURSE`, `PATIENT` | Performs a partial update (contact, insurance, etc.). |
| `GET` | `/api/v1/patients/{id}/risk-profile`| `DOCTOR` | Fetches the AI-calculated health risk scores. |

#### Sample payload (POST `/api/v1/patients`):
```json
{
  "personalInfo": {
    "firstName": "Robert",
    "lastName": "Chen",
    "dateOfBirth": "1984-11-23",
    "gender": "MALE",
    "bloodGroup": "O_POSITIVE"
  },
  "contactInfo": {
    "email": "robert.chen@email.com",
    "phone": "+15550199",
    "address": {
      "street": "142 Maple Drive",
      "city": "Boston",
      "state": "MA",
      "postalCode": "02115",
      "country": "USA"
    }
  }
}
```

---

### Module 3: Appointments (Appointment Management)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/appointments` | `ADMIN`, `DOCTOR`, `NURSE` | Lists appointments filtered by doctor, date, or status. |
| `POST` | `/api/v1/appointments` | `ADMIN`, `NURSE`, `PATIENT` | Reserves a slot. Runs the AI no-show prediction model automatically. |
| `POST` | `/api/v1/appointments/{id}/cancel` | `ADMIN`, `NURSE`, `PATIENT` | Cancels an active appointment. |
| `GET` | `/api/v1/appointments/slots` | All Roles | Lists available schedule slots for a doctor/department. |

#### Sample response (201 Created - POST `/api/v1/appointments`):
```json
{
  "success": true,
  "timestamp": "2026-06-12T18:03:00Z",
  "message": "Appointment scheduled.",
  "data": {
    "appointmentId": "APP-2026-0099",
    "status": "SCHEDULED",
    "dateTime": "2026-06-15T09:30:00Z",
    "aiNoShowDetails": {
      "noShowProbability": 0.18,
      "riskFactor": "LOW"
    }
  }
}
```

---

### Module 4: Consultations (Doctor Consultation)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/consultations` | `DOCTOR` | Submits a completed clinic encounter (notes, vitals, prescriptions). |
| `GET` | `/api/v1/consultations/patient/{patientId}`| `DOCTOR`, `PATIENT` | Fetches historical consultations for a patient. |
| `POST` | `/api/v1/consultations/check-interactions`| `DOCTOR` | Intercepts drug lists and calls AI to check for drug-to-drug interactions. |

#### Sample payload (POST `/api/v1/consultations/check-interactions`):
```json
{
  "patientId": "60b8d29a1f28b4382c8f8e04",
  "medicationIds": [
    "60b8d29a1f28b4382c8f8e0b",
    "60b8d29a1f28b4382c8f8e0a"
  ]
}
```
#### Sample response (200 OK):
```json
{
  "success": true,
  "timestamp": "2026-06-12T18:03:00Z",
  "message": "Interaction check completed.",
  "data": {
    "safe": false,
    "warnings": [
      {
        "severity": "CRITICAL",
        "description": "Amoxicillin and DrugX combine to cause severe renal clearance reduction."
      }
    ]
  }
}
```

---

### Module 5: EMR (Electronic Medical Records)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/emrs/patient/{patientId}` | `DOCTOR`, `PATIENT` | Returns the centralized EMR patient profile. |
| `PATCH` | `/api/v1/emrs/patient/{patientId}` | `DOCTOR` | Updates allergies, conditions, and surgical history. |
| `GET` | `/api/v1/emrs/patient/{patientId}/summary`| `DOCTOR`, `PATIENT` | Fetches the AI-generated medical summary. |

---

### Module 6: Laboratory (Laboratory Management)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/lab-tests` | `DOCTOR` | Places a new laboratory order. |
| `PUT` | `/api/v1/lab-tests/{id}/results` | `LAB_TECH` | Submits parameter results. Runs AI anomaly check. |
| `POST` | `/api/v1/lab-tests/{id}/attachments`| `LAB_TECH` | Uploads PDF/DICOM files via multipart form. |
| `GET` | `/api/v1/lab-tests/patient/{patientId}`| `DOCTOR`, `LAB_TECH`, `PATIENT`| Lists laboratory tests for a patient. |

---

### Module 7: Pharmacy (Pharmacy Management)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/pharmacy/inventory` | `ADMIN`, `PHARMACIST`| Lists catalog medicines and stock levels. |
| `POST` | `/api/v1/pharmacy/inventory/batches` | `ADMIN`, `PHARMACIST`| Logs new batch numbers, expiries, and costs. |
| `POST` | `/api/v1/pharmacy/dispense` | `PHARMACIST` | Disenses medications and adjusts stock level balances. |
| `GET` | `/api/v1/pharmacy/inventory/forecast`| `ADMIN`, `PHARMACIST`| Fetches AI demand forecasting metrics. |

---

### Module 8: Billing (Billing & Payments)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/billing/invoices` | `ADMIN` | Generates a new invoice for an encounter. |
| `GET` | `/api/v1/billing/invoices/patient/{patientId}`| `ADMIN`, `PATIENT` | Lists invoices for a patient. |
| `POST` | `/api/v1/billing/invoices/{id}/transactions`| `ADMIN`, `PATIENT` | Processes credit card/UPI transactions. |
| `POST` | `/api/v1/billing/invoices/{id}/claims` | `ADMIN` | Files insurance claims. |

---

### Module 9: Admission (Admission Management)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/admissions` | `ADMIN`, `DOCTOR` | Admits a patient and assigns a bed. |
| `POST` | `/api/v1/admissions/{id}/rounds` | `DOCTOR` | Logs daily medical rounds observations. |
| `POST` | `/api/v1/admissions/{id}/discharge`| `DOCTOR` | Completes discharge, triggers final invoice. |

---

### Module 10: Emergency (Emergency Management)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/emergency-cases` | `NURSE`, `DOCTOR` | Registers emergency arrivals. Generates AI triage scores. |
| `PATCH` | `/api/v1/emergency-cases/{id}/triage`| `NURSE`, `DOCTOR` | Manually overrides or updates a patient's triage tier. |
| `POST` | `/api/v1/emergency-cases/{id}/treatments`| `NURSE`, `DOCTOR` | Logs immediate trauma treatments. |

---

### Module 11: Notifications (Notifications Engine)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/notifications` | All Roles | Lists unread push alerts for the caller's ID. |
| `PATCH` | `/api/v1/notifications/{id}/read` | All Roles | Marks a notification as read. |
| `POST` | `/api/v1/notifications/broadcast` | `ADMIN` | Dispatches system-wide alerts to target roles. |

---

### Module 12: Reports (Reports & Analytics)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/reports/occupancy` | `ADMIN` | Returns inpatient ward bed utilization rates. |
| `GET` | `/api/v1/reports/revenue` | `ADMIN` | Compiles medical department sales. |
| `GET` | `/api/v1/reports/pharmacy-depletion`| `ADMIN`, `PHARMACIST`| Tracks critical medicine inventory depletion speeds. |

---

### Module 13: AI Features (Core Engine Calls)

While AI is integrated into specific module endpoints, these endpoints provide direct access to the AI services:

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/ai/nlp/summarize-history` | `DOCTOR` | Processes historical clinical notes to generate summaries. |
| `POST` | `/api/v1/ai/predictions/readmission-risk`| `DOCTOR` | Predicts a patient's readmission risk score. |
| `GET` | `/api/v1/ai/models/accuracy` | `ADMIN` | Fetches performance and accuracy metrics for the AI models. |

---

## 6. API Performance & Optimization Guide

1.  **GZIP Compression**: Enable response payload compression in Spring Boot application properties:
    ```properties
    server.compression.enabled=true
    server.compression.mime-types=application/json,application/xml,text/html,text/xml,text/plain
    ```
2.  **Projection & Fields Filtering**: Query endpoints should support limiting returned fields using queries to optimize bandwidth:
    `GET /api/v1/patients/{id}?fields=personalInfo.firstName,personalInfo.lastName`
3.  **Rate Limiting**: Enforce rate limits at the gateway layer (e.g., Spring Cloud Gateway + Redis Rate Limiter):
    *   `10 requests/second` per user token for standard operations.
    *   `3 requests/second` per token for compute-heavy AI inference endpoints.
