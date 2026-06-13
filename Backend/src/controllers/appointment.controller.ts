import { Request, Response } from 'express';
import { prisma } from '../config/db';

// State machine validation mapping
const VALID_TRANSITIONS: Record<string, string[]> = {
  REQUESTED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_CONSULTATION', 'CANCELLED'],
  IN_CONSULTATION: ['COMPLETED'],
  COMPLETED: [], // Final state
  CANCELLED: []  // Final state
};

// Seed or update doctor availability (helper endpoint)
export const setAvailability = async (req: Request, res: Response) => {
  const { doctorId, dayOfWeek, startTime, endTime, slotInterval } = req.body;

  if (doctorId === undefined || dayOfWeek === undefined || !startTime || !endTime) {
    return res.status(400).json({ message: 'Missing availability details' });
  }

  try {
    const availability = await prisma.doctorAvailability.upsert({
      where: {
        doctorId_dayOfWeek: {
          doctorId,
          dayOfWeek: parseInt(dayOfWeek)
        }
      },
      update: {
        startTime,
        endTime,
        slotInterval: slotInterval ? parseInt(slotInterval) : 20
      },
      create: {
        doctorId,
        dayOfWeek: parseInt(dayOfWeek),
        startTime,
        endTime,
        slotInterval: slotInterval ? parseInt(slotInterval) : 20
      }
    });

    return res.json(availability);
  } catch (error) {
    console.error('Set availability failure:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Retrieve open slots for a doctor on a specific date (YYYY-MM-DD)
export const getAvailableSlots = async (req: Request, res: Response) => {
  const { doctorId } = req.params;
  const { date } = req.query; // YYYY-MM-DD

  if (!date) {
    return res.status(400).json({ message: 'Date query parameter is required (YYYY-MM-DD)' });
  }

  try {
    const targetDate = new Date(date as string);
    const dayOfWeek = targetDate.getDay();

    // 1. Get doctor shift rules
    const rules = await prisma.doctorAvailability.findUnique({
      where: { doctorId_dayOfWeek: { doctorId, dayOfWeek } }
    });

    if (!rules) {
      return res.json([]); // No shifts on this day
    }

    // 2. Generate potential slots
    const slots: string[] = [];
    const [startH, startM] = rules.startTime.split(':').map(Number);
    const [endH, endM] = rules.endTime.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    for (let min = startMinutes; min < endMinutes; min += rules.slotInterval) {
      const h = Math.floor(min / 60);
      const m = min % 60;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }

    // 3. Query existing non-cancelled appointments for this date
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        dateTime: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          not: 'CANCELLED'
        }
      }
    });

    // 4. Query active booking locks for this date
    const activeLocks = await prisma.bookingLock.findMany({
      where: {
        doctorId,
        slotTime: {
          gte: startOfDay,
          lte: endOfDay
        },
        expiresAt: {
          gt: new Date() // Still valid locks
        }
      }
    });

    // 5. Filter slot lists
    const bookedTimes = appointments.map(a => {
      const d = new Date(a.dateTime);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    });

    const lockedTimes = activeLocks.map(l => {
      const d = new Date(l.slotTime);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    });

    const availableSlots = slots.filter(time => {
      return !bookedTimes.includes(time) && !lockedTimes.includes(time);
    });

    return res.json(availableSlots.map(time => ({
      time,
      dateTime: new Date(`${date}T${time}:00`)
    })));
  } catch (error) {
    console.error('Get available slots failure:', error);
    return res.status(500).json({ message: 'Internal server error fetching slots' });
  }
};

