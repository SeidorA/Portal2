"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button, TextInput } from 'caralstable';
import { CaralIcon } from 'iconcaral2';
import IconPickerModal from '@/app/components/IconPickerModal';

export default function OpportunityFieldBuilder() {
  const supabase = createClient();
  const [sections, setSections] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Section Form State
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionIcon, setNewSectionIcon] = useState('folder');
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  // Field Form State
  const [isAddingFieldTo, setIsAddingFieldTo] = useState<string | null>(null); // section ID
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState('text');
  const [newRequired, setNewRequired] = useState(false);
  const [newOptionsText, setNewOptionsText] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // Fetch sections
    const { data: sectionData } = await supabase
      .from('opportunity_form_sections')
      .select('*')
      .order('order_index', { ascending: true });
      
    // Fetch fields
    const { data: fieldData } = await supabase
      .from('opportunity_fields')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (sectionData) setSections(sectionData);
    if (fieldData) setFields(fieldData);
    
    setLoading(false);
  };

  // --- SECTIONS LOGIC ---
  const handleAddSection = async () => {
    if (!newSectionTitle.trim()) return;
    const maxOrder = sections.length > 0 ? Math.max(...sections.map(s => s.order_index)) : -1;
    
    const { data, error } = await supabase
      .from('opportunity_form_sections')
      .insert({
        title: newSectionTitle.trim(),
        icon: newSectionIcon,
        order_index: maxOrder + 1
      })
      .select()
      .single();

    if (data && !error) {
      setSections([...sections, data]);
      setNewSectionTitle('');
      setNewSectionIcon('folder');
      setIsAddingSection(false);
    } else {
      alert("Error al crear la sección: " + error?.message);
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm("¿Eliminar sección? Se eliminarán todos los campos dentro de ella.")) return;
    const { error } = await supabase.from('opportunity_form_sections').delete().eq('id', id);
    if (!error) {
      setSections(sections.filter(s => s.id !== id));
      setFields(fields.filter(f => f.section_id !== id));
    }
  };

  const moveSection = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sections.length - 1) return;

    const newSections = [...sections];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    const tempOrder = newSections[index].order_index;
    newSections[index].order_index = newSections[swapIndex].order_index;
    newSections[swapIndex].order_index = tempOrder;

    const tempSection = newSections[index];
    newSections[index] = newSections[swapIndex];
    newSections[swapIndex] = tempSection;

    setSections(newSections);

    await supabase.from('opportunity_form_sections').upsert([
      { id: newSections[index].id, order_index: newSections[index].order_index, title: newSections[index].title },
      { id: newSections[swapIndex].id, order_index: newSections[swapIndex].order_index, title: newSections[swapIndex].title }
    ]);
  };

  // --- FIELDS LOGIC ---
  const handleAddField = async () => {
    if (!newLabel.trim() || !isAddingFieldTo) return;
    
    const sectionFields = fields.filter(f => f.section_id === isAddingFieldTo);
    const maxOrder = sectionFields.length > 0 ? Math.max(...sectionFields.map(f => f.order_index)) : -1;
    
    let optionsList: string[] = [];
    if (newType === 'options') {
      optionsList = newOptionsText.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }

    const { data, error } = await supabase
      .from('opportunity_fields')
      .insert({
        section_id: isAddingFieldTo,
        label: newLabel.trim(),
        field_type: newType,
        is_required: newRequired,
        options_list: optionsList,
        order_index: maxOrder + 1
      })
      .select()
      .single();

    if (data && !error) {
      setFields([...fields, data]);
      setNewLabel('');
      setNewType('text');
      setNewRequired(false);
      setNewOptionsText('');
      setIsAddingFieldTo(null);
    } else {
      alert("Error al agregar campo: " + error?.message);
    }
  };

  const handleDeleteField = async (id: string) => {
    if (!confirm("¿Eliminar campo? Afectará a los leads ya creados.")) return;
    const { error } = await supabase.from('opportunity_fields').delete().eq('id', id);
    if (!error) {
      setFields(fields.filter(f => f.id !== id));
    }
  };

  const moveField = async (sectionId: string, index: number, direction: 'up' | 'down') => {
    const sectionFields = fields.filter(f => f.section_id === sectionId).sort((a,b) => a.order_index - b.order_index);
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sectionFields.length - 1) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    const field1 = sectionFields[index];
    const field2 = sectionFields[swapIndex];

    const tempOrder = field1.order_index;
    field1.order_index = field2.order_index;
    field2.order_index = tempOrder;

    // Update state optimistically
    setFields(fields.map(f => {
      if (f.id === field1.id) return { ...f, order_index: field1.order_index };
      if (f.id === field2.id) return { ...f, order_index: field2.order_index };
      return f;
    }));

    await supabase.from('opportunity_fields').upsert([
      { id: field1.id, order_index: field1.order_index, label: field1.label, field_type: field1.field_type },
      { id: field2.id, order_index: field2.order_index, label: field2.label, field_type: field2.field_type }
    ]);
  };

  if (loading) return <div className="text-sm text-neutral-500">Cargando constructor...</div>;

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex justify-between items-center bg-info-main/5 p-4 rounded-xl border border-info-main/20">
        <div>
          <h4 className="text-lg font-bold text-neutral-900 dark:text-white">Formulario Dinámico de Oportunidades</h4>
          <p className="text-sm text-neutral-600">Agrupa los campos en secciones para mejorar la vista.</p>
        </div>
        <Button variant="info" iconName="plus" onClick={() => setIsAddingSection(!isAddingSection)}>
          {isAddingSection ? 'Cancelar' : 'Nueva Sección'}
        </Button>
      </div>

      <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-sm">
        <h5 className="font-semibold text-sm text-neutral-800 dark:text-neutral-200 flex items-center gap-2 mb-2">
          <CaralIcon name="lock" size={16} className="text-neutral-500" />
          Campos Fijos del Sistema (Automáticos)
        </h5>
        <div className="flex gap-4 opacity-70">
          <div className="flex-1 bg-white dark:bg-neutral-900 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <span className="text-xs font-bold text-neutral-500">Obligatorio</span>
            <p className="font-medium text-sm">Cliente / Empresa</p>
          </div>
          <div className="flex-1 bg-white dark:bg-neutral-900 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <span className="text-xs font-bold text-neutral-500">Obligatorio</span>
            <p className="font-medium text-sm">Producto Asociado</p>
          </div>
        </div>
      </div>

      {isAddingSection && (
        <div className="bg-white dark:bg-neutral-900 border-2 border-info-main/30 p-4 rounded-xl flex items-end gap-4 shadow-sm animate-fade-in">
          <div className="flex flex-col gap-1 w-32">
            <span className="text-xs font-semibold text-neutral-700">Icono</span>
            <button 
              className="h-[42px] border border-neutral-300 dark:border-neutral-700 rounded-md flex items-center justify-center gap-2 hover:bg-neutral-50"
              onClick={() => setIsIconPickerOpen(true)}
            >
              <CaralIcon name={newSectionIcon as any} size={20} />
            </button>
          </div>
          <div className="flex-1">
            <span className="block text-xs font-semibold text-neutral-700 mb-1">Nombre de la Sección</span>
            <TextInput 
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              placeholder="Ej. Datos Comerciales"
            />
          </div>
          <Button variant="success" onClick={handleAddSection} disabled={!newSectionTitle.trim()}>Crear Sección</Button>
        </div>
      )}

      {/* Render Sections */}
      <div className="flex flex-col gap-6">
        {sections.map((section, sIndex) => {
          const sectionFields = fields.filter(f => f.section_id === section.id).sort((a,b) => a.order_index - b.order_index);
          const isAddingToThis = isAddingFieldTo === section.id;

          return (
            <div key={section.id} className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-neutral-50 dark:bg-neutral-800/50 p-3 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-neutral-400 hover:text-info-main disabled:opacity-30" disabled={sIndex === 0} onClick={() => moveSection(sIndex, 'up')}>
                      <CaralIcon name="chevronUp" size={14} />
                    </button>
                    <button className="text-neutral-400 hover:text-info-main disabled:opacity-30" disabled={sIndex === sections.length - 1} onClick={() => moveSection(sIndex, 'down')}>
                      <CaralIcon name="chevronDown" size={14} />
                    </button>
                  </div>
                  <div className="p-2 bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800">
                    <CaralIcon name={section.icon as any} size={20} className="text-neutral-600" />
                  </div>
                  <h3 className="font-bold text-neutral-900 dark:text-white text-lg">{section.title}</h3>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="light" size="sm" iconName="plus" onClick={() => setIsAddingFieldTo(isAddingToThis ? null : section.id)}>
                    {isAddingToThis ? 'Cancelar' : 'Agregar Campo'}
                  </Button>
                  <button className="p-2 text-neutral-400 hover:text-danger-main transition-colors rounded-lg hover:bg-danger-main/10" onClick={() => handleDeleteSection(section.id)}>
                    <CaralIcon name="trash" size={18} />
                  </button>
                </div>
              </div>

              <div className="p-4 flex flex-col gap-3">
                {isAddingToThis && (
                  <div className="bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-200 dark:border-neutral-700 p-4 rounded-xl flex flex-col gap-4 shadow-inner mb-2 animate-fade-in">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <span className="block text-xs font-semibold text-neutral-700 mb-1">Nombre del Campo</span>
                        <TextInput 
                          value={newLabel}
                          onChange={(e) => setNewLabel(e.target.value)}
                          placeholder="Ej. Industria, Presupuesto..."
                        />
                      </div>
                      <div className="w-48">
                        <span className="block text-xs font-semibold text-neutral-700 mb-1">Tipo de Dato</span>
                        <select 
                          className="w-full h-[42px] px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white text-sm"
                          value={newType}
                          onChange={(e) => setNewType(e.target.value)}
                        >
                          <option value="text">Texto Corto</option>
                          <option value="number">Número</option>
                          <option value="date">Fecha</option>
                          <option value="boolean">Casilla (Sí/No)</option>
                          <option value="options">Desplegable (Opciones)</option>
                        </select>
                      </div>
                    </div>
                    
                    {newType === 'options' && (
                      <div>
                        <span className="block text-xs font-semibold text-neutral-700 mb-1">Opciones (separadas por coma)</span>
                        <TextInput 
                          value={newOptionsText}
                          onChange={(e) => setNewOptionsText(e.target.value)}
                          placeholder="Opción 1, Opción 2, Opción 3"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={newRequired}
                          onChange={(e) => setNewRequired(e.target.checked)}
                          className="w-4 h-4 text-info-main rounded border-neutral-300"
                        />
                        <span className="text-sm font-medium text-neutral-700">Obligatorio al crear la oportunidad</span>
                      </label>
                      <Button variant="success" size="sm" onClick={handleAddField} disabled={!newLabel.trim()}>Guardar Campo</Button>
                    </div>
                  </div>
                )}

                {sectionFields.length === 0 && !isAddingToThis ? (
                  <div className="text-center p-6 text-sm text-neutral-400 italic">No hay campos en esta sección.</div>
                ) : (
                  sectionFields.map((field, fIndex) => (
                    <div key={field.id} className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-3 rounded-lg hover:border-neutral-300 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                          <button className="p-0.5 text-neutral-400 hover:text-info-main disabled:opacity-30" disabled={fIndex === 0} onClick={() => moveField(section.id, fIndex, 'up')}>
                            <CaralIcon name="chevronUp" size={14} />
                          </button>
                          <button className="p-0.5 text-neutral-400 hover:text-info-main disabled:opacity-30" disabled={fIndex === sectionFields.length - 1} onClick={() => moveField(section.id, fIndex, 'down')}>
                            <CaralIcon name="chevronDown" size={14} />
                          </button>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200 text-sm">{field.label}</span>
                            {field.is_required && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase">Obligatorio</span>}
                            <span className="text-[10px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded border border-neutral-200 uppercase">{field.field_type}</span>
                          </div>
                          {field.field_type === 'options' && (
                            <span className="text-xs text-neutral-400 mt-0.5">Opciones: {field.options_list?.join(', ')}</span>
                          )}
                        </div>
                      </div>
                      <button className="p-2 text-neutral-400 hover:text-danger-main transition-colors rounded-full hover:bg-danger-main/10" onClick={() => handleDeleteField(field.id)}>
                        <CaralIcon name="trash" size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
        {sections.length === 0 && (
          <div className="text-center p-8 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-500 text-sm">
            No has creado ninguna sección todavía. Crea una para empezar a agregar campos.
          </div>
        )}
      </div>

      <IconPickerModal
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        onSelect={(iconName) => setNewSectionIcon(iconName)}
        initialIconName={newSectionIcon}
      />
    </div>
  );
}
