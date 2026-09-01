"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button, TextInput } from 'caralstable';
import { CaralIcon } from 'iconcaral2';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

export default function StageBuilder() {
  const supabase = createClient();
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // New stage form state
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('info');

  // Edit stage form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('info');

  useEffect(() => {
    setIsMounted(true);
    loadStages();
  }, []);

  const loadStages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('opportunity_stages')
      .select('*')
      .order('order_index', { ascending: true });

    if (data) setStages(data);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const maxOrder = stages.length > 0 ? Math.max(...stages.map(s => s.order_index)) : -1;

    const { data, error } = await supabase
      .from('opportunity_stages')
      .insert({
        name: newName.trim(),
        color: newColor,
        order_index: maxOrder + 1
      })
      .select()
      .single();

    if (data && !error) {
      setStages([...stages, data]);
      setNewName('');
      setIsAdding(false);
    } else {
      alert("Error al agregar estado: " + error?.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este estado? Las oportunidades en este estado podrían perder su referencia.")) return;

    const { error } = await supabase
      .from('opportunity_stages')
      .delete()
      .eq('id', id);

    if (!error) {
      setStages(stages.filter(s => s.id !== id));
    }
  };

  const startEditing = (stage: any) => {
    setEditingId(stage.id);
    setEditName(stage.name);
    setEditColor(stage.color);
  };

  const handleEditSave = async () => {
    if (!editName.trim() || !editingId) return;

    const { error } = await supabase
      .from('opportunity_stages')
      .update({ name: editName.trim(), color: editColor })
      .eq('id', editingId);

    if (!error) {
      setStages(stages.map(s => s.id === editingId ? { ...s, name: editName.trim(), color: editColor } : s));
      setEditingId(null);
    } else {
      alert("Error al actualizar: " + error.message);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.index === destination.index) return;

    const newStages = Array.from(stages);
    const [removed] = newStages.splice(source.index, 1);
    newStages.splice(destination.index, 0, removed);

    // Update order_index for all items to reflect their new array index
    const updatedStages = newStages.map((stage, idx) => ({
      ...stage,
      order_index: idx
    }));

    setStages(updatedStages);

    // Save to DB in bulk
    const updates = updatedStages.map(s => ({
      id: s.id,
      name: s.name,
      order_index: s.order_index
    }));

    await supabase.from('opportunity_stages').upsert(updates);
  };

  if (loading) return <div className="text-sm text-neutral-500">Cargando estados...</div>;

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex justify-between items-center bg-info-main/5 p-4 rounded-xl border border-info-main/20">
        <div>
          <h4 className="text-lg font-bold text-neutral-900 dark:text-white">Constructor de Estados</h4>
          <p className="text-sm text-neutral-600">Define los estados por los que pasarán las oportunidades.</p>
        </div>
        <Button
          variant={isAdding ? 'danger' : 'info'}
          iconName={isAdding ? 'x' : 'plus'}
          onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? 'Cancelar' : 'Nuevo Estado'}
        </Button>
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl flex items-end gap-4 shadow-sm animate-fade-in">
          <div className="flex-1">
            <span className="block text-xs font-semibold text-neutral-700 mb-1">Nombre del Estado</span>
            <TextInput
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej. Validación Legal"
            />
          </div>
          <div className="w-32">
            <span className="block text-xs font-semibold text-neutral-700 mb-1">Color</span>
            <select
              className="w-full h-[42px] px-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:ring-2 focus:ring-info-main outline-none transition-shadow"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
            >
              <option value="info">Celeste</option>
              <option value="success">Verde </option>
              <option value="danger">Rojo</option>
              <option value="warning">Naranja</option>
              <option value="indido">Morado</option>
              <option value="sakura">Rosa</option>
              <option value="seidor">Azul</option>
            </select>
          </div>
          <Button variant="success" onClick={handleAdd} disabled={!newName.trim()}>Guardar</Button>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="stages-list">
          {(provided) => (
            <div className="flex flex-col gap-3" {...provided.droppableProps} ref={provided.innerRef}>
              {stages.map((stage, index) => (
                <Draggable key={stage.id} draggableId={stage.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`flex items-center justify-between bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-sm ${snapshot.isDragging ? 'ring-2 ring-info-main ring-opacity-50' : ''}`}
                    >
                      {editingId === stage.id ? (
                        <div className="flex-1 flex gap-4 ml-8 items-end">
                          <div className="flex-1">
                            <span className="block text-xs font-semibold text-neutral-700 mb-1">Nombre del Estado</span>
                            <TextInput value={editName} onChange={(e) => setEditName(e.target.value)} />
                          </div>
                          <div className="w-32">
                            <span className="block text-xs font-semibold text-neutral-700 mb-1">Color</span>
                            <select
                              className="w-full h-[42px] px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
                              value={editColor}
                              onChange={(e) => setEditColor(e.target.value)}
                            >
                              <option value="info">Celeste (Info)</option>
                              <option value="success">Verde (Success)</option>
                              <option value="danger">Rojo (Danger)</option>
                              <option value="warning">Naranja (Warning)</option>
                              <option value="indido">Morado (Indigo)</option>
                              <option value="sakura">Rosa (Sakura)</option>
                              <option value="seidor">Azul (Seidor)</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="success" size="sm" onClick={handleEditSave} disabled={!editName.trim()}>Guardar</Button>
                            <Button variant="light" size="sm" onClick={() => setEditingId(null)}>Cancelar</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-4">
                            <div {...provided.dragHandleProps} className="p-2 text-neutral-500 hover:text-info-main cursor-grab active:cursor-grabbing transition-colors">
                              <CaralIcon name="dots" />
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full bg-${stage.color}-main`}></div>
                                <span className="font-bold text-neutral-900 dark:text-white">{stage.name}</span>
                              </div>
                              <span className="text-xs text-neutral-700">Orden: {stage.order_index}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              className="p-2 text-neutral-400 hover:text-info-main transition-colors rounded-full hover:bg-info-main/10"
                              onClick={() => startEditing(stage)}
                              title="Editar etapa"
                            >
                              <CaralIcon name="edit" size={18} />
                            </button>
                            <button
                              className="p-2 text-neutral-400 hover:text-danger-main transition-colors rounded-full hover:bg-danger-main/10"
                              onClick={() => handleDelete(stage.id)}
                              title="Eliminar etapa"
                            >
                              <CaralIcon name="trash" size={18} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
