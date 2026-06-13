import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, Send, X, Calendar, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Slot {
  time: string;
  dateTime: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  slots?: Slot[];
  doctorId?: string;
  doctorName?: string;
}

export const AiAssistant: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am your HMS Secure AI Assistant. You can describe your symptoms or request an appointment (e.g., 'My chest hurts' or 'I need to see an orthopedist'). How can I help you today?"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: inputValue
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await axios.post('/api/ai/chat', {
        message: userMessage.text,
        conversationHistory: messages.map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }))
      });

      const botMessage: Message = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: response.data.response,
        slots: response.data.slots,
        doctorId: response.data.doctorId,
        doctorName: response.data.doctorName
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'assistant',
          text: "I'm sorry, I encountered an error checking our directory. Please try again."
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleBookSlot = async (slot: Slot, doctorId: string, doctorName: string) => {
    if (!user) return;
    setBookingStatus(`Acquiring lock for ${slot.time}...`);

    try {
      // Step 1: Query first patient in database to act as patient target
      // In production, we resolve this from user.id
      const patientsRes = await axios.get('/api/patients');
      const testPatient = patientsRes.data[0];
      
      if (!testPatient) {
        setBookingStatus('Error: No patient records exist to link. Create a patient profile first.');
        return;
      }

      // Step 2: Lock the slot for 5 minutes (distributed lock check)
      const lockRes = await axios.post('/api/appointments/lock', {
        doctorId,
        slotTime: slot.dateTime,
        lockedBy: user.id
      });

      const lockId = lockRes.data.lock.id;
      setBookingStatus(`Lock secured. Confirming booking for ${testPatient.firstName}...`);

      // Step 3: Confirm booking
      await axios.post('/api/appointments/book', {
        patientId: testPatient.id,
        doctorId,
        dateTime: slot.dateTime,
        notes: `AI Triage requested via Assistant Chatbot`,
        lockId
      });

      setBookingStatus(null);
      setMessages(prev => [
        ...prev,
        {
          id: String(Date.now()),
          sender: 'assistant',
          text: `Success! Checked out and booked with ${doctorName} for slot ${slot.time} tomorrow. Lock deleted.`
        }
      ]);
    } catch (err: any) {
      console.error('Booking failed:', err);
      const msg = err.response?.data?.message || 'Booking failed';
      setBookingStatus(null);
      setMessages(prev => [
        ...prev,
        {
          id: String(Date.now()),
          sender: 'assistant',
          text: `Transaction conflict: ${msg}. Could not secure this slot.`
        }
      ]);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[999] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-blue-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="glass-premium fixed bottom-24 right-6 z-[999] flex h-[500px] w-[380px] flex-col rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-indigo-500/20 bg-indigo-950/40 px-4 py-3 text-white">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-bold">Secure HMS AI</h3>
                <span className="text-[10px] text-indigo-400">Zero-Data-Retention Engine</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(m => (
              <div
                key={m.id}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-800/80 text-slate-100 rounded-bl-none border border-slate-700/50'
                  }`}
                >
                  <p>{m.text}</p>

                  {/* Render slot options if available */}
                  {m.slots && m.slots.length > 0 && m.doctorId && m.doctorName && (
                    <div className="mt-3 space-y-2 border-t border-slate-700/50 pt-2">
                      <p className="text-[11px] font-semibold text-indigo-400 flex items-center">
                        <Calendar className="mr-1 h-3 w-3" /> Select an available slot:
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {m.slots.map((slot, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleBookSlot(slot, m.doctorId!, m.doctorName!)}
                            className="rounded bg-indigo-500/20 border border-indigo-500/30 px-2 py-1 text-center text-xs font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/40"
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-1.5 rounded-2xl bg-slate-800/80 px-4 py-3 border border-slate-700/50">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.3s]"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.15s]"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-400"></div>
                </div>
              </div>
            )}

            {bookingStatus && (
              <div className="flex items-center space-x-2 rounded-lg bg-indigo-950/40 border border-indigo-500/20 px-3 py-2 text-xs text-indigo-300">
                <div className="h-3 w-3 animate-spin rounded-full border border-indigo-400 border-t-transparent"></div>
                <span>{bookingStatus}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-indigo-500/20 bg-indigo-950/20 p-3 flex space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Describe symptoms or request slot..."
              className="flex-1 rounded-lg bg-[#070a13] border border-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            <button
              onClick={handleSend}
              className="flex items-center justify-center rounded-lg bg-indigo-600 px-3 text-white transition-colors hover:bg-indigo-500"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
