import React from 'react';
import { AppData } from '../types';
import { APP_VERSION } from '../constants';

interface DashboardProps {
  data: AppData;
  onRefresh: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, onRefresh }) => {
  const getUnidad = (id: any) => {
    if (!id) return undefined;
    const cleanId = String(id).trim();
    return data.unidades.find(u => String(u.ID_UNIDAD).trim() === cleanId);
  };

  const getProyecto = (idUnidad: string) => {
    const unidad = getUnidad(idUnidad);
    if (!unidad) return undefined;
    return data.proyectos.find(p => p.ID_PROYECTO === unidad.ID_PROYECTO);
  };

  const activeRounds = (data.rondas || [])
    .filter(r => {
      const unit = getUnidad(r.ID_UNIDAD);
      if (!unit) return false;
      return String(r.ESTADO || '').toUpperCase().trim() !== 'ENTREGADA';
    })
    .sort((a, b) => new Date(a.FECHA_LIMITE).getTime() - new Date(b.FECHA_LIMITE).getTime());

  const getUrgencyStyles = (dateString: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const deadline = new Date(dateString);
    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'bg-app-red-bg text-app-red-text border-app-red-text/20 shadow-red-100';
    if (diffDays <= 2) return 'bg-app-yellow-bg text-app-yellow-text border-app-yellow-text/20 shadow-orange-100';
    return 'bg-app-accent-blue/30 text-app-primary border-app-primary/20 shadow-blue-50';
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div>
           <h2 className="text-6xl font-extralight text-app-text-main tracking-tighter">Dashboard</h2>
           <div className="flex items-center gap-2 mt-4">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-app-text-sub/10 rounded-full shadow-sm">
                <span className="w-2 h-2 rounded-full bg-app-primary animate-pulse"></span>
                <span className="text-[10px] text-app-text-sub font-black uppercase tracking-[0.1em]">PLATINUM v{APP_VERSION}</span>
             </div>
             <span className="text-[10px] text-app-text-sub font-bold uppercase tracking-[0.2em] ml-3">Centro de Operaciones Cloud</span>
           </div>
        </div>
        <button 
          onClick={onRefresh} 
          className="group flex items-center gap-4 bg-app-sidebar text-white px-10 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-app-primary transition-all shadow-xl shadow-app-sidebar/10 active:scale-95"
        >
          <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Sincronizar Datos
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Libros', val: data.proyectos.length, sub: 'Proyectos Activos', color: 'bg-white text-app-text-main border-app-text-sub/10' },
          { label: 'Unidades', val: data.unidades.length, sub: 'Módulos Totales', color: 'bg-white text-app-text-main border-app-text-sub/10' },
          { label: 'Urgentes', val: activeRounds.filter(r => getUrgencyStyles(r.FECHA_LIMITE).includes('red')).length, sub: 'Fuera de plazo', color: 'bg-app-red-bg text-app-red-text border-app-red-text/10' },
          { label: 'Pendientes', val: activeRounds.length, sub: 'Tareas activas', color: 'bg-app-accent-blue/30 text-app-primary border-app-primary/10' }
        ].map((stat, i) => (
          <div key={i} className={`${stat.color} p-10 rounded-[2.5rem] border shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden`}>
            <div className="text-6xl font-light tracking-tighter mb-2 relative z-10">{stat.val}</div>
            <div className="text-[11px] font-black uppercase tracking-[0.3em] opacity-70 relative z-10">{stat.label}</div>
            <div className="text-[10px] font-medium uppercase tracking-widest opacity-40 mt-1 relative z-10">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[3rem] shadow-xl shadow-app-sidebar/5 border border-app-text-sub/5 overflow-hidden">
        <div className="px-12 py-12 border-b border-app-text-sub/5 flex justify-between items-center bg-app-bg/10">
          <div>
            <h3 className="text-[10px] font-black text-app-text-sub uppercase tracking-[0.4em]">Próximas Entregas</h3>
            <p className="text-xl font-light text-app-text-main mt-1">Prioridad por calendario editorial</p>
          </div>
          <span className="px-6 py-2 bg-app-primary/5 text-app-primary border border-app-primary/10 rounded-xl text-[10px] font-black tracking-widest uppercase">
            {activeRounds.length} TAREAS EN CURSO
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left bg-app-bg/20">
                <th className="px-12 py-6 text-[9px] font-black text-app-text-sub uppercase tracking-[0.3em]">Límite</th>
                <th className="px-12 py-6 text-[9px] font-black text-app-text-sub uppercase tracking-[0.3em]">Unidad y Proyecto</th>
                <th className="px-12 py-6 text-[9px] font-black text-app-text-sub uppercase tracking-[0.3em]">Fase</th>
                <th className="px-12 py-6 text-[9px] font-black text-app-text-sub uppercase tracking-[0.3em] text-right">Situación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-text-sub/5">
              {activeRounds.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-12 py-32 text-center opacity-30 text-app-text-main text-[11px] font-black uppercase tracking-[0.4em]">Sin entregas pendientes</td>
                </tr>
              ) : (
                activeRounds.map(ronda => {
                  const unidad = getUnidad(ronda.ID_UNIDAD);
                  if (!unidad) return null;
                  const proyecto = getProyecto(ronda.ID_UNIDAD);
                  
                  return (
                    <tr key={ronda.ID_RONDA} className="hover:bg-app-bg/40 transition-all group">
                      <td className="px-12 py-10 whitespace-nowrap">
                        <div className={`inline-flex flex-col items-center justify-center w-20 h-20 rounded-[2rem] border ${getUrgencyStyles(ronda.FECHA_LIMITE)} shadow-lg`}>
                          <span className="text-[9px] font-black uppercase tracking-tight opacity-70">
                            {new Date(ronda.FECHA_LIMITE).toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')}
                          </span>
                          <span className="text-2xl font-light tracking-tighter">
                            {new Date(ronda.FECHA_LIMITE).getDate()}
                          </span>
                        </div>
                      </td>
                      <td className="px-12 py-10">
                        <div className="text-xl font-light text-app-text-main tracking-tight group-hover:text-app-primary transition-colors">{unidad.CODIGO_UD}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-app-text-sub font-bold uppercase tracking-widest">{proyecto?.NOMBRE_PROYECTO || 'McGraw Hill'}</span>
                        </div>
                      </td>
                      <td className="px-12 py-10">
                        <span className="text-sm font-medium text-app-text-main/80">{ronda.TIPO_RONDA}</span>
                      </td>
                      <td className="px-12 py-10 text-right">
                        <div className="inline-flex items-center gap-3 bg-white px-5 py-2.5 rounded-xl border border-app-text-sub/5 shadow-sm">
                           <span className="text-[10px] font-black text-app-text-sub uppercase tracking-widest">{ronda.ESTADO}</span>
                        </div>
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