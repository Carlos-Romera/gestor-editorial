
import { AppData, Proyecto, Unidad, Ronda, EstadoProyecto, EstadoRonda, TipoRonda } from '../types';
import { GOOGLE_SCRIPT_URL, IS_DEMO_MODE } from '../constants';

const STORAGE_KEY = 'gestor_editorial_demo_data';

const getLocalData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { console.warn(e); }
  return { proyectos: [], unidades: [], rondas: [], lastUpdated: new Date().toISOString() };
};

const saveLocalData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, lastUpdated: new Date().toISOString() }));
};

const validateApiUrl = () => {
    if (IS_DEMO_MODE) return;
    if (!GOOGLE_SCRIPT_URL.startsWith('http')) {
        throw new Error(`URL de Configuración Incorrecta`);
    }
};

export const fetchData = async (): Promise<AppData> => {
  if (IS_DEMO_MODE) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return getLocalData();
  }

  try {
    validateApiUrl();
    const urlWithCacheBuster = `${GOOGLE_SCRIPT_URL}?t=${Date.now()}`;
    const response = await fetch(urlWithCacheBuster);
    if (!response.ok) throw new Error('Error de red');
    const result = await response.json();
    if (result.status === 'error') throw new Error(result.message);
    
    // Añadimos la marca de tiempo de la base de datos
    return { ...result.data, lastUpdated: new Date().toISOString() };
  } catch (error: any) {
    console.error("API Error:", error);
    throw error;
  }
};

export const saveItem = async (type: 'proyecto' | 'unidad' | 'ronda', item: any): Promise<any> => {
  if (IS_DEMO_MODE) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const currentData = getLocalData();
    const key = type === 'proyecto' ? 'proyectos' : type === 'unidad' ? 'unidades' : 'rondas';
    const idKey = type === 'proyecto' ? 'ID_PROYECTO' : type === 'unidad' ? 'ID_UNIDAD' : 'ID_RONDA';
    
    const idx = (currentData[key] as any[]).findIndex((i: any) => i[idKey] === item[idKey]);
    if (idx >= 0) (currentData[key] as any[])[idx] = item;
    else (currentData[key] as any[]).push(item);
    
    saveLocalData(currentData);
    return { status: 'success', item };
  }

  const payload = JSON.stringify({ action: 'save', type, data: item });
  const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: payload,
  });

  const data = await response.json();
  if (data.status === 'error') throw new Error(data.message);
  return data;
};

export const deleteItem = async (type: 'proyecto' | 'unidad' | 'ronda', id: string): Promise<any> => {
  if (IS_DEMO_MODE) {
    const currentData = getLocalData();
    const key = type === 'proyecto' ? 'proyectos' : type === 'unidad' ? 'unidades' : 'rondas';
    const idKey = type === 'proyecto' ? 'ID_PROYECTO' : type === 'unidad' ? 'ID_UNIDAD' : 'ID_RONDA';
    (currentData[key] as any[]) = (currentData[key] as any[]).filter((i: any) => i[idKey] !== id);
    saveLocalData(currentData);
    return { status: 'success', id };
  }
  const payload = JSON.stringify({ action: 'delete', type, id });
  const response = await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: payload,
  });
  const data = await response.json();
  if (data.status === 'error') throw new Error(data.message);
  return data;
};

export const generateId = (prefix: string): string => `${prefix}-${Date.now().toString().slice(-6)}`;
