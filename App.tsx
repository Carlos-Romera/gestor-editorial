
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
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchData();
      setData(result);
    } catch (err: any) {
      setError(err.message || "Error de conexión");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isConnected = !IS_DEMO_MODE && !!data.spreadsheetName;

  return (
    <Layout 
      activeTab={activeTab} 
      onNavigate={setActiveTab} 
      isLoading={isLoading} 
      isConnected={isConnected}
    >
      {error && !IS_DEMO_MODE && (
        <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex justify-between items-center">
          <p className="text-amber-800 text-sm font-bold">⚠️ {error}</p>
          <button onClick={loadData} className="text-xs bg-amber-200 text-amber-900 px-4 py-1 rounded-full font-black">REINTENTAR</button>
        </div>
      )}
      
      {activeTab === 'dashboard' && <Dashboard data={data} onRefresh={loadData} />}
      {activeTab === 'proyectos' && <ProjectsManager data={data} onUpdate={loadData} />}
    </Layout>
  );
};

export default App;
