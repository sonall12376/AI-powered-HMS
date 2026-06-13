import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';

export const prisma = new PrismaClient();

export const connectMongo = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hms_clinical';
  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};
