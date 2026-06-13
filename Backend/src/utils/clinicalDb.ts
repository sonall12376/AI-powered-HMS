import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { MedicalHistory } from '../models/medicalHistory.model';

const fallbackFilePath = path.join(__dirname, '../../clinical_db.json');

// Ensure local JSON file database exists
const initializeFallbackFile = () => {
  if (!fs.existsSync(fallbackFilePath)) {
    fs.writeFileSync(fallbackFilePath, JSON.stringify({}));
  }
};

const readFallbackData = (): Record<string, any> => {
  initializeFallbackFile();
  try {
    const raw = fs.readFileSync(fallbackFilePath, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (err) {
    console.error('Failed to read clinical fallback JSON database:', err);
    return {};
  }
};

const writeFallbackData = (data: Record<string, any>) => {
  initializeFallbackFile();
  try {
    fs.writeFileSync(fallbackFilePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed to write clinical fallback JSON database:', err);
  }
};

export const saveClinicalHistory = async (patientId: string, historyPayload: any) => {
  // Check if MongoDB is fully connected (readyState === 1)
  if (mongoose.connection.readyState === 1) {
    try {
      // Upsert into MongoDB
      return await MedicalHistory.findOneAndUpdate(
        { patientId },
        { ...historyPayload, patientId },
        { new: true, upsert: true }
      );
    } catch (err) {
      console.warn('MongoDB query failed. Falling back to local JSON file:', err);
    }
  }

  // Fallback to local JSON database file
  const data = readFallbackData();
  data[patientId] = {
    patientId,
    ...historyPayload,
    updatedAt: new Date(),
    createdAt: data[patientId]?.createdAt || new Date()
  };
  writeFallbackData(data);
  return data[patientId];
};

export const getClinicalHistory = async (patientId: string) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = await MedicalHistory.findOne({ patientId });
      if (doc) return doc;
    } catch (err) {
      console.warn('MongoDB query failed. Falling back to local JSON file:', err);
    }
  }

  // Fallback to local JSON database file
  const data = readFallbackData();
  return data[patientId] || null;
};
