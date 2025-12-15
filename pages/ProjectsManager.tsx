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
  const [selectedUnit, setSelectedUnit] = useState<Unidad | null>(null);
  
  // Modal States
  const [isProjectModalOpen, setProjectModalOpen] = useState(false);
  const [isUnitModalOpen, setUnitModalOpen] = useState(false);
  const [isRoundModalOpen, setRoundModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form States
  const [projectForm, setProjectForm] = useState<Partial<Proyecto>>({});
  const [unitForm, setUnitForm] = useState<Partial<Unidad>>({});
  const [roundForm, setRoundForm] = useState<Partial<Ronda>>({});

  // --- ACTIONS ---

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
    if (!projectForm.NOMBRE_PROYECTO || projectForm.NOMBRE_PROYECTO.trim() === "") {
        alert("⚠️ El nombre del proyecto es obligatorio.");
        return;
    }

    setIsSaving(true);
    const finalId = projectForm.ID_PROYECTO && projectForm.ID_PROYECTO.trim() !== '' 
      ? projectForm.ID_PROYECTO.trim() 
      : generateId('P');

    const newProject: Proyecto = {
      ID_PROYECTO: finalId,
      NOMBRE_PROYECTO: projectForm.NOMBRE_PROYECTO.trim(),
      CLIENTE: projectForm.CLIENTE || '',
      CAMPANA: projectForm.CAMPANA || '',
      ESTADO: projectForm.ESTADO || EstadoProyecto.ACTIVO,
    };
    
    try {
        await saveItem('proyecto', newProject);
        setProjectModalOpen(false);
        onUpdate();
    } catch (e) {
        alert("Error guardando el proyecto.");
        console.error(e);
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectForm.ID_PROYECTO) return;
    if (!window.confirm("¿Estás seguro de que quieres eliminar este proyecto?")) return;

    setIsSaving(true);
    try {
        await deleteItem('proyecto', projectForm.ID_PROYECTO);
        setProjectModalOpen(false);
        setSelectedProject(null);
        onUpdate();
    } catch (e) {
        console.error(e);
        alert("Error al eliminar el proyecto.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleNewUnit = () => {
    if (!selectedProject) return;
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + DEFAULT_DEADLINE_DAYS);

    setUnitForm({
      ID_PROYECTO: selectedProject.ID_PROYECTO,
      FECHA_LIMITE_PRIMERAS: deadline.toISOString().split('T')[0],
      NOTAS: ''
    });
    setUnitModalOpen(true);
  };

  const saveUnit = async () => {
    if (!unitForm.CODIGO_UD || unitForm.CODIGO_UD.trim() === "") {
        alert("⚠️ El código de la unidad es obligatorio.");
        return;
    }
    
    setIsSaving(true);
    try {
        const newUnit: Unidad = {
          ID_UNIDAD: unitForm.ID_UNIDAD || generateId('U'),
          ID_PROYECTO: selectedProject!.ID_PROYECTO,
          CODIGO_UD: unitForm.CODIGO_UD.trim(),
          TITULO_UD: unitForm.TITULO_UD || '',
          FECHA_RECEPCION_ORIGINALES: '', 
          FECHA_LIMITE_PRIMERAS: unitForm.FECHA_LIMITE_PRIMERAS || '',
          NOTAS: unitForm.NOTAS || ''
        };
        await saveItem('unidad', newUnit);
        setUnitModalOpen(false);
        onUpdate();
    } catch (e) {
        alert("Error guardando la unidad.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleNewRound = (unit: Unidad) => {
    setSelectedUnit(unit);
    const today = new Date().toISOString().split('T')[0];
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + DEFAULT_DEADLINE_DAYS);

    setRoundForm({
      ID_UNIDAD: unit.ID_UNIDAD,
      CATEGORIA: CategoriaRonda.MAYOR, // Por defecto Mayor
      TIPO_RONDA: TipoRonda.PRIMERAS, // Por defecto Primeras
      ESTADO: EstadoRonda.PENDIENTE,
      FECHA_RECEPCION: today,
      FECHA_LIMITE: deadline.toISOString().split('T')[0],
      ENLACE_ARCHIVO: '',
      COMENTARIOS: ''
    });
    setRoundModalOpen(true);
  };

  const handleEditRound = (r: Ronda) => {
    setRoundForm(r);
    setRoundModalOpen(true);
  };

  const saveRound = async () => {
    if (!roundForm.TIPO_RONDA || roundForm.TIPO_RONDA.trim() === "") {
        alert("Debes especificar el tipo de ronda/prueba.");
        return;
    }

    setIsSaving(true);
    try {
        const newRound: Ronda = {
          ID_RONDA: roundForm.ID_RONDA || generateId('R'),
          ID_UNIDAD: roundForm.ID_UNIDAD!,
          CATEGORIA: roundForm.CATEGORIA || CategoriaRonda.MAYOR,
          TIPO_RONDA: roundForm.TIPO_RONDA,
          FECHA_RECEPCION: roundForm.FECHA_RECEPCION || '',
          FECHA_LIMITE: roundForm.FECHA_LIMITE || '',
          ESTADO: roundForm.ESTADO || EstadoRonda.PENDIENTE,
          ENLACE_ARCHIVO: roundForm.ENLACE_ARCHIVO || '',
          COMENTARIOS: roundForm.COMENTARIOS || ''
        };
        await saveItem('ronda', newRound);
        setRoundModalOpen(false);
        onUpdate();
    } catch (e) {
        alert("Error guardando la ronda.");
    } finally {
        setIsSaving(false);
    }
  };

  const markRoundDelivered = async (r: Ronda) => {
    if(!window.confirm("¿Marcar prueba como Entregada?")) return;
    const updatedRound = { ...r, ESTADO: EstadoRonda.ENTREGADA };
    try {
        await saveItem('ronda', updatedRound);
        onUpdate();
    } catch(e) {
        alert("Error actualizando estado.");
    }
  };

  // --- RENDER HELPERS ---

  if (selectedProject) {
    const projectUnits = data.unidades.filter(u => u.ID_PROYECTO === selectedProject.ID_PROYECTO);

    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedProject(null)} className="text-sm text-gray-500 hover:text-gray-800 flex items-center mb-4">
          ← Volver a proyectos
        </button>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-accent">
          <div className="flex justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {selectedProject.NOMBRE_PROYECTO || <span className="text-gray-400 italic">Sin Título</span>}
              </h2>
              <p className="text-gray-500">{selectedProject.CLIENTE} - {selectedProject.CAMPANA}</p>
              <p className="text-xs text-gray-400 mt-1">ID: {selectedProject.ID_PROYECTO}</p>
            </div>
            <button onClick={() => handleEditProject(selectedProject)} className="text-accent text-sm underline">Editar Proyecto</button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Unidades</h3>
          <button onClick={handleNewUnit} className="bg-accent text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
            + Nueva Unidad
          </button>
        </div>

        <div className="space-y-4">
          {projectUnits.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500 mb-2">Este proyecto aún no tiene unidades.</p>
              <button onClick={handleNewUnit} className="text-accent hover:underline font-medium">
                Crear la primera unidad
              </button>
            </div>
          ) : null}
          {projectUnits.map(unit => {
            const unitRounds = data.rondas.filter(r => r.ID_UNIDAD === unit.ID_UNIDAD);
            
            // Logic to determine Current Status
            const activeRound = unitRounds.find(r => r.ESTADO !== EstadoRonda.ENTREGADA);
            const lastDelivered = [...unitRounds].reverse().find(r => r.ESTADO === EstadoRonda.ENTREGADA);
            
            let statusBadge = <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded border border-gray-200">⚪ Sin iniciar</span>;
            
            if (activeRound) {
                statusBadge = (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200 font-bold flex items-center gap-1">
                        <span className="relative flex h-2 w-2 mr-1">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        En curso: {activeRound.TIPO_RONDA}
                    </span>
                );
            } else if (lastDelivered) {
                statusBadge = (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200 font-medium">
                        ✅ {lastDelivered.TIPO_RONDA} Entregada
                    </span>
                );
            }

            return (
              <div key={unit.ID_UNIDAD} className="bg-white border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">{unit.CODIGO_UD}</span>
                    <span className="text-gray-600 border-r pr-3 mr-1 hidden md:inline">{unit.TITULO_UD}</span>
                    <span className="text-gray-600 md:hidden block">{unit.TITULO_UD}</span>
                    {statusBadge}
                  </div>
                  <button onClick={() => handleNewRound(unit)} className="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-100 whitespace-nowrap">
                    + Añadir Prueba
                  </button>
                </div>
                
                {unitRounds.length > 0 && (
                  <div className="divide-y divide-gray-100">
                    {unitRounds.map(round => {
                      const isMinor = round.CATEGORIA === CategoriaRonda.MENOR;
                      return (
                        <div key={round.ID_RONDA} className={`px-4 py-3 flex items-center justify-between hover:bg-gray-50 ${isMinor ? 'bg-slate-50' : ''}`}>
                          <div className="flex-1 flex items-start gap-3">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  {isMinor ? (
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600 bg-purple-100 px-1.5 rounded border border-purple-200">
                                      Menor
                                    </span>
                                  ) : (
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-100 px-1.5 rounded border border-blue-200">
                                      Mayor
                                    </span>
                                  )}
                                  <span className={`font-medium text-sm ${isMinor ? 'text-gray-600 italic' : 'text-gray-800'}`}>
                                      {round.TIPO_RONDA}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1 flex gap-2">
                                   <span>Límite: {new Date(round.FECHA_LIMITE).toLocaleDateString('es-ES')}</span>
                                   <span className={`px-1.5 rounded-full text-[10px] ${round.ESTADO === EstadoRonda.ENTREGADA ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {round.ESTADO}
                                   </span>
                                </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                             {round.ENLACE_ARCHIVO && (
                               <a href={round.ENLACE_ARCHIVO} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 text-xs mr-2">
                                 Link 🔗
                               </a>
                             )}
                             {round.ESTADO !== EstadoRonda.ENTREGADA && (
                               <button onClick={() => markRoundDelivered(round)} className="text-xs text-green-600 border border-green-600 px-2 py-1 rounded hover:bg-green-50">
                                 ✓ Entregar
                               </button>
                             )}
                             <button onClick={() => handleEditRound(round)} className="text-gray-400 hover:text-gray-600">
                               ✎
                             </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {unitRounds.length === 0 && <div className="p-4 text-xs text-gray-400 italic">Sin pruebas registradas.</div>}
              </div>
            );
          })}
        </div>

        {/* MODALS INSIDE PROJECT VIEW */}
        <Modal isOpen={isUnitModalOpen} onClose={() => setUnitModalOpen(false)} title="Nueva Unidad">
           <div className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-gray-700">Código UD</label>
               <input type="text" className="mt-1 block w-full border border-gray-300 rounded p-2" 
                  value={unitForm.CODIGO_UD || ''} onChange={e => setUnitForm({...unitForm, CODIGO_UD: e.target.value})} placeholder="UD 01" />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700">Título</label>
               <input type="text" className="mt-1 block w-full border border-gray-300 rounded p-2" 
                  value={unitForm.TITULO_UD || ''} onChange={e => setUnitForm({...unitForm, TITULO_UD: e.target.value})} />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700">Límite Primeras (Estimado)</label>
               <input type="date" className="mt-1 block w-full border border-gray-300 rounded p-2" 
                   value={unitForm.FECHA_LIMITE_PRIMERAS || ''} onChange={e => setUnitForm({...unitForm, FECHA_LIMITE_PRIMERAS: e.target.value})} />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700">Notas</label>
               <textarea className="mt-1 block w-full border border-gray-300 rounded p-2" rows={2}
                  value={unitForm.NOTAS || ''} onChange={e => setUnitForm({...unitForm, NOTAS: e.target.value})} />
             </div>
             <div className="pt-4 flex justify-end">
               <button onClick={saveUnit} disabled={isSaving} className="bg-primary text-white px-4 py-2 rounded hover:bg-slate-700 disabled:opacity-50">
                 {isSaving ? 'Guardando...' : 'Guardar Unidad'}
               </button>
             </div>
           </div>
        </Modal>

        <Modal isOpen={isRoundModalOpen} onClose={() => setRoundModalOpen(false)} title="Gestionar Prueba / Ronda">
           <div className="space-y-4">
             
             {/* CATEGORIA TOGGLE */}
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría de Prueba</label>
                <div className="flex space-x-4">
                    <label className="inline-flex items-center cursor-pointer">
                        <input type="radio" className="form-radio text-accent" 
                            name="categoria"
                            checked={roundForm.CATEGORIA !== CategoriaRonda.MENOR}
                            onChange={() => setRoundForm({
                                ...roundForm, 
                                CATEGORIA: CategoriaRonda.MAYOR, 
                                TIPO_RONDA: TipoRonda.PRIMERAS // Reset to default major
                            })} 
                        />
                        <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-bold">MAYOR</span>
                    </label>
                    <label className="inline-flex items-center cursor-pointer">
                        <input type="radio" className="form-radio text-purple-600" 
                            name="categoria"
                            checked={roundForm.CATEGORIA === CategoriaRonda.MENOR}
                            onChange={() => setRoundForm({
                                ...roundForm, 
                                CATEGORIA: CategoriaRonda.MENOR,
                                TIPO_RONDA: '' // Clear for manual input
                            })} 
                        />
                        <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded font-bold">MENOR</span>
                    </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    {roundForm.CATEGORIA === CategoriaRonda.MENOR 
                        ? "Pruebas intermedias, correcciones puntuales o revisiones rápidas."
                        : "Pruebas estándar del flujo editorial."}
                </p>
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-700">Nombre / Tipo de Prueba</label>
               {roundForm.CATEGORIA === CategoriaRonda.MENOR ? (
                   <input type="text" className="mt-1 block w-full border border-gray-300 rounded p-2" 
                      placeholder="Ej: Revisión pág. 4, Corrección errata..."
                      value={roundForm.TIPO_RONDA || ''} 
                      onChange={e => setRoundForm({...roundForm, TIPO_RONDA: e.target.value})} 
                   />
               ) : (
                   <select className="mt-1 block w-full border border-gray-300 rounded p-2"
                      value={roundForm.TIPO_RONDA || TipoRonda.PRIMERAS} 
                      onChange={e => setRoundForm({...roundForm, TIPO_RONDA: e.target.value})}>
                        {Object.values(TipoRonda).map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
               )}
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Recepción</label>
                  <input type="date" className="mt-1 block w-full border border-gray-300 rounded p-2" 
                      value={roundForm.FECHA_RECEPCION || ''} onChange={e => setRoundForm({...roundForm, FECHA_RECEPCION: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Límite</label>
                  <input type="date" className="mt-1 block w-full border border-gray-300 rounded p-2" 
                      value={roundForm.FECHA_LIMITE || ''} onChange={e => setRoundForm({...roundForm, FECHA_LIMITE: e.target.value})} />
                </div>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700">Enlace Archivo</label>
               <input type="text" className="mt-1 block w-full border border-gray-300 rounded p-2" 
                  value={roundForm.ENLACE_ARCHIVO || ''} onChange={e => setRoundForm({...roundForm, ENLACE_ARCHIVO: e.target.value})} />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700">Estado</label>
               <select className="mt-1 block w-full border border-gray-300 rounded p-2"
                  value={roundForm.ESTADO} onChange={e => setRoundForm({...roundForm, ESTADO: e.target.value})}>
                    {Object.values(EstadoRonda).map(t => <option key={t} value={t}>{t}</option>)}
               </select>
             </div>
             <div className="pt-4 flex justify-end">
               <button onClick={saveRound} disabled={isSaving} className="bg-primary text-white px-4 py-2 rounded hover:bg-slate-700 disabled:opacity-50">
                 {isSaving ? 'Guardando...' : 'Guardar Prueba'}
               </button>
             </div>
           </div>
        </Modal>

         <Modal isOpen={isProjectModalOpen} onClose={() => setProjectModalOpen(false)} title="Editar Proyecto">
           <div className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-gray-500">Identificador (ID)</label>
               <input type="text" className="mt-1 block w-full border border-gray-200 bg-gray-100 rounded p-2 text-gray-500" 
                  value={projectForm.ID_PROYECTO || ''} disabled />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700">Nombre Proyecto</label>
               <input type="text" className="mt-1 block w-full border border-gray-300 rounded p-2" 
                  value={projectForm.NOMBRE_PROYECTO || ''} onChange={e => setProjectForm({...projectForm, NOMBRE_PROYECTO: e.target.value})} />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700">Estado</label>
               <select className="mt-1 block w-full border border-gray-300 rounded p-2"
                  value={projectForm.ESTADO} onChange={e => setProjectForm({...projectForm, ESTADO: e.target.value})}>
                    {Object.values(EstadoProyecto).map(t => <option key={t} value={t}>{t}</option>)}
               </select>
             </div>
             <div className="pt-4 flex justify-between items-center">
               <button 
                  type="button"
                  onClick={handleDeleteProject}
                  disabled={isSaving}
                  className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-2 border border-transparent hover:bg-red-50 rounded"
               >
                 {isSaving ? '...' : 'Eliminar Proyecto'}
               </button>
               <button onClick={saveProject} disabled={isSaving} className="bg-primary text-white px-4 py-2 rounded hover:bg-slate-700 disabled:opacity-50">
                 {isSaving ? 'Guardando...' : 'Guardar Proyecto'}
               </button>
             </div>
           </div>
        </Modal>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Proyectos</h2>
        <button onClick={handleNewProject} className="bg-primary text-white px-4 py-2 rounded shadow hover:bg-slate-800">
          + Nuevo Proyecto
        </button>
      </div>

      {data.proyectos.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border-2 border-dashed border-gray-200">
           <div className="text-6xl mb-4">✨</div>
           <h3 className="text-xl font-medium text-gray-900 mb-2">Comienza tu Base de Datos</h3>
           <p className="text-gray-500 max-w-sm mx-auto mb-6">Actualmente no hay proyectos. Crea el primero para empezar a gestionar unidades y rondas.</p>
           <button onClick={handleNewProject} className="bg-accent text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 font-medium">
             Crear Primer Proyecto
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.proyectos.map(proj => (
            <div key={proj.ID_PROYECTO} 
                 onClick={() => setSelectedProject(proj)}
                 className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-accent cursor-pointer transition-all">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg text-gray-800 truncate pr-2">{proj.NOMBRE_PROYECTO || <span className="text-gray-300 italic">Sin Título</span>}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${proj.ESTADO === EstadoProyecto.ACTIVO ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {proj.ESTADO}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">{proj.CLIENTE} • {proj.CAMPANA}</p>
              <div className="text-xs text-gray-400 mt-1 font-mono">{proj.ID_PROYECTO}</div>
              <div className="mt-4 text-xs text-gray-400 border-t pt-2">
                {data.unidades.filter(u => u.ID_PROYECTO === proj.ID_PROYECTO).length} Unidades
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isProjectModalOpen} onClose={() => setProjectModalOpen(false)} title="Nuevo Proyecto">
           <div className="space-y-4">
             <div>
               <label className="block text-sm font-bold text-gray-700">Identificador (ID)</label>
               <input type="text" className="mt-1 block w-full border border-gray-300 rounded p-2" 
                  value={projectForm.ID_PROYECTO || ''} onChange={e => setProjectForm({...projectForm, ID_PROYECTO: e.target.value})} placeholder="Ej: P-BIO-2025 (Opcional - dejar vacío para auto-generar)" />
               <p className="text-xs text-gray-500 mt-1">Usa un código único si lo deseas (ej. ISBN o código interno).</p>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700">Nombre Proyecto <span className="text-red-500">*</span></label>
               <input type="text" className="mt-1 block w-full border border-gray-300 rounded p-2" 
                  value={projectForm.NOMBRE_PROYECTO || ''} onChange={e => setProjectForm({...projectForm, NOMBRE_PROYECTO: e.target.value})} placeholder="Ej: Biología 3º ESO" />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700">Cliente</label>
               <input type="text" className="mt-1 block w-full border border-gray-300 rounded p-2" 
                  value={projectForm.CLIENTE || ''} onChange={e => setProjectForm({...projectForm, CLIENTE: e.target.value})} />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700">Campaña</label>
               <input type="text" className="mt-1 block w-full border border-gray-300 rounded p-2" 
                  value={projectForm.CAMPANA || ''} onChange={e => setProjectForm({...projectForm, CAMPANA: e.target.value})} />
             </div>
             <div className="pt-4 flex justify-end">
               <button onClick={saveProject} disabled={isSaving} className="bg-primary text-white px-4 py-2 rounded hover:bg-slate-700 disabled:opacity-50">
                 {isSaving ? 'Guardando...' : 'Crear Proyecto'}
               </button>
             </div>
           </div>
      </Modal>
    </div>
  );
};