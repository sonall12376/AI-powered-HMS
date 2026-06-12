# AI-Powered Hospital & Healthcare Management System (HMS)
## Frontend UI/UX Architecture Design Document

This document defines the complete user interface and user experience (UI/UX) architecture for the React and Tailwind CSS frontend application. It outlines routing schemes, role-based menus, layouts, component structures, responsive guidelines, and module breakdowns.

---

## 1. Core Layout and Navigation Architecture

The application implements a responsive, persistent layout system consisting of a Sidebar (collapsible), a top Navbar (utility bar), and a Main Content area.

### A. Sidebar Design (Navigation Drawer)
*   **Aesthetics**: Sleek dark mode or dark-indigo theme (`bg-slate-900 text-slate-300`) to create a professional, premium interface.
*   **Behavior**: Collapsible to icon-only view on desktop (`width: 260px` expanded vs `80px` collapsed). On mobile, it acts as an overlay drawer sliding from the left, triggered by a hamburger menu in the Navbar.
*   **Sections**:
    1.  **Brand Header**: System logo and title ("CareFlow AI").
    2.  **User Profile Summary**: Linked profile photo, username, and active security role badge.
    3.  **Navigation Links**: Grouped logically (e.g., "Clinical", "Operations", "Finance") with Tailwind hover transitions (`hover:bg-slate-800 hover:text-white transition-all`).

### B. Navbar Design (Global Utility Bar)
*   **Aesthetics**: Glassmorphism backdrop blur (`bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800`).
*   **Components**:
    *   **Hamburger Toggle**: Expands/collapses the Sidebar.
    *   **AI Quick Search Bar**: Global text search (`CMD + K` or `CTRL + K` trigger) to search patients, consults, or actions.
    *   **Notification Bell**: Badge counter dropdown. Integrates WebSocket listener for real-time critical lab results and ER alerts.
    *   **Profile Dropdown**: User actions (Settings, Profile, Switch Role, Logout).

