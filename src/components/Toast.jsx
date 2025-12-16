import React, { useEffect } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { TOAST_DURATION } from '../utils/constants';

export function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: {
      bg: 'bg-green-500 dark:bg-green-600',
      icon: <Check size={20} />
    },
    error: {
      bg: 'bg-red-500 dark:bg-red-600',
      icon: <AlertCircle size={20} />
    },
    info: {
      bg: 'bg-blue-500 dark:bg-blue-600',
      icon: <AlertCircle size={20} />
    }
  };

  const current = styles[type] || styles.info;

  return (
    <div
      className={`
        fixed top-4 left-4 right-4 z-50
        ${current.bg}
        text-white
        p-4 rounded-lg shadow-lg
        flex items-center gap-3
      `}
    >
      {current.icon}

      <span className="flex-1 text-sm font-medium">
        {message}
      </span>

      <button
        onClick={onClose}
        className="
          p-1 rounded
          hover:bg-white/20
          focus:outline-none
        "
      >
        <X size={16} />
      </button>
    </div>
  );
}
