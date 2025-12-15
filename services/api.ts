import { AppData, Proyecto, Unidad, Ronda, EstadoProyecto, EstadoRonda, TipoRonda } from '../types';
import { GOOGLE_SCRIPT_URL, IS_DEMO_MODE } from '../constants';

// --- MOCK DATA STORAGE KEY ---
const STORAGE_KEY = 'gestor_editorial_demo_data';

// Helper to get data from local storage or return default empty state
const getLocalData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn("Error parsing local storage data", e);
  }
  return {
    proyectos: [], 
    unidades: [],
    rondas: []
  };
};

// Helper to save data to local storage
const saveLocalData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// --- API FUNCTIONS ---

export const fetchData = async (): Promise<AppData> => {
  if (IS_DEMO_MODE) {
    console.warn("⚠️ MODO DEMO: Leyendo datos locales (No de Google Sheets). Revisa constants.ts.");
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network latency
    return getLocalData();
  }

  try {
    console.log("Conectando a Google Sheets...", GOOGLE_SCRIPT_URL);
    const response = await fetch(GOOGLE_SCRIPT_URL);
    if (!response.ok) throw new Error('Error de red al conectar con Google Sheets');
    
    const data = await response.json();
    
    if (data.status === 'error') {
        throw new Error(`Error del Servidor Google: ${data.message}`);
    }
    
    return data.data;
  } catch (error: any) {
    console.error("API Error:", error);
    // Mostrar el error exacto al usuario si viene del script
    throw error;
  }
};

export const saveItem = async (type: 'proyecto' | 'unidad' | 'ronda', item: any): Promise<any> => {
  if (IS_DEMO_MODE) {
    console.warn("⚠️ MODO DEMO: Guardando en navegador (No en Google Sheets).");
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const currentData = getLocalData();
    
    if (type === 'proyecto') {
      const idx = currentData.proyectos.findIndex(p => p.ID_PROYECTO === item.ID_PROYECTO);
      if (idx >= 0) currentData.proyectos[idx] = item;
      else currentData.proyectos.push(item);
    } else if (type === 'unidad') {
      const idx = currentData.unidades.findIndex(u => u.ID_UNIDAD === item.ID_UNIDAD);
      if (idx >= 0) currentData.unidades[idx] = item;
      else currentData.unidades.push(item);
    } else if (type === 'ronda') {
      const idx = currentData.rondas.findIndex(r => r.ID_RONDA === item.ID_RONDA);
      if (idx >= 0) currentData.rondas[idx] = item;
      else currentData.rondas.push(item);
    }
    
    saveLocalData(currentData);
    alert("NOTA: Se ha guardado en modo DEMO (Local). Configura la URL en constants.ts para guardar en Google Sheets.");
    return { status: 'success', item };
  }

  // Real API Call
  // Usamos 'text/plain' para el Content-Type para evitar la solicitud "OPTIONS" (preflight) de CORS
  const payload = JSON.stringify({ action: 'save', type, data: item });
  
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
        "Content-Type": "text/plain;charset=utf-8",
        },
        body: payload,
    });

    const data = await response.json();
    if (data.status === 'error') throw new Error(data.message);
    return data;
  } catch (e: any) {
      console.error(e);
      alert(`Error guardando en Google: ${e.message}`);
      throw e;
  }
};

export const deleteItem = async (type: 'proyecto' | 'unidad' | 'ronda', id: string): Promise<any> => {
  if (IS_DEMO_MODE) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const currentData = getLocalData();

    if (type === 'proyecto') {
      currentData.proyectos = currentData.proyectos.filter(p => p.ID_PROYECTO !== id);
      // Optional: Cleanup related units/rounds could go here, but keeping it simple for now
    } else if (type === 'unidad') {
      currentData.unidades = currentData.unidades.filter(u => u.ID_UNIDAD !== id);
    } else if (type === 'ronda') {
      currentData.rondas = currentData.rondas.filter(r => r.ID_RONDA !== id);
    }
    
    saveLocalData(currentData);
    return { status: 'success', id };
  }

  const payload = JSON.stringify({ action: 'delete', type, id });
  
  const response = await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: payload,
  });

  const data = await response.json();
  if (data.status === 'error') throw new Error(data.message);
  return data;
};

// Helper to generate IDs
export const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now().toString().slice(-6)}`;
};