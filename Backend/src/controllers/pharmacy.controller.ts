import { Request, Response } from 'express';
import { prisma } from '../config/db';

// 1. Get Medicines Inventory (with alerts checked)
export const getMedicines = async (req: Request, res: Response) => {
  try {
    const medicines = await prisma.medicine.findMany({
      orderBy: { name: 'asc' },
      include: { inventoryLogs: true }
    });
    return res.json(medicines);
  } catch (error) {
    console.error('[PHARMACY] Fetch medicines failure:', error);
    return res.status(500).json({ message: 'Failed to retrieve medicine inventory' });
  }
};

// 2. Add New Medicine to Stock
export const addMedicine = async (req: Request, res: Response) => {
  const { name, batchNo, price, expiryDate, stockQuantity } = req.body;

  if (!name || !batchNo || price === undefined || !expiryDate || stockQuantity === undefined) {
    return res.status(400).json({ message: 'All medicine stock parameters are required' });
  }

  try {
    const medicine = await prisma.$transaction(async (tx) => {
      // Create medicine
      const med = await tx.medicine.create({
        data: {
          name,
          batchNo,
          price: parseFloat(price),
          expiryDate: new Date(expiryDate),
          stockQuantity: parseInt(stockQuantity, 10)
        }
      });

      // Log inventory action
      await tx.inventoryLog.create({
        data: {
          medicineId: med.id,
          action: 'ADD_STOCK',
          quantity: parseInt(stockQuantity, 10)
        }
      });

      return med;
    });

    return res.status(201).json({
      message: 'New medicine batch cataloged successfully.',
      medicine
    });
  } catch (error) {
    console.error('[PHARMACY] Add medicine failure:', error);
    return res.status(500).json({ message: 'Failed to add medicine to inventory' });
  }
};

// 3. Update stock levels manually (Logs transactions)
export const updateMedicineStock = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, quantity } = req.body; // Action: ADD_STOCK, EXPIRED_REMOVED, STOCK_TAKE

  if (!action || quantity === undefined) {
    return res.status(400).json({ message: 'Action type and quantity are required' });
  }

  const validActions = ['ADD_STOCK', 'EXPIRED_REMOVED', 'STOCK_TAKE'];
  if (!validActions.includes(action)) {
    return res.status(400).json({ message: 'Invalid stock adjustments action' });
  }

  const changeQty = parseInt(quantity, 10);

  try {
    const med = await prisma.medicine.findUnique({ where: { id } });
    if (!med) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    let nextStock = med.stockQuantity;
    if (action === 'ADD_STOCK') {
      nextStock += changeQty;
    } else if (action === 'EXPIRED_REMOVED') {
      nextStock = Math.max(0, nextStock - changeQty);
    } else if (action === 'STOCK_TAKE') {
      nextStock = changeQty;
    }

    const updatedMed = await prisma.$transaction(async (tx) => {
      const updated = await tx.medicine.update({
        where: { id },
        data: { stockQuantity: nextStock }
      });

      await tx.inventoryLog.create({
        data: {
          medicineId: id,
          action,
          quantity: action === 'STOCK_TAKE' ? changeQty - med.stockQuantity : (action === 'EXPIRED_REMOVED' ? -changeQty : changeQty)
        }
      });

      return updated;
    });

    return res.json({
      message: 'Stock adjusted and transactional log registered.',
      medicine: updatedMed
    });
  } catch (error) {
    console.error('[PHARMACY] Update stock failure:', error);
    return res.status(500).json({ message: 'Failed to adjust medicine stock' });
  }
};

// 4. Create Doctor Prescription Order
export const createPrescription = async (req: Request, res: Response) => {
  const { patientId, medicineName, dosage, frequency, duration } = req.body;
  const doctorId = req.user?.userId;

  if (!patientId || !medicineName || !dosage || !frequency || !duration || !doctorId) {
    return res.status(400).json({ message: 'All prescription parameters are required' });
  }

  try {
    const patientExists = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patientExists) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const prescription = await prisma.prescription.create({
      data: {
        patientId,
        doctorId,
        medicineName,
        dosage,
        frequency,
        duration,
        status: 'PENDING'
      },
      include: {
        patient: true
      }
    });

    return res.status(201).json({
      message: 'Prescription ordered and sent to pharmacy queue.',
      prescription
    });
  } catch (error) {
    console.error('[PHARMACY] Create prescription failure:', error);
    return res.status(500).json({ message: 'Failed to write prescription order' });
  }
};

// 5. Get Prescription Queue
export const getPrescriptions = async (req: Request, res: Response) => {
  try {
    const queue = await prisma.prescription.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        patient: true
      }
    });
    return res.json(queue);
  } catch (error) {
    console.error('[PHARMACY] Fetch queue failure:', error);
    return res.status(500).json({ message: 'Failed to retrieve prescription queue' });
  }
};

// 6. Dispense Prescription (Decrement stock, logs action)
export const dispensePrescription = async (req: Request, res: Response) => {
  const { id } = req.params; // Prescription ID

  try {
    const prescription = await prisma.prescription.findUnique({
      where: { id }
    });

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription order not found' });
    }

    if (prescription.status !== 'PENDING') {
      return res.status(400).json({ message: 'Prescription has already been dispensed or cancelled' });
    }

    // Lookup corresponding medicine by name (case-insensitive check)
    const medicine = await prisma.medicine.findFirst({
      where: {
        name: {
          equals: prescription.medicineName
        }
      }
    });

    if (!medicine) {
      return res.status(400).json({
        message: `Inventory error: Medicine "${prescription.medicineName}" does not exist in the catalog. Stock must be cataloged first.`
      });
    }

    if (medicine.stockQuantity < 1) {
      return res.status(400).json({
        message: `Stock deficiency: Cannot dispense "${prescription.medicineName}". Current inventory balance is 0.`
      });
    }

    // Execute dispensing transaction: decrement stock, log dispense audit, mark prescription as DISPENSED
    await prisma.$transaction(async (tx) => {
      await tx.medicine.update({
        where: { id: medicine.id },
        data: {
          stockQuantity: {
            decrement: 1
          }
        }
      });

      await tx.inventoryLog.create({
        data: {
          medicineId: medicine.id,
          action: 'DISPENSE',
          quantity: -1
        }
      });

      await tx.prescription.update({
        where: { id },
        data: {
          status: 'DISPENSED'
        }
      });
    });

    return res.json({
      message: `Prescription successfully dispensed. Stock level for "${medicine.name}" decremented.`,
      medicineName: medicine.name
    });
  } catch (error) {
    console.error('[PHARMACY] Dispensing failure:', error);
    return res.status(500).json({ message: 'Error dispensing prescription' });
  }
};
