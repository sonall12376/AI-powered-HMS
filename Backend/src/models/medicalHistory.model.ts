import { Schema, model, Document, models } from 'mongoose';

export interface IChronicCondition {
  conditionName: string;
  diagnosedDate?: Date;
  status: 'Active' | 'Resolved' | 'Remission';
}

export interface IAllergy {
  allergen: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  reaction?: string;
}

export interface IPastOperation {
  procedure: string;
  date?: Date;
  surgeon?: string;
  notes?: string;
}

export interface IFamilyHistory {
  relationship: string;
  conditionName: string;
  ageAtOnset?: number;
}

export interface IMedicalHistory extends Document {
  patientId: string; // Links to PostgreSQL Patient.id
  chronicConditions: IChronicCondition[];
  allergies: IAllergy[];
  pastOperations: IPastOperation[];
  familyHistory: IFamilyHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const MedicalHistorySchema = new Schema<IMedicalHistory>({
  patientId: { type: String, required: true, unique: true, index: true },
  chronicConditions: [{
    conditionName: { type: String, required: true },
    diagnosedDate: Date,
    status: { type: String, enum: ['Active', 'Resolved', 'Remission'], default: 'Active' }
  }],
  allergies: [{
    allergen: { type: String, required: true },
    severity: { type: String, enum: ['Mild', 'Moderate', 'Severe'], required: true },
    reaction: String
  }],
  pastOperations: [{
    procedure: { type: String, required: true },
    date: Date,
    surgeon: String,
    notes: String
  }],
  familyHistory: [{
    relationship: { type: String, required: true },
    conditionName: { type: String, required: true },
    ageAtOnset: Number
  }]
}, { timestamps: true });

// Prevent schema compilation errors during hot reloads or multiple imports
export const MedicalHistory = models.MedicalHistory || model<IMedicalHistory>('MedicalHistory', MedicalHistorySchema);
