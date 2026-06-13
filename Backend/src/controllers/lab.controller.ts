import { Request, Response } from 'express';
import { prisma } from '../config/db';
import fs from 'fs';
import path from 'path';

// Helper: Save Base64 file (similar to EMR uploads for Lab reports)
const saveBase64Report = (fileName: string, base64Data: string): string => {
  const uploadsDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
  let buffer: Buffer;
  let ext = path.extname(fileName) || '.pdf';
  let baseName = path.basename(fileName, ext) || 'lab_report';

  if (matches && matches.length === 3) {
    buffer = Buffer.from(matches[2], 'base64');
  } else {
    buffer = Buffer.from(base64Data, 'base64');
  }

  const cleanBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
  const safeName = `lab_${cleanBaseName}-${Date.now()}${ext}`;
  const filePath = path.join(uploadsDir, safeName);
  fs.writeFileSync(filePath, buffer);

  return `/uploads/${safeName}`;
};

// 1. Order a Lab Test
export const orderLabTest = async (req: Request, res: Response) => {
  const { patientId, testName } = req.body;
  const doctorId = req.user?.userId;

  if (!patientId || !testName || !doctorId) {
    return res.status(400).json({ message: 'Patient ID and test name are required' });
  }

  try {
    const patientExists = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patientExists) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const test = await prisma.labTest.create({
      data: {
        patientId,
        doctorId,
        testName,
        status: 'PENDING'
      },
      include: {
        patient: true
      }
    });

    return res.status(201).json({
      message: 'Laboratory test ordered successfully.',
      test
    });
  } catch (error) {
    console.error('[LAB] Order test failure:', error);
    return res.status(500).json({ message: 'Failed to order lab test' });
  }
};

// 2. Fetch Laboratory Queue
export const getLabQueue = async (req: Request, res: Response) => {
  try {
    const queue = await prisma.labTest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        patient: true,
        reports: true
      }
    });
    return res.json(queue);
  } catch (error) {
    console.error('[LAB] Fetch queue failure:', error);
    return res.status(500).json({ message: 'Failed to retrieve laboratory queue' });
  }
};

// 3. Update Lab Test Status (Workflow Guard)
export const updateLabStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['PENDING', 'SAMPLE_COLLECTED', 'PROCESSING', 'RESULTS_READY', 'COMPLETED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid laboratory status' });
  }

  try {
    const test = await prisma.labTest.findUnique({
      where: { id }
    });

    if (!test) {
      return res.status(404).json({ message: 'Laboratory test not found' });
    }

    // State Machine transitions enforcement:
    // Pending → Sample Collected → Processing → Results Ready → Completed
    const currentStatus = test.status;
    let validTransition = false;

    if (currentStatus === 'PENDING' && status === 'SAMPLE_COLLECTED') validTransition = true;
    else if (currentStatus === 'SAMPLE_COLLECTED' && status === 'PROCESSING') validTransition = true;
    else if (currentStatus === 'PROCESSING' && status === 'RESULTS_READY') validTransition = true;
    else if (currentStatus === 'RESULTS_READY' && status === 'COMPLETED') validTransition = true;
    else if (currentStatus === status) validTransition = true; // allow no-op

    if (!validTransition) {
      return res.status(400).json({
        message: `Invalid state jump: Cannot jump from ${currentStatus} to ${status}. Protocol sequence must be followed.`
      });
    }

    const updatedTest = await prisma.labTest.update({
      where: { id },
      data: { status },
      include: { patient: true }
    });

    return res.json({
      message: `Status transitioned to ${status}.`,
      test: updatedTest
    });
  } catch (error) {
    console.error('[LAB] Status transition failure:', error);
    return res.status(500).json({ message: 'Failed to transition laboratory test status' });
  }
};

// 4. Submit Lab Report and Complete Order
export const submitLabReport = async (req: Request, res: Response) => {
  const { id } = req.params; // LabTest ID
  const { resultSummary, fileName, fileBase64 } = req.body;

  if (!resultSummary) {
    return res.status(400).json({ message: 'Result summary is required to close lab order' });
  }

  try {
    const test = await prisma.labTest.findUnique({
      where: { id },
      include: { reports: true }
    });

    if (!test) {
      return res.status(404).json({ message: 'Laboratory test not found' });
    }

    if (test.status !== 'RESULTS_READY') {
      return res.status(400).json({
        message: `Lab test must be in RESULTS_READY status to upload reports and complete. Current: ${test.status}`
      });
    }

    let reportUrl = null;
    if (fileBase64 && fileName) {
      reportUrl = saveBase64Report(fileName, fileBase64);
    }

    // Save report details and transition test to COMPLETED
    await prisma.$transaction([
      prisma.labReport.upsert({
        where: { labTestId: id },
        create: {
          labTestId: id,
          resultSummary,
          reportUrl,
          completedAt: new Date()
        },
        update: {
          resultSummary,
          reportUrl,
          completedAt: new Date()
        }
      }),
      prisma.labTest.update({
        where: { id },
        data: { status: 'COMPLETED' }
      })
    ]);

    // Send Doctor notification simulation
    console.log(`[NOTIFICATION SYSTEM] Doctor alerted: Lab test ${test.testName} (ID: ${test.id}) for patient ${test.patientId} is completed.`);

    return res.json({
      message: 'Laboratory report generated and test marked COMPLETED.',
      reportUrl
    });
  } catch (error) {
    console.error('[LAB] Submit report failure:', error);
    return res.status(500).json({ message: 'Failed to complete laboratory report' });
  }
};

// 5. Fetch Completed Lab Reports
export const getLabReports = async (req: Request, res: Response) => {
  try {
    const reports = await prisma.labReport.findMany({
      orderBy: { completedAt: 'desc' },
      include: {
        labTest: {
          include: {
            patient: true
          }
        }
      }
    });
    return res.json(reports);
  } catch (error) {
    console.error('[LAB] Get reports failure:', error);
    return res.status(500).json({ message: 'Failed to retrieve laboratory reports list' });
  }
};
