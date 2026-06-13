# AI-Powered Hospital Management System (HMS)

This is an enterprise-grade Hospital Management System built with a secure React + TypeScript frontend and a Node.js + Express backend. The application features distributed slot booking locks, clinical diagnosis/triage assistance, role-based security access, and an AI-powered Patient Medical Record Summarizer.

---

## Technical Stack

* **Frontend**: React, TypeScript, Tailwind CSS, Vite
* **Backend**: Node.js, Express, TypeScript
* **Relational DB / Scheduler**: PostgreSQL or SQLite (managed via Prisma)
* **EMR Document Storage**: MongoDB or Local JSON File DB (managed via Mongoose)
* **AI Integrations**: OpenAI API (with a local heuristics fallback engine)

---

## File Structure

```text
AI-powered-HMS/
├── Backend/
│   ├── prisma/
│   │   ├── dev.db                   # Local database (SQLite default)
│   │   ├── schema.prisma            # Database models (User, Patient, Appointment, LabTest, Medicine)
│   │   └── seed.ts                  # Mock database seeding script
│   ├── src/
│   │   ├── config/db.ts             # Prisma & MongoDB setup
│   │   ├── controllers/             # Backend Business Logic
│   │   │   ├── ai.controller.ts     # Symptom triaging and AI record summary
│   │   │   ├── appointment.ts       # Booking engine & slot lock state handlers
│   │   │   ├── auth.controller.ts   # JWT auth endpoints
│   │   │   ├── emr.controller.ts    # MongoDB file upload handlers
│   │   │   ├── lab.controller.ts    # Lab queue workflow
│   │   │   ├── pharmacy.controller.ts# Inventory & prescription dispenser queue
│   │   │   └── staff.controller.ts  # Onboard security log creation
│   │   ├── middleware/              # Auth & RBAC guards
│   │   ├── models/                  # EMR MongoDB model specs
│   │   ├── routes/                  # Express routes configuration
│   │   └── index.ts                 # Express entry point
│   ├── .env                         # Server environment configs
│   ├── package.json                 # Backend dependencies
│   └── tsconfig.json                # TS compiler configuration
│
└── Frontend/
    ├── src/
    │   ├── components/              # Global reusable elements (AiAssistant, CriticalAlert)
    │   ├── context/AuthContext.tsx  # JWT user states and role clearance context
    │   ├── pages/                   # Application Pages
    │   │   ├── Dashboard.tsx        # Registry, Active Chart profiles, & Audit ledger
    │   │   ├── Laboratory.tsx       # Lab workflow diagnostics console
    │   │   ├── Login.tsx            # Secure login dashboard
    │   │   ├── MedicalRecords.tsx   # Document timeline archive (MongoDB upload/download)
    │   │   ├── PatientProfile.tsx   # Detailed chart & AI summary synthesis modal
    │   │   ├── Pharmacy.tsx         # Dispensing queue and stock tracking logs
    │   │   └── Scheduler.tsx        # Slot allocations & locking interface
    │   ├── App.tsx                  # Main router configuration (contains route guards)
    │   └── main.tsx                 # DOM mounting node
    ├── tailwind.config.js           # UI styling styles
    ├── tsconfig.json                # TypeScript declarations
    └── vite.config.ts               # Bundler parameters (includes port 5000 proxy mapping)
```

---

## Startup Instructions

To run the application, open your project folder in VS Code and run the following in two separate terminal windows:

### Terminal 1: Backend Setup & Launch
1. Navigate to the backend folder:
   ```bash
   cd Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the database schema & seed mock data (Doctors, Patients, Availabilities):
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npx ts-node prisma/seed.ts
   ```
4. Start the backend:
   ```bash
   npm run dev
   ```
   *The server will start at `http://localhost:5000`.*

### Terminal 2: Frontend Setup & Launch
1. Navigate to the frontend folder:
   ```bash
   cd Frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Boot the development dev server:
   ```bash
   npm run dev
   ```
   *Vite will start the client interface at `http://localhost:5173`.*

---

## System Accounts (For Testing)

You can log in to test different role clearances:

| Role | Email | Password |
|---|---|---|
| **Super Admin** | `admin@hms.com` | `admin123` |
| **Doctor** | `doctor.general@hms.com` | `doc123` |
| **Doctor** | `doctor.cardio@hms.com` | `doc123` |