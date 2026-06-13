import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { ArrowLeft, Clock, ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Scheduler: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  
  // Booking modal state
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);
  const [activeLock, setActiveLock] = useState<any>(null);

  const [error, setError] = useState<string | null>(null);

  // Timer for booking lock
  const [lockCountdown, setLockCountdown] = useState<number>(0);
  const countdownIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
    fetchPatients();
  }, []);

  // Set up timer countdown when lock is acquired
  useEffect(() => {
    if (lockCountdown > 0) {
      countdownIntervalRef.current = window.setInterval(() => {
        setLockCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            setActiveLock(null);
            setShowBookModal(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [lockCountdown]);

  const fetchAppointments = async () => {
    try {
      const res = await axios.get('/api/appointments');
      setAppointments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDoctors = async () => {
    // Seed doctors list for UI drop-down selection
    // In production we get users with role DOCTOR
    setDoctors([
      { id: 'doc-cardiology-uuid', name: 'Dr. Sarah Jenkins (Cardiology)' },
      { id: 'doc-orthopedics-uuid', name: 'Dr. Robert Chen (Orthopedics)' },
      { id: 'doc-pediatrics-uuid', name: 'Dr. Emily Watson (Pediatrics)' },
      { id: 'doc-general-uuid', name: 'Dr. John Doe (General Medicine)' }
    ]);
    setSelectedDoctorId('doc-cardiology-uuid');
  };

  const fetchPatients = async () => {
    try {
      const res = await axios.get('/api/patients');
      setPatients(res.data);
      if (res.data.length > 0) {
        setSelectedPatientId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Convert DB appointments to FullCalendar events format
  const getCalendarEvents = () => {
    return appointments.map(a => ({
      id: a.id,
      title: `${a.patient.firstName} ${a.patient.lastName} (${a.status})`,
      start: a.dateTime,
      end: new Date(new Date(a.dateTime).getTime() + 20 * 60 * 1000), // 20-min slots
      color: a.status === 'COMPLETED' ? '#10b981' : a.status === 'CANCELLED' ? '#ef4444' : '#4f46e5',
      extendedProps: { ...a }
    }));
  };

  // Handle slot clicking (Distributed Concurrency Booking)
  const handleDateSelect = async (selectInfo: any) => {
    if (!user) return;
    setError(null);
    const doctorId = selectedDoctorId;
    const slotTime = selectInfo.start;

    setBookingStatus('Requesting 5-minute concurrency lock...');
    setShowBookModal(true);
    setSelectedSlot(slotTime);

    try {
      // Step 1: Create slot lock in database
      const lockRes = await axios.post('/api/appointments/lock', {
        doctorId,
        slotTime: slotTime.toISOString(),
        lockedBy: user.id
      });

      // Step 2: Set lock and countdown (300 seconds = 5 minutes)
      setActiveLock(lockRes.data.lock);
      setLockCountdown(300);
      setBookingStatus(null);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to lock slot. It may be locked or booked.');
      setBookingStatus(null);
      setTimeout(() => setShowBookModal(false), 2000);
    }
  };

  // Confirm booking inside lock period
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedSlot || !activeLock) return;

    setBookingStatus('Finalizing booking transaction...');
    try {
      await axios.post('/api/appointments/book', {
        patientId: selectedPatientId,
        doctorId: selectedDoctorId,
        dateTime: selectedSlot.toISOString(),
        notes,
        lockId: activeLock.id
      });

      // Clear lock countdown
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setLockCountdown(0);
      setActiveLock(null);
      setShowBookModal(false);
      setNotes('');
      setBookingStatus(null);
      fetchAppointments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Booking confirmation failed.');
      setBookingStatus(null);
    }
  };

  const handleCancelBookingFlow = async () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setLockCountdown(0);
    setActiveLock(null);
    setShowBookModal(false);
    setNotes('');
    setBookingStatus(null);
  };

  // Handle Drag & Drop rescheduling
  const handleEventDrop = async (dropInfo: any) => {
    const apptId = dropInfo.event.id;
    const newDateTime = dropInfo.event.start;

    try {
      await axios.put(`/api/appointments/${apptId}/reschedule`, {
        dateTime: newDateTime.toISOString()
      });
      fetchAppointments();
    } catch (err: any) {
      alert(`Rescheduling blocked: ${err.response?.data?.message || 'Double-booking clash detected.'}`);
      dropInfo.revert(); // Put it back on UI
    }
  };

  return (
    <div className="min-h-screen bg-[#070a13] pb-16 pt-24 text-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="flex items-center text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="mr-2 h-4.5 w-4.5" /> Back to Dashboard
          </Link>
          <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            <Clock className="h-4.5 w-4.5 text-indigo-400" />
            <span className="text-xs font-bold text-slate-300">Distributed Slot Locking Enabled</span>
          </div>
        </div>

        {/* Doctor Selector */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-[#0b0f19] border border-slate-800 rounded-xl p-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-white">Interactive Scheduler Engine</h2>
            <p className="text-xs text-slate-400 mt-0.5">Drag-and-drop slots to reschedule. Drag-select empty slots to book.</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Doctor Profile:</span>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="rounded bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none"
            >
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Calendar View */}
        <div className="glass-premium rounded-2xl p-6 border border-slate-800">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            slotDuration="00:20:00"
            slotMinTime="08:00:00"
            slotMaxTime="18:00:00"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'timeGridWeek,timeGridDay'
            }}
            events={getCalendarEvents()}
            selectable={true}
            selectMirror={true}
            select={handleDateSelect}
            editable={user?.role !== 'PATIENT'} // Intercept block patient editing
            eventDrop={handleEventDrop}
            allDaySlot={false}
            height="auto"
          />
        </div>
      </div>

      {/* Secure Checkout Concurrency Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="glass-premium w-full max-w-md rounded-2xl p-6 border border-indigo-500/20 shadow-2xl relative overflow-hidden">
            
            {/* Background Glow */}
            <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-indigo-500/10 blur-xl" />

            <h3 className="font-heading text-base font-bold text-white flex items-center mb-1">
              <ShieldCheck className="h-5 w-5 mr-2 text-indigo-400" /> Secure Slot Reservation
            </h3>
            
            {lockCountdown > 0 && (
              <div className="mb-4 text-xs font-bold text-indigo-400 bg-indigo-950/20 border border-indigo-500/20 rounded-lg p-2.5 flex items-center justify-between">
                <span>Concurrency Lock Active</span>
                <span className="font-mono text-white animate-pulse">0{Math.floor(lockCountdown / 60)}:{String(lockCountdown % 60).padStart(2, '0')}</span>
              </div>
            )}

            {error && (
              <div className="mb-4 flex items-start space-x-2 rounded-lg border border-red-500/20 bg-red-950/20 p-3 text-xs text-red-400">
                <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {bookingStatus && (
              <div className="mb-4 flex items-center space-x-2 rounded-lg bg-indigo-950/30 border border-indigo-500/15 p-3 text-xs text-indigo-300">
                <div className="h-3 w-3 animate-spin rounded-full border border-indigo-400 border-t-transparent"></div>
                <span>{bookingStatus}</span>
              </div>
            )}

            {activeLock && (
              <form onSubmit={handleConfirmBooking} className="space-y-4">
                <div className="space-y-3 bg-[#070a13] p-3 rounded-lg border border-slate-800 text-xs text-slate-400">
                  <p>Slot Selected: <span className="text-white font-semibold">{selectedSlot?.toLocaleString()}</span></p>
                  <p>Doctor Profile: <span className="text-white font-semibold">
                    {doctors.find(d => d.id === selectedDoctorId)?.name}
                  </span></p>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Select Patient Ledger Profile</label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full rounded bg-[#070a13] border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.sequenceId})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Clinical Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe intake status or visit context..."
                    rows={2}
                    className="w-full rounded bg-[#070a13] border border-slate-800 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end space-x-2 border-t border-slate-800 pt-4">
                  <button
                    type="button"
                    onClick={handleCancelBookingFlow}
                    className="rounded bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancel / Unlock
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 flex items-center"
                  >
                    <UserCheck className="mr-1 h-3.5 w-3.5" /> Book Appointment
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
