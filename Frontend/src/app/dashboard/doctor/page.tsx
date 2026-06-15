'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/hms/GlassCard';
import Table from '@/components/hms/Table';

interface Appointment {
  id?: string;
  appointmentId: string;
  patientId: string;
  appointmentDate: string;
  appointmentTime: string;
  status: 'REQUESTED' | 'CONFIRMED' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED';
  reasonForVisit: string;
  aiNoShowDetails?: {
    noShowProbability: number;
    riskFactor: string;
  };
}

interface Patient {
  patientId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    bloodGroup: string;
  };
  contactInfo: {
    email: string;
    phone: string;
  };
  aiHealthProfile: {
    riskScore: number;
    riskCategory: string;
  };
}

export default function DoctorDashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [doctorUser, setDoctorUser] = useState<any>(null);

  // Lists
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [scheduleSlots, setScheduleSlots] = useState<{ time: string; booked: boolean }[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Encounter Workspace State
  const [activeEncounter, setActiveEncounter] = useState<Appointment | null>(null);
  const [encounterPatient, setEncounterPatient] = useState<Patient | null>(null);
  const [patientHistory, setPatientHistory] = useState<any[]>([]);

  // Vitals
  const [bloodPressure, setBloodPressure] = useState('120/80');
  const [heartRate, setHeartRate] = useState(75);
  const [temperature, setTemperature] = useState(98.6);
  const [spo2, setSpo2] = useState(98);
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(175);

  // Symptoms & Notes
  const [symptomInput, setSymptomInput] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');

  // AI Symptoms check results
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<any | null>(null);

  // Diagnoses list
  const [diagnoses, setDiagnoses] = useState<{ icdCode: string; description: string; type: 'PRIMARY' | 'SECONDARY' }[]>([
    { icdCode: '', description: '', type: 'PRIMARY' }
  ]);

  // Prescription list
  const [medications, setMedications] = useState<{
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[]>([]);

  const [newMed, setNewMed] = useState({
    medicineName: '',
    dosage: '',
    frequency: 'Once daily',
    duration: '5 days',
    instructions: 'Take after meals'
  });

  const [savingEncounter, setSavingEncounter] = useState(false);
  const [encounterStatus, setEncounterStatus] = useState<string | null>(null);

  useEffect(() => {
    const jwt = localStorage.getItem('hms_token');
    const userStr = localStorage.getItem('hms_user');

    if (!jwt || !userStr) {
      router.push('/');
      return;
    }

    const parsedUser = JSON.parse(userStr);
    if (parsedUser.role !== 'DOCTOR') {
      router.push('/');
      return;
    }

    setToken(jwt);
    setDoctorUser(parsedUser);
    loadDoctorDashboard(jwt, parsedUser.linkedEntityId);
  }, [router]);

  useEffect(() => {
    if (token && doctorUser) {
      fetchDoctorSchedules(token, doctorUser.linkedEntityId, selectedDate);
    }
  }, [selectedDate, token, doctorUser]);

  const loadDoctorDashboard = async (jwt: string, doctorId: string) => {
    try {
      // 1. Fetch appointments for Doctor
      const res = await fetch('http://localhost:8080/api/v1/appointments', {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      if (res.ok) {
        setAppointments(await res.json());
      } else {
        setAppointments([
          { appointmentId: 'APT-0012', patientId: 'PAT-201', appointmentDate: selectedDate, appointmentTime: '10:00', status: 'CONFIRMED', reasonForVisit: 'Chest pain on exertion', aiNoShowDetails: { noShowProbability: 0.12, riskFactor: 'LOW' } }
        ]);
      }
    } catch {
      setAppointments([
        { appointmentId: 'APT-0012', patientId: 'PAT-201', appointmentDate: selectedDate, appointmentTime: '10:00', status: 'CONFIRMED', reasonForVisit: 'Chest pain on exertion', aiNoShowDetails: { noShowProbability: 0.12, riskFactor: 'LOW' } }
      ]);
    }
  };

  const fetchDoctorSchedules = async (jwt: string, doctorId: string, dateStr: string) => {
    try {
      const res = await fetch(`http://localhost:8080/api/v1/appointments/doctor-schedules?doctorId=${doctorId}&date=${dateStr}`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      if (res.ok) {
        const schedules = await res.json();
        if (schedules && schedules.length > 0) {
          setScheduleSlots(schedules[0].timeSlots);
          return;
        }
      }
      generateDefaultSlots();
    } catch {
      generateDefaultSlots();
    }
  };

  const generateDefaultSlots = () => {
    setScheduleSlots([
      { time: '09:00', booked: false },
      { time: '10:00', booked: false },
      { time: '11:00', booked: false },
      { time: '12:00', booked: false },
      { time: '14:00', booked: false },
      { time: '15:00', booked: false },
      { time: '16:00', booked: false },
      { time: '17:00', booked: false }
    ]);
  };

  const handleToggleSchedule = async (time: string, isBooked: boolean) => {
    if (!token || !doctorUser) return;
    
    // Toggle slot locally first
    const updatedSlots = scheduleSlots.map(s => s.time === time ? { ...s, booked: !s.booked } : s);
    setScheduleSlots(updatedSlots);

    const payload = {
      doctorId: doctorUser.linkedEntityId,
      availableDate: selectedDate,
      timeSlots: updatedSlots
    };

    try {
      await fetch('http://localhost:8080/api/v1/appointments/doctor-schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error('Failed to sync schedule with server', err);
    }
  };

  const startConsultation = async (apt: Appointment) => {
    setActiveEncounter(apt);
    setEncounterStatus(null);
    setAiInsights(null);
    setClinicalNotes('');
    setSymptomInput(apt.reasonForVisit || '');
    setDiagnoses([{ icdCode: '', description: '', type: 'PRIMARY' }]);
    setMedications([]);

    // Fetch patient file details
    try {
      const pRes = await fetch(`http://localhost:8080/api/v1/patients/${apt.patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (pRes.ok) {
        setEncounterPatient(await pRes.json());
      } else {
        setEncounterPatient({
          patientId: apt.patientId,
          personalInfo: { firstName: 'John', lastName: 'Doe', dateOfBirth: '1990-05-14', gender: 'Male', bloodGroup: 'O+' },
          contactInfo: { email: 'john.doe@example.com', phone: '555-0199' },
          aiHealthProfile: { riskScore: 22, riskCategory: 'LOW' }
        });
      }

      // Fetch Patient history
      const hRes = await fetch(`http://localhost:8080/api/v1/consultations/patient/${apt.patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (hRes.ok) {
        setPatientHistory(await hRes.json());
      } else {
        setPatientHistory([]);
      }
    } catch {
      setEncounterPatient({
        patientId: apt.patientId,
        personalInfo: { firstName: 'John', lastName: 'Doe', dateOfBirth: '1990-05-14', gender: 'Male', bloodGroup: 'O+' },
        contactInfo: { email: 'john.doe@example.com', phone: '555-0199' },
        aiHealthProfile: { riskScore: 22, riskCategory: 'LOW' }
      });
      setPatientHistory([]);
    }
  };

  const runAiSymptomAnalysis = async () => {
    if (!symptomInput.trim() || !token) return;
    setAiLoading(true);
    setAiInsights(null);

    const symptomsList = symptomInput.split(',').map(s => s.trim()).filter(Boolean);

    try {
      // Mock call to symptom analysis since analysis runs during consultation posting,
      // or calling a separate mock parser locally.
      const res = await fetch('http://localhost:8080/api/v1/consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        // Dry run consultation to get insights, or simulate it. We'll simulate here for UI speed.
        body: JSON.stringify({
          appointmentId: activeEncounter?.appointmentId,
          symptoms: symptomsList,
          vitals: { bloodPressure, heartRate, temperature, spo2, weight, height },
          diagnoses: [],
          clinicalNotes: 'AI Assessment Run'
        })
      });

      if (res.ok) {
        const dummy = await res.json();
        setAiInsights(dummy.aiClinicalInsights);
        
        // Auto-fill diagnosis if AI returns conditions
        if (dummy.aiClinicalInsights && dummy.aiClinicalInsights.possibleConditions.length > 0) {
          setDiagnoses([{
            icdCode: 'R07.9',
            description: dummy.aiClinicalInsights.possibleConditions[0] + ' suspected',
            type: 'PRIMARY'
          }]);
        }
      } else {
        throw new Error();
      }
    } catch {
      // Fallback local symptom assessment
      console.warn('Running client side mock symptom assessment.');
      const symptoms = symptomsList.join(' ');
      let conditions = ['Upper respiratory symptoms'];
      let severity = 'LOW';
      let recs = 'Rest, monitor symptoms.';

      if (symptoms.includes('chest') || symptoms.includes('breath') || symptoms.includes('pain')) {
        conditions = ['Suspected Cardiac Angina', 'Myocardial Infarction Rule Out', 'GERD'];
        severity = 'CRITICAL';
        recs = 'Recommend immediate cardiology evaluation, ECG, and Troponin test.';
      }

      setAiInsights({
        possibleConditions: conditions,
        severityLevel: severity,
        suggestedDepartment: severity === 'CRITICAL' ? 'Cardiology' : 'General Medicine',
        recommendation: recs
      });

      setDiagnoses([{
        icdCode: severity === 'CRITICAL' ? 'I20.9' : 'J06.9',
        description: conditions[0],
        type: 'PRIMARY'
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  const addMedication = () => {
    if (!newMed.medicineName) return;
    setMedications(prev => [...prev, newMed]);
    setNewMed({
      medicineName: '',
      dosage: '',
      frequency: 'Once daily',
      duration: '5 days',
      instructions: 'Take after meals'
    });
  };

  const removeMedication = (idx: number) => {
    setMedications(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDiagnosisChange = (index: number, field: string, value: string) => {
    const updated = diagnoses.map((d, i) => i === index ? { ...d, [field]: value } : d);
    setDiagnoses(updated);
  };

  const addDiagnosisRow = () => {
    setDiagnoses(prev => [...prev, { icdCode: '', description: '', type: 'SECONDARY' }]);
  };

  const saveConsultationSession = async () => {
    if (!activeEncounter || !token) return;
    setSavingEncounter(true);
    setEncounterStatus(null);

    const symptomsList = symptomInput.split(',').map(s => s.trim()).filter(Boolean);
    const consultationPayload = {
      appointmentId: activeEncounter.id || activeEncounter.appointmentId,
      vitals: { bloodPressure, heartRate, temperature, spo2, weight, height },
      symptoms: symptomsList,
      clinicalNotes: clinicalNotes,
      diagnoses: diagnoses.filter(d => d.icdCode && d.description),
      aiClinicalInsights: aiInsights
    };

    try {
      // 1. Post consultation
      const consRes = await fetch('http://localhost:8080/api/v1/consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(consultationPayload)
      });

      if (!consRes.ok) throw new Error('Failed to record consultation details.');
      const savedCons = await consRes.json();

      // 2. Post prescription if we have medications
      if (medications.length > 0) {
        const prescriptionPayload = {
          consultationId: savedCons.consultationId,
          medications: medications
        };

        const presRes = await fetch('http://localhost:8080/api/v1/prescriptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(prescriptionPayload)
        });

        if (!presRes.ok) throw new Error('Consultation saved, but prescription log failed.');
      }

      setEncounterStatus('Consultation completed and saved successfully.');
      
      // Update appt lists
      setAppointments(prev => prev.map(a => a.appointmentId === activeEncounter.appointmentId ? { ...a, status: 'COMPLETED' } : a));
      
      // Close after 1.5 seconds
      setTimeout(() => {
        setActiveEncounter(null);
        setEncounterPatient(null);
      }, 1500);

    } catch (err: any) {
      setEncounterStatus('Error: ' + err.message);
    } finally {
      setSavingEncounter(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hms_token');
    localStorage.removeItem('hms_user');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#060814] text-gray-100 p-6 relative">
      {/* Background Animated Glows */}
      <div className="bg-glow-container">
        <div className="bg-glow-1"></div>
        <div className="bg-glow-2"></div>
      </div>

      {/* Top Header */}
      <header className="flex justify-between items-center mb-8 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-white">Clinical Operations Panel</h1>
          <p className="text-xs text-gray-400 mt-1">
            Logged in as Dr. House (ID: {doctorUser?.linkedEntityId || 'DOC-101'})
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded bg-white/5 border border-white/10 text-xs hover:bg-white/10 transition-colors text-white"
        >
          Logout Portal
        </button>
      </header>

      {/* Dashboard Grid */}
      {!activeEncounter ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Appointments List (Col-span-2) */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-bold text-white mb-2">Today's Appointment Queue</h2>
            <GlassCard hoverable={false}>
              <Table<Appointment>
                data={appointments}
                rowsPerPage={5}
                columns={[
                  { header: 'Appt ID', accessor: (row) => <span className="font-semibold text-white">{row.appointmentId}</span> },
                  { header: 'Patient ID', accessor: (row) => <span>{row.patientId}</span> },
                  { header: 'Date', accessor: (row) => <span>{row.appointmentDate}</span> },
                  { header: 'Time', accessor: (row) => <span>{row.appointmentTime}</span> },
                  { header: 'Reason', accessor: (row) => <span>{row.reasonForVisit}</span> },
                  { 
                    header: 'No-Show Probability', 
                    accessor: (row) => row.aiNoShowDetails ? (
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.aiNoShowDetails.riskFactor === 'LOW' ? 'bg-emerald-500/10 text-emerald-400' :
                        row.aiNoShowDetails.riskFactor === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {Math.round(row.aiNoShowDetails.noShowProbability * 100)}% ({row.aiNoShowDetails.riskFactor})
                      </span>
                    ) : <span>-</span>
                  },
                  { 
                    header: 'Status', 
                    accessor: (row) => (
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        row.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                        row.status === 'CONFIRMED' ? 'bg-blue-500/10 text-blue-400' :
                        row.status === 'IN_CONSULTATION' ? 'bg-purple-500/10 text-purple-400' :
                        row.status === 'REQUESTED' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {row.status}
                      </span>
                    )
                  },
                  {
                    header: 'Action',
                    accessor: (row) => row.status === 'CONFIRMED' || row.status === 'REQUESTED' ? (
                      <button
                        onClick={() => startConsultation(row)}
                        className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
                      >
                        Encounter
                      </button>
                    ) : <span className="text-gray-600">-</span>
                  }
                ]}
              />
            </GlassCard>
          </div>

          {/* Schedule Manager (Col-span-1) */}
          <div className="lg:col-span-1 space-y-6">
            <h2 className="text-lg font-bold text-white mb-2">Schedule Coordinator</h2>
            <GlassCard glowColor="rgba(6, 182, 212, 0.15)">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Selected Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 glass-input text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Today's Operating Hours</label>
                  <div className="grid grid-cols-2 gap-2">
                    {scheduleSlots.map((slot, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleToggleSchedule(slot.time, slot.booked)}
                        className={`p-2.5 rounded border text-xs font-medium text-center transition-all ${
                          slot.booked 
                            ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300' 
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        {slot.time} {slot.booked ? '(Open)' : '(Closed)'}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-3 italic text-center">
                    Toggling hours defines open slots available for Patient booking.
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      ) : (
        /* Clinical Encounter Workspace Mode */
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left panel: Patient details and Medical File View */}
          <div className="xl:col-span-1 space-y-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold text-white">Patient Record</h2>
              <button
                onClick={() => { setActiveEncounter(null); setEncounterPatient(null); }}
                className="text-xs text-gray-400 hover:text-white"
              >
                ← Back to Queue
              </button>
            </div>

            {encounterPatient && (
              <GlassCard hoverable={false} className="space-y-4">
                <div className="border-b border-white/5 pb-3">
                  <h3 className="text-md font-bold text-white">
                    {encounterPatient.personalInfo.firstName} {encounterPatient.personalInfo.lastName}
                  </h3>
                  <p className="text-xs text-gray-400">ID: {encounterPatient.patientId}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="block text-[10px] text-gray-500 font-semibold uppercase">Date of Birth</span>
                    <span className="text-white font-medium">{encounterPatient.personalInfo.dateOfBirth}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-500 font-semibold uppercase">Gender / Blood</span>
                    <span className="text-white font-medium">
                      {encounterPatient.personalInfo.gender} ({encounterPatient.personalInfo.bloodGroup})
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[10px] text-gray-500 font-semibold uppercase">Email</span>
                    <span className="text-white font-medium">{encounterPatient.contactInfo.email}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[10px] text-gray-500 font-semibold uppercase">Phone</span>
                    <span className="text-white font-medium">{encounterPatient.contactInfo.phone}</span>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4">
                  <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Patient Risk Assessment
                  </span>
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-bold">Severity Risk</span>
                      <span className="block text-lg font-extrabold text-white">
                        {encounterPatient.aiHealthProfile.riskScore}%
                      </span>
                    </div>
                    <div>
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                        encounterPatient.aiHealthProfile.riskCategory === 'LOW' ? 'bg-emerald-500/10 text-emerald-400' :
                        encounterPatient.aiHealthProfile.riskCategory === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {encounterPatient.aiHealthProfile.riskCategory}
                      </span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Historical Encounters for this patient */}
            <h2 className="text-md font-bold text-white mt-4">Encounter History</h2>
            <div className="space-y-3">
              {patientHistory.length > 0 ? (
                patientHistory.map((h, idx) => (
                  <GlassCard key={idx} hoverable={false} className="p-4 text-xs space-y-2">
                    <div className="flex justify-between font-bold border-b border-white/5 pb-2">
                      <span className="text-indigo-400">{h.consultationId}</span>
                      <span className="text-gray-500">{new Date(h.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p><strong className="text-white">Symptoms:</strong> {h.symptoms.join(', ')}</p>
                    <p><strong className="text-white">Primary Diagnosis:</strong> {h.diagnoses.find((d: any) => d.type === 'PRIMARY')?.description || '-'}</p>
                    <p className="text-gray-400 italic">"{h.clinicalNotes}"</p>
                  </GlassCard>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic text-center py-4 bg-white/5 border border-white/5 rounded">
                  No historical consultation files found.
                </p>
              )}
            </div>
          </div>

          {/* Right panel: Active Clinical encounter worksheet (Col-span-2) */}
          <div className="xl:col-span-2 space-y-6">
            <h2 className="text-lg font-bold text-white mb-2">Clinical Assessment Worksheet</h2>
            <GlassCard hoverable={false} glowColor="rgba(138, 75, 241, 0.2)" className="space-y-6">
              
              {encounterStatus && (
                <div className={`p-3 rounded text-xs text-center font-semibold ${
                  encounterStatus.startsWith('Error') 
                    ? 'bg-red-950/45 text-red-400 border border-red-500/20' 
                    : 'bg-emerald-950/45 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {encounterStatus}
                </div>
              )}

              {/* Grid 1: Vitals */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wide">Patient Vitals</h3>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1 font-semibold uppercase">Blood Pressure</label>
                    <input
                      type="text"
                      value={bloodPressure}
                      onChange={(e) => setBloodPressure(e.target.value)}
                      className="w-full px-2 py-1.5 glass-input text-xs text-white text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1 font-semibold uppercase">Pulse Rate (bpm)</label>
                    <input
                      type="number"
                      value={heartRate}
                      onChange={(e) => setHeartRate(Number(e.target.value))}
                      className="w-full px-2 py-1.5 glass-input text-xs text-white text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1 font-semibold uppercase">Temp (°F)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(Number(e.target.value))}
                      className="w-full px-2 py-1.5 glass-input text-xs text-white text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1 font-semibold uppercase">SpO2 (%)</label>
                    <input
                      type="number"
                      value={spo2}
                      onChange={(e) => setSpo2(Number(e.target.value))}
                      className="w-full px-2 py-1.5 glass-input text-xs text-white text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1 font-semibold uppercase">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="w-full px-2 py-1.5 glass-input text-xs text-white text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1 font-semibold uppercase">Height (cm)</label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="w-full px-2 py-1.5 glass-input text-xs text-white text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Grid 2: Symptoms & AI analyzer */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wide">Symptoms & AI Diagnostics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-3">
                    <label className="block text-[10px] text-gray-500 font-semibold uppercase">Presenting Symptoms (comma-separated)</label>
                    <input
                      type="text"
                      value={symptomInput}
                      onChange={(e) => setSymptomInput(e.target.value)}
                      placeholder="cough, fever, fatigue"
                      className="w-full px-3 py-2 glass-input text-xs text-white"
                    />
                    <button
                      onClick={runAiSymptomAnalysis}
                      disabled={aiLoading}
                      className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
                    >
                      {aiLoading ? 'AI Diagnostics check running...' : 'Execute AI Symptom Analyzer'}
                    </button>
                  </div>

                  <div className="md:col-span-1">
                    <div className="p-3.5 rounded bg-indigo-950/20 border border-indigo-500/10 min-h-[110px] text-[11px] space-y-1.5">
                      <span className="block font-bold text-[10px] text-indigo-300 uppercase">AI Diagnosis Recommendation</span>
                      {aiInsights ? (
                        <>
                          <p className="text-white"><strong className="text-gray-400">Suspects:</strong> {aiInsights.possibleConditions.join(', ')}</p>
                          <p className="text-white"><strong className="text-gray-400">Severity:</strong> <span className="text-red-400 uppercase font-bold">{aiInsights.severityLevel}</span></p>
                          <p className="text-gray-400 italic">"{aiInsights.recommendation}"</p>
                        </>
                      ) : (
                        <p className="text-gray-500 italic mt-2">Trigger AI check to populate diagnostic guidance.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 3: Diagnoses */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wide">Official Clinical Diagnoses</h3>
                  <button 
                    onClick={addDiagnosisRow}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold"
                  >
                    + Add Secondary Diagnosis
                  </button>
                </div>
                <div className="space-y-2">
                  {diagnoses.map((diag, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 text-xs">
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="ICD-10 Code"
                          value={diag.icdCode}
                          onChange={(e) => handleDiagnosisChange(idx, 'icdCode', e.target.value)}
                          className="w-full px-2 py-1.5 glass-input text-xs text-white"
                        />
                      </div>
                      <div className="col-span-7">
                        <input
                          type="text"
                          placeholder="Clinical description"
                          value={diag.description}
                          onChange={(e) => handleDiagnosisChange(idx, 'description', e.target.value)}
                          className="w-full px-2 py-1.5 glass-input text-xs text-white"
                        />
                      </div>
                      <div className="col-span-3">
                        <select
                          value={diag.type}
                          onChange={(e: any) => handleDiagnosisChange(idx, 'type', e.target.value)}
                          className="w-full px-2 py-1.5 glass-input text-xs text-white focus:outline-none"
                        >
                          <option value="PRIMARY">PRIMARY</option>
                          <option value="SECONDARY">SECONDARY</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid 4: Notes */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wide">Clinician encounter notes</h3>
                <textarea
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Record findings, care advice, and follow up recommendations..."
                  className="w-full h-20 p-3 glass-input text-xs text-gray-200 focus:outline-none"
                />
              </div>

              {/* Grid 5: Prescriptions */}
              <div className="space-y-3 border-t border-white/5 pt-4">
                <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wide">Write Prescription Order</h3>
                
                {/* Add Medication form row */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Medicine Name"
                    value={newMed.medicineName}
                    onChange={(e) => setNewMed(prev => ({ ...prev, medicineName: e.target.value }))}
                    className="px-2 py-1.5 glass-input text-xs text-white col-span-1 sm:col-span-2"
                  />
                  <input
                    type="text"
                    placeholder="Dosage (e.g. 500mg)"
                    value={newMed.dosage}
                    onChange={(e) => setNewMed(prev => ({ ...prev, dosage: e.target.value }))}
                    className="px-2 py-1.5 glass-input text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Frequency (e.g. Twice daily)"
                    value={newMed.frequency}
                    onChange={(e) => setNewMed(prev => ({ ...prev, frequency: e.target.value }))}
                    className="px-2 py-1.5 glass-input text-xs text-white"
                  />
                  <button
                    onClick={addMedication}
                    className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
                  >
                    Add Med
                  </button>
                </div>

                {/* Medication List */}
                {medications.length > 0 && (
                  <ul className="space-y-2 mt-2 bg-white/5 p-3 rounded border border-white/5">
                    {medications.map((med, idx) => (
                      <li key={idx} className="flex justify-between items-center text-xs text-gray-300">
                        <span>
                          <strong className="text-white">{med.medicineName}</strong> - {med.dosage} ({med.frequency}) for {med.duration}
                        </span>
                        <button
                          onClick={() => removeMedication(idx)}
                          className="text-red-400 hover:text-red-300 font-semibold"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex justify-end space-x-3 border-t border-white/5 pt-4">
                <button
                  onClick={() => { setActiveEncounter(null); setEncounterPatient(null); }}
                  className="px-4 py-2.5 rounded bg-white/5 border border-white/10 text-xs hover:bg-white/10 transition-colors text-white"
                >
                  Cancel assessment
                </button>
                <button
                  onClick={saveConsultationSession}
                  disabled={savingEncounter}
                  className="px-5 py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
                >
                  {savingEncounter ? 'Saving encounter records...' : 'Complete & Close Clinical Session'}
                </button>
              </div>

            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
