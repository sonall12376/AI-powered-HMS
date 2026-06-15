# AI-Powered HMS - Next.js Frontend Dashboard Portal

This directory contains the **Next.js 16 + React 19** frontend portal for the AI-Powered Hospital Management System (HMS), designed with a premium glassmorphic visual system.

---

## 🎨 Design System & Aesthetics

- **Glassmorphism**: Transparent, blurred visual elements (`backdrop-filter: blur(16px)`) with subtle custom outer glow borders.
- **Harmonious Dark Theme**: Curated deep-blue and violet/indigo gradient styles (`#060814`) providing a state-of-the-art visual experience.
- **Micro-Animations**: Transitions on card interactions, inputs, and tab toggles.
- **Google Font Integration**: Native self-hosted `Outfit` font setup via `next/font/google` for speed and CSS spec compliance.

---

## 📂 Directories & Views

- `/src/components/hms`:
  - `GlassCard.tsx`: A wrapper utilizing glassmorphic styles with dynamic colored glow intensities.
  - `Table.tsx`: A generic table with built-in search filters, sorting headers, and paginated footers.
- `/src/app/page.tsx`: System login gate featuring role quick-fills (Patient, Doctor, Admin) and backend connection healthchecks.
- `/src/app/dashboard/patient`:
  - Profile demographics summary.
  - AI scheduling text area for conversational scheduling.
  - Interactive status tables displaying appointment history and prescriptions.
- `/src/app/dashboard/doctor`:
  - Availability scheduler toggles.
  - Vitals tracker logs, diagnoses inputs (ICD-10 list), and medication builders.
  - Symptom Analyzer trigger button sending vitals and notes to the backend for automated suggestions.

---

## 🏃 Setup & Running Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 3. Production Build
Ensure type safety and optimal bundle loading:
```bash
npm run build
```

---

## 🔌 Connection Profiles

- **Online Mode**: The portal attempts to establish contact with the backend API at `http://localhost:8080/api/v1`. The footer displays `online` upon successful pings.
- **Offline / Mock Mode**: If the backend is offline, the interface falls back to a deterministic local mockup generator. Users can still test login, booking queries, natural language parsing, and consultation note logic.
