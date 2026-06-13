import { Router } from 'express';
import * as authCtrl from '../controllers/auth.controller';
import * as staffCtrl from '../controllers/staff.controller';
import * as patientCtrl from '../controllers/patient.controller';
import * as apptCtrl from '../controllers/appointment.controller';
import * as aiCtrl from '../controllers/ai.controller';
import * as emrCtrl from '../controllers/emr.controller';
import * as labCtrl from '../controllers/lab.controller';
import * as pharmacyCtrl from '../controllers/pharmacy.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';

const router = Router();

// ==========================================
// MODULE 1: AUTHENTICATION & SECURITY GATE
// ==========================================
router.post('/auth/login', authCtrl.login);
router.post('/auth/refresh', authCtrl.refresh);
router.post('/auth/logout', authCtrl.logout);

// Staff Onboarding (Super Admin ONLY)
router.post(
  '/staff/onboard',
  authenticate,
  authorize(['SUPER_ADMIN']),
  staffCtrl.onboardStaff
);

// ==========================================
// MODULE 2: PATIENT MANAGEMENT & CHART
// ==========================================
router.post(
  '/patients',
  authenticate,
  authorize(['SUPER_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']),
  patientCtrl.registerPatient
);
router.get(
  '/patients',
  authenticate,
  authorize(['SUPER_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']),
  patientCtrl.listPatients
);
router.get(
  '/patients/:id',
  authenticate,
  authorize(['SUPER_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']),
  patientCtrl.getPatientById
);

// ==========================================
// MODULE 3: APPOINTMENT SCHEDULING ENGINE
// ==========================================
router.post(
  '/appointments/availability',
  authenticate,
  authorize(['SUPER_ADMIN', 'DOCTOR']),
  apptCtrl.setAvailability
);
router.get(
  '/appointments/availability/:doctorId',
  authenticate,
  apptCtrl.getAvailableSlots
);
router.post(
  '/appointments/lock',
  authenticate,
  apptCtrl.lockSlot
);
router.post(
  '/appointments/book',
  authenticate,
  apptCtrl.bookAppointment
);
router.put(
  '/appointments/:id/status',
  authenticate,
  authorize(['SUPER_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']),
  apptCtrl.updateAppointmentStatus
);
router.put(
  '/appointments/:id/reschedule',
  authenticate,
  authorize(['SUPER_ADMIN', 'DOCTOR', 'RECEPTIONIST']),
  apptCtrl.rescheduleAppointment
);
router.get(
  '/appointments',
  authenticate,
  apptCtrl.listAppointments
);

// ==========================================
// AI INTEGRATIONS
// ==========================================
router.post(
  '/ai/analyze-symptoms',
  authenticate,
  aiCtrl.analyzeSymptoms
);
router.post(
  '/ai/chat',
  authenticate,
  aiCtrl.chatAssistant
);
router.post(
  '/patients/:id/ai-summary',
  authenticate,
  authorize(['SUPER_ADMIN', 'DOCTOR', 'NURSE']),
  aiCtrl.summarizeMedicalRecord
);

// ==========================================
// MODULE 5: ELECTRONIC MEDICAL RECORDS (EMR)
// ==========================================
router.get(
  '/patients/:id/records',
  authenticate,
  authorize(['SUPER_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT']),
  emrCtrl.listPatientRecords
);
router.post(
  '/patients/:id/records',
  authenticate,
  authorize(['SUPER_ADMIN', 'DOCTOR', 'NURSE']),
  emrCtrl.uploadRecord
);
router.get(
  '/records/:recordId',
  authenticate,
  emrCtrl.getRecordDetails
);

// ==========================================
// MODULE 6: LABORATORY MANAGEMENT
// ==========================================
router.post(
  '/labs/orders',
  authenticate,
  authorize(['SUPER_ADMIN', 'DOCTOR']),
  labCtrl.orderLabTest
);
router.get(
  '/labs/queue',
  authenticate,
  authorize(['SUPER_ADMIN', 'DOCTOR', 'LAB_TECH']),
  labCtrl.getLabQueue
);
router.put(
  '/labs/tests/:id/status',
  authenticate,
  authorize(['SUPER_ADMIN', 'LAB_TECH']),
  labCtrl.updateLabStatus
);
router.post(
  '/labs/tests/:id/report',
  authenticate,
  authorize(['SUPER_ADMIN', 'LAB_TECH']),
  labCtrl.submitLabReport
);
router.get(
  '/labs/reports',
  authenticate,
  authorize(['SUPER_ADMIN', 'DOCTOR', 'LAB_TECH', 'PATIENT']),
  labCtrl.getLabReports
);

// ==========================================
// MODULE 7: PHARMACY MANAGEMENT
// ==========================================
router.get(
  '/pharmacy/medicines',
  authenticate,
  pharmacyCtrl.getMedicines
);
router.post(
  '/pharmacy/medicines',
  authenticate,
  authorize(['SUPER_ADMIN', 'PHARMACIST']),
  pharmacyCtrl.addMedicine
);
router.put(
  '/pharmacy/medicines/:id',
  authenticate,
  authorize(['SUPER_ADMIN', 'PHARMACIST']),
  pharmacyCtrl.updateMedicineStock
);
router.get(
  '/pharmacy/prescriptions',
  authenticate,
  authorize(['SUPER_ADMIN', 'DOCTOR', 'PHARMACIST']),
  pharmacyCtrl.getPrescriptions
);
router.post(
  '/pharmacy/prescriptions',
  authenticate,
  authorize(['SUPER_ADMIN', 'DOCTOR']),
  pharmacyCtrl.createPrescription
);
router.post(
  '/pharmacy/prescriptions/:id/dispense',
  authenticate,
  authorize(['SUPER_ADMIN', 'PHARMACIST']),
  pharmacyCtrl.dispensePrescription
);

export default router;

