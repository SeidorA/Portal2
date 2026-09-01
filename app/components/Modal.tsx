import React, { useEffect, useRef } from 'react';
import { Button } from 'caralstable';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export default function Modal({ isOpen, onClose, title, children, width = 'md' }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClass = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw]'
  }[width];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm animate-fade-in animate-duration-200" 
        onClick={onClose}
      />
      <div 
        ref={modalRef}
        className={`relative w-full ${widthClass} bg-white dark:bg-neutral-900 rounded-xl shadow-xl flex flex-col max-h-[90vh] animate-fade-in animate-duration-200`}
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <h2 className="text-lg font-poppins font-semibold text-neutral-900 dark:text-white">
            {title}
          </h2>
          <Button
            isIconButton
            variant="ghost"
            iconName="close"
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          />
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
