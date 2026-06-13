import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { MedicalRecord } from '../models/medicalRecord.model';

const fallbackFilePath = path.join(__dirname, '../../records_db.json');

// Ensure local JSON file database exists
const initializeFallbackFile = () => {
  if (!fs.existsSync(fallbackFilePath)) {
    fs.writeFileSync(fallbackFilePath, JSON.stringify({}));
  }
};

const readFallbackData = (): Record<string, any[]> => {
  initializeFallbackFile();
  try {
    const raw = fs.readFileSync(fallbackFilePath, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (err) {
    console.error('Failed to read EMR fallback JSON database:', err);
    return {};
  }
};

const writeFallbackData = (data: Record<string, any[]>) => {
  initializeFallbackFile();
  try {
    fs.writeFileSync(fallbackFilePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed to write EMR fallback JSON database:', err);
  }
};

export const saveMedicalRecord = async (payload: {
  patientId: string;
  doctorId: string;
  recordType: 'Radiology' | 'Prescription' | 'Lab Report' | 'Consultation';
  title: string;
  description: string;
  fileUrl: string;
}) => {
  // If MongoDB is fully connected (readyState === 1)
  if (mongoose.connection.readyState === 1) {
    try {
      const record = new MedicalRecord(payload);
      return await record.save();
    } catch (err) {
      console.warn('MongoDB query failed. Falling back to local EMR JSON file:', err);
    }
  }

  // Fallback to local JSON database file
  const data = readFallbackData();
  if (!data[payload.patientId]) {
    data[payload.patientId] = [];
  }

  const mockRecord = {
    id: `rec-${Math.random().toString(36).substr(2, 9)}`,
    ...payload,
    uploadDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  data[payload.patientId].push(mockRecord);
  writeFallbackData(data);
  return mockRecord;
};

export const getMedicalRecords = async (patientId: string, filter?: { recordType?: string; search?: string }) => {
  let records: any[] = [];

  if (mongoose.connection.readyState === 1) {
    try {
      const query: any = { patientId };
      if (filter?.recordType) {
        query.recordType = filter.recordType;
      }
      if (filter?.search) {
        query.$or = [
          { title: { $regex: filter.search, $options: 'i' } },
          { description: { $regex: filter.search, $options: 'i' } }
        ];
      }
      records = await MedicalRecord.find(query).sort({ uploadDate: -1 });
      return records;
    } catch (err) {
      console.warn('MongoDB query failed. Falling back to local EMR JSON file:', err);
    }
  }

  // Fallback
  const data = readFallbackData();
  records = data[patientId] || [];

  if (filter?.recordType) {
    records = records.filter(r => r.recordType === filter.recordType);
  }
  if (filter?.search) {
    const searchLower = filter.search.toLowerCase();
    records = records.filter(r => 
      r.title.toLowerCase().includes(searchLower) || 
      r.description.toLowerCase().includes(searchLower)
    );
  }

  // Sort descending by uploadDate/createdAt
  records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return records;
};

export const getMedicalRecordById = async (recordId: string) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = await MedicalRecord.findById(recordId);
      if (doc) return doc;
    } catch (err) {
      console.warn('MongoDB query failed. Falling back to local EMR JSON file:', err);
    }
  }

  // Fallback
  const data = readFallbackData();
  for (const patientId of Object.keys(data)) {
    const record = data[patientId].find(r => r.id === recordId || r._id === recordId);
    if (record) return record;
  }
  return null;
};
