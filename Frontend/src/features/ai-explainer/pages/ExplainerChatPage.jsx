import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { explainPrescription } from '../services/explainerApi';

export default function ExplainerChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I am CareFlow AI, your clinical pharmacologist assistant. Please type your prescription details, dosage instructions, or select one of the samples below, and I will explain how to take it safely."
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const samples = [
    {
      title: 'Amoxicillin Antibiotic',
      text: 'Amoxicillin 500mg, 1 tablet 3 times a day for 7 days. Finish the entire course.'
    },
    {
      title: 'Paracetamol Pain Relief',
      text: 'Paracetamol 650mg, 1 tablet every 6 hours as needed for fever. Maximum 4 tablets in 24 hours.'
    },
    {
      title: 'Ibuprofen anti-inflammatory',
      text: 'Ibuprofen 400mg, 1 tablet strictly after breakfast and dinner for 5 days.'
    }
  ];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    if (!textToSend || textToSend.trim() === '') return;

    // Add user message
    setMessages(prev => [...prev, { sender: 'user', text: textToSend }]);
    setLoading(true);

    try {
      const patientId = user?.username || 'anonymous-patient';
      const explanation = await explainPrescription(textToSend, patientId);
      
      setMessages(prev => [...prev, { sender: 'ai', text: explanation }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'system-error',
          text: err.message || 'Failed to connect to the explanation server. Please try again.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitForm = (e) => {
    e.preventDefault();
    const text = inputText;
    setInputText('');
    handleSendMessage(text);
  };

  // Basic Markdown-like parser for bolding and bullets
  const renderFormattedText = (text) => {
    if (!text) return '';
    return text.split('\n').map((line, idx) => {
      let content = line;
      let isHeader = false;
      let headerLevel = 0;

      // Match headers
      if (line.startsWith('### ')) {
        content = line.substring(4);
        isHeader = true;
        headerLevel = 3;
      } else if (line.startsWith('#### ')) {
        content = line.substring(5);
        isHeader = true;
        headerLevel = 4;
      }

      // Match bullets
      const isBullet = line.startsWith('- ');
      if (isBullet) {
        content = line.substring(2);
      }

      // Match warning icon
      const isWarning = line.startsWith('⚠️ ');
      if (isWarning) {
        content = line.substring(2);
      }

      // Parse bold tags **text**
      const boldParts = content.split('**');
      const parsedElements = boldParts.map((part, pIdx) => {
        if (pIdx % 2 === 1) {
          return <strong key={pIdx} className="font-bold text-white">{part}</strong>;
        }
        return part;
      });

      if (isHeader) {
        if (headerLevel === 3) return <h3 key={idx} className="text-sm font-bold text-white mt-3 mb-1.5">{parsedElements}</h3>;
        return <h4 key={idx} className="text-xs font-bold text-sky-400 mt-2.5 mb-1.5 uppercase tracking-wide">{parsedElements}</h4>;
      }

      if (isBullet) {
        return (
          <div key={idx} className="ml-4 flex items-start gap-1.5 text-xs text-slate-300 py-0.5">
            <span className="text-sky-500 mt-1 flex-shrink-0">•</span>
            <span>{parsedElements}</span>
          </div>
        );
      }

      if (isWarning) {
        return (
          <div key={idx} className="mt-4 rounded-xl border border-rose-950 bg-rose-950/20 p-3 text-xs text-rose-400 leading-relaxed">
            <span className="mr-1.5">⚠️</span>
            {parsedElements}
          </div>
        );
      }

      return (
        <p key={idx} className="text-xs text-slate-200 leading-relaxed mb-1 min-h-[1em]">
          {parsedElements}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 mb-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white text-lg font-bold shadow-md shadow-sky-500/10">
          🤖
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">AI Prescription Explainer</h1>
          <p className="text-xs text-slate-400">Dosage details &amp; clinical safety explanation agent</p>
        </div>
      </div>

      {/* Messages Feed Container */}
      <div className="flex-grow rounded-2xl border border-slate-800 bg-slate-900/40 p-4 overflow-y-auto mb-4 space-y-4 shadow-inner">
        {messages.map((msg, index) => {
          if (msg.sender === 'user') {
            return (
              <div key={index} className="flex justify-end animate-fade-in">
                <div className="max-w-[75%] rounded-2xl rounded-tr-none bg-sky-600 px-4 py-2.5 text-xs text-white shadow-md shadow-sky-600/10">
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              </div>
            );
          } else if (msg.sender === 'system-error') {
            return (
              <div key={index} className="flex justify-center animate-fade-in">
                <div className="max-w-[85%] rounded-xl border border-rose-950 bg-rose-950/30 px-4 py-3 text-xs text-rose-400">
                  <span className="font-bold mr-1">⛔ System Alert:</span> {msg.text}
                </div>
              </div>
            );
          } else {
            return (
              <div key={index} className="flex gap-3 animate-fade-in">
                <div className="h-7 w-7 rounded-lg bg-slate-800 flex items-center justify-center text-sm flex-shrink-0 select-none">
                  🤖
                </div>
                <div className="max-w-[80%] rounded-2xl rounded-tl-none bg-slate-900 border border-slate-800 px-4.5 py-3 shadow-md">
                  {renderFormattedText(msg.text)}
                </div>
              </div>
            );
          }
        })}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3 items-center">
            <div className="h-7 w-7 rounded-lg bg-slate-800 flex items-center justify-center text-sm">
              🤖
            </div>
            <div className="rounded-2xl rounded-tl-none bg-slate-900 border border-slate-800 px-4 py-2.5 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-2 w-2 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Samples Selection */}
      <div className="mb-4">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-2">
          Click a prescription sample to quick-diagnose:
        </span>
        <div className="flex flex-wrap gap-2">
          {samples.map((sample, idx) => (
            <button
              key={idx}
              disabled={loading}
              onClick={() => handleSendMessage(sample.text)}
              className="text-[11px] font-medium text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 rounded-xl px-3 py-1.5 transition-all text-left max-w-xs truncate"
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={onSubmitForm} className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Paste prescription contents or write dosage details here..."
          className="flex-grow rounded-xl border border-slate-800 bg-slate-900/60 text-white placeholder-slate-500 px-4 py-3 text-xs focus:outline-none focus:border-sky-500 transition-all shadow-inner"
        />
        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className={`rounded-xl bg-sky-500 hover:bg-sky-400 px-5 py-3 text-xs font-bold text-white shadow-md shadow-sky-500/20 flex items-center justify-center transition-all ${
            loading || !inputText.trim() ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <span>Send 🚀</span>
        </button>
      </form>
    </div>
  );
}
