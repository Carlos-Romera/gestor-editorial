
import { AppData } from '../types';
import { GOOGLE_SCRIPT_URL } from '../constants';

export const fetchData = async (): Promise<AppData> => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'GET',
      redirect: 'follow'
    });
    
    if (!response.ok) throw new Error(`Error ${response.status}`);
    
    const result = await response.json();
    if (result && result.status === 'success') return result.data;

    throw new Error("Respuesta inválida del servidor");
  } catch (err) {
    console.error("Error de lectura:", err);
    throw err;
  }
};

export const saveItem = async (type: 'proyecto' | 'unidad' | 'ronda', item: any): Promise<void> => {
  try {
    // Usamos POST con modo no-cors para Google Apps Script
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', 
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'save', type, data: item }),
    });
    return;
  } catch (err) {
    console.error("Error de escritura:", err);
    throw err;
  }
};

export const deleteItem = async (type: 'proyecto' | 'unidad' | 'ronda', id: string): Promise<void> => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'delete', type, id }),
    });
  } catch (err) {
    console.error("Error al borrar:", err);
    throw err;
  }
};

export const generateId = (prefix: string): string => `${prefix}-${Date.now()}`;
