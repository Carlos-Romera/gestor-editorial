import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ProjectsManager } from './pages/ProjectsManager';
import { fetchData } from './services/api';
import { AppData } from './types';
import { GOOGLE_SCRIPT_URL, IS_DEMO_MODE } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'proyectos'>('dashboard');
  const [data, setData] = useState<AppData>({ proyectos: [], unidades: [], rondas: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchData();
      setData(result);
    } catch (error) {
      console.error(error);
      // No mostramos alerta agresiva aquí para no interrumpir UX, pero el dashboard mostrará el error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    // Check if user has configured the backend
    if (!IS_DEMO_MODE && GOOGLE_SCRIPT_URL === "") {
        setIsConfigured(false);
    }
  }, []);

  if (!isConfigured) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
              <div className="bg-white p-8 rounded shadow-lg max-w-md">
                  <h1 className="text-xl font-bold text-red-600 mb-4">Configuración Requerida</h1>
                  <p className="mb-4">Para conectar esta app con Google Sheets:</p>
                  <ol className="list-decimal list-inside text-sm space-y-2 mb-4">
                      <li>Abre el archivo <code>backend/GoogleAppsScript.js</code></li>
                      <li>Sigue los pasos para crear el script en tu Google Drive.</li>
                      <li>Copia la URL de la Web App generada.</li>
                      <li>Pégala en <code>constants.ts</code> variable <code>GOOGLE_SCRIPT_URL</code>.</li>
                  </ol>
                  <p className="text-xs text-gray-500">Por ahora, la app funcionará en modo DEMO automáticamente si dejas la URL vacía.</p>
              </div>
          </div>
      )
  }

  // Determine if we are truly connected (have data from sheet)
  const isConnected = !IS_DEMO_MODE && !!data.spreadsheetName;

  return (
    <Layout activeTab={activeTab} onNavigate={setActiveTab} isLoading={isLoading} spreadsheetUrl={data.spreadsheetUrl} isConnected={isConnected}>
      {activeTab === 'dashboard' && <Dashboard data={data} onRefresh={loadData} />}
      {activeTab === 'proyectos' && <ProjectsManager data={data} onUpdate={loadData} />}
    </Layout>
  );
};

export default App;