import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../config/db';

export const onboardStaff = async (req: Request, res: Response) => {
  const { email, role } = req.body;

  if (!email || !role) {
    return res.status(400).json({ message: 'Email and role are required' });
  }

  // Validate allowed roles (must be valid staff roles)
  const validStaffRoles = ['SUPER_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LAB_TECH', 'PHARMACIST'];
  if (!validStaffRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid staff role specified' });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'A user with this email already exists' });
    }

    // Generate secure temporary password of length 12
    const tempPassword = crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
    
    // Hash password with 12 rounds of bcrypt
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Create staff user in PostgreSQL
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        status: 'PENDING_ONBOARD'
      }
    });

    // Mock an automated email dispatch to console
    console.log('\n-------------------------------------------------------------');
    console.log(`[EMAIL DISPATCH] Mock Email Sent To: ${email}`);
    console.log(`Subject: HMS Secure Onboarding Credentials`);
    console.log(`Welcome to the Hospital Management System!`);
    console.log(`Your account has been configured with role: ${role}`);
    console.log(`Temporary Password: ${tempPassword}`);
    console.log('Action Required: Please log in and change your password.');
    console.log('-------------------------------------------------------------\n');

    return res.status(201).json({
      message: 'Staff onboarded successfully.',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      },
      // Hand back the temp password for testing / evaluation
      tempPasswordDevOnly: tempPassword
    });
  } catch (error) {
    console.error('Staff onboarding error:', error);
    return res.status(500).json({ message: 'Internal server error during staff onboarding' });
  }
};
