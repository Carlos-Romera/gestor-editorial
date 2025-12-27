
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
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const [projectForm, setProjectForm] = useState<Partial<Proyecto>>({});
  const [unitForm, setUnitForm] = useState<Partial<Unidad>>({});
  const [roundForm, setRoundForm] = useState<Partial<Ronda>>({});

  useEffect(() => {
    if (pendingDelete) {
      const t = setTimeout(() => setPendingDelete(null), 3000);
      return () => clearTimeout(t);
    }
  }, [pendingDelete]);

  const filteredProyectos = useMemo(() => {
    return data.proyectos.filter(p => 
      p.NOMBRE_PROYECTO.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.CLIENTE.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data.proyectos, searchTerm]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '---';
    try {
      const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const d = new Date(cleanDate);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase().replace('.', '');
    } catch {
      return dateStr;
    }
  };

  const toggleUnit = (id: string) => {
    const next = new Set(expandedUnits);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedUnits(next);
  };

  const isMajorPhase = (tipo: string) => {
    const t = (tipo || '').toUpperCase();
    return t.includes('PRIMERAS') || t.includes('SEGUNDAS') || t.includes('TERCERAS') || t.includes('FINALES');
  };

  const getCategoryDisplay = (ronda: Ronda) => {
    const isMayor = isMajorPhase(ronda.TIPO_RONDA);
    return {
      text: isMayor ? 'MAYOR' : 'MENOR',
      className: isMayor 
        ? 'bg-app-quick-cyan/20 text-app-quick-text/60 border-app-quick-text/5' 
        : 'bg-app-accent-blue/10 text-app-primary/60 border-app-primary/5'
    };
  };

  // HANDLERS PARA GUARDAR (CREAR O EDITAR)
  const handleSaveProject = async () => {
    if (!projectForm.NOMBRE_PROYECTO) return;
    setIsSaving(true);
    const id = projectForm.ID_PROYECTO || generateId('P');
    await saveItem('proyecto', { ...projectForm, ID_PROYECTO: id, ESTADO: projectForm.ESTADO || 'Activo' });
    setProjectModalOpen(false);
    onUpdate();
    setIsSaving(false);
  };

  const handleSaveUnit = async () => {
    if (!unitForm.CODIGO_UD) return;
    setIsSaving(true);
    const id = unitForm.ID_UNIDAD || generateId('U');
    await saveItem('unidad', { ...unitForm, ID_UNIDAD: id });
    setUnitModalOpen(false);
    onUpdate();
    setIsSaving(false);
  };

  const handleSaveRound = async () => {
    if (!roundForm.TIPO_RONDA) return;
    setIsSaving(true);
    const id = roundForm.ID_RONDA || generateId('R');
    await saveItem('ronda', { ...roundForm, ID_RONDA: id });
    setRoundModalOpen(false);
    onUpdate();
    setIsSaving(false);
  };

  const handleDelete = async (type: 'proyecto' | 'unidad' | 'ronda', id: string) => {
    if (pendingDelete === id) {
      setIsSaving(true);
      await deleteItem(type, id);
      if (type === 'proyecto') setSelectedProject(null);
      setPendingDelete(null);
      onUpdate();
      setIsSaving(false);
    } else {
      setPendingDelete(id);
    }
  };

  // VISTA DE DETALLE DE UN PROYECTO
  if (selectedProject) {
    const units = data.unidades
      .filter(u => String(u.ID_PROYECTO) === String(selectedProject.ID_PROYECTO))
      .sort((a, b) => a.CODIGO_UD.localeCompare(b.CODIGO_UD, undefined, { numeric: true }));

    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
        {/* CABECERA PROYECTO */}
        <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-app-text-sub/5">
          <button onClick={() => setSelectedProject(null)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-app-text-sub hover:text-app-primary transition-all">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M15 19l-7-7 7-7" /></svg>
            Volver
          </button>
          <div className="text-center group cursor-pointer" onClick={() => { setProjectForm(selectedProject); setProjectModalOpen(true); }}>
            <div className="flex items-center justify-center gap-3">
               <h2 className="text-3xl font-light tracking-tight text-app-text-main group-hover:text-app-primary transition-colors">{selectedProject.NOMBRE_PROYECTO}</h2>
               <svg className="w-4 h-4 text-app-text-sub/20 group-hover:text-app-primary opacity-0 group-hover:opacity-100 transition-all" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            </div>
            <p className="text-[10px] font-black text-app-text-sub uppercase tracking-[0.3em] mt-1">{selectedProject.CLIENTE} • {selectedProject.CAMPANA}</p>
          </div>
          <button onClick={() => {setUnitForm({ID_PROYECTO: selectedProject.ID_PROYECTO}); setUnitModalOpen(true);}} className="bg-app-primary text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-app-primary/20 hover:scale-105 active:scale-95 transition-all">Nueva Unidad</button>
        </div>

        {/* LISTADO DE UNIDADES */}
        <div className="space-y-4">
          {units.map(unit => {
            const rounds = data.rondas.filter(r => String(r.ID_UNIDAD) === String(unit.ID_UNIDAD));
            const isExpanded = expandedUnits.has(unit.ID_UNIDAD);
            const latestRound = rounds.length > 0 
              ? [...rounds].sort((a, b) => new Date(b.FECHA_LIMITE).getTime() - new Date(a.FECHA_LIMITE).getTime())[0]
              : null;

            return (
              <div key={unit.ID_UNIDAD} className="bg-white rounded-[2rem] border border-app-text-sub/5 overflow-hidden shadow-sm transition-all hover:shadow-md">
                
                <div className={`p-6 flex items-center gap-4 transition-all ${isExpanded ? 'bg-app-bg/10' : ''}`}>
                  
                  {/* ID / TÍTULO */}
                  <div className="flex items-center gap-4 w-[30%] cursor-pointer" onClick={() => toggleUnit(unit.ID_UNIDAD)}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isExpanded ? 'bg-app-primary text-white shadow-lg' : 'bg-app-bg text-app-text-sub'}`}>
                       <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-app-text-main text-lg leading-none">{unit.CODIGO_UD}</h4>
                      <p className="text-[10px] text-app-text-sub font-bold uppercase tracking-widest mt-1.5 truncate max-w-[180px]">{unit.TITULO_UD || 'Sin título'}</p>
                    </div>
                  </div>

                  {!isExpanded && (
                    <>
                      <div className="w-[20%]">
                        {latestRound && <span className="text-xs font-black uppercase tracking-widest text-app-text-main">{latestRound.TIPO_RONDA}</span>}
                      </div>
                      <div className="w-[15%]">
                        {latestRound && <span className={`px-3 py-1 text-[8px] font-black uppercase border rounded-md ${getCategoryDisplay(latestRound).className}`}>{getCategoryDisplay(latestRound).text}</span>}
                      </div>
                      <div className="w-[15%] text-center">
                        {latestRound && <span className="text-[10px] font-bold text-app-text-main">{formatDate(latestRound.FECHA_LIMITE)}</span>}
                      </div>
                      <div className="w-[20%] flex justify-end items-center gap-3">
                        <button onClick={() => {setUnitForm(unit); setUnitModalOpen(true);}} className="p-2 text-app-text-sub hover:text-app-primary transition-colors">
                           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                        </button>
                        <button onClick={() => {setRoundForm({ID_UNIDAD: unit.ID_UNIDAD, ESTADO: 'Pendiente', CATEGORIA: 'Mayor', TIPO_RONDA: 'Primeras'}); setRoundModalOpen(true);}} className="bg-app-accent-blue/40 text-app-primary px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-app-primary/10">+ FASE</button>
                      </div>
                    </>
                  )}
                </div>

                {isExpanded && (
                  <div className="px-6 pb-8 bg-app-bg/5 border-t border-app-text-sub/5 pt-4">
                    <div className="space-y-1">
                      {rounds.map(r => (
                        <div key={r.ID_RONDA} className="flex items-center py-4 px-4 hover:bg-white rounded-2xl transition-all group">
                          <div className="w-[30%] pl-10">
                            <span className="text-sm font-bold text-app-text-main">{r.TIPO_RONDA}</span>
                          </div>
                          <div className="w-[20%]">
                            <span className={`px-3 py-1 text-[8px] font-black uppercase border rounded-md ${getCategoryDisplay(r).className}`}>{getCategoryDisplay(r).text}</span>
                          </div>
                          <div className="w-[15%] text-center">
                            <span className="text-[10px] font-bold text-app-text-sub">{formatDate(r.FECHA_LIMITE)}</span>
                          </div>
                          <div className="w-[15%] text-center">
                            <span className={`px-3 py-1 rounded-md text-[8px] font-black uppercase border ${r.ESTADO === 'Entregada' ? 'bg-app-green/10 text-app-green border-app-green/20' : 'bg-app-yellow-bg text-app-yellow-text border-app-yellow-text/20'}`}>{r.ESTADO}</span>
                          </div>
                          <div className="w-[20%] flex justify-end">
                             <button onClick={() => handleDelete('ronda', r.ID_RONDA)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${pendingDelete === r.ID_RONDA ? 'bg-app-red-bg text-app-red-text' : 'text-app-text-sub/20 hover:text-app-red-text'}`}>
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                             </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* MODAL UNIDAD */}
        <Modal isOpen={isUnitModalOpen} onClose={() => setUnitModalOpen(false)} title={unitForm.ID_UNIDAD ? "Editar Unidad" : "Nueva Unidad"}>
          <div className="space-y-4">
            <input className="w-full p-4 bg-app-bg rounded-2xl font-bold outline-none" placeholder="Código (Ej: UD 01)" value={unitForm.CODIGO_UD || ''} onChange={e => setUnitForm({...unitForm, CODIGO_UD: e.target.value})} />
            <input className="w-full p-4 bg-app-bg rounded-2xl font-medium outline-none" placeholder="Título de la unidad" value={unitForm.TITULO_UD || ''} onChange={e => setUnitForm({...unitForm, TITULO_UD: e.target.value})} />
            <button onClick={handleSaveUnit} disabled={isSaving} className="w-full bg-app-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-app-primary/20 disabled:opacity-50">{isSaving ? 'Guardando...' : 'Guardar Cambios'}</button>
          </div>
        </Modal>

        {/* MODAL RONDA */}
        <Modal isOpen={isRoundModalOpen} onClose={() => setRoundModalOpen(false)} title="Registrar Fase Editorial">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <select className="p-4 bg-app-bg rounded-2xl font-bold" value={roundForm.CATEGORIA} onChange={e => setRoundForm({...roundForm, CATEGORIA: e.target.value})}>
                <option value="Mayor">P. Mayores</option>
                <option value="Menor">P. Menores</option>
              </select>
              <input className="p-4 bg-app-bg rounded-2xl font-bold" placeholder="Fase (Ej: Segundas)" value={roundForm.TIPO_RONDA || ''} onChange={e => setRoundForm({...roundForm, TIPO_RONDA: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-[9px] font-black uppercase text-app-text-sub ml-2 mb-1 block">Límite</label>
                 <input type="date" className="w-full p-4 bg-app-bg rounded-2xl font-bold" value={roundForm.FECHA_LIMITE} onChange={e => setRoundForm({...roundForm, FECHA_LIMITE: e.target.value})} />
               </div>
               <div>
                 <label className="text-[9px] font-black uppercase text-app-text-sub ml-2 mb-1 block">Estado</label>
                 <select className="w-full p-4 bg-app-bg rounded-2xl font-bold" value={roundForm.ESTADO} onChange={e => setRoundForm({...roundForm, ESTADO: e.target.value})}>
                    <option value="Pendiente">Pendiente</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="Entregada">Entregada</option>
                 </select>
               </div>
            </div>
            <button onClick={handleSaveRound} disabled={isSaving} className="w-full bg-app-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-app-primary/20">{isSaving ? 'Sincronizando...' : 'Guardar Registro'}</button>
          </div>
        </Modal>
      </div>
    );
  }

  // VISTA DE CATÁLOGO DE LIBROS
  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
        <div>
          <h2 className="text-6xl font-extralight tracking-tighter text-app-text-main">Libros</h2>
          <p className="text-[11px] text-app-text-sub font-bold uppercase tracking-[0.4em] mt-2 ml-1">Catálogo McGraw Hill 2025</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative">
              <input 
                type="text" 
                placeholder="BUSCAR LIBRO..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-white border border-app-text-sub/10 rounded-2xl px-6 py-4 text-[11px] font-bold uppercase tracking-widest w-72 outline-none focus:ring-2 focus:ring-app-primary/20 transition-all shadow-sm"
              />
           </div>
           <button onClick={() => {setProjectForm({CLIENTE: 'McGraw Hill', CAMPANA: '2025'}); setProjectModalOpen(true);}} className="bg-app-sidebar text-white px-10 py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest hover:bg-app-primary transition-all shadow-xl">+ NUEVO LIBRO</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredProyectos.map(proj => (
          <div key={proj.ID_PROYECTO} onClick={() => setSelectedProject(proj)} className="bg-white p-10 rounded-[3.5rem] border border-app-text-sub/5 shadow-sm hover:shadow-2xl hover:border-app-primary/30 hover:-translate-y-2 cursor-pointer transition-all duration-500 group relative flex flex-col min-h-[300px]">
            <div className="flex justify-between items-start mb-8">
               <span className="text-[10px] bg-app-accent-blue/30 text-app-primary px-4 py-1.5 rounded-full font-black uppercase tracking-widest">{proj.CAMPANA}</span>
               <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); setProjectForm(proj); setProjectModalOpen(true); }} className="w-9 h-9 rounded-xl flex items-center justify-center bg-app-bg text-app-text-sub hover:text-app-primary transition-all">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete('proyecto', proj.ID_PROYECTO); }} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${pendingDelete === proj.ID_PROYECTO ? 'bg-app-red-bg text-app-red-text' : 'text-app-text-sub/20 hover:text-app-red-text'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
               </div>
            </div>
            <h3 className="font-bold text-3xl text-app-text-main group-hover:text-app-primary transition-colors leading-tight mb-2">{proj.NOMBRE_PROYECTO}</h3>
            <p className="text-[12px] text-app-text-sub font-bold uppercase tracking-widest mb-10">{proj.CLIENTE}</p>
            <div className="mt-auto flex items-center justify-between border-t border-app-bg pt-8">
              <span className="text-[11px] font-black text-app-text-sub/40 uppercase tracking-widest flex items-center gap-2 group-hover:text-app-primary transition-all">
                Gestionar Unidades
                <svg className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
              </span>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isProjectModalOpen} onClose={() => setProjectModalOpen(false)} title={projectForm.ID_PROYECTO ? "Editar Libro" : "Nuevo Libro"}>
        <div className="space-y-6">
          <input className="w-full p-6 bg-app-bg rounded-[1.5rem] font-bold text-2xl outline-none" placeholder="Título del Libro" value={projectForm.NOMBRE_PROYECTO || ''} onChange={e => setProjectForm({...projectForm, NOMBRE_PROYECTO: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
             <input className="p-5 bg-app-bg rounded-2xl font-bold" placeholder="Campaña" value={projectForm.CAMPANA || ''} onChange={e => setProjectForm({...projectForm, CAMPANA: e.target.value})} />
             <input className="p-5 bg-app-bg rounded-2xl font-bold" placeholder="Cliente" value={projectForm.CLIENTE || ''} onChange={e => setProjectForm({...projectForm, CLIENTE: e.target.value})} />
          </div>
          <button onClick={handleSaveProject} disabled={isSaving} className="w-full bg-app-primary text-white py-6 rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-app-primary/20 disabled:opacity-50">{isSaving ? 'Guardando...' : 'Guardar Proyecto'}</button>
        </div>
      </Modal>
    </div>
  );
};
