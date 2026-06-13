import { Request, Response } from 'express';
import { OpenAI } from 'openai';
import { prisma } from '../config/db';
import { getClinicalHistory } from '../utils/clinicalDb';
import { getMedicalRecords } from '../utils/recordDb';

const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

// Unalterable medical disclaimer
const MEDICAL_DISCLAIMER = "This analysis is AI-generated and is for triaging purposes only. Please consult a qualified medical professional or go to the nearest emergency room for formal diagnosis.";

// Hardcoded department maps for demonstration / tool resolve
const DEPARTMENT_DOCTORS: Record<string, { doctorId: string, name: string, keyword: string }> = {
  Cardiology: { doctorId: 'doc-cardiology-uuid', name: 'Dr. Sarah Jenkins (Cardiology)', keyword: 'chest' },
  Orthopedics: { doctorId: 'doc-orthopedics-uuid', name: 'Dr. Robert Chen (Orthopedics)', keyword: 'bone' },
  Pediatrics: { doctorId: 'doc-pediatrics-uuid', name: 'Dr. Emily Watson (Pediatrics)', keyword: 'child' },
  GeneralMedicine: { doctorId: 'doc-general-uuid', name: 'Dr. John Doe (General Medicine)', keyword: 'cough' }
};

// 1. AI Symptom Analyzer & Triage Guide
export const analyzeSymptoms = async (req: Request, res: Response) => {
  const { symptoms } = req.body;

  if (!symptoms || typeof symptoms !== 'string') {
    return res.status(400).json({ message: 'Symptoms description text is required' });
  }

  try {
    if (openai) {
      // Call OpenAI API for structured response
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert AI triage nurse. Analyze the symptoms provided.
Return a JSON object matching this structure:
{
  "conditions": ["Condition 1", "Condition 2", "Condition 3"],
  "department": "Cardiology" | "Orthopedics" | "Pediatrics" | "GeneralMedicine",
  "urgency": "Low" | "Medium" | "High",
  "disclaimer": "${MEDICAL_DISCLAIMER}"
}
Ensure the disclaimer matches EXACTLY. Do not add markdown or backticks.`
          },
          { role: 'user', content: symptoms }
        ],
        response_format: { type: 'json_object' }
      });

      const parsed = JSON.parse(response.choices[0].message.content || '{}');
      return res.json(parsed);
    } else {
      // Fallback local rule engine if no API key is set
      console.log('[AI Triage] No OpenAI Key. Using local rules engine.');
      let conditions = ['Viral Infection', 'Common Cold', 'Mild Fatigue'];
      let department = 'GeneralMedicine';
      let urgency = 'Low';

      const lower = symptoms.toLowerCase();
      if (lower.includes('chest') || lower.includes('heart') || lower.includes('breathing')) {
        conditions = ['Angina Pectoris', 'Myocardial Infarction Suspect', 'Arrhythmia'];
        department = 'Cardiology';
        urgency = 'High';
      } else if (lower.includes('bone') || lower.includes('joint') || lower.includes('fracture') || lower.includes('sprain')) {
        conditions = ['Bone Fracture', 'Joint Dislocation', 'Severe Ligament Sprain'];
        department = 'Orthopedics';
        urgency = 'Medium';
      } else if (lower.includes('child') || lower.includes('baby') || lower.includes('kid')) {
        conditions = ['Pediatric Influenza', 'Gastroenteritis', 'Middle Ear Infection'];
        department = 'Pediatrics';
        urgency = 'Medium';
      }

      return res.json({
        conditions,
        department,
        urgency,
        disclaimer: MEDICAL_DISCLAIMER
      });
    }
  } catch (error) {
    console.error('Symptom triage error:', error);
    return res.status(500).json({ message: 'Error analyzing symptoms' });
  }
};

// 2. AI Conversational Appointment Assistant
export const chatAssistant = async (req: Request, res: Response) => {
  const { message, conversationHistory = [] } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Chat message is required' });
  }

  try {
    let responseText = '';
    let parsedAction: {
      action?: 'SEARCH_SLOTS' | 'BOOK_SLOT';
      department?: string;
      doctorId?: string;
      slotTime?: string;
      needClarification?: boolean;
    } = {};

    if (openai) {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful Hospital Assistant. Converse naturally with the user and resolve symptoms to departments:
- "chest/heart/breathing" -> Cardiology (Dr. Sarah Jenkins)
- "fracture/bone/joint" -> Orthopedics (Dr. Robert Chen)
- "child/baby/kid" -> Pediatrics (Dr. Emily Watson)
- Default / cough / fever / general -> GeneralMedicine (Dr. John Doe)

If the user wants to book or complains of symptoms:
1. Resolve the department.
2. Signal you want to search availability by outputting a JSON block with:
{
  "responseText": "Your natural response here.",
  "action": "SEARCH_SLOTS",
  "department": "Cardiology" | "Orthopedics" | "Pediatrics" | "GeneralMedicine"
}
If they are just talking, reply with action: null.
Ensure output is clean JSON.`
          },
          ...conversationHistory.map((h: any) => ({ role: h.role, content: h.content })),
          { role: 'user', content: message }
        ],
        response_format: { type: 'json_object' }
      });

      const data = JSON.parse(response.choices[0].message.content || '{}');
      responseText = data.responseText || 'How can I assist you today?';
      parsedAction = data;
    } else {
      // Local fallback rules for chat assistant
      const lower = message.toLowerCase();
      responseText = `I understand. Let me check the schedule for you.`;
      
      let resolvedDept = 'GeneralMedicine';
      if (lower.includes('chest') || lower.includes('heart')) {
        resolvedDept = 'Cardiology';
      } else if (lower.includes('bone') || lower.includes('fracture') || lower.includes('sprain')) {
        resolvedDept = 'Orthopedics';
      } else if (lower.includes('child') || lower.includes('kid')) {
        resolvedDept = 'Pediatrics';
      }

      parsedAction = {
        action: 'SEARCH_SLOTS',
        department: resolvedDept
      };
      
      const doc = DEPARTMENT_DOCTORS[resolvedDept];
      responseText = `It sounds like you might need to see a specialist in ${resolvedDept}. I'm searching for open slots with ${doc.name}.`;
    }

    // Process Tool/Function execution: if the AI wants to search slots
    let slots: any[] = [];
    let doctorName = '';
    let resolvedDoctorId = '';

    if (parsedAction.action === 'SEARCH_SLOTS' && parsedAction.department) {
      const docInfo = DEPARTMENT_DOCTORS[parsedAction.department];
      if (docInfo) {
        // Query the database to find actual doctor user ID
        const docUser = await prisma.user.findFirst({
          where: {
            role: 'DOCTOR',
            email: { contains: parsedAction.department.toLowerCase() }
          }
        });
        
        resolvedDoctorId = docUser?.id || docInfo.doctorId;
        doctorName = docInfo.name;

        // Fetch availability for tomorrow/today
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];

        const dayOfWeek = tomorrow.getDay();
        const rules = await prisma.doctorAvailability.findUnique({
          where: { doctorId_dayOfWeek: { doctorId: resolvedDoctorId, dayOfWeek } }
        });

        if (rules) {
          // Mock available slots dynamically for the chat response
          const slotsAvail = ['09:00', '10:00', '11:00', '14:00', '15:20'];
          slots = slotsAvail.map(time => ({
            time,
            dateTime: new Date(`${dateStr}T${time}:00`)
          }));
        } else {
          // Add default fallback slots
          slots = [
            { time: '10:00', dateTime: new Date(`${dateStr}T10:00:00`) },
            { time: '11:20', dateTime: new Date(`${dateStr}T11:20:00`) },
            { time: '14:00', dateTime: new Date(`${dateStr}T14:00:00`) }
          ];
        }
      }
    }

    return res.json({
      response: responseText,
      action: parsedAction.action || null,
      department: parsedAction.department || null,
      doctorId: resolvedDoctorId,
      doctorName,
      slots
    });
  } catch (error) {
    console.error('Chat assistant error:', error);
    return res.status(500).json({ message: 'Error processing chat assistant' });
  }
};