// Locks a selected slot for exactly 5 minutes
export const lockSlot = async (req: Request, res: Response) => {
  const { doctorId, slotTime, lockedBy } = req.body; // slotTime should be ISO string

  if (!doctorId || !slotTime || !lockedBy) {
    return res.status(400).json({ message: 'Doctor ID, Slot Time and Lock Holder are required' });
  }

  const parsedSlot = new Date(slotTime);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes lock duration

  try {
    // Run distributed check and write in a database transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Check for existing appointment at exact slot time
      const existingAppt = await tx.appointment.findFirst({
        where: {
          doctorId,
          dateTime: parsedSlot,
          status: { not: 'CANCELLED' }
        }
      });

      if (existingAppt) {
        throw new Error('SLOT_BOOKED');
      }

      // 2. Check for active unexpired booking lock
      const existingLock = await tx.bookingLock.findFirst({
        where: {
          doctorId,
          slotTime: parsedSlot,
          expiresAt: { gt: now }
        }
      });

      if (existingLock) {
        if (existingLock.lockedBy === lockedBy) {
          // If locked by same user, extend it
          return tx.bookingLock.update({
            where: { id: existingLock.id },
            data: { expiresAt }
          });
        }
        throw new Error('SLOT_LOCKED');
      }

      // 3. Clean up expired locks for this doctor/slot if any exist
      await tx.bookingLock.deleteMany({
        where: {
          doctorId,
          slotTime: parsedSlot
        }
      });

      // 4. Create new lock
      return tx.bookingLock.create({
        data: {
          doctorId,
          slotTime: parsedSlot,
          lockedBy,
          expiresAt
        }
      });
    });

    return res.status(201).json({
      message: 'Slot locked successfully for 5 minutes',
      lock: result
    });
  } catch (error: any) {
    if (error.message === 'SLOT_BOOKED') {
      return res.status(409).json({ message: 'This slot is already booked' });
    }
    if (error.message === 'SLOT_LOCKED') {
      return res.status(423).json({ message: 'This slot is temporarily locked by another user' });
    }
    console.error('Lock slot transaction failure:', error);
    return res.status(500).json({ message: 'Failed to acquire slot lock due to concurrency conflict' });
  }
};

// Create a confirmed booking, deleting the lock
export const bookAppointment = async (req: Request, res: Response) => {
  const { patientId, doctorId, dateTime, notes, lockId } = req.body;

  if (!patientId || !doctorId || !dateTime) {
    return res.status(400).json({ message: 'Patient ID, Doctor ID, and DateTime are required' });
  }

  const parsedDate = new Date(dateTime);

  try {
    const appointment = await prisma.$transaction(async (tx) => {
      // 1. Verify slot is not already booked
      const existingAppt = await tx.appointment.findFirst({
        where: {
          doctorId,
          dateTime: parsedDate,
          status: { not: 'CANCELLED' }
        }
      });

      if (existingAppt) {
        throw new Error('SLOT_BOOKED');
      }

      // 2. Create the appointment
      const appt = await tx.appointment.create({
        data: {
          patientId,
          doctorId,
          dateTime: parsedDate,
          status: 'REQUESTED',
          notes
        }
      });

      // 3. Remove lock if lockId was supplied
      if (lockId) {
        await tx.bookingLock.deleteMany({
          where: { id: lockId }
        });
      } else {
        // Remove any lock on this slot for this doctor
        await tx.bookingLock.deleteMany({
          where: { doctorId, slotTime: parsedDate }
        });
      }

      return appt;
    });

    return res.status(201).json(appointment);
  } catch (error: any) {
    if (error.message === 'SLOT_BOOKED') {
      return res.status(409).json({ message: 'Slot already booked during lock period' });
    }
    console.error('Booking appointment failure:', error);
    return res.status(500).json({ message: 'Internal server error scheduling booking' });
  }
};

// Strict state machine modifier endpoint
export const updateAppointmentStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // New desired status

  if (!status) {
    return res.status(400).json({ message: 'New status is required' });
  }

  try {
    const appointment = await prisma.appointment.findUnique({ where: { id } });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const currentStatus = appointment.status;
    const allowedNext = VALID_TRANSITIONS[currentStatus];

    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        message: `Invalid state transition: Cannot move appointment from ${currentStatus} to ${status}.`
      });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status }
    });

    return res.json(updated);
  } catch (error) {
    console.error('Update status failure:', error);
    return res.status(500).json({ message: 'Internal server error updating status' });
  }
};

// Reschedule appointment (drag-and-drop support)
export const rescheduleAppointment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { dateTime } = req.body; // ISO String

  if (!dateTime) {
    return res.status(400).json({ message: 'New date and time is required' });
  }

  const newDateTime = new Date(dateTime);

  try {
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check availability
    const conflict = await prisma.appointment.findFirst({
      where: {
        id: { not: id },
        doctorId: appointment.doctorId,
        dateTime: newDateTime,
        status: { not: 'CANCELLED' }
      }
    });

    if (conflict) {
      return res.status(409).json({ message: 'The doctor is already booked at this rescheduled slot' });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { dateTime: newDateTime }
    });

    return res.json(updated);
  } catch (error) {
    console.error('Reschedule appointment failure:', error);
    return res.status(500).json({ message: 'Internal server error rescheduling' });
  }
};

// Fetch appointments list
export const listAppointments = async (req: Request, res: Response) => {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            sequenceId: true
          }
        }
      },
      orderBy: { dateTime: 'asc' }
    });
    return res.json(appointments);
  } catch (error) {
    console.error('List appointments failure:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
