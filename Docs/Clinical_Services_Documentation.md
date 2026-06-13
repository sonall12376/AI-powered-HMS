# Hospital Management System
# Clinical Services Module Documentation

## Team Information

**Module Owner:** Member 3

**Branch Name:** clinical-services

**Modules Covered:**
- Module 5: Electronic Medical Records (EMR)
- Module 6: Laboratory Management
- Module 7: Pharmacy Management
- AI Medical Record Summarizer

---

# Overview

The Clinical Services module manages all patient clinical data within the Hospital Management System.

This module includes:

1. Electronic Medical Records (EMR)
2. Laboratory Management
3. Pharmacy Management
4. AI Medical Record Summarizer

The purpose of this module is to provide secure medical record storage, laboratory workflows, medicine inventory management, prescription fulfillment, and AI-powered patient summaries.

---

# Module 5: Electronic Medical Records (EMR)

## Objective

Store and manage all patient medical records digitally.

---

## Features

### Medical Record Upload

Doctors and staff can upload:

- PDF Reports
- X-Ray Images
- MRI Reports
- Laboratory Reports
- Prescriptions
- Consultation Notes

### Medical Record Search

Search records by:

- Patient
- Doctor
- Record Type
- Upload Date

### Medical Record Filtering

Filter by:

- Prescription
- Consultation
- Laboratory
- Radiology
- Surgery
- Other

### Medical History Timeline

Display complete patient history in chronological order.

### Report Download

Users can download uploaded reports.

---

## EMR Workflow

Patient Visit
↓
Doctor Consultation
↓
Medical Record Created
↓
File Uploaded
↓
Stored in EMR
↓
Available for Future Visits

---

## Database Table

### MedicalRecords

| Field | Type |
|---------|---------|
| id | String |
| patientId | String |
| doctorId | String |
| title | String |
| description | String |
| recordType | String |
| fileUrl | String |
| uploadDate | DateTime |
| createdAt | DateTime |
| updatedAt | DateTime |

---

## API Endpoints

### Get Records

GET /api/patients/:id/records

### Upload Record

POST /api/patients/:id/records

### Get Record Details

GET /api/records/:recordId

### Download Record

GET /api/records/:recordId/download

---

# Module 6: Laboratory Management

## Objective

Manage laboratory testing workflows from order creation to report delivery.

---

## Features

### Test Ordering

Doctors can order laboratory tests.

Examples:

- Blood Test
- Urine Test
- Thyroid Profile
- CBC
- Liver Function Test

### Sample Collection

Laboratory staff collects patient samples.

### Status Tracking

Track test progress.

Status Flow:

Pending
↓
Sample Collected
↓
Processing
↓
Results Ready
↓
Completed

### Report Upload

Laboratory staff uploads final reports.

### Doctor Notification

Notify doctors when reports are completed.

---

## Laboratory Workflow

Doctor Orders Test
↓
Lab Receives Request
↓
Sample Collection
↓
Processing
↓
Results Generated
↓
Report Uploaded
↓
Doctor Notified

---

## Database Tables

### LabTests

| Field | Type |
|---------|---------|
| id | String |
| patientId | String |
| doctorId | String |
| testName | String |
| status | String |
| requestedAt | DateTime |
| completedAt | DateTime |

---

### LabReports

| Field | Type |
|---------|---------|
| id | String |
| testId | String |
| findings | String |
| summary | String |
| reportUrl | String |
| createdAt | DateTime |

---

## API Endpoints

### Create Lab Order

POST /api/labs/orders

### Get Lab Queue

GET /api/labs/queue

### Update Status

PUT /api/labs/tests/:id/status

### Upload Report

POST /api/labs/tests/:id/report

### View Reports

GET /api/labs/reports

---

# Module 7: Pharmacy Management

## Objective

Manage medicine inventory, prescriptions, and dispensing operations.

---

## Features

### Inventory Management

Track:

- Medicine Name
- Batch Number
- Manufacturer
- Expiry Date
- Available Quantity

### Stock Monitoring

Monitor inventory levels continuously.

### Low Stock Alerts

Generate alerts when stock falls below threshold.

### Expiry Alerts

Notify pharmacy staff about expiring medicines.

