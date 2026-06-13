import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { saveMedicalRecord, getMedicalRecords, getMedicalRecordById } from '../utils/recordDb';

// Helper: Save Base64 file to uploads directory
const saveBase64File = (fileName: string, base64Data: string): string => {
  const uploadsDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Strip metadata prefix if present, e.g. "data:application/pdf;base64,"
  const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
  let buffer: Buffer;
  let ext = path.extname(fileName) || '.png';
  let baseName = path.basename(fileName, ext) || 'record';

  if (matches && matches.length === 3) {
    buffer = Buffer.from(matches[2], 'base64');
  } else {
    buffer = Buffer.from(base64Data, 'base64');
  }

  // Make filename unique to prevent collision
  const cleanBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
  const safeName = `${cleanBaseName}-${Date.now()}${ext}`;
  const filePath = path.join(uploadsDir, safeName);
  fs.writeFileSync(filePath, buffer);

  return `/uploads/${safeName}`;
};

// 1. List Patient EMR Records
export const listPatientRecords = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { recordType, search } = req.query;

  try {
    const records = await getMedicalRecords(id, {
      recordType: recordType as string,
      search: search as string
    });
    return res.json(records);
  } catch (error) {
    console.error('[EMR] List patient records failure:', error);
    return res.status(500).json({ message: 'Failed to retrieve patient medical records' });
  }
};

// 2. Upload EMR Record (Base64 file format)
export const uploadRecord = async (req: Request, res: Response) => {
  const { id } = req.params; // patientId
  const { title, description, recordType, fileName, fileBase64 } = req.body;
  const doctorId = req.user?.userId;

  if (!title || !description || !recordType || !fileName || !fileBase64 || !doctorId) {
    return res.status(400).json({ message: 'Missing required EMR payload fields' });
  }

  const validTypes = ['Radiology', 'Prescription', 'Lab Report', 'Consultation'];
  if (!validTypes.includes(recordType)) {
    return res.status(400).json({ message: 'Invalid record category' });
  }

  try {
    // Write Base64 string to a file on local filesystem
    const fileUrl = saveBase64File(fileName, fileBase64);

    // Save record meta
    const record = await saveMedicalRecord({
      patientId: id,
      doctorId,
      recordType: recordType as any,
      title,
      description,
      fileUrl
    });

    return res.status(201).json({
      message: 'Medical record uploaded and registered successfully.',
      record
    });
  } catch (error) {
    console.error('[EMR] Record upload failure:', error);
    return res.status(500).json({ message: 'Failed to upload and store medical record' });
  }
};

// 3. Get EMR Record details
export const getRecordDetails = async (req: Request, res: Response) => {
  const { recordId } = req.params;

  try {
    const record = await getMedicalRecordById(recordId);
    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }
    return res.json(record);
  } catch (error) {
    console.error('[EMR] Fetch record details failure:', error);
    return res.status(500).json({ message: 'Failed to fetch medical record details' });
  }
};
