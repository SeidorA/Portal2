import React, { useState, useEffect } from 'react';
import { Opportunity } from './mockData';
import { CaralIcon } from 'iconcaral2';
import { createClient } from '@/utils/supabase/client';
import { Timeline, TextInput, Button, Tabs } from 'caralstable';
import OpportunityRequirementsForm from './OpportunityRequirementsForm';

// Utilidad nativa para no requerir date-fns
function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'hace un momento';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `hace ${diffInMinutes} min`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `hace ${diffInHours} horas`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `hace ${diffInDays} días`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

interface OpportunityDetailsProps {
  opportunity: Opportunity;
  onClose: () => void;
  initialTab?: 'info' | 'features' | 'reqs' | 'approvals';
  stages?: any[];
}

export default function OpportunityDetails({ opportunity, onClose, initialTab = 'info', stages = [] }: OpportunityDetailsProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'features' | 'reqs' | 'approvals'>(initialTab);
  const [activities, setActivities] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const isLastStage = stages.length > 0 && opportunity.status === stages[stages.length - 1].id;

  const raw = opportunity.raw || {};
  const company = raw.company_data || {};
  const customAnswers = company.custom_answers || {};

  const loadActivities = async () => {
    const { data, error } = await supabase
      .from('opportunity_activities')
      .select(`*`)
      .eq('opportunity_id', opportunity.id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setActivities(data);
    }
  };

  const loadFormSchema = async () => {
    const { data: sectionData } = await supabase.from('opportunity_form_sections').select('*').order('order_index', { ascending: true });
    if (sectionData) setSections(sectionData);

    const { data: fieldData } = await supabase.from('opportunity_fields').select('*').order('order_index', { ascending: true });
    if (fieldData) setFields(fieldData);
  };

  useEffect(() => {
    loadActivities();
    loadFormSchema();
  }, [opportunity.id]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);

    const { data: userData } = await supabase.auth.getUser();

    if (userData.user) {
      const userName = userData.user.user_metadata?.name || userData.user.user_metadata?.full_name || userData.user.email?.split('@')[0] || 'Usuario';
      await supabase.from('opportunity_activities').insert({
        opportunity_id: opportunity.id,
        user_id: userData.user.id,
        activity_type: 'comment',
        content: { text: newComment, user_name: userName }
      });
      setNewComment('');
      loadActivities();
    }

    setIsSubmitting(false);
  };

  const handleCloseAction = async (action: 'won' | 'lost' | 'delete') => {
    if (action === 'delete') {
      if (!confirm("¿Estás seguro de eliminar esta oportunidad de forma definitiva?")) return;

      // Eliminar actividades primero si no hay on delete cascade
      await supabase.from('opportunity_activities').delete().eq('opportunity_id', opportunity.id);
      await supabase.from('opportunities').delete().eq('id', opportunity.id);
    } else {
      const confirmText = action === 'won' ? "Cerrar con Venta" : "Cerrar como Perdida";
      if (!confirm(`¿Estás seguro de marcar esta oportunidad como "${confirmText}"? Ya no aparecerá en el tablero principal.`)) return;

      await supabase.from('opportunities').update({ status: action }).eq('id', opportunity.id);

      // Registrar actividad
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const userName = userData.user.user_metadata?.name || userData.user.user_metadata?.full_name || userData.user.email?.split('@')[0] || 'Usuario';
        await supabase.from('opportunity_activities').insert({
          opportunity_id: opportunity.id,
          user_id: userData.user.id,
          activity_type: 'status_change',
          content: {
            message: `marcó la oportunidad como ${confirmText}`,
            old_status: opportunity.status,
            new_status: action,
            user_name: userName
          }
        });
      }
    }

    onClose();
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin flex flex-col gap-8">

        {/* Header Section */}
        <div className="flex flex-col gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-6">
          <div className="flex items-center gap-3 mb-1">
            <span className="bg-info-main/10 text-info-main px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {opportunity.status}
            </span>
            <span className="text-sm font-medium text-neutral-800">
              ID: {opportunity.id.split('-')[0]}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            {opportunity.clientName}
          </h2>
          <p className="text-lg text-info-main font-medium">
            {opportunity.productName}
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="w-full -mt-2">
          <Tabs
            tabs={[
              { label: 'Información' },
              { label: 'Requerimientos' + (opportunity.missingRequirements ? ' 🔴' : '') },
              { label: 'Aprobaciones' + (opportunity.requiresIntervention ? ' 🔴' : '') }
            ]}
            activeIndex={activeTab === 'info' ? 0 : activeTab === 'reqs' ? 1 : 2}
            onChange={(idx) => setActiveTab(idx === 0 ? 'info' : idx === 1 ? 'reqs' : 'approvals')}
          />
        </div>

        {activeTab === 'info' && (
          <div className="flex flex-col gap-8 animate-fade-in">
            {/* General Data (Cliente Fijo) */}
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-neutral-300/10 p-4 rounded-xl border border-neutral-100">
                <div>
                  <span className="block text-xs font-medium text-neutral-800 mb-1">Cliente / Empresa</span>
                  <span className="text-sm font-semibold text-neutral-900">{company.name || opportunity.clientName || '-'}</span>
                </div>
              </div>
            </div>

            {/* Dynamic Sections */}
            {sections.map(section => {
              const sectionFields = fields.filter(f => f.section_id === section.id);
              if (sectionFields.length === 0) return null;

              return (
                <div key={section.id} className="flex flex-col gap-4">
                  <h3 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
                    <CaralIcon name={section.icon as any} size={20} className="text-info-main" />
                    {section.title}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-neutral-300/10 p-4 rounded-xl border border-neutral-100">
                    {sectionFields.map(field => {
                      let answer = customAnswers[field.id];
                      if (field.field_type === 'boolean') answer = answer ? 'Sí' : 'No';

                      return (
                        <div key={field.id}>
                          <span className="block text-xs font-medium text-neutral-800 mb-1">{field.label}</span>
                          <span className="text-sm font-semibold text-neutral-900">{answer !== undefined && answer !== '' ? answer : '-'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Other fields without section */}
            {fields.filter(f => !f.section_id).length > 0 && (
              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
                  <CaralIcon name="layers" size={20} className="text-neutral-400" />
                  Otros Campos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-neutral-300/10 p-4 rounded-xl border border-neutral-100">
                  {fields.filter(f => !f.section_id).map(field => {
                    let answer = customAnswers[field.id];
                    if (field.field_type === 'boolean') answer = answer ? 'Sí' : 'No';

                    return (
                      <div key={field.id}>
                        <span className="block text-xs font-medium text-neutral-800 mb-1">{field.label}</span>
                        <span className="text-sm font-semibold text-neutral-900">{answer !== undefined && answer !== '' ? answer : '-'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Requerimientos Generales */}
            <div className="flex flex-col gap-4 border-t border-neutral-200 dark:border-neutral-800 pt-6">
              <OpportunityRequirementsForm
                opportunity={opportunity}
                view="requirements"
                mode="general"
              />
            </div>

            {/* Activity History */}
            <div className="flex flex-col gap-4 mt-2 border-t border-neutral-200 dark:border-neutral-800 pt-6">
              <h3 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
                <CaralIcon name="history" size={20} className="text-neutral-400" />
                Historial y Comentarios
              </h3>
              <div className="flex flex-col ml-2">
                {activities.length > 0 ? activities.map((act, idx) => (
                  <Timeline
                    key={act.id}
                    hideTopLine={idx === 0}
                    hideBottomLine={idx === activities.length - 1}
                    variant={act.activity_type === 'comment' ? 'info' : 'default'}
                  >
                    <div className="flex flex-col mb-6 -mt-1 ml-2">
                      <div className="flex flex-col gap-1 text-sm">
                        <span className="text-xs text-neutral-800">
                          • {formatRelativeTime(act.created_at)}
                        </span>

                        <span className="font-semibold text-neutral-900">{act.content.user_name || 'Usuario'}</span>
                        {act.activity_type === 'status_change' && (
                          <span className="text-neutral-800">
                            movió esta oportunidad de <span className="font-semibold">{act.content.old_status}</span> a <span className="font-semibold">{act.content.new_status}</span>
                          </span>
                        )}
                        {act.activity_type === 'creation' && (
                          <span className="text-neutral-800">creó la oportunidad</span>
                        )}
                        {act.activity_type === 'comment' && (
                          <span className="text-neutral-800">comentó</span>
                        )}

                      </div>
                      {act.activity_type === 'comment' && act.content.text && (
                        <div className="mt-2 p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                          {act.content.text}
                        </div>
                      )}
                    </div>
                  </Timeline>
                )) : (
                  <div className="text-sm text-neutral-500 italic mb-4 ml-2">No hay actividad registrada.</div>
                )}

                <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-col gap-3">
                  <TextInput
                    placeholder="Escribe un comentario..."
                    multiline
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button
                      variant="info"
                      size="sm"
                      onClick={handleAddComment}
                      disabled={isSubmitting || !newComment.trim()}
                    >
                      {isSubmitting ? 'Comentando...' : 'Comentar'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}



        {activeTab === 'reqs' && (
          <div className="flex flex-col gap-8 animate-fade-in">
            <div className="flex flex-col gap-4">
              <OpportunityRequirementsForm
                opportunity={opportunity}
                view="requirements"
                fieldSource="requirements"
              />
            </div>
          </div>
        )}

        {activeTab === 'approvals' && (
          <div className="flex flex-col gap-8 animate-fade-in">
            <div className="flex flex-col gap-4">
              <OpportunityRequirementsForm
                opportunity={opportunity}
                view="approvals"
              />
            </div>
          </div>
        )}

        {/* Footer Actions - Cierres Definitivos */}
        <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800 flex flex-col gap-4">
          <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Acciones de Cierre</h4>
          <div className="flex flex-wrap gap-3">
            {isLastStage && (
              <Button variant="success" iconName="check-circle" onClick={() => handleCloseAction('won')}>
                Cerrar con Venta
              </Button>
            )}
            <Button variant="warning" iconName="x" onClick={() => handleCloseAction('lost')}>
              Cerrar como Perdida
            </Button>
            <div className="flex-1 min-w-[20px]" />
            <Button variant="danger" iconName="trash" onClick={() => handleCloseAction('delete')}>
              Eliminar
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
