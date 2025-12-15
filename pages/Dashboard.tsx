import React, { useState } from 'react';
import { AppData, EstadoRonda, Ronda, Unidad, Proyecto, CategoriaRonda } from '../types';
import { IS_DEMO_MODE, GOOGLE_SCRIPT_URL } from '../constants';
import { Modal } from '../components/Modal';

interface DashboardProps {
  data: AppData;
  onRefresh: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, onRefresh }) => {
  const [showSetup, setShowSetup] = useState(false);

  // Helpers to join data
  const getUnidad = (id: string) => data.unidades.find(u => u.ID_UNIDAD === id);
  const getProyecto = (idUnidad: string) => {
    const unidad = getUnidad(idUnidad);
    return unidad ? data.proyectos.find(p => p.ID_PROYECTO === unidad.ID_PROYECTO) : undefined;
  };

  // Filter active rounds (not delivered)
  const activeRounds = data.rondas
    .filter(r => r.ESTADO !== EstadoRonda.ENTREGADA)
    .sort((a, b) => new Date(a.FECHA_LIMITE).getTime() - new Date(b.FECHA_LIMITE).getTime());

  const getUrgencyColor = (dateString: string) => {
    const today = new Date();
    const deadline = new Date(dateString);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return 'bg-red-100 text-red-800 border-red-200';
    if (diffDays <= 3) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Panel de Trabajo</h2>
           {!IS_DEMO_MODE && data.spreadsheetName ? (
              <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-200 inline-block">
                 <div className="flex items-center gap-2 text-green-700 font-bold">
                    <span>✅ Conectado Correctamente</span>
                 </div>
                 <div className="mt-1 text-xs">
                    Hoja: <strong>{data.spreadsheetName}</strong><br/>
                    ID: <code className="bg-gray-200 px-1 rounded">{data.spreadsheetId?.substring(0, 15)}...</code>
                 </div>
              </div>
           ) : !IS_DEMO_MODE && (
             <div className="mt-2 bg-red-50 text-red-800 p-2 rounded border border-red-200 text-sm">
                ❌ Error de Conexión: El script no devuelve datos. Revisa la implementación.
             </div>
           )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {data.spreadsheetUrl && (
            <a 
              href={data.spreadsheetUrl} 
              target="_blank" 
              rel="noreferrer"
              className="text-sm bg-white text-gray-700 px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 flex items-center gap-2 shadow-sm"
            >
              <span>📂</span> Abrir Hoja
            </a>
          )}
          <button onClick={onRefresh} className="text-sm text-accent hover:underline flex items-center gap-1">
             🔄 Forzar Actualización
          </button>
        </div>
      </div>

      {!IS_DEMO_MODE && !data.spreadsheetName && (
        <div className="bg-white border-l-4 border-red-500 p-6 shadow-md">
          <h3 className="text-lg font-bold text-red-700 mb-2">Diagnóstico de Problemas</h3>
          <p className="text-sm text-gray-700 mb-4">
            La barra lateral dice "CONECTADO" porque has puesto una URL, pero no estamos recibiendo el nombre de la hoja.
            Esto significa que <strong>tu script en Google Apps Script está desactualizado</strong>.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded">
             <div>
                <h4 className="font-bold text-sm mb-2">URL Configurada (constants.ts):</h4>
                <code className="block bg-slate-800 text-yellow-400 p-2 rounded text-xs break-all">
                  {GOOGLE_SCRIPT_URL}
                </code>
             </div>
             <div>
                <h4 className="font-bold text-sm mb-2">Solución:</h4>
                <button onClick={() => setShowSetup(true)} className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 w-full">
                   Ver pasos para Reparar Script
                </button>
             </div>
          </div>
        </div>
      )}

      {IS_DEMO_MODE && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg shadow-sm mb-6 transition-all hover:shadow-md">
          <div className="flex flex-col md:flex-row items-start justify-between gap-4">
            <div>
               <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
                 🚀 Modo Demostración
               </h3>
               <p className="text-blue-700 mb-4 max-w-2xl text-sm leading-relaxed">
                 Estás usando datos locales temporales. Para guardar tus proyectos en Google Drive y que no se borren, conecta tu hoja de cálculo.
               </p>
               <button 
                 onClick={() => setShowSetup(true)}
                 className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 font-medium transition-colors flex items-center gap-2"
               >
                 <span>⚡</span> Guía de Conexión
               </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SETUP WIZARD MODAL --- */}
      <Modal isOpen={showSetup} onClose={() => setShowSetup(false)} title="Reparar Conexión Google Sheets">
        <div className="space-y-6 pb-4 max-h-[70vh] overflow-y-auto pr-2">
          
          <div className="bg-yellow-50 p-4 rounded text-sm text-gray-800 border border-yellow-200">
             Para que funcione, el código en Google debe ser exactamente el mismo que te damos aquí, y debes haber creado una "Nueva versión" al implementar.
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold">1</div>
            <div className="flex-1">
              <h4 className="font-bold text-lg text-gray-800">Actualizar Script</h4>
              <p className="text-sm text-gray-600 mb-1">Copia el nuevo código de <code>backend/GoogleAppsScript.js</code> y pégalo en tu proyecto de Apps Script.</p>
              <div className="bg-gray-100 p-2 rounded border border-gray-300">
                 <p className="text-xs text-red-600 font-bold mb-1">¡NO OLVIDES ESTO!</p>
                 <code className="text-xs block">const SPREADSHEET_ID = 'TU_ID_REAL_AQUI';</code>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold">2</div>
            <div className="flex-1">
               <h4 className="font-bold text-lg text-gray-800">Actualizar Cabeceras Hoja (NUEVO)</h4>
               <p className="text-sm text-gray-600 mb-2">Para guardar las "Pruebas Menores":</p>
               <div className="bg-blue-50 p-2 border border-blue-200 rounded text-sm text-blue-900">
                  Ve a la pestaña <strong>Rondas</strong> de tu hoja y añade en la fila 1 la columna: <strong>CATEGORIA</strong>
               </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold">3</div>
            <div className="flex-1">
              <h4 className="font-bold text-lg text-gray-800">Publicar Nueva Versión</h4>
              <p className="text-sm text-gray-600 mb-2">
                 Implementar {'>'} Gestionar {'>'} Editar {'>'} <strong>Nueva versión</strong> {'>'} Implementar.
              </p>
            </div>
          </div>

        </div>
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow-sm border-l-4 border-red-500">
          <div className="text-2xl font-bold">{activeRounds.filter(r => getUrgencyColor(r.FECHA_LIMITE).includes('red')).length}</div>
          <div className="text-gray-500 text-sm">Urgentes (Hoy)</div>
        </div>
        <div className="bg-white p-4 rounded shadow-sm border-l-4 border-yellow-500">
           <div className="text-2xl font-bold">{activeRounds.filter(r => getUrgencyColor(r.FECHA_LIMITE).includes('yellow')).length}</div>
           <div className="text-gray-500 text-sm">Próximas (3 días)</div>
        </div>
        <div className="bg-white p-4 rounded shadow-sm border-l-4 border-blue-500">
           <div className="text-2xl font-bold">{activeRounds.length}</div>
           <div className="text-gray-500 text-sm">Total Pendientes</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Entregas Pendientes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Límite</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proyecto / Unidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prueba</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeRounds.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    🎉 ¡No hay entregas pendientes! Todo al día.
                  </td>
                </tr>
              ) : (
                activeRounds.map(ronda => {
                  const unidad = getUnidad(ronda.ID_UNIDAD);
                  const proyecto = getProyecto(ronda.ID_UNIDAD);
                  const isMinor = ronda.CATEGORIA === CategoriaRonda.MENOR;
                  return (
                    <tr key={ronda.ID_RONDA} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getUrgencyColor(ronda.FECHA_LIMITE)}`}>
                          {new Date(ronda.FECHA_LIMITE).toLocaleDateString('es-ES')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{unidad?.CODIGO_UD || 'Unidad desc.'}</div>
                        <div className="text-xs text-gray-500">{proyecto?.NOMBRE_PROYECTO || 'Proyecto desc.'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {isMinor && <span className="text-[10px] text-purple-700 bg-purple-100 px-1 rounded mr-2 uppercase font-bold">Menor</span>}
                        {ronda.TIPO_RONDA}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ronda.ESTADO}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};