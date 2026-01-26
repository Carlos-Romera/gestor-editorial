
import React, { useState, useEffect, useMemo } from 'react';
import { AppData, Proyecto, Unidad, Ronda } from '../types';
import { Modal } from '../components/Modal';
import { generateId, saveItem, deleteItem } from '../services/api';

interface ProjectsManagerProps {
  data: AppData;
  onUpdate: () => void;
}

export const ProjectsManager: React.FC<ProjectsManagerProps> = ({ data, onUpdate }) => {
  const [selectedProject, setSelectedProject] = useState<Proyecto | null>(null);
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isProjectModalOpen, setProjectModalOpen] = useState(false);
  const [isUnitModalOpen, setUnitModalOpen] = useState(false);
  const [isRoundModalOpen, setRoundModalOpen] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  const [projectForm, setProjectForm] = useState<Partial<Proyecto>>({});
  const [unitForm, setUnitForm] = useState<Partial<Unidad>>({});
  const [roundForm, setRoundForm] = useState<Partial<Ronda>>({});

  const filteredProyectos = useMemo(() => {
    return [...data.proyectos]
      .filter(p => p.NOMBRE_PROYECTO.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.NOMBRE_PROYECTO.localeCompare(b.NOMBRE_PROYECTO));
  }, [data.proyectos, searchTerm]);

  const handleSaveWithFeedback = async (type: 'proyecto' | 'unidad' | 'ronda', form: any, closeFn: () => void) => {
    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      const idField = type === 'proyecto' ? 'ID_PROYECTO' : type === 'unidad' ? 'ID_UNIDAD' : 'ID_RONDA';
      const prefix = type === 'proyecto' ? 'P' : type === 'unidad' ? 'U' : 'R';
      
      const item = { 
        ...form, 
        [idField]: form[idField] || generateId(prefix) 
      };
      
      await saveItem(type, item);
      
      setSaveStatus('success');
      setTimeout(() => {
        closeFn();
        onUpdate();
        setIsSaving(false);
        setSaveStatus('idle');
      }, 800);
    } catch (err) {
      alert("Error al sincronizar con Google Sheets");
      setIsSaving(false);
      setSaveStatus('idle');
    }
  };

  const toggleUnit = (id: string) => {
    const next = new Set(expandedUnits);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedUnits(next);
  };

  const openEditUnit = (unit: Unidad) => {
    setUnitForm(unit);
    setUnitModalOpen(true);
  };

  const openEditRound = (round: Ronda) => {
    let formattedDate = '';
    if (round.FECHA_LIMITE) {
      const d = new Date(round.FECHA_LIMITE);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toISOString().split('T')[0];
      }
    }
    setRoundForm({ ...round, FECHA_LIMITE: formattedDate });
    setRoundModalOpen(true);
  };

  // Lógica para determinar la fase más avanzada (última modificación conceptual)
  const getLatestRound = (rounds: Ronda[]) => {
    if (rounds.length === 0) return null;
    const priority: Record<string, number> = {
      'Finales': 4,
      'Terceras': 3,
      'Segundas': 2,
      'Primeras': 1
    };
    return [...rounds].sort((a, b) => (priority[b.TIPO_RONDA] || 0) - (priority[a.TIPO_RONDA] || 0))[0];
  };

  if (selectedProject) {
    const units = data.unidades
      .filter(u => u.ID_PROYECTO === selectedProject.ID_PROYECTO)
      .sort((a, b) => a.CODIGO_UD.localeCompare(b.CODIGO_UD, undefined, { numeric: true }));

    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-app-text-sub/5 gap-4">
          <button onClick={() => setSelectedProject(null)} className="text-[10px] font-black uppercase tracking-widest text-app-text-sub hover:text-app-primary transition-all flex items-center gap-2 self-start md:self-center">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M15 19l-7-7 7-7" /></svg>
            Proyectos
          </button>
          <h2 className="text-3xl font-light tracking-tight text-app-text-main text-center">{selectedProject.NOMBRE_PROYECTO}</h2>
          <button onClick={() => {setUnitForm({ID_PROYECTO: selectedProject.ID_PROYECTO}); setUnitModalOpen(true);}} className="bg-app-primary text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-app-primary/20 hover:scale-105 active:scale-95 transition-all">Añadir Unidad</button>
        </div>

        <div className="space-y-4">
          {units.map(unit => {
            const rounds = data.rondas.filter(r => r.ID_UNIDAD === unit.ID_UNIDAD);
            const latestRound = getLatestRound(rounds);
            const isExpanded = expandedUnits.has(unit.ID_UNIDAD);

            return (
              <div key={unit.ID_UNIDAD} className="bg-white rounded-[2rem] border border-app-text-sub/5 overflow-hidden shadow-sm">
                <div className={`p-6 flex items-center cursor-pointer hover:bg-app-bg/10 transition-colors ${isExpanded ? 'bg-app-bg/20' : ''}`} onClick={() => toggleUnit(unit.ID_UNIDAD)}>
                  
                  {/* BLOQUE IZQUIERDA: Info Unidad */}
                  <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${isExpanded ? 'bg-app-primary text-white' : 'bg-app-bg text-app-text-sub'}`}>
                       <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    <div className="truncate">
                      <h4 className="font-bold text-app-text-main text-lg tracking-tight truncate">{unit.CODIGO_UD}</h4>
                      <p className="text-[9px] text-app-text-sub font-black uppercase tracking-widest truncate">{unit.TITULO_UD || 'Sin título'}</p>
                    </div>
                  </div>

                  {/* BLOQUE CENTRAL: Estado / Última modificación */}
                  <div className="hidden md:flex flex-1 justify-center items-center">
                    {latestRound ? (
                      <div className={`flex items-center gap-2.5 px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] border transition-all ${
                        latestRound.ESTADO === 'Entregada' ? 'bg-app-green/5 text-app-green border-app-green/20' :
                        latestRound.ESTADO === 'En Proceso' ? 'bg-app-primary/5 text-app-primary border-app-primary/20' :
                        'bg-app-yellow-bg/40 text-app-yellow-text border-app-yellow-text/20'
                      }`}>
                        <span className="opacity-40">{latestRound.TIPO_RONDA}:</span>
                        <span className="whitespace-nowrap">{latestRound.ESTADO}</span>
                      </div>
                    ) : (
                      <span className="text-[9px] font-black uppercase tracking-widest text-app-text-sub opacity-20 px-4 py-2 border border-dashed border-app-text-sub/20 rounded-xl">Sin Fases Activas</span>
                    )}
                  </div>

                  {/* BLOQUE DERECHA: Acciones */}
                  <div className="flex gap-3 items-center flex-1 justify-end">
                     <button 
                       onClick={(e) => { e.stopPropagation(); openEditUnit(unit); }} 
                       className="p-3 bg-app-bg text-app-text-sub hover:text-app-primary rounded-xl transition-all group/btn"
                       title="Editar Unidad"
                     >
                       <svg className="w-4 h-4 transition-transform group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                     </button>
                     <button 
                       onClick={(e) => { e.stopPropagation(); setRoundForm({ID_UNIDAD: unit.ID_UNIDAD, ESTADO: 'Pendiente', CATEGORIA: 'Mayor'}); setRoundModalOpen(true); }} 
                       className="bg-app-bg text-app-primary px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border border-app-primary/5 hover:bg-app-primary hover:text-white transition-all shadow-sm"
                     >
                       Nueva Fase
                     </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-6 bg-app-bg/5 border-t border-app-text-sub/5">
                    {rounds.length === 0 ? (
                      <p className="text-center py-8 text-[10px] font-black uppercase text-app-text-sub opacity-30">No hay fases registradas</p>
                    ) : (
                      <div className="space-y-3">
                        {[...rounds].sort((a,b) => (priorityOrder[b.TIPO_RONDA] || 0) - (priorityOrder[a.TIPO_RONDA] || 0)).map(r => (
                          <div 
                            key={r.ID_RONDA} 
                            onClick={() => openEditRound(r)}
                            className="flex items-center justify-between p-4 bg-white rounded-2xl border border-app-text-sub/5 shadow-sm hover:border-app-primary/30 cursor-pointer group transition-all"
                          >
                            <div className="flex items-center gap-6">
                               <div className="w-8 h-8 rounded-lg bg-app-bg flex items-center justify-center text-app-primary font-black text-[10px]">
                                 {r.TIPO_RONDA.charAt(0)}
                               </div>
                               <div>
                                 <span className="text-[10px] font-black uppercase text-app-text-main tracking-widest block">{r.TIPO_RONDA}</span>
                                 <span className="text-[9px] font-bold text-app-text-sub italic">{r.FECHA_LIMITE ? new Date(r.FECHA_LIMITE).toLocaleDateString() : 'Sin fecha'}</span>
                               </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg ${
                                r.ESTADO === 'Entregada' ? 'bg-app-green/10 text-app-green' : 
                                r.ESTADO === 'En Proceso' ? 'bg-app-primary/10 text-app-primary' : 
                                'bg-app-yellow-bg text-app-yellow-text'
                              }`}>
                                {r.ESTADO || 'Pendiente'}
                              </span>
                              <svg className="w-4 h-4 text-app-text-sub opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Modal isOpen={isUnitModalOpen} onClose={() => setUnitModalOpen(false)} title={unitForm.ID_UNIDAD ? "Editar Unidad" : "Nueva Unidad Cloud"}>
          <div className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-app-text-sub ml-4">Código</label>
              <input className="w-full p-5 bg-app-bg border border-app-text-sub/10 rounded-2xl font-bold outline-none focus:border-app-primary transition-all" placeholder="Ej: UD 01" value={unitForm.CODIGO_UD || ''} onChange={e => setUnitForm({...unitForm, CODIGO_UD: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-app-text-sub ml-4">Título</label>
              <input className="w-full p-5 bg-app-bg border border-app-text-sub/10 rounded-2xl font-medium outline-none focus:border-app-primary transition-all" placeholder="Título del tema" value={unitForm.TITULO_UD || ''} onChange={e => setUnitForm({...unitForm, TITULO_UD: e.target.value})} />
            </div>
            <div className="flex gap-4">
               {unitForm.ID_UNIDAD && (
                  <button onClick={() => { if(confirm('¿Borrar unidad?')) { deleteItem('unidad', unitForm.ID_UNIDAD!); setUnitModalOpen(false); onUpdate(); } }} className="px-6 bg-app-red-bg text-app-red-text rounded-2xl font-black text-[10px] uppercase">Borrar</button>
               )}
               <button 
                onClick={() => handleSaveWithFeedback('unidad', unitForm, () => setUnitModalOpen(false))} 
                disabled={isSaving} 
                className={`flex-1 py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${
                  saveStatus === 'success' ? 'bg-app-green text-white' : 'bg-app-primary text-white shadow-app-primary/20'
                }`}
              >
                {saveStatus === 'saving' ? 'Guardando...' : saveStatus === 'success' ? '¡Hecho!' : unitForm.ID_UNIDAD ? 'Actualizar' : 'Guardar Unidad'}
              </button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={isRoundModalOpen} onClose={() => setRoundModalOpen(false)} title={roundForm.ID_RONDA ? "Modificar Fase" : "Nueva Fase Editorial"}>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-app-text-sub ml-4">Fase</label>
                <select className="w-full p-5 bg-app-bg border border-app-text-sub/10 rounded-2xl font-bold outline-none" value={roundForm.TIPO_RONDA || ''} onChange={e => setRoundForm({...roundForm, TIPO_RONDA: e.target.value})}>
                  <option value="">Selecciona...</option>
                  <option value="Primeras">Primeras</option>
                  <option value="Segundas">Segundas</option>
                  <option value="Terceras">Terceras</option>
                  <option value="Finales">Finales</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-app-text-sub ml-4">Estado</label>
                <select className="w-full p-5 bg-app-bg border border-app-text-sub/10 rounded-2xl font-bold outline-none" value={roundForm.ESTADO || 'Pendiente'} onChange={e => setRoundForm({...roundForm, ESTADO: e.target.value})}>
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Proceso">En Proceso</option>
                  <option value="Entregada">Entregada</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-app-text-sub ml-4">Fecha Límite</label>
                <input type="date" className="w-full p-5 bg-app-bg border border-app-text-sub/10 rounded-2xl font-bold outline-none" value={roundForm.FECHA_LIMITE || ''} onChange={e => setRoundForm({...roundForm, FECHA_LIMITE: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-app-text-sub ml-4">Categoría</label>
                <select className="w-full p-5 bg-app-bg border border-app-text-sub/10 rounded-2xl font-bold outline-none" value={roundForm.CATEGORIA || 'Mayor'} onChange={e => setRoundForm({...roundForm, CATEGORIA: e.target.value})}>
                  <option value="Mayor">Mayor</option>
                  <option value="Menor">Menor</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-app-text-sub ml-4">Enlace Archivo (Opcional)</label>
              <input className="w-full p-5 bg-app-bg border border-app-text-sub/10 rounded-2xl font-medium outline-none" placeholder="https://..." value={roundForm.ENLACE_ARCH || ''} onChange={e => setRoundForm({...roundForm, ENLACE_ARCH: e.target.value})} />
            </div>

            <div className="flex gap-4">
              {roundForm.ID_RONDA && (
                <button onClick={() => { if(confirm('¿Eliminar esta fase?')) { deleteItem('ronda', roundForm.ID_RONDA!); setRoundModalOpen(false); onUpdate(); } }} className="px-6 bg-app-red-bg text-app-red-text rounded-2xl font-black text-[10px] uppercase">Eliminar</button>
              )}
              <button 
                onClick={() => handleSaveWithFeedback('ronda', roundForm, () => setRoundModalOpen(false))} 
                disabled={isSaving} 
                className={`flex-1 py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${
                  saveStatus === 'success' ? 'bg-app-green text-white' : 'bg-app-primary text-white shadow-app-primary/20'
                }`}
              >
                {saveStatus === 'saving' ? 'Subiendo...' : saveStatus === 'success' ? '¡Hecho!' : roundForm.ID_RONDA ? 'Guardar Cambios' : 'Crear Fase'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
        <div>
          <h2 className="text-6xl font-extralight tracking-tighter text-app-text-main">Gestión Editorial</h2>
          <p className="text-[11px] text-app-text-sub font-bold uppercase tracking-[0.4em] mt-2 ml-1 italic">Sincronización total con Google Sheets</p>
        </div>
        <div className="flex items-center gap-4">
           <input type="text" placeholder="Filtrar proyectos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-white border border-app-text-sub/10 rounded-2xl px-6 py-4 text-[11px] font-bold uppercase w-72 outline-none shadow-sm focus:border-app-primary transition-all" />
           <button onClick={() => {setProjectForm({CLIENTE: 'McGraw Hill', CAMPANA: '2025', ESTADO: 'Activo'}); setProjectModalOpen(true);}} className="bg-app-sidebar text-white px-10 py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-app-sidebar/20 hover:bg-app-primary transition-all">+ NUEVO</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredProyectos.map(proj => (
          <div key={proj.ID_PROYECTO} onClick={() => setSelectedProject(proj)} className="bg-white p-10 rounded-[3.5rem] border border-app-text-sub/5 shadow-sm hover:shadow-2xl cursor-pointer transition-all duration-500 group relative flex flex-col min-h-[250px] overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-app-primary opacity-20 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-3xl text-app-text-main group-hover:text-app-primary transition-colors leading-tight tracking-tight">{proj.NOMBRE_PROYECTO}</h3>
              <button onClick={(e) => { e.stopPropagation(); setProjectForm(proj); setProjectModalOpen(true); }} className="p-2 opacity-0 group-hover:opacity-100 text-app-text-sub hover:text-app-primary transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2.5 2.5 0 113.536 3.536L12 14.243H8.5V10.757l9.414-9.414z" /></svg>
              </button>
            </div>
            <p className="text-[12px] text-app-text-sub font-black uppercase tracking-[0.2em] mt-auto border-t border-app-bg pt-6 flex items-center justify-between">
              {proj.CLIENTE}
              <svg className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
            </p>
          </div>
        ))}
      </div>

      <Modal isOpen={isProjectModalOpen} onClose={() => setProjectModalOpen(false)} title={projectForm.ID_PROYECTO ? "Editar Proyecto" : "Nuevo Proyecto Cloud"}>
        <div className="space-y-6">
          <div className="space-y-1">
             <label className="text-[10px] font-black uppercase tracking-widest text-app-text-sub ml-4">Nombre del Libro / Proyecto</label>
             <input className="w-full p-6 bg-app-bg border border-app-text-sub/10 rounded-[1.5rem] font-bold text-xl outline-none focus:border-app-primary transition-all" placeholder="Ej: Biología 2 Bachillerato" value={projectForm.NOMBRE_PROYECTO || ''} onChange={e => setProjectForm({...projectForm, NOMBRE_PROYECTO: e.target.value})} />
          </div>
          <div className="flex gap-4">
            {projectForm.ID_PROYECTO && (
              <button onClick={() => { if(confirm('¿Borrar proyecto?')) { deleteItem('proyecto', projectForm.ID_PROYECTO!); setProjectModalOpen(false); onUpdate(); } }} className="px-6 bg-app-red-bg text-app-red-text rounded-2xl font-black text-[10px] uppercase">Borrar</button>
            )}
            <button 
              onClick={() => handleSaveWithFeedback('proyecto', projectForm, () => setProjectModalOpen(false))} 
              disabled={isSaving} 
              className={`flex-1 py-6 rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${
                saveStatus === 'success' ? 'bg-app-green text-white' : 'bg-app-primary text-white shadow-app-primary/20'
              }`}
            >
              {saveStatus === 'saving' ? 'Guardando...' : saveStatus === 'success' ? '¡Guardado!' : projectForm.ID_PROYECTO ? 'Actualizar' : 'Crear Proyecto'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const priorityOrder: Record<string, number> = {
  'Finales': 4,
  'Terceras': 3,
  'Segundas': 2,
  'Primeras': 1
};
