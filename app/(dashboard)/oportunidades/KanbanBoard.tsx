"use client";

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Opportunity } from './mockData';
import KanbanCard from './KanbanCard';
import { CaralIcon } from 'iconcaral2';

import { createClient } from '@/utils/supabase/client';

export default function KanbanBoard({
  opportunities,
  setOpportunities,
  stages,
  onOpportunityClick
}: {
  opportunities: Opportunity[],
  setOpportunities: React.Dispatch<React.SetStateAction<Opportunity[]>>,
  stages: any[],
  onOpportunityClick?: (opportunity: Opportunity, initialTab?: 'info' | 'reqs' | 'approvals') => void
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedStageId, setDraggedStageId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDragStart = (initial: any) => {
    setIsDragging(true);
    setDraggedStageId(initial.source.droppableId);
  };

  const handleDragEnd = async (result: DropResult) => {
    setIsDragging(false);
    setDraggedStageId(null);
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Load user to check permissions
    const { data: userData } = await supabase.auth.getUser();
    const userRole = userData.user?.user_metadata?.role || 'usuario_comun'; // no admin fallback
    const userName = userData.user?.user_metadata?.name || userData.user?.user_metadata?.full_name || userData.user?.email?.split('@')[0] || 'Usuario';

    const draggedOpp = opportunities.find(o => o.id === draggableId);
    if (!draggedOpp) return;

    // Check if there are pending requirements or approvals
    if (source.droppableId !== destination.droppableId && destination.droppableId !== 'delete' && destination.droppableId !== 'lost') {
      if (draggedOpp.missingRequirements || draggedOpp.missingFeatures || draggedOpp.requiresIntervention) {
        if (onOpportunityClick) {
          let tabToOpen: 'reqs' | 'features' | 'approvals' = 'approvals';
          if (draggedOpp.missingFeatures) tabToOpen = 'features';
          if (draggedOpp.missingRequirements) tabToOpen = 'reqs';
          onOpportunityClick(draggedOpp, tabToOpen);
        }
        return;
      }
    }

    // Handle Closing Actions (won, lost, delete)
    if (['won', 'lost', 'delete'].includes(destination.droppableId)) {
      if (destination.droppableId === 'delete') {
        if (!confirm("¿Estás seguro de eliminar esta oportunidad de forma definitiva?")) return;

        await supabase.from('opportunity_activities').delete().eq('opportunity_id', draggableId);
        await supabase.from('opportunities').delete().eq('id', draggableId);
        setOpportunities(prev => prev.filter(o => o.id !== draggableId));
      } else {
        const confirmText = destination.droppableId === 'won' ? "Cerrar con Venta" : "Cerrar como Perdida";
        if (!confirm(`¿Estás seguro de marcar esta oportunidad como "${confirmText}"?`)) return;

        await supabase.from('opportunities').update({ status: destination.droppableId }).eq('id', draggableId);
        setOpportunities(prev => prev.filter(o => o.id !== draggableId));

        if (userData.user) {
          const oldStageName = stages.find(s => s.id === source.droppableId)?.name || source.droppableId;
          await supabase.from('opportunity_activities').insert({
            opportunity_id: draggableId,
            user_id: userData.user.id,
            activity_type: 'status_change',
            content: {
              old_status: oldStageName,
              new_status: confirmText,
              user_name: userName,
              message: `marcó la oportunidad como ${confirmText}`
            }
          });
        }
      }
      return;
    }


    // Fetch user roles
    let userRoles: string[] = [userRole];
    if (userData.user) {
      const { data: rData } = await supabase.from('user_roles').select('role_id').eq('user_id', userData.user.id);
      if (rData && rData.length > 0) {
        userRoles = [...userRoles, ...rData.map(r => r.role_id)];
      }
    }

    // Verify new access_roles from product_stage_config
    const productId = draggedOpp.raw?.product_id;
    if (productId) {
      const { data: configData } = await supabase
        .from('product_stage_config')
        .select('*')
        .eq('product_id', productId)
        .eq('stage_id', destination.droppableId)
        .single();

      if (configData && configData.access_roles && configData.access_roles.length > 0) {
        const allowedRoles = configData.access_roles;
        const hasAccess = userRoles.some(ur => allowedRoles.some((ar: any) => ar.toString() === ur.toString()));
        if (!hasAccess && !userRoles.includes('admin')) {
          alert("No tienes permiso para mover la oportunidad a esta etapa.");
          return;
        }
      }
    }

    // Verify rules (legacy auto_comment)
    const { data: rules } = await supabase
      .from('opportunity_rules')
      .select('*')
      .eq('from_status', source.droppableId)
      .eq('to_status', destination.droppableId);

    let ruleToApply = rules && rules.length > 0 ? rules[0] : null;

    // Optimistic UI update
    setOpportunities((prev) => {
      const newItems = Array.from(prev);
      const draggedItemIndex = newItems.findIndex(item => item.id === draggableId);

      if (draggedItemIndex !== -1) {
        const draggedItem = newItems[draggedItemIndex];
        const updatedItem = { ...draggedItem, status: destination.droppableId as any };

        newItems.splice(draggedItemIndex, 1);

        const destItems = newItems.filter(i => i.status === destination.droppableId);
        destItems.splice(destination.index, 0, updatedItem);

        const otherItems = newItems.filter(i => i.status !== destination.droppableId);

        return [...otherItems, ...destItems];
      }
      return prev;
    });

    // Supabase update for status
    await supabase
      .from('opportunities')
      .update({ status: destination.droppableId })
      .eq('id', draggableId);

    // Insert activity record
    if (userData.user && source.droppableId !== destination.droppableId) {
      const oldStageName = stages.find(s => s.id === source.droppableId)?.name || source.droppableId;
      const newStageName = stages.find(s => s.id === destination.droppableId)?.name || destination.droppableId;

      await supabase
        .from('opportunity_activities')
        .insert({
          opportunity_id: draggableId,
          user_id: userData.user.id,
          activity_type: 'status_change',
          content: {
            old_status: oldStageName,
            new_status: newStageName,
            user_name: userName
          }
        });

      // Insert auto comment if rule dictates
      if (ruleToApply && ruleToApply.auto_comment) {
        await supabase
          .from('opportunity_activities')
          .insert({
            opportunity_id: draggableId,
            user_id: userData.user.id,
            activity_type: 'comment',
            content: {
              text: ruleToApply.auto_comment,
              user_name: 'Sistema (Automatización)'
            }
          });
      }
    }
  };

  // Prevenir errores de hidratación con @hello-pangea/dnd
  if (!isMounted) return <div className="w-full h-[600px] flex items-center justify-center text-neutral-400">Cargando tablero...</div>;

  const isLastStage = stages.length > 0 && draggedStageId === stages[stages.length - 1].id;

  return (
    <div className="flex w-full h-[calc(100vh-200px)] overflow-x-auto pb-4 gap-6 scrollbar-thin relative">
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {stages.map((stage) => {
          const columnOpportunities = opportunities.filter(opp => opp.status === stage.id);

          return (
            <div key={stage.id} className="flex flex-col min-w-[320px] w-[320px] rounded-2xl border border-neutral-300 flex-shrink-0 h-full overflow-hidden shadow-md shadow-neutral-500/50">

              {/* Encabezado de la columna */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800 bg-container relative overflow-hidden">
                <div className={`absolute bottom-0 left-0 w-full h-1 bg-${stage.color}-main`}></div>
                <h6 className="font-bold text-neutral-900 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full bg-${stage.color}-main`}></div>
                  {stage.name}
                </h6>
                <span className="bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-xs font-bold px-2 py-1 rounded-full">
                  {columnOpportunities.length}
                </span>
              </div>

              {/* Zona de Droppable */}
              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-4 overflow-y-auto transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-info-main/5 dark:bg-info-main/10' : ''
                      }`}
                  >
                    {columnOpportunities.map((opp, index) => (
                      <KanbanCard
                        key={opp.id}
                        opportunity={opp}
                        index={index}
                        onClick={onOpportunityClick}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}

        {/* Closing Actions Drop Zones */}
        <div className={`fixed bottom-0 left-0 right-0 h-32 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-center gap-6 transition-all duration-300 z-50 shadow-2xl ${isDragging ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none'}`}>
          {isLastStage && (
            <Droppable droppableId="won">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex items-center justify-center w-72 h-16 rounded-xl border-2 border-dashed transition-colors ${snapshot.isDraggingOver ? 'bg-success-main/20 border-success-main text-success-main' : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-500 hover:border-success-main/50 hover:text-success-main/80 shadow-sm'}`}
                >
                  <div className="flex items-center gap-3 font-bold text-lg">
                    <CaralIcon name="check-circle" size={24} />
                    Cerrar con Venta
                  </div>
                  <div className="hidden">{provided.placeholder}</div>
                </div>
              )}
            </Droppable>
          )}

          <Droppable droppableId="lost">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex items-center justify-center w-72 h-16 rounded-xl border-2 border-dashed transition-colors ${snapshot.isDraggingOver ? 'bg-danger-main/20 border-danger-main text-danger-main' : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-500 hover:border-danger-main/50 hover:text-danger-main/80 shadow-sm'}`}
              >
                <div className="flex items-center gap-3 font-bold text-lg">
                  <CaralIcon name="x-circle" size={24} />
                  Cerrar como Perdida
                </div>
                <div className="hidden">{provided.placeholder}</div>
              </div>
            )}
          </Droppable>

          <Droppable droppableId="delete">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex items-center justify-center w-72 h-16 rounded-xl border-2 border-dashed transition-colors ${snapshot.isDraggingOver ? 'bg-neutral-800/20 border-neutral-800 text-neutral-800 dark:bg-white/20 dark:border-white dark:text-white' : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-500 hover:border-neutral-600 hover:text-neutral-700 dark:hover:border-neutral-400 dark:hover:text-neutral-300 shadow-sm'}`}
              >
                <div className="flex items-center gap-3 font-bold text-lg">
                  <CaralIcon name="trash" size={24} />
                  Eliminar
                </div>
                <div className="hidden">{provided.placeholder}</div>
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>
    </div>
  );
}
