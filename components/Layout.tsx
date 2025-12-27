import React from 'react';
import { IS_DEMO_MODE, APP_VERSION } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'proyectos';
  onNavigate: (tab: 'dashboard' | 'proyectos') => void;
  isLoading: boolean;
  spreadsheetUrl?: string;
  isConnected?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onNavigate, isLoading, spreadsheetUrl, isConnected }) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-app-bg">
      <nav className="bg-app-sidebar text-white w-full md:w-72 flex-shrink-0 flex flex-col shadow-2xl z-10 border-r border-white/5">
        <div className="p-8 border-b border-white/5">
          <div className="flex justify-between items-start">
             <h1 className="text-xl font-light tracking-tighter text-white">McGraw <span className="text-app-primary font-bold">Flow</span></h1>
             <span className="text-[10px] bg-app-red-text text-white px-2 py-0.5 rounded-full font-black shadow-[0_0_10px_rgba(244,91,106,0.5)]">v{APP_VERSION}</span>
          </div>
          <p className="text-[10px] text-app-text-sub mt-2 font-bold uppercase tracking-[0.2em]">Campaña 2025</p>
          
          <div className="mt-8">
             {IS_DEMO_MODE ? (
                <div className="px-4 py-2 bg-red-950/40 text-app-red-text text-[10px] font-bold rounded-xl border border-red-900/50 text-center tracking-widest uppercase">
                    Modo Desconectado
                </div>
             ) : (
                isConnected ? (
                   <div className="px-4 py-2 bg-white/5 text-app-green text-[10px] font-bold rounded-xl border border-white/10 flex items-center justify-center gap-3 tracking-widest uppercase">
                      <span className="w-2 h-2 rounded-full bg-app-green shadow-[0_0_10px_rgba(24,212,138,0.8)]"></span>
                      Sincronizado
                   </div>
                ) : (
                   <div className="px-4 py-2 bg-app-yellow-bg/10 text-app-yellow-text text-[10px] font-bold rounded-xl border border-app-yellow-bg/20 text-center tracking-widest uppercase animate-pulse">
                      Conectando...
                   </div>
                )
             )}
          </div>
        </div>
        
        <div className="mt-8 flex md:flex-col">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`p-6 text-left transition-all flex items-center gap-4 text-xs font-bold uppercase tracking-[0.2em] ${activeTab === 'dashboard' ? 'bg-white/5 text-app-primary border-r-4 border-app-primary' : 'text-app-text-sub hover:text-white'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onNavigate('proyectos')}
            className={`p-6 text-left transition-all flex items-center gap-4 text-xs font-bold uppercase tracking-[0.2em] ${activeTab === 'proyectos' ? 'bg-white/5 text-app-primary border-r-4 border-app-primary' : 'text-app-text-sub hover:text-white'}`}
          >
            Proyectos
          </button>
        </div>

        <div className="mt-auto p-8 hidden md:block">
          {spreadsheetUrl && (
            <a 
              href={spreadsheetUrl}
              target="_blank"
              rel="noreferrer"
              className="block w-full border border-white/10 text-app-text-sub hover:text-white hover:border-white/20 text-[9px] font-black uppercase tracking-widest py-4 rounded-2xl text-center transition-all"
            >
              Base de Datos (Sheets)
            </a>
          )}
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto p-6 md:p-12 relative">
        {isLoading && (
          <div className="absolute top-0 left-0 w-full h-1 bg-app-primary/10 z-50 overflow-hidden">
             <div className="h-full bg-app-primary animate-[loading_2s_infinite] w-1/3 shadow-[0_0_10px_rgba(48,107,255,0.5)]"></div>
          </div>
        )}
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};