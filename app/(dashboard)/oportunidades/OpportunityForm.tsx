"use client";

import React, { useState, useEffect } from 'react';
import { TextInput, Button } from 'caralstable';
import { createClient } from '@/utils/supabase/client';
import { CaralIcon } from 'iconcaral2';
import OpportunityRequirementsForm from './OpportunityRequirementsForm';

export interface OpportunityFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function OpportunityForm({ onClose, onSuccess }: OpportunityFormProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);

  const supabase = createClient();

  const [formData, setFormData] = useState({
    product_id: '',
    company_name: '',
    custom_answers: {} as Record<string, any>
  });
  
  const [createdOpportunity, setCreatedOpportunity] = useState<any>(null);

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase.from('products').select('id, title').order('order_index', { ascending: true }).order('created_at', { ascending: false });
      if (data) setProducts(data);
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    async function fetchData() {
      const { data: sectionData } = await supabase
        .from('opportunity_form_sections')
        .select('*')
        .order('order_index', { ascending: true });
      if (sectionData) setSections(sectionData);

      const { data: fieldData } = await supabase
        .from('opportunity_fields')
        .select('*')
        .order('order_index', { ascending: true });
      if (fieldData) setCustomFields(fieldData);

      const { data: stagesData } = await supabase
        .from('opportunity_stages')
        .select('*')
        .order('order_index', { ascending: true });
      if (stagesData) setStages(stagesData);
    }
    fetchData();
  }, []);

  const handleCustomFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      custom_answers: {
        ...prev.custom_answers,
        [fieldId]: value
      }
    }));
  };



  const handleSubmit = async () => {
    setIsLoading(true);
    
    const initialStatus = stages.length > 0 ? stages[0].id : 'nuevas';

    // Insert the opportunity
    const { data: insertedData, error } = await supabase.from('opportunities').insert({
      product_id: formData.product_id,
      status: initialStatus,
      company_data: {
        name: formData.company_name,
        custom_answers: formData.custom_answers
      },
      rep_data: {},
      technical_answers: {}
    }).select('id').single();

    if (!error && insertedData) {
      // Insert creation activity
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const userName = userData.user.user_metadata?.name || userData.user.user_metadata?.full_name || userData.user.email?.split('@')[0] || 'Usuario';
        await supabase.from('opportunity_activities').insert({
          opportunity_id: insertedData.id,
          user_id: userData.user.id,
          activity_type: 'creation',
          content: { message: "creó la oportunidad", user_name: userName }
        });
      }
      setIsLoading(false);
      setCreatedOpportunity({ id: insertedData.id, status: initialStatus, product_id: formData.product_id });
      setStep(3);
    } else {
      setIsLoading(false);
      console.error(error);
      alert("Error al guardar la oportunidad");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">

        {/* Pasos */}
        <div className="flex gap-2 mb-8">
          <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-info-main' : 'bg-neutral-200 dark:bg-neutral-800'}`} />
          <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-info-main' : 'bg-neutral-200 dark:bg-neutral-800'}`} />
          <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-info-main' : 'bg-neutral-200 dark:bg-neutral-800'}`} />
        </div>

        {step === 1 && (
          <div className="animate-fade-in flex flex-col gap-6">
            <div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Producto de Interés</h3>
              <p className="text-sm text-neutral-800">Selecciona el producto o servicio que interesa al cliente.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Producto</label>
              <select
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-info-main outline-none text-neutral-900 dark:text-white"
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
              >
                <option value="">Seleccione un producto...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in flex flex-col gap-6">
            <div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Datos de la Oportunidad</h3>
              <p className="text-sm text-neutral-500">Completa la información inicial del lead.</p>
            </div>

            <div className="flex flex-col gap-5">
              <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <div className="flex flex-col gap-2">
                  <TextInput
                    label="Cliente / Empresa (Obligatorio)"
                    placeholder="Ej. TechCorp"
                    value={formData.company_name}
                    onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                  />
                </div>
              </div>

              {sections.map(section => {
                const sectionFields = customFields.filter(f => f.section_id === section.id);
                if (sectionFields.length === 0) return null;

                return (
                  <div key={section.id} className="flex flex-col gap-4 bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <h4 className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                      <CaralIcon name={section.icon as any} size={18} className="text-info-main" />
                      {section.title}
                    </h4>
                    <div className="flex flex-col gap-4">
                      {sectionFields.map(field => (
                        <div key={field.id} className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {field.label} {field.is_required && <span className="text-red-500">*</span>}
                          </label>
                          {field.field_type === 'options' ? (
                            <select
                              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none text-sm"
                              value={formData.custom_answers[field.id] || ''}
                              onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                            >
                              <option value="">Seleccionar...</option>
                              {(field.options_list || []).map((opt: string) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : field.field_type === 'boolean' ? (
                            <label className="flex items-center gap-2 cursor-pointer mt-1">
                              <input
                                type="checkbox"
                                checked={formData.custom_answers[field.id] === true}
                                onChange={(e) => handleCustomFieldChange(field.id, e.target.checked)}
                                className="w-5 h-5 text-info-main rounded border-neutral-300"
                              />
                              <span className="text-sm">Sí, confirmar</span>
                            </label>
                          ) : (
                            <TextInput
                              type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                              placeholder={`Ingresar ${field.label.toLowerCase()}...`}
                              value={formData.custom_answers[field.id] || ''}
                              onChange={e => handleCustomFieldChange(field.id, e.target.value)}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {/* Campos sin sección */}
              {customFields.filter(f => !f.section_id).length > 0 && (
                <div className="flex flex-col gap-4 bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                  <h4 className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                    <CaralIcon name="layers" size={18} className="text-neutral-400" />
                    Otros Campos
                  </h4>
                  <div className="flex flex-col gap-4">
                    {customFields.filter(f => !f.section_id).map(field => (
                      <div key={field.id} className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          {field.label} {field.is_required && <span className="text-red-500">*</span>}
                        </label>
                        {field.field_type === 'options' ? (
                          <select
                            className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none text-sm"
                            value={formData.custom_answers[field.id] || ''}
                            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                          >
                            <option value="">Seleccionar...</option>
                            {(field.options_list || []).map((opt: string) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : field.field_type === 'boolean' ? (
                          <label className="flex items-center gap-2 cursor-pointer mt-1">
                            <input
                              type="checkbox"
                              checked={formData.custom_answers[field.id] === true}
                              onChange={(e) => handleCustomFieldChange(field.id, e.target.checked)}
                              className="w-5 h-5 text-info-main rounded border-neutral-300"
                            />
                            <span className="text-sm">Sí, confirmar</span>
                          </label>
                        ) : (
                          <TextInput
                            type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                            placeholder={`Ingresar ${field.label.toLowerCase()}...`}
                            value={formData.custom_answers[field.id] || ''}
                            onChange={e => handleCustomFieldChange(field.id, e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && createdOpportunity && (
          <div className="animate-fade-in flex flex-col gap-6">
            <div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Preguntas Iniciales</h3>
              <p className="text-sm text-neutral-500">Responde estas preguntas generales para completar la creación.</p>
            </div>
            
            <OpportunityRequirementsForm 
              opportunity={createdOpportunity}
              view="requirements"
              mode="general"
              onAnswersUpdated={onSuccess}
            />
          </div>
        )}
      </div>

      {/* Botones de navegación */}
      <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-between bg-neutral-50 dark:bg-neutral-900/50">
        <Button
          variant="light"
          onClick={step === 1 ? onClose : step === 3 ? onSuccess : () => setStep(step - 1)}
        >
          {step === 1 ? 'Cancelar' : step === 3 ? 'Saltar' : 'Atrás'}
        </Button>
        {step !== 3 && (
          <Button
            variant="info"
            onClick={step === 2 ? handleSubmit : () => {
              if (step === 1 && !formData.product_id) {
              alert("Por favor selecciona un producto");
              return;
            }
            if (step === 2 && !formData.company_name.trim()) {
              alert("El Cliente/Empresa es obligatorio");
              return;
            }
            
            // Check mandatory fields
            if (step === 2) {
              for (const field of customFields) {
                if (field.is_required) {
                  const val = formData.custom_answers[field.id];
                  if (val === undefined || val === null || val === '') {
                    alert(`El campo "${field.label}" es obligatorio.`);
                    return;
                  }
                }
              }
            }

            if (step === 1) { // before moving to step 2 it's just product.
              setStep(step + 1);
            }
          }}
          disabled={isLoading}
        >
          {isLoading ? 'Guardando...' : step === 2 ? 'Crear Oportunidad' : 'Siguiente'}
        </Button>
        )}
      </div>
    </div>
  );
}
