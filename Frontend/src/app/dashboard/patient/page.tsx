'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/hms/GlassCard';
import Table from '@/components/hms/Table';

interface PatientProfile {
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
    address: string;
  };
  aiHealthProfile: {
    riskScore: number;
    riskCategory: string;
  };
}

interface Appointment {
  id?: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  reasonForVisit: string;
  aiNoShowDetails?: {
    noShowProbability: number;
    riskFactor: string;
  };
}

interface Consultation {
  consultationId: string;
  appointmentId: string;
  doctorId: string;
  vitals: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    spo2: number;
    weight: number;
    height: number;
  };
  symptoms: string[];
  clinicalNotes: string;
  diagnoses: { icdCode: string; description: string; type: string }[];
  aiClinicalInsights?: {
    possibleConditions: string[];
    severityLevel: string;
    suggestedDepartment: string;
    recommendation: string;
  };
  createdAt: string;
}

export default function PatientDashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [patientUser, setPatientUser] = useState<any>(null);
  
  // States
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [prescriptionData, setPrescriptionData] = useState<any | null>(null);

  // AI Booking Prompt States
  const [promptText, setPromptText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [parsedBooking, setParsedBooking] = useState<{
    appointmentDate: string;
    appointmentTime: string;
    department: string;
    reason: string;
  } | null>(null);
  
  const [bookingStatus, setBookingStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'appointments' | 'history'>('appointments');

  useEffect(() => {
    const jwt = localStorage.getItem('hms_token');
    const userStr = localStorage.getItem('hms_user');
    
    if (!jwt || !userStr) {
      router.push('/');
      return;
    }

    const parsedUser = JSON.parse(userStr);
    if (parsedUser.role !== 'PATIENT') {
      router.push('/');
      return;
    }

    setToken(jwt);
    setPatientUser(parsedUser);
    loadDashboardData(jwt, parsedUser.linkedEntityId);
  }, [router]);

  const loadDashboardData = async (jwt: string, patientId: string) => {
    try {
      // 1. Fetch Profile
      let profileData: PatientProfile;
      const profRes = await fetch(`http://localhost:8080/api/v1/patients/${patientId}`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });

      if (profRes.ok) {
        profileData = await resToPatientProfile(await profRes.json());
      } else {
        // Fallback Mock Profile
        profileData = {
          patientId: patientId || 'PAT-201',
          personalInfo: { firstName: 'John', lastName: 'Doe', dateOfBirth: '1990-05-14', gender: 'Male', bloodGroup: 'O+' },
          contactInfo: { email: 'john.doe@example.com', phone: '555-0199', address: '123 Health Ave, Metro City' },
          aiHealthProfile: { riskScore: 22, riskCategory: 'LOW' }
        };
      }
      setProfile(profileData);

      // 2. Fetch Appointments
      const aptRes = await fetch(`http://localhost:8080/api/v1/appointments`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      if (aptRes.ok) {
        setAppointments(await aptRes.json());
      } else {
        setAppointments([
          { appointmentId: 'APT-0012', patientId, doctorId: 'DOC-101', appointmentDate: '2026-06-20', appointmentTime: '10:00', status: 'CONFIRMED', reasonForVisit: 'General Heart Checkup', aiNoShowDetails: { noShowProbability: 0.08, riskFactor: 'LOW' } }
        ]);
      }

      // 3. Fetch History / Consultations
      const consRes = await fetch(`http://localhost:8080/api/v1/consultations/patient/${patientId}`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      if (consRes.ok) {
        setConsultations(await consRes.json());
      } else {
        setConsultations([
          {
            consultationId: 'CON-0927',
            appointmentId: 'APT-0001',
            doctorId: 'DOC-101',
            vitals: { bloodPressure: '120/80', heartRate: 72, temperature: 98.6, spo2: 99, weight: 78.5, height: 180 },
            symptoms: ['Slight cough', 'Mild fever'],
            clinicalNotes: 'Chest is clear. Encouraged rest and hydration.',
            diagnoses: [{ icdCode: 'J06.9', description: 'Acute upper respiratory infection, unspecified', type: 'PRIMARY' }],
            aiClinicalInsights: {
              possibleConditions: ['Acute Bronchitis', 'Influenza'],
              severityLevel: 'LOW',
              suggestedDepartment: 'General Medicine',
              recommendation: 'Rest, drink warm fluids, and follow up if symptoms worsen.'
            },
            createdAt: '2026-05-10T14:30:00Z'
          }
        ]);
      }

    } catch (err) {
      console.error('Error loading dashboard data', err);
    }
  };

  const resToPatientProfile = (data: any): PatientProfile => {
    return {
      patientId: data.patientId,
      personalInfo: data.personalInfo || {},
      contactInfo: data.contactInfo || {},
      aiHealthProfile: data.aiHealthProfile || { riskScore: 30, riskCategory: 'LOW' }
    };
  };

  const handleAiParse = async () => {
    if (!promptText.trim()) return;
    setAiLoading(true);
    setBookingStatus(null);
    setParsedBooking(null);

    try {
      const res = await fetch('http://localhost:8080/api/v1/appointments/ai-assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: promptText }),
      });

      if (!res.ok) throw new Error('AI was unable to parse this request.');
      const data = await res.json();
      setParsedBooking(data);
    } catch (err: any) {
      // Mock parsing locally if offline
      console.warn('Using client-side mock parser.');
      const text = promptText.toLowerCase();
      let date = new Date().toISOString().split('T')[0];
      let time = '10:00';
      let dept = 'General Medicine';
      let reason = 'AI Parsed Checkup';

      if (text.includes('cardiologist') || text.includes('heart') || text.includes('cardio')) {
        dept = 'Cardiology';
      }
      if (text.includes('tomorrow')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        date = tomorrow.toISOString().split('T')[0];
      }
      if (text.includes('11')) {
        time = '11:00';
      }

      setParsedBooking({
        appointmentDate: date,
        appointmentTime: time,
        department: dept,
        reason: reason
      });
    } finally {
      setAiLoading(false);
    }
  };

  const confirmBooking = async () => {
    if (!parsedBooking || !profile || !token) return;
    setBookingLoading(true);
    setBookingStatus(null);

    const bookingPayload = {
      patientId: profile.patientId,
      doctorId: 'DOC-101', // Seed doctor
      appointmentDate: parsedBooking.appointmentDate,
      appointmentTime: parsedBooking.appointmentTime,
      reasonForVisit: parsedBooking.reason || 'General checkup',
    };

    try {
      const res = await fetch('http://localhost:8080/api/v1/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingPayload)
      });

      if (res.status === 409) {
        const errDetail = await res.json();
        throw new Error(errDetail.detail || 'Schedule conflict: The selected slot is already booked.');
      }

      if (!res.ok) throw new Error('Failed to book appointment.');
      const savedApt = await res.json();
      
      setAppointments(prev => [savedApt, ...prev]);
      setBookingStatus({ type: 'success', message: 'Appointment successfully confirmed via AI Assistant!' });
      setParsedBooking(null);
      setPromptText('');
    } catch (err: any) {
      setBookingStatus({ type: 'error', message: err.message || 'Error occurred during slot reservation.' });
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelAppointment = async (aptId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:8080/api/v1/appointments/${aptId}/status?status=CANCELLED`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAppointments(prev => prev.map(a => a.id === aptId || a.appointmentId === aptId ? { ...a, status: 'CANCELLED' } : a));
      } else {
        // Mock cancellation
        setAppointments(prev => prev.map(a => a.appointmentId === aptId ? { ...a, status: 'CANCELLED' } : a));
      }
    } catch (err) {
      setAppointments(prev => prev.map(a => a.appointmentId === aptId ? { ...a, status: 'CANCELLED' } : a));
    }
  };

  const fetchPrescription = async (consultationId: string) => {
    setPrescriptionData(null);
    try {
      const res = await fetch(`http://localhost:8080/api/v1/prescriptions/consultation/${consultationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const p = await res.json();
        setPrescriptionData(p);
      } else {
        setPrescriptionData({
          prescriptionId: 'PR-9827',
          medications: [
            { medicineName: 'Amoxicillin 500mg', dosage: '1 Capsule', frequency: 'Three times daily', duration: '7 days', instructions: 'Take after meals' }
          ]
        });
      }
    } catch {
      setPrescriptionData({
        prescriptionId: 'PR-9827',
        medications: [
          { medicineName: 'Amoxicillin 500mg', dosage: '1 Capsule', frequency: 'Three times daily', duration: '7 days', instructions: 'Take after meals' }
        ]
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hms_token');
    localStorage.removeItem('hms_user');
    router.push('/');
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060814] text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Patient Context...</p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-white">
            Welcome, {profile.personalInfo.firstName} {profile.personalInfo.lastName}
          </h1>
          <p className="text-xs text-gray-400 mt-1">Patient ID: {profile.patientId}</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded bg-white/5 border border-white/10 text-xs hover:bg-white/10 transition-colors"
        >
          Logout Portal
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Health Profile & AI Assistant */}
        <div className="space-y-6 lg:col-span-1">
          {/* Health Profile Widget */}
          <GlassCard glowColor="rgba(6, 182, 212, 0.15)">
            <h3 className="text-lg font-bold text-white mb-4">AI Health Analytics</h3>
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Health Risk Score</span>
                <span className="text-3xl font-extrabold text-white mt-1 inline-block">
                  {profile.aiHealthProfile.riskScore}%
                </span>
              </div>
              <div className="text-right">
                <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk Classification</span>
                <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold mt-2 ${
                  profile.aiHealthProfile.riskCategory === 'LOW' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  profile.aiHealthProfile.riskCategory === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {profile.aiHealthProfile.riskCategory}
                </span>
              </div>
            </div>
            
            <div className="mt-4 bg-white/5 rounded-lg h-2 overflow-hidden">
              <div 
                className={`h-full ${
                  profile.aiHealthProfile.riskScore < 30 ? 'bg-emerald-500' :
                  profile.aiHealthProfile.riskScore < 70 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${profile.aiHealthProfile.riskScore}%` }}
              ></div>
            </div>
          </GlassCard>

          {/* AI Booking Assistant */}
          <GlassCard glowColor="rgba(138, 75, 241, 0.15)">
            <h3 className="text-lg font-bold text-white mb-2">AI Scheduling Assistant</h3>
            <p className="text-xs text-gray-400 mb-4">Schedule your doctor consult using natural speech.</p>
            
            <div className="space-y-4">
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="e.g. Book a cardiologist checkup next Monday at 10 AM"
                className="w-full h-24 p-3 glass-input text-xs text-gray-200 focus:outline-none"
              />
              
              <button
                onClick={handleAiParse}
                disabled={aiLoading}
                className="w-full py-2.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
              >
                {aiLoading ? 'AI Analyzing text...' : 'Process Booking Request'}
              </button>

              {parsedBooking && (
                <div className="p-4 rounded bg-white/5 border border-white/10 space-y-3">
                  <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">AI Proposed Appointment</h4>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="block text-[10px] text-gray-500 font-semibold uppercase">Date</span>
                      <span className="text-white font-medium">{parsedBooking.appointmentDate}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-500 font-semibold uppercase">Time</span>
                      <span className="text-white font-medium">{parsedBooking.appointmentTime}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-[10px] text-gray-500 font-semibold uppercase">Specialty Department</span>
                      <span className="text-white font-medium">{parsedBooking.department}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-[10px] text-gray-500 font-semibold uppercase">Reason</span>
                      <span className="text-white font-medium">{parsedBooking.reason}</span>
                    </div>
                  </div>

                  <button
                    onClick={confirmBooking}
                    disabled={bookingLoading}
                    className="w-full py-2.5 mt-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                  >
                    {bookingLoading ? 'Reserving slot...' : 'Confirm and Lock Schedule'}
                  </button>
                </div>
              )}

              {bookingStatus && (
                <div className={`p-3 rounded text-xs ${
                  bookingStatus.type === 'success' ? 'bg-emerald-950/45 text-emerald-400 border border-emerald-500/20' : 
                  'bg-red-950/45 text-red-400 border border-red-500/20'
                }`}>
                  {bookingStatus.message}
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Appointment Schedule & Medical Records */}
        <div className="space-y-6 lg:col-span-2">
          {/* Tabs */}
          <div className="flex space-x-4 border-b border-white/5 pb-2">
            <button
              onClick={() => setActiveTab('appointments')}
              className={`text-sm font-bold pb-2 border-b-2 transition-colors ${
                activeTab === 'appointments' ? 'text-indigo-400 border-indigo-500' : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              Active Appointments
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`text-sm font-bold pb-2 border-b-2 transition-colors ${
                activeTab === 'history' ? 'text-indigo-400 border-indigo-500' : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              Encounter History & Prescriptions
            </button>
          </div>

          {activeTab === 'appointments' ? (
            <GlassCard hoverable={false}>
              <Table<Appointment>
                data={appointments}
                rowsPerPage={5}
                filterFn={(row, query) => 
                  row.appointmentDate.includes(query) || 
                  row.reasonForVisit.toLowerCase().includes(query.toLowerCase())
                }
                searchPlaceholder="Search active bookings..."
                columns={[
                  { header: 'Appt ID', accessor: (row) => <span className="font-semibold text-white">{row.appointmentId}</span> },
                  { header: 'Date', accessor: (row) => <span>{row.appointmentDate}</span>, sortKey: 'appointmentDate' },
                  { header: 'Time', accessor: (row) => <span>{row.appointmentTime}</span> },
                  { header: 'Reason', accessor: (row) => <span>{row.reasonForVisit}</span> },
                  { 
                    header: 'No-Show Risk', 
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
                        row.status === 'CONFIRMED' ? 'bg-blue-500/10 text-blue-400' :
                        row.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                        row.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {row.status}
                      </span>
                    ) 
                  },
                  {
                    header: 'Action',
                    accessor: (row) => row.status === 'CONFIRMED' || row.status === 'PENDING' ? (
                      <button
                        onClick={() => handleCancelAppointment(row.id || row.appointmentId)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Cancel
                      </button>
                    ) : <span className="text-gray-600">-</span>
                  }
                ]}
              />
            </GlassCard>
          ) : (
            <div className="space-y-6">
              {/* Encounter History Table */}
              <GlassCard hoverable={false}>
                <Table<Consultation>
                  data={consultations}
                  rowsPerPage={5}
                  columns={[
                    { header: 'Consult ID', accessor: (row) => <span className="font-semibold text-white">{row.consultationId}</span> },
                    { header: 'Date', accessor: (row) => <span>{new Date(row.createdAt).toLocaleDateString()}</span> },
                    { header: 'Symptoms', accessor: (row) => <span>{row.symptoms.join(', ')}</span> },
                    { header: 'Primary Diagnosis', accessor: (row) => <span>{row.diagnoses.find(d => d.type === 'PRIMARY')?.description || '-'}</span> },
                    {
                      header: 'Actions',
                      accessor: (row) => (
                        <div className="flex space-x-3 text-xs">
                          <button
                            onClick={() => { setSelectedConsultation(row); fetchPrescription(row.consultationId); }}
                            className="text-indigo-400 hover:text-indigo-300 font-semibold"
                          >
                            View Record
                          </button>
                        </div>
                      )
                    }
                  ]}
                />
              </GlassCard>

              {/* Consultation Details Overlay Card */}
              {selectedConsultation && (
                <GlassCard hoverable={false} glowColor="rgba(138, 75, 241, 0.2)" className="space-y-6">
                  <div className="flex justify-between items-center pb-3 border-b border-white/5">
                    <h3 className="text-md font-bold text-indigo-300">Encounter Record: {selectedConsultation.consultationId}</h3>
                    <button 
                      onClick={() => { setSelectedConsultation(null); setPrescriptionData(null); }}
                      className="text-xs text-gray-500 hover:text-white"
                    >
                      Close Details
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Recorded Vitals</h4>
                      <ul className="space-y-1 bg-white/5 p-3 rounded border border-white/5">
                        <li>Blood Pressure: <span className="text-white font-medium">{selectedConsultation.vitals.bloodPressure}</span></li>
                        <li>Heart Rate: <span className="text-white font-medium">{selectedConsultation.vitals.heartRate} bpm</span></li>
                        <li>Temperature: <span className="text-white font-medium">{selectedConsultation.vitals.temperature} °F</span></li>
                        <li>SpO2 Saturation: <span className="text-white font-medium">{selectedConsultation.vitals.spo2}%</span></li>
                      </ul>
                    </div>

                    {selectedConsultation.aiClinicalInsights && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">AI Clinical Insights</h4>
                        <div className="bg-indigo-950/20 border border-indigo-500/15 p-3 rounded">
                          <p className="font-semibold text-white">Possible Conditions: <span className="font-normal text-indigo-300">{selectedConsultation.aiClinicalInsights.possibleConditions.join(', ')}</span></p>
                          <p className="mt-1 text-gray-400">Severity: <span className="text-red-400 uppercase font-bold">{selectedConsultation.aiClinicalInsights.severityLevel}</span></p>
                          <p className="mt-2 text-gray-300 italic">"{selectedConsultation.aiClinicalInsights.recommendation}"</p>
                        </div>
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <h4 className="text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Clinician Encounter Notes</h4>
                      <p className="p-3 bg-white/5 rounded border border-white/5 text-gray-300 italic">"{selectedConsultation.clinicalNotes}"</p>
                    </div>

                    <div className="md:col-span-2">
                      <h4 className="text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Official Diagnoses</h4>
                      <ul className="space-y-1">
                        {selectedConsultation.diagnoses.map((diag, idx) => (
                          <li key={idx} className="bg-white/5 px-3 py-2 rounded flex justify-between items-center text-xs">
                            <span><strong className="text-white">{diag.icdCode}</strong> - {diag.description}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-semibold">{diag.type}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {prescriptionData && (
                      <div className="md:col-span-2 border-t border-white/5 pt-4">
                        <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Prescribed Medications</h4>
                        <ul className="space-y-2">
                          {prescriptionData.medications.map((med: any, idx: number) => (
                            <li key={idx} className="bg-white/5 p-3 rounded border border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <span className="block text-[10px] text-gray-500 uppercase font-semibold">Medicine</span>
                                <span className="text-white font-bold">{med.medicineName}</span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-gray-500 uppercase font-semibold">Dosage & Frequency</span>
                                <span className="text-gray-300 text-xs">{med.dosage} - {med.frequency}</span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-gray-500 uppercase font-semibold">Duration & Instructions</span>
                                <span className="text-gray-300 text-xs">{med.duration} ({med.instructions})</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </GlassCard>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
