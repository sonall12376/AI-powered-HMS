import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { saveClinicalHistory, getClinicalHistory } from '../utils/clinicalDb';
import { encrypt, decrypt } from '../utils/encrypt';

// Creates a patient profile in PostgreSQL and a linked Medical History in MongoDB.
export const registerPatient = async (req: Request, res: Response) => {
  const {
    firstName,
    lastName,
    dob,
    gender,
    phone,
    email,
    address,
    userId, // optional linked portal user account
    chronicConditions,
    allergies,
    pastOperations,
    familyHistory
  } = req.body;

  if (!firstName || !lastName || !dob || !gender || !phone || !email || !address) {
    return res.status(400).json({ message: 'All basic demographic fields are required' });
  }

  let patient = null;
  let attempts = 0;
  const maxAttempts = 5;

  try {
    // Generate sequential ID with unique retry checking for race conditions
    while (attempts < maxAttempts) {
      try {
        const currentYear = new Date().getFullYear();
        const lastPatient = await prisma.patient.findFirst({
          where: {
            sequenceId: {
              startsWith: `PT-${currentYear}-`
            }
          },
          orderBy: {
            sequenceId: 'desc'
          }
        });

        let nextNum = 1;
        if (lastPatient) {
          const parts = lastPatient.sequenceId.split('-');
          if (parts.length === 3) {
            const lastNum = parseInt(parts[2], 10);
            if (!isNaN(lastNum)) {
              nextNum = lastNum + 1;
            }
          }
        }

        const sequenceId = `PT-${currentYear}-${String(nextNum).padStart(4, '0')}`;

        // Create the Patient in PostgreSQL
        patient = await prisma.patient.create({
          data: {
            sequenceId,
            firstName,
            lastName,
            dob: new Date(dob),
            gender,
            phoneEnc: encrypt(phone),
            email,
            addressEnc: encrypt(address),
            userId: userId || null
          }
        });
        break; // Success! Break retry loop
      } catch (error: any) {
        // Prisma code P2002 corresponds to Unique Constraint Violation
        if (error.code === 'P2002' && error.meta?.target?.includes('sequenceId')) {
          attempts++;
          // Wait a short random millisecond duration before trying again
          await new Promise((resolve) => setTimeout(resolve, Math.random() * 80 + 20));
        } else {
          throw error;
        }
      }
    }

    if (!patient) {
      return res.status(500).json({ message: 'Could not generate unique patient sequence ID. Please try again.' });
    }

    // Now, create the Medical History in MongoDB (or fallback file storage) linked by patientId
    const history = await saveClinicalHistory(patient.id, {
      chronicConditions: chronicConditions || [],
      allergies: allergies || [],
      pastOperations: pastOperations || [],
      familyHistory: familyHistory || []
    });

    return res.status(201).json({
      message: 'Patient profile and medical history created successfully.',
      patient: {
        id: patient.id,
        sequenceId: patient.sequenceId,
        firstName: patient.firstName,
        lastName: patient.lastName,
        dob: patient.dob,
        gender: patient.gender,
        email: patient.email,
        phoneDecrypted: phone,
        addressDecrypted: address,
        createdAt: patient.createdAt
      },
      medicalHistory: history
    });
  } catch (error) {
    console.error('Patient registry failure:', error);
    return res.status(500).json({ message: 'Internal server error during patient registration' });
  }
};

// Fetches complete patient ledger: PostgreSQL demographics (decrypted) + MongoDB clinical history
export const getPatientById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const patient = await prisma.patient.findUnique({
      where: { id }
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Decrypt fields
    const phone = decrypt(patient.phoneEnc);
    const address = decrypt(patient.addressEnc);

    // Fetch from MongoDB (or fallback file storage)
    const medicalHistory = await getClinicalHistory(id);

    return res.json({
      id: patient.id,
      sequenceId: patient.sequenceId,
      firstName: patient.firstName,
      lastName: patient.lastName,
      dob: patient.dob,
      gender: patient.gender,
      email: patient.email,
      phone,
      address,
      createdAt: patient.createdAt,
      medicalHistory: medicalHistory || {
        patientId: id,
        chronicConditions: [],
        allergies: [],
        pastOperations: [],
        familyHistory: []
      }
    });
  } catch (error) {
    console.error('Fetch patient failure:', error);
    return res.status(500).json({ message: 'Internal server error fetching patient' });
  }
};

// List all patients
export const listPatients = async (req: Request, res: Response) => {
  try {
    const patients = await prisma.patient.findMany({
      orderBy: { sequenceId: 'asc' }
    });

    const decryptedPatients = patients.map((p) => ({
      id: p.id,
      sequenceId: p.sequenceId,
      firstName: p.firstName,
      lastName: p.lastName,
      dob: p.dob,
      gender: p.gender,
      email: p.email,
      phone: decrypt(p.phoneEnc),
      address: decrypt(p.addressEnc),
      createdAt: p.createdAt
    }));

    return res.json(decryptedPatients);
  } catch (error) {
    console.error('List patients failure:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
