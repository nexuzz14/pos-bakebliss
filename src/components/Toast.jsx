import React, { useEffect } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { TOAST_DURATION } from '../utils/constants';

export function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600'
  }[type] || 'bg-gray-600';

  return (
    <div className={`fixed top-4 left-4 right-4 ${bgColor} text-white p-4 rounded-lg shadow-lg z-50 flex items-center gap-3`}>
      {type === 'success' && <Check size={20} />}
      {type === 'error' && <AlertCircle size={20} />}
      {type === 'info' && <AlertCircle size={20} />}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="p-1 hover:bg-white/20 rounded">
        <X size={16} />
      </button>
    </div>
  );
}