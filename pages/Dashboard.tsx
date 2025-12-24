
import React from 'react';
import { AppData, EstadoRonda, CategoriaRonda } from '../types';
import { IS_DEMO_MODE } from '../constants';

interface DashboardProps {
  data: AppData;
  onRefresh: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, onRefresh }) => {
  const getUnidad = (id: string) => data.unidades.find(u => u.ID_UNIDAD === id);
  const getProyecto = (idUnidad: string) => {
    const unidad = getUnidad(idUnidad);
    return unidad ? data.proyectos.find(p => p.ID_PROYECTO === unidad.ID_PROYECTO) : undefined;
  };

  const activeRounds = data.rondas
    .filter(r => r.ESTADO !== EstadoRonda.ENTREGADA)
    .sort((a, b) => new Date(a.FECHA_LIMITE).getTime() - new Date(b.FECHA_LIMITE).getTime());

  const getUrgencyColor = (dateString: string) => {
    const today = new Date();
    const deadline = new Date(dateString);
    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 1) return 'bg-red-100 text-red-800 border-red-200';
    if (diffDays <= 3) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-blue-50 text-blue-700 border-blue-100';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* HEADER DE BASE DE DATOS */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
        <div>
           <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Panel de Control</h2>
           <div className="flex items-center gap-3 mt-2">
             <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
               <span className="w-2 h-2 rounded-full bg-green-500"></span>
               Sincronizado con Google Sheets
             </span>
             {data.lastUpdated && (
               <span className="text-[10px] text-slate-300 font-bold">
                 Último pulso: {new Date(data.lastUpdated).toLocaleTimeString()}
               </span>
             )}
           </div>
        </div>
        <button onClick={onRefresh} className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl text-xs font-black hover:bg-slate-50 transition-all shadow-sm active:scale-95 flex items-center gap-2">
          🔄 Refrescar Datos
        </button>
      </div>

      {/* ESTADÍSTICAS DE LA DB */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="text-3xl font-black text-slate-900">{data.proyectos.length}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Proyectos Totales</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="text-3xl font-black text-slate-900">{data.unidades.length}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Unidades en DB</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm ring-2 ring-red-500/5">
          <div className="text-3xl font-black text-red-600">
            {activeRounds.filter(r => getUrgencyColor(r.FECHA_LIMITE).includes('red')).length}
          </div>
          <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mt-1">Urgentes Hoy</div>
        </div>
        <div className="bg-accent p-6 rounded-3xl shadow-xl shadow-blue-100">
          <div className="text-3xl font-black text-white">{activeRounds.length}</div>
          <div className="text-[10px] font-black text-blue-100 uppercase tracking-widest mt-1">Tareas Pendientes</div>
        </div>
      </div>

      {/* LISTADO DE ENTREGAS */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-black text-slate-800">Próximas Entregas</h3>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ordenado por fecha</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left border-b border-slate-50">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Límite</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidad / Proyecto</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Prueba</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {activeRounds.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="text-4xl mb-4">✨</div>
                    <div className="text-slate-400 font-bold italic">No hay entregas pendientes en la base de datos.</div>
                  </td>
                </tr>
              ) : (
                activeRounds.map(ronda => {
                  const unidad = getUnidad(ronda.ID_UNIDAD);
                  const proyecto = getProyecto(ronda.ID_UNIDAD);
                  const isMinor = ronda.CATEGORIA === CategoriaRonda.MENOR;
                  return (
                    <tr key={ronda.ID_RONDA} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className={`px-3 py-1.5 text-[11px] font-black rounded-xl border ${getUrgencyColor(ronda.FECHA_LIMITE)} shadow-sm`}>
                          {new Date(ronda.FECHA_LIMITE).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="text-sm font-black text-slate-800 group-hover:text-accent transition-colors">{unidad?.CODIGO_UD}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{proyecto?.NOMBRE_PROYECTO}</div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                            {isMinor && <span className="text-[9px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded font-black uppercase border border-purple-100">Menor</span>}
                            <span className="text-sm font-bold text-slate-600">{ronda.TIPO_RONDA}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 uppercase tracking-tighter">
                          {ronda.ESTADO}
                        </span>
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
