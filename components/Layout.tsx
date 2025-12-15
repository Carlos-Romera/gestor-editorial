import React from 'react';
import { IS_DEMO_MODE } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'proyectos';
  onNavigate: (tab: 'dashboard' | 'proyectos') => void;
  isLoading: boolean;
  spreadsheetUrl?: string;
  isConnected?: boolean; // New prop for real connection status
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onNavigate, isLoading, spreadsheetUrl, isConnected }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Sidebar / Mobile Header */}
      <nav className="bg-primary text-white w-full md:w-64 flex-shrink-0 flex flex-col shadow-xl z-10">
        <div className="p-4 border-b border-gray-700 bg-slate-900">
          <h1 className="text-xl font-bold tracking-tight text-white">Gestor Editorial</h1>
          <p className="text-xs text-gray-400 mt-1">McGraw 2025</p>
          
          <div className="mt-4 flex justify-center">
             {IS_DEMO_MODE ? (
                <div className="px-3 py-1 bg-red-900 text-red-200 text-xs font-bold rounded border border-red-700 text-center w-full">
                    ⚠ MODO LOCAL
                </div>
             ) : (
                isConnected ? (
                   <div className="px-3 py-1 bg-green-900 text-green-200 text-xs font-bold rounded border border-green-700 text-center w-full flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                      CONECTADO
                   </div>
                ) : (
                   <div className="px-3 py-1 bg-yellow-900 text-yellow-200 text-xs font-bold rounded border border-yellow-700 text-center w-full">
                      ⚠️ SIN CONEXIÓN
                   </div>
                )
             )}
          </div>
        </div>
        
        <div className="flex md:flex-col overflow-x-auto md:overflow-visible">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`p-4 text-left hover:bg-secondary transition-colors whitespace-nowrap md:whitespace-normal flex items-center gap-3 ${activeTab === 'dashboard' ? 'bg-secondary border-l-4 border-accent' : 'border-l-4 border-transparent'}`}
          >
            <span>🏠</span> Dashboard
          </button>
          <button
            onClick={() => onNavigate('proyectos')}
            className={`p-4 text-left hover:bg-secondary transition-colors whitespace-nowrap md:whitespace-normal flex items-center gap-3 ${activeTab === 'proyectos' ? 'bg-secondary border-l-4 border-accent' : 'border-l-4 border-transparent'}`}
          >
            <span>📚</span> Proyectos
          </button>
        </div>

        <div className="mt-auto p-4 hidden md:block space-y-4">
          {spreadsheetUrl && (
            <a 
              href={spreadsheetUrl}
              target="_blank"
              rel="noreferrer"
              className="block w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded shadow transition-colors flex items-center justify-center gap-2"
            >
              <span>📊</span> Base de Datos
            </a>
          )}
          
          <div className="text-xs text-gray-500 border-t border-gray-700 pt-4">
             Estado: {isLoading ? <span className="text-yellow-500">Sincronizando...</span> : (isConnected ? <span className="text-green-500">Online</span> : <span className="text-gray-400">Offline</span>)}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
        {isLoading && (
          <div className="fixed top-0 left-0 w-full h-1 bg-blue-200 z-50">
             <div className="h-full bg-accent animate-pulse w-1/3 mx-auto"></div>
          </div>
        )}
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};