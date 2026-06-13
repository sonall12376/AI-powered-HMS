import { Schema, model, Document, models } from 'mongoose';

export interface IMedicalRecord extends Document {
  patientId: string; // Links to PostgreSQL/SQLite Patient.id
  doctorId: string;  // Links to Doctor User.id
  recordType: 'Radiology' | 'Prescription' | 'Lab Report' | 'Consultation';
  title: string;
  description: string;
  fileUrl: string;
  uploadDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MedicalRecordSchema = new Schema<IMedicalRecord>({
  patientId: { type: String, required: true, index: true },
  doctorId: { type: String, required: true },
  recordType: {
    type: String,
    enum: ['Radiology', 'Prescription', 'Lab Report', 'Consultation'],
    required: true
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  fileUrl: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now }
}, { timestamps: true });

// Prevent schema compilation errors during hot reloads or multiple imports
export const MedicalRecord = models.MedicalRecord || model<IMedicalRecord>('MedicalRecord', MedicalRecordSchema);
