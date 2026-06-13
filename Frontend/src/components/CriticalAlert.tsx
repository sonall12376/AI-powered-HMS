import React from 'react';
import { ShieldAlert, X } from 'lucide-react';

interface CriticalAlertProps {
  message: string;
  onDismiss?: () => void;
}

export const CriticalAlert: React.FC<CriticalAlertProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-[9999] flex items-center justify-between bg-red-600 px-6 py-4.5 text-white shadow-[0_10px_30px_rgba(220,38,38,0.3)] animate-slide-down pulse-red-ring">
      <div className="flex flex-1 items-center justify-center space-x-3 text-center">
        <ShieldAlert className="h-6 w-6 animate-bounce text-white" />
        <span className="font-heading text-sm md:text-base font-extrabold tracking-wider">
          CRITICAL SAFETY WARNING: {message.toUpperCase()}
        </span>
      </div>
      {onDismiss && (
        <button 
          onClick={onDismiss} 
          className="rounded-full p-1.5 hover:bg-red-700/80 transition-colors focus:outline-none"
          title="Acknowledge alert"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};