### C. Dashboard Layout Grid
Dashboards are designed around CSS Grid systems using Tailwind (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`):
1.  **KPI Widget Row**: 4 cards showing primary metrics (e.g., active inpatients, pending appointments, today's revenue, active ER cases) with micro-sparkline charts.
2.  **Primary Workspace Grid**: A 2/3 and 1/3 column layout:
    *   **2/3 Left**: Interactive queue (e.g., Doctor's appointment list, Lab Technician's pending test queue, Nurse's active ward monitoring).
    *   **1/3 Right**: AI-generated action center (suggested tasks, warning alerts, scheduling optimization recommendations).

---

## 2. Role-Based Menu Visibility & Routing

Access control is enforced at both the React Router layer (route guards) and the UI layer (conditional menu rendering).

### A. Role-to-Menu Matrix
The sidebar items dynamically render based on the authenticated user's Spring Data role:

| Sidebar Navigation Option | Path | Allowed Roles |
| :--- | :--- | :--- |
| **System Metrics & Auditing**| `/admin/metrics` | `SUPER_ADMIN` |
| **Staff & Hospital Config** | `/admin/staff` | `HOSPITAL_ADMIN` |
| **Outpatient Schedule** | `/doctor/schedule` | `DOCTOR` |
| **Clinical Consultation** | `/doctor/consult` | `DOCTOR` |
| **Inpatient Ward Monitoring**| `/nurse/wards` | `NURSE`, `DOCTOR` |
| **Patient Registration** | `/reception/check-in` | `RECEPTIONIST`, `HOSPITAL_ADMIN` |
| **Lab Test Queue** | `/lab/queue` | `LAB_TECHNICIAN` |
| **Pharmacy Dispensing** | `/pharmacy/dispense` | `PHARMACIST` |
| **Invoicing & Insurance** | `/billing/invoices` | `BILLING_EXECUTIVE`, `HOSPITAL_ADMIN` |
| **ER Dashboard** | `/emergency/triage` | `NURSE`, `DOCTOR` |
| **Patient Health Portal** | `/patient/portal` | `PATIENT` |

### B. Routing Guards & React Router v6 Config
A custom wrapper component checks if the user's JWT contains the required roles before mounting components:

```jsx
// src/routes/RoleGuard.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const RoleGuard = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hasAccess = user.roles.some(role => allowedRoles.includes(role));

  return hasAccess ? <Outlet /> : <Navigate to="/unauthorized" replace />;
};
```

---

## 3. React Directory Folder Structure

We organize the frontend using a feature-based folder structure to ensure clean separation of concerns:

```
src/
├── assets/                  # SVG Icons, Logos, Background Vectors
├── components/              # Global Shared UI Components (Design System)
│   ├── ui/                  # Reusable Atomic Elements
│   │   ├── Button.jsx       # Tailwind-styled Buttons
│   │   ├── Input.jsx        # Validation-ready Form Inputs
│   │   ├── Card.jsx         # Dashboard Widgets Container
│   │   ├── Modal.jsx        # Popup Dialogue Frames
│   │   └── Table.jsx        # Data Tables with sorting & paging
│   └── charts/              # Recharts / Chart.js wrappers
├── config/                  # Constants, Env Variables, Axio API Clients
├── context/                 # Global React Context providers (Auth, Theme, Socket)
├── features/                # Domain-Specific Modules (Pages, Hooks, Components)
│   ├── auth/                # Login, MFA panels, Refresh logic
│   ├── patients/            # Demographic registration, search list
│   ├── appointments/        # Booking calendar, no-show predictors
│   ├── consultations/       # Clinical vitals, prescription orders, AI insights
│   ├── emr/                 # Allergies tracker, family history, NLP abstracts
│   ├── laboratory/          # Test results logging, GridFS PDF previewers
│   ├── pharmacy/            # Medicine catalog, batch grids, stock alarms
│   ├── billing/             # Invoices creation, insurance claim submission
│   ├── admission/           # Bed grids, ward floor charts, rounds timeline
│   ├── emergency/           # Live ER triage, treatment timers
│   └── reports/             # Interactive revenue & occupancy analytics
├── hooks/                   # Custom Hooks (useAuth, useSocket, useLocalStorage)
├── layouts/                 # Page Templates (DashboardLayout, AuthLayout)
├── routes/                  # AppRoutes.jsx containing nested routers
├── store/                   # Redux Toolkit global store configuration
└── styles/                  # Tailwind index.css and customized utility rules
```

---

## 4. Key User Journey UI Flows

### Journey A: Outpatient consultation with AI-Assisted Diagnosis
1.  **Outpatient Queue**: Doctor views `/doctor/schedule` and clicks "Start Consultation" on a scheduled patient card.
2.  **Encounter Workspace**: The UI transitions to `/doctor/consultations/new?appointmentId=XYZ`.
3.  **Vitals & Symptoms Entry**: Doctor logs current vitals. As symptoms are typed, an auto-debounced API hook queries the AI engine.
4.  **AI Insight Feed**: On the right sidebar widget, the `AIClinicalInsights` panel lists predicted ICD-10 diagnoses and drug-interaction warning flags.
5.  **Prescription Order**: Doctor clicks a recommended diagnosis to auto-populate the record, signs off, and clicks "Fulfill & Print".

### Journey B: Emergency Triage Flow
1.  **ER Landing**: Nurse opens `/emergency/triage`.
2.  **Add Emergency Case**: Nurse clicks "Register Trauma Case" modal. If unidentified, they toggle "Unknown John/Jane Doe".
3.  **AI Priority Scoring**: Nurse inputs quick vital numbers and initial incident notes. The AI engine instantly calculates and returns a triage priority color (RED, ORANGE, YELLOW).
4.  **Board Update**: The card shifts to the top of the queue list, flashing a high-alert warning animation to attract attention.

---

## 5. Responsive Design Guidelines

1.  **Breakpoints**:
    *   `sm` (640px) - Mobile viewport layout adjustment.
    *   `md` (768px) - Tablet viewports (collapses the navigation sidebar into a floating drawer menu).
    *   `lg` (1024px) - Laptop screens (persistent sidebar navigation is restored).
2.  **Minimum Touch Targets**: All interactive items (buttons, checkboxes, links) must measure at least `44px x 44px` on mobile layouts.
3.  **Typography Scale**: Responsive font sizes (`text-xs md:text-sm lg:text-base`) ensure legibility across all form factors.
4.  **Dynamic Data Grids**: Tables on screens below `768px` must collapse into cards or scrollable list items to prevent text wrapping issues.

---

## 6. Detailed Module Specifications

---

### Module 1: Authentication & Authorization

#### Pages:
1.  **LoginPage (`/login`)**: Full screen page with glassmorphism login card, background imagery generated to fit health branding, username/password fields.
2.  **MfaVerificationPage (`/mfa-verify`)**: Numeric PIN screen for entering TOTP codes.
3.  **UnauthorizedPage (`/unauthorized`)**: A 403 screen with return redirect paths.

#### Components:
*   `LoginForm`: Credentials entry form with local state validation.
*   `PinInput`: Auto-focus inputs for MFA code entry.

#### React Routes:
*   `/login` (Public)
*   `/mfa-verify` (Public, requires redirect credentials)

---

### Module 2: Patient Management

#### Pages:
1.  **PatientRegistryPage (`/patients/register`)**: Multi-step wizard form for demographics, emergency contacts, and insurance details.
2.  **PatientListPage (`/patients`)**: Paginated patient table with filters (search by name, ID, phone number).
3.  **PatientProfilePage (`/patients/{id}`)**: Tabbed dashboard displaying patient timeline, demographics, active insurance policies, and billing history.

#### Components:
*   `PatientSearchInput`: Debounced keyword lookup input.
*   `DemographicsForm`, `InsuranceForm`: Sub-forms in the wizard.
*   `PatientTimeline`: Historical overview of patient appointments, surgeries, and admissions.

#### React Routes:
*   `/patients` (Allowed: `ADMIN`, `DOCTOR`, `NURSE`, `RECEPTIONIST`)
*   `/patients/register` (Allowed: `ADMIN`, `NURSE`, `RECEPTIONIST`)
*   `/patients/:id` (Allowed: `ADMIN`, `DOCTOR`, `NURSE`, `RECEPTIONIST`, `PATIENT` via self-ownership)

---

### Module 3: Appointment Management

#### Pages:
1.  **AppointmentSchedulerPage (`/appointments/book`)**: Page with calendar grid showing available doctor time slots.
2.  **AppointmentDashboardPage (`/appointments`)**: Table view of scheduled appointments showing check-in status and AI no-show prediction scores.

#### Components:
*   `CalendarGrid`: Interactive calendar displaying slots.
*   `DoctorSelectDropdown`: Fetches doctor schedules.
*   `NoShowBadge`: Color-coded warning badge showing AI no-show probability.

#### React Routes:
*   `/appointments` (Allowed: `ADMIN`, `DOCTOR`, `NURSE`, `RECEPTIONIST`)
*   `/appointments/book` (Allowed: `ADMIN`, `RECEPTIONIST`, `PATIENT`)

---

### Module 4: Doctor Consultation

#### Pages:
1.  **ConsultationWorkspacePage (`/doctor/consultations/new`)**: Split-pane medical workbench. Left: clinical inputs (vitals, symptoms, prescriptions). Right: real-time AI diagnostic assistant and EMR summary panels.
2.  **ConsultationHistoryPage (`/consultations`)**: List of historical visits.

#### Components:
*   `VitalsGrid`: Form fields for BP, HeartRate, SpO2, and temperature.
*   `PrescriptionBuilder`: Dynamic medication table (allows adding drugs, editing dosages, frequencies, and instructions).
*   `AIClinicalInsightsPanel`: Sidebar widget displaying suggested diagnoses and drug interaction alerts.

#### React Routes:
*   `/doctor/consultations/new` (Allowed: `DOCTOR`)
*   `/consultations` (Allowed: `DOCTOR`, `PATIENT`)

---

### Module 5: Electronic Medical Records (EMR)

#### Pages:
1.  **EMRDashboardPage (`/emr/patient/{patientId}`)**: Patient records index showing allergies, surgeries, chronic illnesses, and medical history.

#### Components:
*   `AllergyTracker`: Interactive list for editing allergen details and severity levels.
*   `MedicalSummaryCard`: Card displaying the AI-generated medical summary.
*   `ChronicConditionList`: Table displaying ongoing health conditions.

#### React Routes:
*   `/emr/patient/:patientId` (Allowed: `DOCTOR`, `NURSE`, `PATIENT` via self-ownership)

---

### Module 6: Laboratory Management

#### Pages:
1.  **LabTestQueuePage (`/lab/queue`)**: Filtered lab order queue showing status (`ORDERED`, `COLLECTED`, `COMPLETED`).
2.  **LabResultsEntryPage (`/lab/test/{id}/results`)**: Form for entering test results values and uploading PDF scans.

#### Components:
*   `ResultsForm`: Parameter input rows displaying reference ranges.
*   `PDFUploader`: File uploader widget with drag-and-drop support.
*   `AnomalyBanner`: Warning banner displayed if the AI anomaly engine flags results.

#### React Routes:
*   `/lab/queue` (Allowed: `LAB_TECHNICIAN`, `DOCTOR`)
*   `/lab/test/:id/results` (Allowed: `LAB_TECHNICIAN`)

---

### Module 7: Pharmacy Management

#### Pages:
1.  **PharmacyInventoryPage (`/pharmacy/inventory`)**: Master medicine catalog displaying batch expiries and stock levels.
2.  **PharmacyDispensationPage (`/pharmacy/dispense`)**: Checkout panel for dispensing prescribed medications.

#### Components:
*   `BatchExpiryTable`: Table displaying stock batches sorted by expiration date.
*   `DispenseBasket`: Checkout cart showing items, dosages, sub-totals, and payment status.
*   `StockLevelWarning`: Badge indicator showing low stock or expired warnings.

#### React Routes:
*   `/pharmacy/inventory` (Allowed: `PHARMACIST`, `HOSPITAL_ADMIN`)
*   `/pharmacy/dispense` (Allowed: `PHARMACIST`)

---

### Module 8: Billing & Payments

#### Pages:
1.  **InvoiceManagerPage (`/billing/invoices`)**: Invoice list showing payment status (Unpaid, Paid, Partially Paid).
2.  **InvoiceDetailPage (`/billing/invoices/{id}`)**: Printable invoice showing itemized lines, claim history, and transaction logs.

#### Components:
*   `LineItemTable`: Invoice itemization lines table.
*   `PaymentGatewayForm`: Card/UPI transaction entry form.
*   `InsuranceClaimModal`: Form for insurance details submission.

#### React Routes:
*   `/billing/invoices` (Allowed: `BILLING_EXECUTIVE`, `HOSPITAL_ADMIN`)
*   `/billing/invoices/:id` (Allowed: `BILLING_EXECUTIVE`, `HOSPITAL_ADMIN`, `PATIENT` via self-ownership)

---

### Module 9: Admission Management

#### Pages:
1.  **AdmissionDashboardPage (`/admissions`)**: Main workspace for managing admitted patients, displaying occupancy levels by ward.
2.  **AdmissionDetailsPage (`/admissions/{id}`)**: Bed details page showing daily rounds records, temperature charts, and medication plans.

#### Components:
*   `BedGridSelector`: Interactive layout grid displaying available and occupied beds.
*   `DailyRoundsTimeline`: Chronological feed of clinical rounds.
*   `DischargeSummaryModal`: Discharge summary submission form.

#### React Routes:
*   `/admissions` (Allowed: `ADMIN`, `DOCTOR`, `NURSE`, `RECEPTIONIST`)
*   `/admissions/:id` (Allowed: `ADMIN`, `DOCTOR`, `NURSE`)

---

### Module 10: Emergency Management

#### Pages:
1.  **ERWorkspacePage (`/emergency/triage`)**: Dashboard showing emergency cases sorted by triage priority (RED, ORANGE, YELLOW).

#### Components:
*   `TriageBoard`: Kanban board displaying active emergency cases.
*   `QuickRegistrationModal`: Minimal registration form (vitals, symptoms) with AI triage suggestions.
*   `ERTreatmentLogger`: Quick-entry form for logging trauma treatments.

#### React Routes:
*   `/emergency/triage` (Allowed: `NURSE`, `DOCTOR`, `ADMIN`)

---

### Module 11: Notifications

#### Pages:
1.  **NotificationInboxPage (`/notifications`)**: Inbox page for managing user alerts and communications.

#### Components:
*   `AlertFeed`: List displaying notifications sorted by time.
*   `NotificationSettings`: Form for toggling SMS, Email, and Push notifications.

#### React Routes:
*   `/notifications` (Allowed: All authenticated roles)

---

### Module 12: Reports & Analytics

#### Pages:
1.  **AnalyticsDashboardPage (`/reports`)**: Interactive metrics dashboard showing hospital occupancy, finance, and pharmacy sales.

#### Components:
*   `RevenueTrendsChart`: Line chart displaying billing revenue trends.
*   `OccupancyDistributionChart`: Bar chart displaying ward occupancy distribution.
*   `AIModelMetricsCard`: Card displaying system-wide AI prediction metrics.

#### React Routes:
*   `/reports` (Allowed: `HOSPITAL_ADMIN`, `SUPER_ADMIN`)

---

## 7. Performance & CSS Design Systems

1.  **Tailwind Theme Extension**:
    Customize brand colors in `tailwind.config.js` to ensure visual consistency:
    ```javascript
    module.exports = {
      theme: {
        extend: {
          colors: {
            brand: {
              50: '#f0f9ff',
              500: '#0ea5e9', // Core cyan accent
              900: '#0c4a6e',
            },
            clinical: {
              red: '#ef4444',    // Immediate RED triage flag
              orange: '#f97316', // ORANGE triage flag
              yellow: '#eab308', // YELLOW triage flag
              green: '#22c55e',  // Standard GREEN triage flag
            }
          }
        }
      }
    }
    ```
2.  **Lazy Loading React Pages**:
    To minimize initial bundle sizes and speed up page load times, load module pages dynamically:
    ```javascript
    const ConsultationWorkspacePage = React.lazy(() => 
      import('./features/consultations/pages/ConsultationWorkspacePage')
    );
    ```
3.  **State Management Guidelines**:
    *   **Global Auth & Theme**: Managed via standard React Context.
    *   **Module-specific states** (e.g., Prescription builder cart, Dispensing basket): Managed locally via `useState` / `useReducer` to limit unnecessary rerenders.
    *   **Server state caching**: Managed via React Query or RTK Query to synchronize API data with local state.