// 3. AI Medical Record Summarizer
export const summarizeMedicalRecord = async (req: Request, res: Response) => {
  const { id } = req.params; // patientId

  try {
    // Collect 1: Patient demographics
    const patient = await prisma.patient.findUnique({
      where: { id }
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Collect 2: MongoDB Clinical History
    const medicalHistory = await getClinicalHistory(id) || {
      chronicConditions: [],
      allergies: [],
      pastOperations: [],
      familyHistory: []
    };

    // Collect 3: Uploaded medical files (EMRs)
    const emrRecords = await getMedicalRecords(id);

    // Collect 4: Lab reports
    const labReports = await prisma.labReport.findMany({
      where: {
        labTest: {
          patientId: id
        }
      },
      include: {
        labTest: true
      }
    });

    // Collect 5: Prescriptions
    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: id }
    });

    // Structure raw text data for OpenAI context
    const patientDossier = {
      demographics: {
        name: `${patient.firstName} ${patient.lastName}`,
        dob: patient.dob,
        gender: patient.gender
      },
      clinicalHistory: {
        chronicConditions: medicalHistory.chronicConditions.map((c: any) => ({ name: c.conditionName, status: c.status })),
        allergies: medicalHistory.allergies.map((a: any) => ({ allergen: a.allergen, severity: a.severity, reaction: a.reaction })),
        surgeries: medicalHistory.pastOperations.map((o: any) => ({ procedure: o.procedure, date: o.date, surgeon: o.surgeon }))
      },
      uploadedRecords: emrRecords.map((r: any) => ({ title: r.title, description: r.description, category: r.recordType })),
      labReports: labReports.map((lr: any) => ({ testName: lr.labTest.testName, resultSummary: lr.resultSummary, completedAt: lr.completedAt })),
      prescriptions: prescriptions.map((p: any) => ({ medicine: p.medicineName, dosage: p.dosage, frequency: p.frequency, duration: p.duration, status: p.status }))
    };

    if (openai) {
      const prompt = `Analyze this patient medical dossier and generate a concise, structured clinical summary.
Dossier: ${JSON.stringify(patientDossier, null, 2)}

Return a JSON object matching this structure EXACTLY:
{
  "chronicDiseases": ["Condition 1", "Condition 2"],
  "allergies": ["Allergen - Severity (Reaction)"],
  "surgeries": ["Procedure (Date/Year)"],
  "activeMedications": ["Medicine Name - Dosage (Frequency)"]
}
Ensure there is no markdown formatting, no backticks, just raw JSON.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert AI clinical data summarizer.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      });

      const parsed = JSON.parse(response.choices[0].message.content || '{}');
      return res.json(parsed);
    } else {
      // Fallback rule engine that extracts values directly and formats them
      console.log('[AI Summarizer] No OpenAI Key. Running local heuristics engine.');
      
      const chronicDiseases = medicalHistory.chronicConditions
        .filter((c: any) => c.status === 'Active')
        .map((c: any) => c.conditionName);

      const allergies = medicalHistory.allergies
        .map((a: any) => `${a.allergen} - ${a.severity}${a.reaction ? ` (${a.reaction})` : ''}`);

      const surgeries = medicalHistory.pastOperations
        .map((o: any) => {
          const year = o.date ? new Date(o.date).getFullYear() : 'N/A';
          return `${o.procedure} (${year})`;
        });

      // Active medications
      const activeMedications = prescriptions
        .filter((p: any) => p.status === 'DISPENSED' || p.status === 'PENDING')
        .map((p: any) => `${p.medicineName} - ${p.dosage} (${p.frequency})`);

      // Add any EMR records of type Prescription
      emrRecords
        .filter((r: any) => r.recordType === 'Prescription')
        .forEach((r: any) => {
          activeMedications.push(`${r.title} (Uploaded prescription: ${r.description})`);
        });

      // If empty, supply clean notice
      if (activeMedications.length === 0) activeMedications.push('No active medications recorded');
      if (chronicDiseases.length === 0) chronicDiseases.push('No active chronic conditions recorded');
      if (allergies.length === 0) allergies.push('No allergies recorded');
      if (surgeries.length === 0) surgeries.push('No surgical history recorded');

      return res.json({
        chronicDiseases,
        allergies,
        surgeries,
        activeMedications
      });
    }
  } catch (error) {
    console.error('[AI Summarizer] Summarization error:', error);
    return res.status(500).json({ message: 'Error summarizing patient medical records' });
  }
};

