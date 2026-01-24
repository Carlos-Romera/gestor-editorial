
import React from 'react';
import { AppData } from '../types';
import { APP_VERSION } from '../constants';

interface DashboardProps {
  data: AppData;
  onRefresh: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, onRefresh }) => {
  const lastUpdate = data.lastUpdated 
    ? new Date(data.lastUpdated).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : '---';

  const getUnidad = (id: any) => data.unidades.find(u => String(u.ID_UNIDAD) === String(id));
  const getProyecto = (id: any) => data.proyectos.find(p => String(p.ID_PROYECTO) === String(id));
  
  const activeRounds = (data.rondas || [])
    .filter(r => String(r.ESTADO).toUpperCase() !== 'ENTREGADA' && getUnidad(r.ID_UNIDAD))
    .sort((a, b) => new Date(a.FECHA_LIMITE).getTime() - new Date(b.FECHA_LIMITE).getTime());

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col lg:flex-row justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-6xl font-extralight text-app-text-main tracking-tighter">Estado <span className="text-app-primary font-normal">Cloud</span></h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-app-primary/10 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-app-green animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-app-text-sub">Sincronizado: {lastUpdate}</span>
            </div>
            <span className="text-[10px] font-black text-app-primary/40 uppercase tracking-[0.3em]">{APP_VERSION}</span>
          </div>
        </div>
        
        <button 
          onClick={onRefresh}
          className="group flex items-center gap-3 bg-app-sidebar text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-app-primary transition-all shadow-xl active:scale-95"
        >
          <svg className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Actualizar desde Excel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-10 rounded-[3rem] border border-app-text-sub/10 shadow-sm">
          <div className="text-7xl font-thin tracking-tighter mb-2 text-app-text-main">{data.proyectos.length}</div>
          <div className="text-[11px] font-black uppercase tracking-[0.4em] text-app-text-sub">Proyectos</div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-app-text-sub/10 shadow-sm">
          <div className="text-7xl font-thin tracking-tighter mb-2 text-app-text-main">{data.unidades.length}</div>
          <div className="text-[11px] font-black uppercase tracking-[0.4em] text-app-text-sub">Unidades</div>
        </div>

        <div className="bg-app-accent-blue/20 p-10 rounded-[3rem] border border-app-primary/10 shadow-sm">
          <div className="text-7xl font-thin tracking-tighter mb-2 text-app-primary">{activeRounds.length}</div>
          <div className="text-[11px] font-black uppercase tracking-[0.4em] text-app-primary/60">Pendientes</div>
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-app-sidebar/5 border border-app-text-sub/5 overflow-hidden">
        <div className="p-12 border-b border-app-bg flex items-center justify-between bg-app-bg/10">
          <h3 className="text-[11px] font-black text-app-text-sub uppercase tracking-[0.5em]">Actividad de la Base de Datos</h3>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-app-text-sub uppercase tracking-widest opacity-50">
                <th className="px-8 py-6">Fecha Límite</th>
                <th className="px-8 py-6">Proyecto</th>
                <th className="px-8 py-6">Unidad</th>
                <th className="px-8 py-6">Fase</th>
                <th className="px-8 py-6 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-bg">
              {activeRounds.map(r => {
                const ud = getUnidad(r.ID_UNIDAD);
                const proj = ud ? getProyecto(ud.ID_PROYECTO) : null;
                
                return (
                  <tr key={r.ID_RONDA} className="group hover:bg-app-bg/30 transition-colors">
                    <td className="px-8 py-8 font-bold text-app-text-main text-sm">
                      {r.FECHA_LIMITE ? new Date(r.FECHA_LIMITE).toLocaleDateString() : '---'}
                    </td>
                    <td className="px-8 py-8">
                      <div className="font-bold text-app-text-main text-xs truncate max-w-[200px]">
                        {proj?.NOMBRE_PROYECTO || 'Desconocido'}
                      </div>
                      <div className="text-[9px] font-black text-app-text-sub uppercase tracking-widest">{proj?.CLIENTE || ''}</div>
                    </td>
                    <td className="px-8 py-8">
                      <div className="font-black text-app-primary text-xs uppercase">{ud?.CODIGO_UD || '---'}</div>
                      <div className="text-[9px] text-app-text-sub truncate max-w-[150px]">{ud?.TITULO_UD || ''}</div>
                    </td>
                    <td className="px-8 py-8">
                      <span className="text-[10px] font-black uppercase bg-app-bg px-3 py-1.5 rounded-lg text-app-text-sub">{r.TIPO_RONDA}</span>
                    </td>
                    <td className="px-8 py-8 text-right">
                      <span className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl inline-block min-w-[100px] text-center ${
                        r.ESTADO === 'En Proceso' ? 'bg-app-primary text-white' : 'bg-app-yellow-bg text-app-yellow-text'
                      }`}>
                        {r.ESTADO}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {activeRounds.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-[10px] font-black uppercase text-app-text-sub opacity-30 tracking-[0.3em]">
                    No hay actividades pendientes en la nube
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
