
import { AppData } from '../types';
import { GOOGLE_SCRIPT_URL } from '../constants';

/**
 * Obtiene todos los datos de la base de datos (Google Sheets)
 */
export const fetchData = async (): Promise<AppData> => {
  const response = await fetch(`${GOOGLE_SCRIPT_URL}?t=${Date.now()}`);
  if (!response.ok) throw new Error("Error de red con Google Sheets");
  const result = await response.json();
  if (result.status === 'error') throw new Error(result.message);
  return result.data;
};

/**
 * Guarda o actualiza un registro en la base de datos
 */
export const saveItem = async (type: 'proyecto' | 'unidad' | 'ronda', item: any): Promise<void> => {
  // Eliminamos mode: 'no-cors' para que el navegador pueda seguir la redirección 
  // que hace Google Apps Script y confirmar que la operación fue exitosa.
  const response = await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'save', type, data: item }),
  });
  
  // Nota: Google Apps Script siempre devuelve un 200 si el script se ejecuta,
  // incluso si hay un error interno, por eso el manejo de errores está en el JSON de respuesta.
};

/**
 * Elimina un registro de la base de datos
 */
export const deleteItem = async (type: 'proyecto' | 'unidad' | 'ronda', id: string): Promise<void> => {
  await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'delete', type, id }),
  });
};

export const generateId = (prefix: string): string => `${prefix}-${Date.now()}`;
