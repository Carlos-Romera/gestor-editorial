import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-app-sidebar/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-app-card rounded-[2.5rem] shadow-2xl w-full max-w-lg max-h-full overflow-y-auto border border-white/20">
        <div className="flex justify-between items-center p-8 border-b border-app-bg">
          <div>
            <h2 className="text-xl font-light text-app-text-main tracking-tight">{title}</h2>
            <p className="text-[9px] font-black text-app-text-sub uppercase tracking-widest mt-1">Formulario Editorial</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-app-bg text-app-text-sub hover:text-app-red-text transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
};