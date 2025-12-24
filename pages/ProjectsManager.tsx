import React, { useState } from 'react';
import { AppData, Proyecto, Unidad, Ronda, EstadoProyecto, EstadoRonda, TipoRonda, CategoriaRonda } from '../types';
import { Modal } from '../components/Modal';
import { generateId, saveItem, deleteItem } from '../services/api';
import { DEFAULT_DEADLINE_DAYS } from '../constants';

interface ProjectsManagerProps {
  data: AppData;
  onUpdate: () => void;
}

export const ProjectsManager: React.FC<ProjectsManagerProps> = ({ data, onUpdate }) => {
  const [selectedProject, setSelectedProject] = useState<Proyecto | null>(null);
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

  // Estados de Modales
  const [isProjectModalOpen, setProjectModalOpen] = useState(false);
  const [isUnitModalOpen, setUnitModalOpen] = useState(false);
  const [isRoundModalOpen, setRoundModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Estados de Formularios
  const [projectForm, setProjectForm] = useState<Partial<Proyecto>>({});
  const [unitForm, setUnitForm] = useState<Partial<Unidad>>({});
  const [roundForm, setRoundForm] = useState<Partial<Ronda>>({});

  // Alternar apertura de acordeón
  const toggleUnit = (unitId: string) => {
    const newExpanded = new Set(expandedUnits);
    if (newExpanded.has(unitId)) newExpanded.delete(unitId);
    else newExpanded.add(unitId);
    setExpandedUnits(newExpanded);
  };

  // --- GESTIÓN DE PROYECTOS ---
  const handleNewProject = () => {
    setProjectForm({ 
      ID_PROYECTO: '', 
      ESTADO: EstadoProyecto.ACTIVO, 
      CLIENTE: 'McGraw Hill', 
      CAMPANA: '2025' 
    });
    setProjectModalOpen(true);
  };

  const handleEditProject = (p: Proyecto) => {
    setProjectForm(p);
    setProjectModalOpen(true);
  };

  const saveProject = async () => {
    if (!projectForm.NOMBRE_PROYECTO?.trim()) return alert("El nombre es obligatorio");
    setIsSaving(true);
    try {
        const id = projectForm.ID_PROYECTO || generateId('P');
        await saveItem('proyecto', { ...projectForm, ID_PROYECTO: id });
        setProjectModalOpen(false);
        onUpdate();
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  // --- GESTIÓN DE UNIDADES ---
  const handleNewUnit = () => {
    setUnitForm({ 
      ID_PROYECTO: selectedProject!.ID_PROYECTO, 
      CODIGO_UD: '', 
      TITULO_UD: '', 
      NOTAS: '' 
    });
    setUnitModalOpen(true);
  };

  const handleEditUnit = (u: Unidad, e: React.MouseEvent) => {
    e.stopPropagation();
    setUnitForm(u);
    setUnitModalOpen(true);
  };

  const saveUnit = async () => {
    if (!unitForm.CODIGO_UD?.trim()) return alert("El código (ej: UD 01) es obligatorio");
    setIsSaving(true);
    try {
        const id = unitForm.ID_UNIDAD || generateId('U');
        await saveItem('unidad', { ...unitForm, ID_UNIDAD: id });
        setUnitModalOpen(false);
        onUpdate();
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  // --- GESTIÓN DE RONDAS (PRUEBAS) ---
  const handleNewRound = (unit: Unidad, e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date().toISOString().split('T')[0];
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + DEFAULT_DEADLINE_DAYS);

    setRoundForm({
      ID_UNIDAD: unit.ID_UNIDAD,
      CATEGORIA: CategoriaRonda.MAYOR,
      TIPO_RONDA: TipoRonda.PRIMERAS,
      ESTADO: EstadoRonda.PENDIENTE,
      FECHA_RECEPCION: today,
      FECHA_LIMITE: deadline.toISOString().split('T')[0]
    });
    setRoundModalOpen(true);
    
    // Abrir el acordeón automáticamente si estaba cerrado
    const newExpanded = new Set(expandedUnits);
    newExpanded.add(unit.ID_UNIDAD);
    setExpandedUnits(newExpanded);
  };

  const saveRound = async () => {
    if (!roundForm.TIPO_RONDA) return alert("Indica el tipo de prueba");
    setIsSaving(true);
    try {
        await saveItem('ronda', { ...roundForm, ID_RONDA: roundForm.ID_RONDA || generateId('R') });
        setRoundModalOpen(false);
        onUpdate();
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  const markDelivered = async (r: Ronda) => {
    if (!confirm("¿Marcar como ENTREGADA?")) return;
    setIsSaving(true);
    try {
      await saveItem('ronda', { ...r, ESTADO: EstadoRonda.ENTREGADA });
      onUpdate();
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  // VISTA DE DETALLE DEL PROYECTO
  if (selectedProject) {
    // ORDENACIÓN NATURAL: UD 2 < UD 10
    const projectUnits = data.unidades
        .filter(u => u.ID_PROYECTO === selectedProject.ID_PROYECTO)
        .sort((a, b) => a.CODIGO_UD.localeCompare(b.CODIGO_UD, undefined, { numeric: true, sensitivity: 'base' }));

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <button 
          onClick={() => setSelectedProject(null)} 
          className="bg-white hover:bg-slate-50 text-slate-700 font-black py-3 px-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-2 transition-all active:scale-95 group"
        >
          <span className="text-xl group-hover:-translate-x-1 transition-transform">⬅</span> Volver a Proyectos
        </button>

        <div className="bg-white p-6 rounded-3xl shadow-sm border-l-8 border-accent flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{selectedProject.NOMBRE_PROYECTO}</h2>
            <p className="text-slate-500 font-medium">{selectedProject.CLIENTE} • {selectedProject.CAMPANA}</p>
          </div>
          <button onClick={() => handleEditProject(selectedProject)} className="text-accent text-xs font-black bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition-colors">CONFIGURAR</button>
        </div>

        <div className="flex justify-between items-center px-1">
          <h3 className="text-xl font-bold text-slate-800">Unidades</h3>
          <button onClick={handleNewUnit} className="bg-slate-900 text-white px-5 py-3 rounded-2xl text-xs font-black hover:bg-black transition-all shadow-xl active:scale-95">
            + Nueva Unidad
          </button>
        </div>

        <div className="space-y-3">
          {projectUnits.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-medium">
               Aún no hay unidades creadas.
            </div>
          )}
          
          {projectUnits.map(unit => {
            const unitRounds = data.rondas.filter(r => r.ID_UNIDAD === unit.ID_UNIDAD);
            const isExpanded = expandedUnits.has(unit.ID_UNIDAD);
            const activeRound = unitRounds.find(r => r.ESTADO !== EstadoRonda.ENTREGADA);
            
            return (
              <div key={unit.ID_UNIDAD} className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md ${isExpanded ? 'border-accent/30 ring-1 ring-accent/5' : 'border-slate-200'}`}>
                {/* CABECERA ACORDEÓN */}
                <div 
                  onClick={() => toggleUnit(unit.ID_UNIDAD)}
                  className="px-6 py-5 flex flex-col md:flex-row md:items-center justify-between cursor-pointer group bg-white hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                    <div className="flex items-center gap-3">
                        <span className="font-black text-slate-900 text-xl min-w-[65px]">{unit.CODIGO_UD}</span>
                        <span className="text-slate-600 truncate font-medium text-sm md:border-l md:pl-4 border-slate-200">{unit.TITULO_UD || '(Sin título)'}</span>
                        {activeRound && (
                           <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider animate-pulse border border-blue-200">
                             En curso
                           </span>
                        )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-end mt-4 md:mt-0">
                    <button onClick={(e) => handleEditUnit(unit, e)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">✎</button>
                    <button onClick={(e) => handleNewRound(unit, e)} className="text-[10px] bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-black font-black transition-all active:scale-95 shadow-md">+ Nueva Prueba</button>
                  </div>
                </div>
                
                {/* CUERPO ACORDEÓN */}
                {isExpanded && (
                    <div className="bg-slate-50/50 border-t border-slate-100 p-6 space-y-3 animate-in slide-in-from-top-2 duration-200">
                        {unitRounds.length > 0 ? (
                            unitRounds.map(round => (
                                <div key={round.ID_RONDA} className="p-4 bg-white rounded-2xl flex items-center justify-between border border-slate-200 shadow-sm">
                                  <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md border ${round.CATEGORIA === CategoriaRonda.MENOR ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                                            {round.CATEGORIA}
                                        </span>
                                        <span className="font-bold text-sm text-slate-800">{round.TIPO_RONDA}</span>
                                      </div>
                                      <div className="text-[11px] text-slate-500">
                                          Límite: <strong className="text-slate-700">{new Date(round.FECHA_LIMITE).toLocaleDateString('es-ES')}</strong>
                                          <span className={`ml-3 font-black ${round.ESTADO === EstadoRonda.ENTREGADA ? 'text-green-600' : 'text-amber-600'}`}>
                                              {round.ESTADO.toUpperCase()}
                                          </span>
                                      </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                      {round.ENLACE_ARCHIVO && (
                                      <a href={round.ENLACE_ARCHIVO} target="_blank" rel="noreferrer" className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-blue-600 hover:bg-blue-50">🔗</a>
                                      )}
                                      {round.ESTADO !== EstadoRonda.ENTREGADA && (
                                      <button onClick={() => markDelivered(round)} className="bg-green-600 text-white text-[10px] font-black px-3 py-2 rounded-lg hover:bg-green-700 transition-all">✓ Entregar</button>
                                      )}
                                  </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-6 text-sm text-slate-400 italic text-center">No hay pruebas registradas aún.</div>
                        )}
                        {unit.NOTAS && (
                          <div className="mt-2 p-3 bg-amber-50 rounded-xl border border-amber-100 text-[11px] text-amber-800">
                            <strong>Notas internas:</strong> {unit.NOTAS}
                          </div>
                        )}
                    </div>
                )}
              </div>
            );
          })}
        </div>

        {/* MODALES */}
        <Modal isOpen={isUnitModalOpen} onClose={() => setUnitModalOpen(false)} title="Datos Unidad">
           <div className="space-y-4">
             <input type="text" className="w-full border border-slate-300 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-accent font-bold" placeholder="Código (UD 01)" value={unitForm.CODIGO_UD || ''} onChange={e => setUnitForm({...unitForm, CODIGO_UD: e.target.value})} />
             <input type="text" className="w-full border border-slate-300 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-accent font-bold" placeholder="Título" value={unitForm.TITULO_UD || ''} onChange={e => setUnitForm({...unitForm, TITULO_UD: e.target.value})} />
             <textarea className="w-full border border-slate-300 rounded-2xl p-4" placeholder="Notas internas" rows={3} value={unitForm.NOTAS || ''} onChange={e => setUnitForm({...unitForm, NOTAS: e.target.value})} />
             <button onClick={saveUnit} disabled={isSaving} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-lg disabled:opacity-50">
                {isSaving ? 'Sincronizando...' : 'Guardar Unidad'}
             </button>
           </div>
        </Modal>

        <Modal isOpen={isRoundModalOpen} onClose={() => setRoundModalOpen(false)} title="Nueva Entrega">
           <div className="space-y-5">
             <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                <button onClick={() => setRoundForm({...roundForm, CATEGORIA: CategoriaRonda.MAYOR})} className={`py-3 rounded-xl text-[10px] font-black uppercase ${roundForm.CATEGORIA === CategoriaRonda.MAYOR ? 'bg-white shadow-sm text-blue-700' : 'text-slate-400'}`}>P. Mayor</button>
                <button onClick={() => setRoundForm({...roundForm, CATEGORIA: CategoriaRonda.MENOR})} className={`py-3 rounded-xl text-[10px] font-black uppercase ${roundForm.CATEGORIA === CategoriaRonda.MENOR ? 'bg-white shadow-sm text-purple-700' : 'text-slate-400'}`}>P. Menor</button>
             </div>
             <input type="text" className="w-full border border-slate-300 rounded-2xl p-4 font-bold" placeholder="Nombre (Primeras, Segundas...)" value={roundForm.TIPO_RONDA || ''} onChange={e => setRoundForm({...roundForm, TIPO_RONDA: e.target.value})} />
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Límite</label>
                  <input type="date" className="w-full border border-slate-300 rounded-2xl p-4 text-sm font-bold" value={roundForm.FECHA_LIMITE || ''} onChange={e => setRoundForm({...roundForm, FECHA_LIMITE: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">URL Archivo</label>
                  <input type="text" className="w-full border border-slate-300 rounded-2xl p-4 text-sm" placeholder="https://..." value={roundForm.ENLACE_ARCHIVO || ''} onChange={e => setRoundForm({...roundForm, ENLACE_ARCHIVO: e.target.value})} />
                </div>
             </div>
             <button onClick={saveRound} disabled={isSaving} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black shadow-xl">
                {isSaving ? 'Actualizando base de datos...' : 'Añadir al Historial'}
             </button>
           </div>
        </Modal>
      </div>
    );
  }

  // VISTA INICIAL: GRILLA DE PROYECTOS
  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Proyectos</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Gestión Editorial Centralizada</p>
        </div>
        <button onClick={handleNewProject} className="bg-slate-900 text-white px-8 py-5 rounded-[2rem] shadow-2xl hover:bg-black transition-all font-black active:scale-95 text-sm uppercase tracking-widest">
          + Crear Proyecto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {data.proyectos.map(proj => (
          <div key={proj.ID_PROYECTO} 
               onClick={() => setSelectedProject(proj)}
               className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:border-accent hover:-translate-y-2 cursor-pointer transition-all duration-300 group">
            <h3 className="font-black text-3xl text-slate-800 leading-tight group-hover:text-accent transition-colors mb-3">{proj.NOMBRE_PROYECTO}</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-10">{proj.CLIENTE} | {proj.CAMPANA}</p>
            <div className="flex items-center justify-between border-t border-slate-50 pt-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-800 text-sm font-black border border-slate-200">
                        {data.unidades.filter(u => u.ID_PROYECTO === proj.ID_PROYECTO).length}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidades</span>
                </div>
                <div className="text-[10px] text-slate-300 font-mono">{proj.ID_PROYECTO}</div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isProjectModalOpen} onClose={() => setProjectModalOpen(false)} title="Proyecto Editorial">
        <div className="space-y-5">
            <input type="text" className="w-full border border-slate-200 bg-slate-50 p-4 rounded-2xl font-black outline-none focus:ring-2 focus:ring-accent" placeholder="Nombre del proyecto" value={projectForm.NOMBRE_PROYECTO || ''} onChange={e => setProjectForm({...projectForm, NOMBRE_PROYECTO: e.target.value})} />
            <div className="grid grid-cols-2 gap-3">
                <input type="text" className="w-full border p-4 rounded-2xl bg-slate-50 font-bold" placeholder="Cliente" value={projectForm.CLIENTE || ''} onChange={e => setProjectForm({...projectForm, CLIENTE: e.target.value})} />
                <input type="text" className="w-full border p-4 rounded-2xl bg-slate-50 font-bold" placeholder="Campaña" value={projectForm.CAMPANA || ''} onChange={e => setProjectForm({...projectForm, CAMPANA: e.target.value})} />
            </div>
            <div className="pt-6 flex flex-col gap-4">
               <button onClick={saveProject} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black shadow-xl hover:bg-black transition-all">Sincronizar con Sheets</button>
               {projectForm.ID_PROYECTO && (
                  <button onClick={async () => { if(confirm("¿Eliminar proyecto?")) { await deleteItem('proyecto', projectForm.ID_PROYECTO!); setSelectedProject(null); onUpdate(); setProjectModalOpen(false); } }} className="text-red-500 font-black text-[10px] uppercase tracking-widest hover:underline text-center">Eliminar Proyecto</button>
               )}
            </div>
        </div>
      </Modal>
    </div>
  );
};
