"use client";

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { CaralIcon } from 'iconcaral2';
import { Button, Drawer } from 'caralstable';
import { createClient } from '@/utils/supabase/client';

export default function RequirementsBoard({
  product,
  stages,
  configData,
  onChange
}: {
  product: any,
  stages: any[],
  configData: any[],
  onChange: (newConfig: any[]) => void
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [board, setBoard] = useState<Record<string, any[]>>({});

  const [isCreatingFeatureQuestion, setIsCreatingFeatureQuestion] = useState(false);
  const [fqTitle, setFqTitle] = useState('');
  const [fqFeatureId, setFqFeatureId] = useState('');
  const [isSavingFq, setIsSavingFq] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!product || (!product.requirements && !product.features)) {
      setBoard({});
      return;
    }

    const newBoard: Record<string, any[]> = {
      'general': []
    };
    stages.forEach(s => {
      newBoard[s.id] = [];
    });

    // Map requirements to stages based on configData
    // configData: [{ stage_id, required_fields: ['req_id'] }]
    const reqs = (product.requirements || []).map((r: any) => ({ ...r, _isFeature: false }));
    const allCombined = [...reqs];

    allCombined.forEach((req: any) => {
      let assignedStage = 'general';
      for (const config of configData) {
        if (config.required_fields && config.required_fields.includes(req.id)) {
          assignedStage = config.stage_id;
          break;
        }
      }

      if (newBoard[assignedStage]) {
        newBoard[assignedStage].push(req);
      } else {
        newBoard['general'].push(req); // Fallback if stage deleted
      }
    });

    setBoard(newBoard);
  }, [product, stages, configData]);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    setBoard(prev => {
      const sourceList = Array.from(prev[source.droppableId] || []);
      const destList = Array.from(prev[destination.droppableId] || []);

      const sourceUniqueTags = Array.from(new Set(sourceList.flatMap(req => req.tags || ['General'])));
      const destUniqueTags = Array.from(new Set(destList.flatMap(req => req.tags || ['General'])));

      if (draggableId.startsWith('tag::')) {
        const [, tag] = draggableId.split('::');

        const itemsToMove = sourceList.filter(req => (req.tags || ['General']).includes(tag));
        const remainingSource = sourceList.filter(req => !(req.tags || ['General']).includes(tag));

        let insertIndex = destination.index - destUniqueTags.length;
        insertIndex = Math.max(0, Math.min(insertIndex, destList.length));

        destList.splice(insertIndex, 0, ...itemsToMove);

        const newBoard = {
          ...prev,
          [source.droppableId]: remainingSource,
          [destination.droppableId]: destList
        };
        notifyChange(newBoard);
        return newBoard;
      }

      // Single item move
      const sourceIndex = source.index - sourceUniqueTags.length;
      let destIndex = destination.index - destUniqueTags.length;

      // Prevent dragging a requirement into the tags area
      destIndex = Math.max(0, Math.min(destIndex, destList.length));

      const [removed] = sourceList.splice(sourceIndex, 1);

      if (source.droppableId === destination.droppableId) {
        sourceList.splice(destIndex, 0, removed);
        const newBoard = { ...prev, [source.droppableId]: sourceList };
        notifyChange(newBoard);
        return newBoard;
      } else {
        destList.splice(destIndex, 0, removed);
        const newBoard = {
          ...prev,
          [source.droppableId]: sourceList,
          [destination.droppableId]: destList
        };
        notifyChange(newBoard);
        return newBoard;
      }
    });
  };

  const notifyChange = (newBoard: Record<string, any[]>) => {
    // Convert board back to configData format preserving other fields
    const newConfig = stages.map(s => {
      const reqsInStage = newBoard[s.id] || [];
      const existingConf = configData.find(c => c.stage_id === s.id) || {};
      return {
        ...existingConf,
        stage_id: s.id,
        required_fields: reqsInStage.map(r => r.id)
      };
    }).filter(c => c.required_fields.length > 0 || c.auto_advance_on_complete);

    onChange(newConfig);
  };

  if (!isMounted) return <div className="p-8 text-center text-neutral-500">Cargando tablero...</div>;
  if (!product) return <div className="p-8 text-center text-neutral-500">Selecciona un producto</div>;

  const columns = [
    { id: 'general', title: 'General / Siempre Requerido' },
    ...stages.map(s => ({ id: s.id, title: s.name }))
  ];

  const handleSaveFeatureQuestion = async () => {
    if (!fqTitle || !fqFeatureId) return alert('Debes escribir la pregunta y seleccionar una feature.');
    setIsSavingFq(true);
    const newReq = {
      id: Date.now().toString(),
      title: fqTitle,
      description: '',
      is_mandatory: false,
      type: 'feature_question',
      tags: ['General'],
      linked_feature_id: fqFeatureId
    };

    const updatedRequirements = [...(product.requirements || []), newReq];
    const { error } = await supabase.from('products').update({ requirements: updatedRequirements }).eq('id', product.id);

    setIsSavingFq(false);
    if (error) {
      alert('Error guardando en base de datos: ' + error.message);
    } else {
      setIsCreatingFeatureQuestion(false);
      setFqTitle('');
      setFqFeatureId('');
      window.location.reload();
    }
  };

  const handleDeleteFeatureQuestion = async (reqId: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta pregunta de feature?")) return;
    const updatedRequirements = (product.requirements || []).filter((r: any) => r.id !== reqId);

    // Also remove it from configData required_fields
    const newConfigData = configData.map(c => ({
      ...c,
      required_fields: (c.required_fields || []).filter((id: string) => id !== reqId)
    }));

    const { error: reqError } = await supabase.from('products').update({ requirements: updatedRequirements }).eq('id', product.id);

    // We should also trigger the parent's onChange to reflect the new configData
    if (!reqError) {
      onChange(newConfigData);
      window.location.reload();
    } else {
      alert("Error eliminando: " + reqError.message);
    }
  };

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4 pt-2">
        <DragDropContext onDragEnd={handleDragEnd}>
          {columns.map(col => {
            const items = board[col.id] || [];
            return (
              <div key={col.id} className="flex flex-col min-w-[280px] w-[280px] bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-800 flex-shrink-0 h-[500px]">
                <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-container rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-neutral-900 dark:text-white">{col.title}</h4>
                    <span className="text-xs font-bold bg-neutral-200 dark:bg-neutral-700 px-2 py-0.5 rounded-full text-neutral-600 dark:text-neutral-300">
                      {items.length}
                    </span>
                  </div>
                  {col.id === 'general' && (
                    <button onClick={() => setIsCreatingFeatureQuestion(true)} className="text-info-main hover:bg-info-light/20 p-1 rounded transition-colors" title="Crear Pregunta de Feature">
                      <CaralIcon name="plus" size={16} />
                    </button>
                  )}
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-3 overflow-y-auto flex flex-col gap-2 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                    >
                      {(() => {
                        const uniqueTags = Array.from(new Set(items.flatMap(req => req.tags || ['General'])));

                        return (
                          <>
                            {uniqueTags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2 pb-2 border-b border-neutral-200 dark:border-neutral-700 border-dashed">
                                {uniqueTags.map((tag, tagIndex) => (
                                  <Draggable key={`tag::${tag}::${col.id}`} draggableId={`tag::${tag}::${col.id}`} index={tagIndex}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`text-[10px] flex items-center gap-1 font-bold px-2 py-1 rounded cursor-grab shadow-sm border transition-all ${snapshot.isDragging ? 'bg-info-main text-white border-info-main z-50 scale-105' : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-600 hover:border-info-main/50'}`}
                                        title={`Arrastra para mover todos los items con el tag "${tag}"`}
                                      >
                                        <CaralIcon name="gripVertical" size={12} className={snapshot.isDragging ? "text-white" : "text-neutral-400"} />
                                        {tag} ({items.filter(req => (req.tags || ['General']).includes(tag as string)).length})
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                              </div>
                            )}

                            {items.map((req, reqIndex) => (
                              <Draggable key={req.id} draggableId={req.id} index={uniqueTags.length + reqIndex}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`bg-white dark:bg-neutral-900 p-3 rounded-md border border-neutral-200 dark:border-neutral-700 shadow-sm transition-all ${snapshot.isDragging ? 'shadow-lg ring-2 ring-info-main ring-opacity-50 scale-[1.02] z-50 opacity-90' : 'hover:border-neutral-300'}`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <div className="mt-0.5 text-neutral-400 cursor-grab">
                                        <CaralIcon name="gripVertical" size={14} />
                                      </div>
                                      <div className="flex-1 flex justify-between items-start gap-2">
                                        <div>
                                          <p className="text-xs font-semibold text-neutral-900 dark:text-white leading-tight mb-1">{req.title}</p>
                                          <div className="flex flex-wrap gap-1">
                                            {req._isFeature ? (
                                              <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded uppercase font-bold border border-indigo-200">Feature</span>
                                            ) : (
                                              <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded uppercase font-bold border border-slate-200">Req</span>
                                            )}
                                            {req.type === 'options' && <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase font-bold">Opciones</span>}
                                            {req.type === 'tasklist' && <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded uppercase font-bold">Lista</span>}
                                            {req.is_mandatory && <span className="text-[9px] bg-danger-light text-danger-main border border-danger-main/20 px-1.5 py-0.5 rounded uppercase font-bold">Oblig</span>}
                                            {(req.tags || ['General']).map((tag: string, i: number) => (
                                              <span key={i} className="text-[9px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 px-1.5 py-0.5 rounded font-medium">{tag}</span>
                                            ))}
                                          </div>
                                        </div>
                                        {req.type === 'feature_question' && (
                                          <button
                                            onClick={() => handleDeleteFeatureQuestion(req.id)}

                                            title="Eliminar pregunta"
                                          >
                                            <CaralIcon name="trash" size={14} />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          </>
                        );
                      })()}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </DragDropContext>
      </div>

      <Drawer
        isOpen={isCreatingFeatureQuestion}
        onClose={() => setIsCreatingFeatureQuestion(false)}
        title="Crear Pregunta de Feature"
        position="right"
        size="md"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Crea rápidamente una pregunta opcional para recolectar información sobre una Feature Comercial. Podrás arrastrar esta pregunta a cualquier etapa del Kanban.
          </p>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Pregunta (Título)</label>
            <input
              type="text"
              value={fqTitle}
              onChange={(e) => setFqTitle(e.target.value)}
              placeholder="Ej: ¿Qué orígenes SAP te interesan?"
              className="h-10 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Selecciona la Feature Comercial vinculada</label>
            <select
              value={fqFeatureId}
              onChange={(e) => setFqFeatureId(e.target.value)}
              className="h-10 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            >
              <option value="">Selecciona una feature...</option>
              {(product.features || []).map((f: any) => (
                <option key={f.id} value={f.id}>{f.title}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex justify-end">
            <Button onClick={handleSaveFeatureQuestion} disabled={isSavingFq} variant="info">
              {isSavingFq ? 'Guardando...' : 'Crear y Añadir al Tablero'}
            </Button>
          </div>
        </div>
      </Drawer>
    </>
  );
}