### Prescription Queue

Display prescriptions waiting for dispensing.

### Medicine Dispensing

Dispense medicines and update stock automatically.

---

## Pharmacy Workflow

Doctor Creates Prescription
↓
Prescription Queue
↓
Pharmacist Reviews
↓
Stock Verification
↓
Medicine Dispensed
↓
Inventory Updated

---

## Database Tables

### Medicines

| Field | Type |
|---------|---------|
| id | String |
| name | String |
| batchNumber | String |
| manufacturer | String |
| stockQuantity | Integer |
| expiryDate | DateTime |
| price | Decimal |

---

### InventoryLogs

| Field | Type |
|---------|---------|
| id | String |
| medicineId | String |
| action | String |
| quantity | Integer |
| createdAt | DateTime |

---

### Prescriptions

| Field | Type |
|---------|---------|
| id | String |
| patientId | String |
| doctorId | String |
| medicines | JSON |
| status | String |
| createdAt | DateTime |

---

## API Endpoints

### Get Medicines

GET /api/pharmacy/medicines

### Add Medicine

POST /api/pharmacy/medicines

### Update Medicine

PUT /api/pharmacy/medicines/:id

### Prescription Queue

GET /api/pharmacy/prescriptions

### Create Prescription

POST /api/pharmacy/prescriptions

### Dispense Medicine

POST /api/pharmacy/prescriptions/:id/dispense

---

# AI Medical Record Summarizer

## Objective

Provide a concise AI-generated summary of patient medical history.

---

## Data Sources

The AI summarizer analyzes:

- Medical Records
- Laboratory Reports
- Prescriptions
- Consultation Notes

---

## AI Workflow

Patient Selected
↓
Medical Records Collected
↓
Lab Reports Collected
↓
Prescriptions Collected
↓
AI Processing
↓
Summary Generated

---

## API Endpoint

POST /api/patients/:id/ai-summary

---

## Sample Output

{
  "chronicDiseases": [
    "Hypertension",
    "Diabetes"
  ],
  "allergies": [
    "Penicillin"
  ],
  "surgeries": [
    "Appendectomy"
  ],
  "activeMedications": [
    "Metformin",
    "Amlodipine"
  ],
  "summary": "Patient has a history of hypertension and diabetes. Currently taking Metformin and Amlodipine."
}

---

# Project Structure

Backend/

src/

controllers/
- emr.controller.ts
- lab.controller.ts
- pharmacy.controller.ts

services/
- emr.service.ts
- lab.service.ts
- pharmacy.service.ts

routes/
- emr.routes.ts
- lab.routes.ts
- pharmacy.routes.ts

models/
- MedicalRecord
- LabTest
- LabReport
- Medicine
- InventoryLog
- Prescription

---

Frontend/

src/

pages/
- MedicalRecords.tsx
- Laboratory.tsx
- Pharmacy.tsx

components/

EMR
- RecordUploader
- RecordViewer
- Timeline

Laboratory
- LabQueue
- StatusTracker
- ReportUploader

Pharmacy
- InventoryTable
- DispenseModal
- StockAlerts

---

# Security

Implemented Security Features:

- JWT Authentication
- Role-Based Access Control (RBAC)
- Input Validation
- Error Handling
- Audit Logging
- Secure File Upload Handling

---

# Roles Allowed

| Role | Access |
|--------|--------|
| SUPER_ADMIN | Full Access |
| DOCTOR | Full Clinical Access |
| LAB_TECH | Laboratory Access |
| PHARMACIST | Pharmacy Access |
| NURSE | View Access |
| PATIENT | Limited Record Access |

---

# Verification Checklist

EMR
- Upload Record
- View Record
- Search Record
- Download Record

Laboratory
- Create Test
- Update Status
- Upload Report
- Complete Workflow

Pharmacy
- Add Medicine
- Manage Inventory
- Dispense Prescription
- Update Stock

AI Summary
- Generate Summary
- Verify Output
- Validate Data Sources

---

# Conclusion

The Clinical Services Module provides complete management of medical records, laboratory operations, pharmacy workflows, and AI-assisted patient summarization within the Hospital Management System.

Branch:
clinical-services

Module Owner:
Member 3

Status:
Completed