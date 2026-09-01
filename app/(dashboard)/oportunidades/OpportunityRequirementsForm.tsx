"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button, TextInput, Toggle } from 'caralstable';
import { CaralIcon } from 'iconcaral2';

interface OpportunityRequirementsFormProps {
  opportunity: any;
  onAnswersUpdated?: () => void;
  view?: 'requirements' | 'approvals';
  fieldSource?: 'requirements' | 'features';
  mode?: 'stage' | 'general' | 'all';
}

const statusToStageNameMap: Record<string, string> = {
  'nuevas': 'Nuevas',
  'contacto': 'En Contacto',
  'propuesta': 'En Propuesta',
  'negociacion': 'En Negociación'
};

export default function OpportunityRequirementsForm({ opportunity, onAnswersUpdated, view = 'requirements', fieldSource = 'requirements', mode = 'stage' }: OpportunityRequirementsFormProps) {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [productRequirements, setProductRequirements] = useState<any[]>([]);
  const [requiredForCurrentStage, setRequiredForCurrentStage] = useState<any[]>([]);
  const [allRequiredForCurrentStage, setAllRequiredForCurrentStage] = useState<any[]>([]);
  const [generalRequirements, setGeneralRequirements] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>(opportunity.technical_answers || opportunity.raw?.technical_answers || {});
  const [isSaving, setIsSaving] = useState(false);
  const [currentStageConfig, setCurrentStageConfig] = useState<any>(null);
  const [allStageConfigs, setAllStageConfigs] = useState<any[]>([]);
  const [allStages, setAllStages] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserRoles, setCurrentUserRoles] = useState<string[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [apiOptionsData, setApiOptionsData] = useState<Record<string, any[]>>({});
  const [allProductFeatures, setAllProductFeatures] = useState<any[]>([]);

  useEffect(() => {
    async function fetchUserContext() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        const { data: rolesData } = await supabase.from('user_roles').select('role_id').eq('user_id', user.id);
        if (rolesData) setCurrentUserRoles(rolesData.map(r => r.role_id));
      }
    }
    fetchUserContext();
  }, []);

  useEffect(() => {
    loadRequirements();
  }, [opportunity.id]);

  useEffect(() => {
    const fetchApiOptions = async () => {
      const newApiData: Record<string, any[]> = {};
      for (const req of productRequirements) {
        let isApi = req.type === 'api_select';
        let apiUrl = req.api_url;
        let apiScript = req.api_script;

        if (req.type === 'feature_question' && req.linked_feature_id) {
          const linkedFeat = allProductFeatures.find(f => f.id === req.linked_feature_id);
          if (linkedFeat && linkedFeat.type === 'api_select') {
            isApi = true;
            apiUrl = linkedFeat.api_url;
            apiScript = linkedFeat.api_script;
          }
        }

        if (isApi && apiUrl) {
          try {
            const res = await fetch(apiUrl);
            let data = await res.json();
            if (apiScript) {
              try {
                // eslint-disable-next-line no-new-func
                const transformFn = new Function('data', apiScript);
                data = transformFn(data);
              } catch (err) {
                console.error(`Error executing script for ${req.title}:`, err);
              }
            }

            if (Array.isArray(data)) {
              newApiData[req.id] = data;
            } else {
              newApiData[req.id] = data !== undefined ? [String(data)] : [];
            }
          } catch (e) {
            console.error(`Error fetching API for ${req.title}:`, e);
            newApiData[req.id] = [];
          }
        }
      }
      setApiOptionsData(prev => ({ ...prev, ...newApiData }));
    };
    if (productRequirements.length > 0) {
      fetchApiOptions();
    }
  }, [productRequirements]);

  const loadRequirements = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Product
      let productQuery = supabase.from('products').select('*');
      if (opportunity.raw?.product_id) {
        productQuery = productQuery.eq('id', opportunity.raw?.product_id);
      } else if (opportunity.product_id) {
        productQuery = productQuery.eq('id', opportunity.product_id);
      } else {
        productQuery = productQuery.eq('title', opportunity.productName);
      }
      const { data: productsData } = await productQuery.limit(1);

      if (!productsData || productsData.length === 0) {
        setIsLoading(false);
        return;
      }
      const product = productsData[0];
      const allCombined = [...(product.requirements || []), ...(product.features || [])];
      const allRequirements = mode === 'general' ? allCombined : (fieldSource === 'features' ? (product.features || []) : (product.requirements || []));

      console.log("All requirements for mode", mode, ":", allRequirements);

      setProductRequirements(allRequirements);
      setAllProductFeatures(product.features || []);

      // 2. Fetch config for this product
      const { data: configData } = await supabase
        .from('product_stage_config')
        .select('*')
        .eq('product_id', product.id);

      // 3. Find current stage ID
      const currentStageName = statusToStageNameMap[opportunity.status] || opportunity.status;

      const { data: allStagesData } = await supabase.from('opportunity_stages').select('*').order('order_index');
      let stageId = null;

      if (allStagesData) {
        setAllStages(allStagesData);
        // Find stage by UUID (if refactored) or by name case-insensitive
        const matchedStage = allStagesData.find(s =>
          s.id === opportunity.status ||
          s.name.toLowerCase() === currentStageName.toLowerCase() ||
          s.name.toLowerCase() === opportunity.status.toLowerCase()
        );

        if (matchedStage) {
          stageId = matchedStage.id;
        } else if (allStagesData.length > 0) {
          // Fallback to first stage if not found to prevent completely breaking
          stageId = allStagesData[0].id;
        }
      }

      let stageReqIds: string[] = [];
      let allMappedIds = new Set<string>();

      if (configData) {
        setAllStageConfigs(configData);
        const currentConf = configData.find(c => c.stage_id === stageId);
        if (currentConf) setCurrentStageConfig(currentConf);

        configData.forEach(conf => {
          (conf.required_fields || []).forEach((id: string) => allMappedIds.add(id));
          if (conf.stage_id === stageId) {
            stageReqIds = conf.required_fields || [];
          }
        });
      }

      // 4. Split requirements
      let allCombinedStageReqs = allCombined.filter((req: any) => stageReqIds.includes(req.id));
      setAllRequiredForCurrentStage(allCombinedStageReqs);

      let stageReqs = allRequirements.filter((req: any) => stageReqIds.includes(req.id));
      let generalReqs = allRequirements.filter((req: any) => !allMappedIds.has(req.id));

      setRequiredForCurrentStage(stageReqs);
      setGeneralRequirements(generalReqs);

      // 5. Fetch approvals
      if (stageId) {
        const { data: appData } = await supabase.from('opportunity_approvals').select('*').eq('opportunity_id', opportunity.id).eq('stage_id', stageId);
        if (appData) setApprovals(appData);
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const handleAnswerChange = (reqId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [reqId]: value
    }));
  };

  const isRequirementVisible = (req: any) => {
    if (!req.depends_on || !req.depends_on.requirement_id) return true;

    const parentId = req.depends_on.requirement_id;
    const expectedValues = String(req.depends_on.value).split(',').map(v => v.trim());
    const parentAnswer = answers[parentId];

    if (Array.isArray(parentAnswer)) {
      return parentAnswer.some(a => expectedValues.includes(String(a)));
    }
    return expectedValues.includes(String(parentAnswer));
  };

  const isRequirementCompleted = (req: any, answer: any) => {
    if (answer === undefined || answer === null || answer === '') return false;

    if (req.type === 'tasklist') {
      if (!Array.isArray(answer)) return false;
      return req.options && req.options.every((opt: string) => answer.includes(opt));
    }

    if (req.type === 'boolean') {
      return answer === true;
    }

    if (Array.isArray(answer) && answer.length === 0) {
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    setIsSaving(true);

    let allCompleted = true;
    for (const req of allRequiredForCurrentStage) {
      if (isRequirementVisible(req)) {
        // Solo bloquea el avance automático si el requisito es obligatorio y no está completado
        if (req.is_mandatory && !isRequirementCompleted(req, answers[req.id])) {
          allCompleted = false;
          break;
        }
      }
    }

    const rawTriggers = currentStageConfig?.trigger_automations;
    const triggers = Array.isArray(rawTriggers) ? rawTriggers : [];
    const hasLegacyAuto = currentStageConfig?.auto_advance_on_complete === true;
    const hasAutoAdvanceRule = triggers.some((t: any) => t.type === 'auto_advance') || hasLegacyAuto;

    // Check approvals
    let allApprovalsMet = true;
    triggers.forEach((t: any) => {
      if (t.type === 'user_approval' && !approvals.some(a => a.approved_by === t.target)) allApprovalsMet = false;
      if (t.type === 'role_approval' && !approvals.some(a => a.role_used === t.target)) allApprovalsMet = false;
    });

    let newStatus = opportunity.status;
    let autoAdvanced = false;
    let newStageName = "";

    // Para avanzar: si existe regla auto_advance, los datos deben estar completos. 
    // Además TODAS las reglas de aprobación deben estar cumplidas.
    // Si NO hay regla de auto_advance (solo aprobaciones), no importa si los datos están completos o no.
    const canAdvance = (!hasAutoAdvanceRule || allCompleted) && allApprovalsMet;

    if (canAdvance && currentStageConfig) {
      const currentStageIndex = allStages.findIndex(s => s.id === currentStageConfig.stage_id);
      if (currentStageIndex !== -1 && currentStageIndex < allStages.length - 1) {
        const nextStage = allStages[currentStageIndex + 1];
        newStatus = nextStage.id;
        newStageName = nextStage.name;
        autoAdvanced = true;
      }
    }

    const { error } = await supabase
      .from('opportunities')
      .update({ technical_answers: answers, status: newStatus })
      .eq('id', opportunity.id);

    if (!error && autoAdvanced) {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const oldStageName = allStages.find(s => s.id === currentStageConfig.stage_id)?.name || opportunity.status;

        await supabase.from('opportunity_activities').insert({
          opportunity_id: opportunity.id,
          user_id: userData.user.id,
          activity_type: 'status_change',
          content: {
            old_status: oldStageName,
            new_status: newStageName,
            user_name: 'Sistema (Automatización)',
            message: `avanzó automáticamente la oportunidad a ${newStageName}`
          }
        });

        // Execute Entry Actions (add_comment)
        const nextStageConfig = allStageConfigs.find(c => c.stage_id === newStatus);
        if (nextStageConfig && Array.isArray(nextStageConfig.trigger_automations)) {
          const addCommentActions = nextStageConfig.trigger_automations.filter((t: any) => t.type === 'add_comment');
          for (const action of addCommentActions) {
            await supabase.from('opportunity_activities').insert({
              opportunity_id: opportunity.id,
              user_id: userData.user.id,
              activity_type: 'comment',
              content: {
                user_name: 'Sistema (Automatización)',
                text: action.text
              }
            });
          }
        }
      }
    }

    setIsSaving(false);

    if (!error) {
      if (autoAdvanced) {
        alert(`¡Excelente! Todos los requisitos fueron completados. La oportunidad avanzó automáticamente a ${newStageName}.`);
      } else {
        alert('Requisitos guardados correctamente.');
      }
      if (onAnswersUpdated) onAnswersUpdated();
      window.location.reload();
    } else {
      alert("Error al guardar: " + error.message);
    }
  };

  const handleApprove = async (trigger: any) => {
    if (!currentUser || !currentStageConfig) return;
    setIsSaving(true);

    const roleUsed = trigger.type === 'role_approval' ? trigger.target : 'user';

    const { error } = await supabase.from('opportunity_approvals').insert({
      opportunity_id: opportunity.id,
      stage_id: currentStageConfig.stage_id,
      approved_by: currentUser.id,
      role_used: roleUsed
    });

    if (!error) {
      // Simulate new approval in our state to check if we can advance immediately
      const newApprovals = [...approvals, { approved_by: currentUser.id, role_used: roleUsed }];

      let allCompleted = true;
      for (const req of allRequiredForCurrentStage) {
        if (isRequirementVisible(req)) {
          if (req.is_mandatory && !isRequirementCompleted(req, answers[req.id])) {
            allCompleted = false;
            break;
          }
        }
      }

      const rawTriggers = currentStageConfig?.trigger_automations;
      const triggers = Array.isArray(rawTriggers) ? rawTriggers : [];
      const hasLegacyAuto = currentStageConfig?.auto_advance_on_complete === true;
      const hasAutoAdvanceRule = triggers.some((t: any) => t.type === 'auto_advance') || hasLegacyAuto;

      let allApprovalsMet = true;
      triggers.forEach((t: any) => {
        if (t.type === 'user_approval' && !newApprovals.some(a => a.approved_by === t.target)) allApprovalsMet = false;
        if (t.type === 'role_approval' && !newApprovals.some(a => a.role_used === t.target)) allApprovalsMet = false;
      });

      const canAdvance = (!hasAutoAdvanceRule || allCompleted) && allApprovalsMet;

      if (canAdvance) {
        let newStatus = opportunity.status;
        let newStageName = "";
        const currentStageIndex = allStages.findIndex(s => s.id === currentStageConfig.stage_id);
        if (currentStageIndex !== -1 && currentStageIndex < allStages.length - 1) {
          const nextStage = allStages[currentStageIndex + 1];
          newStatus = nextStage.id;
          newStageName = nextStage.name;

          await supabase.from('opportunities').update({ status: newStatus }).eq('id', opportunity.id);
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            const oldStageName = allStages.find(s => s.id === currentStageConfig.stage_id)?.name || opportunity.status;
            await supabase.from('opportunity_activities').insert({
              opportunity_id: opportunity.id,
              user_id: userData.user.id,
              activity_type: 'status_change',
              content: {
                old_status: oldStageName,
                new_status: newStageName,
                user_name: 'Sistema (Aprobación)',
                message: `avanzó la oportunidad a ${newStageName} tras la última aprobación`
              }
            });

            // Execute Entry Actions (add_comment)
            const nextStageConfig = allStageConfigs.find(c => c.stage_id === nextStage.id);
            if (nextStageConfig && Array.isArray(nextStageConfig.trigger_automations)) {
              const addCommentActions = nextStageConfig.trigger_automations.filter((t: any) => t.type === 'add_comment');
              for (const action of addCommentActions) {
                await supabase.from('opportunity_activities').insert({
                  opportunity_id: opportunity.id,
                  user_id: userData.user.id,
                  activity_type: 'comment',
                  content: {
                    user_name: 'Sistema (Automatización)',
                    text: action.text
                  }
                });
              }
            }
          }
          alert(`Aprobación registrada. La oportunidad avanzó a ${newStageName}.`);
          if (onAnswersUpdated) onAnswersUpdated();
          window.location.reload();
          return;
        }
      }

      // If couldn't advance, just reload the view to show as Approved
      await loadRequirements();
      alert('Aprobación registrada con éxito.');
    } else {
      alert('Error al registrar aprobación: ' + error.message);
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return <div className="p-4 text-sm text-neutral-500">Cargando requisitos técnicos...</div>;
  }

  if (productRequirements.length === 0) {
    return (
      <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg text-sm text-neutral-500 text-center">
        No se encontraron requisitos técnicos para el producto {opportunity.productName || 'seleccionado'}.
      </div>
    );
  }

  const renderRequirementInput = (req: any) => {
    const value = answers[req.id];
    let activeReq = req;

    if (req.type === 'feature_question' && req.linked_feature_id) {
      const linkedFeat = allProductFeatures.find(f => f.id === req.linked_feature_id);
      if (linkedFeat) {
        activeReq = { ...linkedFeat, id: req.id, title: req.title, description: req.description, is_mandatory: req.is_mandatory };
      }
    }

    if (activeReq.type === 'options') {
      return (
        <div className="flex flex-col gap-2 mt-2">
          <select
            value={value || ''}
            onChange={(e) => handleAnswerChange(req.id, e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:border-info-main"
          >
            <option value="" disabled>Selecciona una opción...</option>
            {req.options?.map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    } else if (activeReq.type === 'tasklist') {
      const taskValues = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-col gap-2 mt-2">
          {activeReq.options?.map((task: string) => {
            const checked = taskValues.includes(task);
            return (
              <label key={task} className="flex items-center gap-2 text-sm text-neutral-800 dark:text-neutral-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...taskValues, task]
                      : taskValues.filter((t: string) => t !== task);
                    handleAnswerChange(req.id, newValues);
                  }}
                  className="w-4 h-4 text-info-main rounded"
                />
                <span className={checked ? 'line-through text-neutral-400' : ''}>{task}</span>
              </label>
            );
          })}
        </div>
      );
    } else if (activeReq.type === 'boolean') {
      return (
        <div className="flex items-start gap-2 mt-3">
          <Toggle
            checked={!!value}
            onChange={(checked) => handleAnswerChange(req.id, checked)}
            label={activeReq.boolean_label || activeReq.title}
          />
        </div>
      );
    } else if (activeReq.type === 'api_select') {
      const options = apiOptionsData[req.id];
      return (
        <div className="flex flex-col gap-2 mt-2">
          {!options ? (
            <div className="text-xs text-neutral-500 italic">Cargando opciones desde API...</div>
          ) : options.length === 0 ? (
            <div className="text-xs text-neutral-500 italic">No se encontraron opciones (API vacía o error).</div>
          ) : (
            <select
              value={value || ''}
              onChange={(e) => handleAnswerChange(req.id, e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:border-info-main"
            >
              <option value="" disabled>Selecciona una opción externa...</option>
              {options.map((opt: any, i: number) => {
                const optValue = typeof opt === 'object' && opt !== null ? String(opt.id || opt.name || opt.value || JSON.stringify(opt)) : String(opt);
                const optLabel = typeof opt === 'object' && opt !== null ? String(opt.name || opt.title || opt.label || opt.id || JSON.stringify(opt)) : String(opt);
                return (
                  <option key={i} value={optValue}>{optLabel}</option>
                );
              })}
            </select>
          )}
        </div>
      );
    } else {
      // Default text input
      return (
        <div className="mt-2">
          <TextInput
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => handleAnswerChange(req.id, e.target.value)}
            placeholder="Escribe aquí..."
          />
        </div>
      );
    }
  };

  if (view === 'approvals') {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        {currentStageConfig?.trigger_automations && Array.isArray(currentStageConfig.trigger_automations) && currentStageConfig.trigger_automations.filter((t: any) => t.type !== 'auto_advance').length > 0 ? (
          <div className="bg-warning-light border border-warning-main rounded-xl p-4 flex flex-col gap-3">
            <h4 className="font-bold text-warning-hard text-sm flex items-center gap-2">
              <CaralIcon name="shield" size={16} />
              Aprobaciones Requeridas
            </h4>
            <p className="text-sm text-warning-hard dark:text-warning-600 mb-2">
              Para que la oportunidad avance automáticamente a la siguiente etapa, se requieren las siguientes aprobaciones, además de completar los requisitos técnicos obligatorios.
            </p>
            <div className="flex flex-col gap-2">
              {currentStageConfig.trigger_automations.filter((t: any) => t.type !== 'auto_advance').map((t: any, idx: number) => {
                const isApprovedUser = t.type === 'user_approval' && approvals.some(a => a.approved_by === t.target);
                const isApprovedRole = t.type === 'role_approval' && approvals.some(a => a.role_used === t.target);
                const isApproved = isApprovedUser || isApprovedRole;

                let canApprove = false;
                if (!isApproved && currentUser) {
                  if (t.type === 'user_approval' && currentUser.id === t.target) canApprove = true;
                  if (t.type === 'role_approval' && currentUserRoles.includes(t.target)) canApprove = true;
                }

                let label = t.type === 'user_approval' ? `Usuario Específico` : `Rol Específico`;

                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
                    <span className="text-sm font-medium text-neutral-800 dark:text-neutral-300">Requiere Aprobación de: <strong className="text-info-main">{label}</strong></span>
                    {isApproved ? (
                      <span className="text-xs font-bold text-success-main bg-success-light px-3 py-1.5 rounded-md">Aprobado</span>
                    ) : canApprove ? (
                      <Button variant="info" size="sm" onClick={() => handleApprove(t)} disabled={isSaving}>Aprobar Pase</Button>
                    ) : (
                      <span className="text-xs font-medium text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-md">Pendiente</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-col items-center justify-center text-center gap-3">
            <CaralIcon name="shield-check" size={32} className="text-neutral-400" />
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Esta etapa no requiere aprobaciones manuales.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">

      {/* Renderizamos las validaciones y campos */}
      {(() => {
        let baseReqs = mode === 'general' ? generalRequirements : mode === 'stage' ? requiredForCurrentStage : [...generalRequirements, ...requiredForCurrentStage];
        const visibleReqs = baseReqs.filter(isRequirementVisible);

        if (visibleReqs.length === 0) {
          return (
            <div className="p-8 text-center bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <CaralIcon name="check-circle" size={32} className="mx-auto text-green-500 mb-2" />
              <h4 className="text-neutral-900 dark:text-white font-medium">Todo listo</h4>
              <p className="text-sm text-neutral-500 mt-1">No hay requisitos pendientes para esta etapa.</p>
            </div>
          );
        }

        return (
          <div className="flex flex-col gap-4">
            <h4 className="text-md font-bold text-neutral-800 flex items-center gap-2">
              <CaralIcon name="target" size={18} className="text-info-main" />
              {mode === 'general' ? 'Requerimiento del cliente' : 'Requisitos de la etapa'}
            </h4>
            <div className="grid grid-cols-1 gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
              {visibleReqs.map((req) => (
                <div key={req.id} className="flex justify-between items-start pb-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 last:pb-0 animate-fade-in">
                  <div className="flex items-center gap-4 min-w-[30%]">
                    {isRequirementCompleted(req, answers[req.id]) && <div className='flex items-center justify-center rounded-full p-2 bg-success-light border border-success-main text-success-main'><CaralIcon name="check" size={16} /></div>}
                    <div>
                      <span className="font-semibold text-neutral-900 dark:text-white text-sm">{req.title}</span>
                      {req.is_mandatory && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase font-bold">Obligatorio</span>}
                      {req.depends_on && <span className="ml-2 text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded uppercase font-bold">Dependiente</span>}
                      {req.description && (
                        <p className="text-xs text-neutral-800 dark:text-neutral-400 mt-1">{req.description}</p>
                      )}
                    </div>

                  </div>
                  {renderRequirementInput(req)}
                </div>
              ))}
            </div>
          </div>
        );
      })()}


      <div className={`flex items-center p-4 rounded-xl border mt-2 ${mode === 'general' ? 'justify-end bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200' : 'justify-between bg-info-main/5 border-info-main/20'}`}>
        {mode !== 'general' && (
          <div className="flex flex-col">
            <span className="text-info-main font-bold text-sm">Etapa Actual</span>
            <h4 className="text-lg font-bold text-neutral-900 dark:text-white">{statusToStageNameMap[opportunity.status]}</h4>
          </div>
        )}
        <Button
          variant={mode === 'general' ? 'default' : 'info'}
          iconName="save"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Guardando...' : mode === 'general' ? 'Guardar Respuestas' : 'Guardar Requisitos'}
        </Button>
      </div>

    </div>
  );
}
