import React, { useState } from 'react';

interface AdmonitionsMenuProps {
  onInsert: (type: string) => void;
}

export const AdmonitionsMenu: React.FC<AdmonitionsMenuProps> = ({ onInsert }) => {
  const [isOpen, setIsOpen] = useState(false);

  const admonitions = [
    { type: 'NOTE', label: 'Nota', icon: '📝', color: 'text-neutral-500' },
    { type: 'TIP', label: 'Tip', icon: '💡', color: 'text-green-500' },
    { type: 'INFO', label: 'Info', icon: 'ℹ️', color: 'text-blue-500' },
    { type: 'WARNING', label: 'Cuidado', icon: '⚠️', color: 'text-yellow-500' },
    { type: 'CAUTION', label: 'Peligro', icon: '🔥', color: 'text-red-500' },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 dark:text-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-md transition-colors"
      >
        💡 Alertas
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl z-50 py-1">
            {admonitions.map((adm) => (
              <button
                key={adm.type}
                type="button"
                className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-3 transition-colors"
                onClick={() => {
                  onInsert(adm.type);
                  setIsOpen(false);
                }}
              >
                <span>{adm.icon}</span>
                <span className={`font-medium ${adm.color}`}>{adm.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
