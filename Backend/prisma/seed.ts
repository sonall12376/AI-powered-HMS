import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { saveClinicalHistory } from '../src/utils/clinicalDb';

const prisma = new PrismaClient();

const ALGORITHM = 'aes-256-gcm';

const encrypt = (text: string): string => {
  const secret = process.env.ENCRYPTION_SECRET || 'hms_enterprise_level_secure_encryption_secret_default_key_2026';
  const key = crypto.createHash('sha256').update(secret).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
};

async function main() {
  console.log('Starting system database seeding...');

  // Connect MongoDB with safety check
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hms_clinical';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    console.log('MongoDB connected for seeding.');
  } catch (err) {
    console.log('MongoDB connection timeout for seeding. Using local JSON fallback instead.');
  }

  // Clean old databases
  await prisma.auditLog.deleteMany({});
  await prisma.bookingLock.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.doctorAvailability.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.user.deleteMany({});

  // Reset fallback JSON database
  const jsonPath = path.join(__dirname, '../clinical_db.json');
  try {
    fs.writeFileSync(jsonPath, JSON.stringify({}, null, 2));
  } catch (err) {
    // ignore
  }

  const hashPassword = (pw: string) => bcrypt.hashSync(pw, 10);

  // 1. Create Super Admin User
  const admin = await prisma.user.create({
    data: {
      email: 'admin@hms.com',
      passwordHash: hashPassword('admin123'),
      role: 'SUPER_ADMIN',
      status: 'ACTIVE'
    }
  });
  console.log('Seeded User: admin@hms.com (SUPER_ADMIN)');

  // 2. Seed Doctors
  const doctorsData = [
    { id: 'doc-cardiology-uuid', email: 'doctor.cardio@hms.com', name: 'Dr. Sarah Jenkins' },
    { id: 'doc-orthopedics-uuid', email: 'doctor.ortho@hms.com', name: 'Dr. Robert Chen' },
    { id: 'doc-pediatrics-uuid', email: 'doctor.pediatric@hms.com', name: 'Dr. Emily Watson' },
    { id: 'doc-general-uuid', email: 'doctor.general@hms.com', name: 'Dr. John Doe' }
  ];

  for (const doc of doctorsData) {
    await prisma.user.create({
      data: {
        id: doc.id,
        email: doc.email,
        passwordHash: hashPassword('doc123'),
        role: 'DOCTOR',
        status: 'ACTIVE'
      }
    });

    // Seed Availability Matrix (Monday-Friday, 9:00 - 17:00, 20min slots)
    for (let day = 1; day <= 5; day++) {
      await prisma.doctorAvailability.create({
        data: {
          doctorId: doc.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          slotInterval: 20
        }
      });
    }
    console.log(`Seeded Doctor: ${doc.name} with Availability shift patterns`);
  }

  // 3. Seed Patients (Postgres + MongoDB history)
  const patient1 = await prisma.patient.create({
    data: {
      id: 'patient-1-uuid',
      sequenceId: 'PT-2026-0001',
      firstName: 'Christopher',
      lastName: 'Nolan',
      dob: new Date('1970-07-30'),
      gender: 'Male',
      email: 'nolan@inception.com',
      phoneEnc: encrypt('+1 (555) 123-4567'),
      addressEnc: encrypt('144 Inception Way, Los Angeles, CA')
    }
  });

  await saveClinicalHistory(patient1.id, {
    chronicConditions: [
      { conditionName: 'Hypertension', status: 'Active', diagnosedDate: new Date('2020-05-15') }
    ],
    allergies: [
      { allergen: 'Penicillin', severity: 'Severe', reaction: 'Anaphylaxis and respiratory shock' }
    ],
    pastOperations: [
      { procedure: 'Appendectomy', date: new Date('2015-08-20'), surgeon: 'Dr. House' }
    ],
    familyHistory: [
      { relationship: 'Father', conditionName: 'Myocardial Infarction' }
    ]
  });

  const patient2 = await prisma.patient.create({
    data: {
      id: 'patient-2-uuid',
      sequenceId: 'PT-2026-0002',
      firstName: 'Scarlett',
      lastName: 'Johansson',
      dob: new Date('1984-11-22'),
      gender: 'Female',
      email: 'scarlett@avenger.com',
      phoneEnc: encrypt('+1 (555) 987-6543'),
      addressEnc: encrypt('500 Broadway St, New York, NY')
    }
  });

  await saveClinicalHistory(patient2.id, {
    chronicConditions: [],
    allergies: [
      { allergen: 'Peanuts', severity: 'Moderate', reaction: 'Skin hives and swelling' }
    ],
    pastOperations: [],
    familyHistory: []
  });

  console.log('Seeded Patients: Christopher Nolan (Allergic to Penicillin) & Scarlett Johansson');
  console.log('Seeding finished successfully.');

  try {
    await mongoose.disconnect();
  } catch (err) {}
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Seeding process encountered an error:', err);
  process.exit(1);
});
