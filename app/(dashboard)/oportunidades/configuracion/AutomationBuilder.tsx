import React, { useState } from 'react';
import { CaralIcon } from 'iconcaral2';
import { Toggle, Button } from 'caralstable';

interface AutomationBuilderProps {
  products: any[];
  stages: any[];
  selectedProduct: string | null;
  onProductChange: (productId: string) => void;
  configData: any[];
  onChange: (newConfig: any[]) => void;
  profiles?: any[];
  roles?: any[];
}

export default function AutomationBuilder({
  products,
  stages,
  selectedProduct,
  onProductChange,
  configData,
  onChange,
  profiles = [],
  roles = []
}: AutomationBuilderProps) {

  // Default auto_advance mapped to trigger_automations
  const handleToggleRule = (stageId: string, ruleType: string, isEnabled: boolean) => {
    const existingConfig = configData.find(c => c.stage_id === stageId);
    let newConfig = [...configData];

    if (existingConfig) {
      newConfig = newConfig.map(c => {
        if (c.stage_id !== stageId) return c;
        const rawT = c.trigger_automations;
        let triggers = Array.isArray(rawT) ? rawT : [];
        if (isEnabled) {
          if (!triggers.some((t: any) => t.type === ruleType)) {
            triggers = [...triggers, { type: ruleType }];
          }
        } else {
          triggers = triggers.filter((t: any) => t.type !== ruleType);
        }

        const newC = { ...c, trigger_automations: triggers };
        if (ruleType === 'auto_advance') {
          newC.auto_advance_on_complete = isEnabled;
        }

        return newC;
      });
    } else {
      newConfig.push({
        stage_id: stageId,
        required_fields: [],
        trigger_automations: isEnabled ? [{ type: ruleType }] : []
      });
    }

    onChange(newConfig);
  };

  const handleAddApprovalRule = (stageId: string, type: 'user_approval' | 'role_approval', targetId: string) => {
    if (!targetId) return;
    const existingConfig = configData.find(c => c.stage_id === stageId);
    let newConfig = [...configData];

    const newRule = { type, target: targetId };

    if (existingConfig) {
      newConfig = newConfig.map(c => {
        if (c.stage_id !== stageId) return c;
        const rawT = c.trigger_automations;
        let triggers = Array.isArray(rawT) ? rawT : [];
        // prevent duplicate
        if (!triggers.some((t: any) => t.type === type && t.target === targetId)) {
          triggers = [...triggers, newRule];
        }
        return { ...c, trigger_automations: triggers };
      });
    } else {
      newConfig.push({
        stage_id: stageId,
        required_fields: [],
        trigger_automations: [newRule]
      });
    }

    onChange(newConfig);
  };

  const handleRemoveRule = (stageId: string, ruleIndex: number) => {
    const existingConfig = configData.find(c => c.stage_id === stageId);
    if (!existingConfig) return;

    const newConfig = configData.map(c => {
      if (c.stage_id !== stageId) return c;
      const rawT = c.trigger_automations;
      let triggers = Array.isArray(rawT) ? [...rawT] : [];
      triggers.splice(ruleIndex, 1);
      return { ...c, trigger_automations: triggers };
    });

    onChange(newConfig);
  };

  const [activeStageAdd, setActiveStageAdd] = useState<string | null>(null);
  const [newRuleType, setNewRuleType] = useState<'user_approval' | 'role_approval'>('role_approval');
  const [newRuleTarget, setNewRuleTarget] = useState<string>('');

  const [activeStageAddAction, setActiveStageAddAction] = useState<string | null>(null);
  const [newActionType, setNewActionType] = useState<'add_comment'>('add_comment');
  const [newActionPayload, setNewActionPayload] = useState<string>('');

  const handleAddAction = (stageId: string, type: 'add_comment', text: string) => {
    if (!text.trim()) return;
    const existingConfig = configData.find(c => c.stage_id === stageId);
    let newConfig = [...configData];

    const newRule = { type, text: text.trim() };

    if (existingConfig) {
      newConfig = newConfig.map(c => {
        if (c.stage_id !== stageId) return c;
        const rawT = c.trigger_automations;
        let triggers = Array.isArray(rawT) ? rawT : [];
        triggers = [...triggers, newRule];
        return { ...c, trigger_automations: triggers };
      });
    } else {
      newConfig.push({
        stage_id: stageId,
        required_fields: [],
        trigger_automations: [newRule]
      });
    }

    onChange(newConfig);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white">Triggers y Aprobaciones (Human-in-the-Loop)</h3>
          <p className="text-sm text-neutral-800">
            Configura qué debe suceder para que la oportunidad pase de esta etapa a la siguiente. Puedes combinar reglas (se exigirán TODAS).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-neutral-600 dark:text-neutral-800">Producto:</span>
          <select
            className="h-9 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            value={selectedProduct || ''}
            onChange={(e) => onProductChange(e.target.value)}
          >
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedProduct && (
        <div className="flex gap-6 overflow-x-auto pb-6 pt-4 px-2 items-center min-h-[400px]">
          {stages.map((stage, index) => {
            const config = configData.find(c => c.stage_id === stage.id);
            const rawTriggers = config?.trigger_automations;
            const triggers = Array.isArray(rawTriggers) ? rawTriggers : [];

            // Retrocompatibilidad con auto_advance_on_complete antiguo si lo hubiera
            const hasLegacyAutoAdvance = config?.auto_advance_on_complete === true;
            const hasAutoAdvanceRule = triggers.some((t: any) => t.type === 'auto_advance') || hasLegacyAutoAdvance;

            const isLastStage = index === stages.length - 1;

            return (
              <React.Fragment key={stage.id}>
                {/* Etapa Columna */}
                <div
                  className={`bg-container border-2 rounded-xl flex flex-col shrink-0 w-[340px] shadow-sm relative self-stretch transition-colors ${hasAutoAdvanceRule && !isLastStage ? 'border-success-main/30 shadow-success-main/10' : 'border-neutral-200 dark:border-neutral-800'
                    }`}
                >
                  {/* Encabezado de la Columna */}
                  <div className="flex items-center gap-3 p-4 border-b border-neutral-300 bg-neutral-300/10 rounded-t-xl">
                    <div className={`w-8 h-8 rounded-full bg-${stage.color}-main/10 flex items-center justify-center text-${stage.color}-main shrink-0`}>
                      <CaralIcon name="bolt" size={16} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h4 className="font-bold text-neutral-900 truncate">
                        {stage.name}
                      </h4>
                    </div>
                    {isLastStage && <span className="text-[10px] bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold px-2 py-0.5 rounded-full shrink-0">Última</span>}
                  </div>

                  {/* Aprobaciones HITL (Cuerpo de la Columna) */}
                  <div className="p-4 flex flex-col gap-4 flex-1">
                    {/* --- APROBACIONES HITL --- */}
                    <div className="flex items-center gap-2 mb-1">
                      <CaralIcon name="check" size={14} />
                      <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Aprobaciones</span>
                    </div>

                    {triggers.filter((t: any) => t.type === 'user_approval' || t.type === 'role_approval').map((t: any) => {
                      const idx = triggers.indexOf(t);
                      let iconName = 'user';
                      let label = '';
                      if (t.type === 'user_approval') {
                        const u = profiles.find(p => p.id.toString() === t.target.toString());
                        label = `Usuario: ${u ? u.email : t.target}`;
                      } else if (t.type === 'role_approval') {
                        const r = roles.find(r => r.id.toString() === t.target.toString());
                        iconName = 'shield';
                        label = `Rol: ${r ? r.name : t.target}`;
                      }

                      return (
                        <div key={idx} className="flex items-start justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
                          <div className="flex items-start gap-2">
                            <CaralIcon name={iconName as any} size={14} className="text-info-main mt-0.5 shrink-0" />
                            <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 leading-tight">{label}</span>
                          </div>
                          <button onClick={() => handleRemoveRule(stage.id, idx)} className="text-danger-main hover:text-danger-dark p-1 shrink-0 ml-2">
                            <CaralIcon name="x" size={14} />
                          </button>
                        </div>
                      );
                    })}

                    {triggers.filter((t: any) => t.type === 'user_approval' || t.type === 'role_approval').length === 0 && (
                      <div className="text-xs text-neutral-800 italic text-center py-2 border border-dashed border-neutral-200 dark:border-neutral-700 rounded-lg">
                        Ninguna
                      </div>
                    )}

                    {!isLastStage && activeStageAdd !== stage.id && (
                      <button
                        onClick={() => setActiveStageAdd(stage.id)}
                        className="flex items-center justify-center gap-1 text-xs text-info-main font-bold mt-1 hover:bg-info-main/5 p-2 rounded-lg transition-colors border border-transparent hover:border-info-main/20"
                      >
                        <CaralIcon name="plus" size={12} /> Añadir regla
                      </button>
                    )}

                    {activeStageAdd === stage.id && (
                      <div className="flex flex-col gap-2 mt-1 p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50 rounded-lg animate-fade-in">
                        <select
                          className="h-8 px-2 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs w-full"
                          value={newRuleType}
                          onChange={(e) => setNewRuleType(e.target.value as any)}
                        >
                          <option value="role_approval">Aprobación por Rol</option>
                          <option value="user_approval">Aprobación por Usuario</option>
                        </select>

                        <select
                          className="h-8 px-2 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs w-full"
                          value={newRuleTarget}
                          onChange={(e) => setNewRuleTarget(e.target.value)}
                        >
                          <option value="">Seleccione...</option>
                          {newRuleType === 'role_approval' && roles.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                          {newRuleType === 'user_approval' && profiles.map(p => (
                            <option key={p.id} value={p.id}>{p.email}</option>
                          ))}
                        </select>

                        <div className="flex justify-end gap-2 mt-1">
                          <button onClick={() => setActiveStageAdd(null)} className="text-xs text-neutral-800 hover:text-neutral-700 font-medium px-2 py-1">
                            Cancelar
                          </button>
                          <Button
                            variant="info"
                            size="sm"
                            disabled={!newRuleTarget}
                            onClick={() => {
                              handleAddApprovalRule(stage.id, newRuleType, newRuleTarget);
                              setActiveStageAdd(null);
                              setNewRuleTarget('');
                            }}
                          >
                            Añadir
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* --- ACCIONES AUTOMÁTICAS --- */}
                    <div className="flex items-center gap-2 mb-1 mt-4">
                      <CaralIcon name="bolt" size={14} className="text-purple-600" />
                      <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Acciones (Al entrar)</span>
                    </div>

                    {triggers.filter((t: any) => t.type === 'add_comment').map((t: any) => {
                      const idx = triggers.indexOf(t);
                      return (
                        <div key={idx} className="flex items-start justify-between p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-900/50 shadow-sm">
                          <div className="flex items-start gap-2 min-w-0 flex-1">
                            <CaralIcon name="message-square" size={14} className="text-purple-600 mt-0.5 shrink-0" />
                            <div className="flex flex-col gap-1 min-w-0 flex-1">
                              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 leading-tight">Agregar Comentario</span>
                              <span className="text-xs text-neutral-800 italic truncate" title={t.text}>"{t.text}"</span>
                            </div>
                          </div>
                          <button onClick={() => handleRemoveRule(stage.id, idx)} className="text-danger-main hover:text-danger-dark p-1 shrink-0 ml-2">
                            <CaralIcon name="x" size={14} />
                          </button>
                        </div>
                      );
                    })}

                    {triggers.filter((t: any) => t.type === 'add_comment').length === 0 && (
                      <div className="text-xs text-neutral-800 italic text-center py-2 border border-dashed border-neutral-200 dark:border-neutral-700 rounded-lg">
                        Ninguna
                      </div>
                    )}

                    {activeStageAddAction !== stage.id && (
                      <button
                        onClick={() => setActiveStageAddAction(stage.id)}
                        className="flex items-center justify-center gap-1 text-xs text-purple-600 font-bold mt-1 hover:bg-purple-100/50 p-2 rounded-lg transition-colors border border-transparent hover:border-purple-200"
                      >
                        <CaralIcon name="plus" size={12} /> Añadir acción
                      </button>
                    )}

                    {activeStageAddAction === stage.id && (
                      <div className="flex flex-col gap-2 mt-1 p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/50 rounded-lg animate-fade-in">
                        <select
                          className="h-8 px-2 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs w-full"
                          value={newActionType}
                          onChange={(e) => setNewActionType(e.target.value as any)}
                        >
                          <option value="add_comment">Agregar Comentario</option>
                        </select>

                        {newActionType === 'add_comment' && (
                          <textarea
                            className="p-2 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs w-full min-h-[60px] resize-none"
                            placeholder="Escribe el comentario automático..."
                            value={newActionPayload}
                            onChange={(e) => setNewActionPayload(e.target.value)}
                          />
                        )}

                        <div className="flex justify-end gap-2 mt-1">
                          <button onClick={() => { setActiveStageAddAction(null); setNewActionPayload(''); }} className="text-xs text-neutral-800 hover:text-neutral-700 font-medium px-2 py-1">
                            Cancelar
                          </button>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={!newActionPayload.trim()}
                            onClick={() => {
                              handleAddAction(stage.id, newActionType, newActionPayload);
                              setActiveStageAddAction(null);
                              setNewActionPayload('');
                            }}
                          >
                            Añadir
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Conector Visual (Auto Advance) */}
                {!isLastStage && (
                  <div className="flex flex-col items-center justify-center shrink-0 w-[140px] relative">
                    {/* Linea base */}
                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-neutral-200 dark:bg-neutral-800 -translate-y-1/2 z-0"></div>

                    {/* Linea activa */}
                    <div
                      className={`absolute top-1/2 left-0 h-[2px] -translate-y-1/2 z-0 transition-all duration-300 ${hasAutoAdvanceRule ? 'bg-success-main w-full' : 'w-0'}`}
                    ></div>

                    {/* Arrow head */}
                    <div className={`absolute top-1/2 -right-1 -translate-y-1/2 z-10 transition-colors ${hasAutoAdvanceRule ? 'text-success-main' : 'text-neutral-300 dark:text-neutral-700'}`}>
                      <CaralIcon name="chevron-right" size={24} />
                    </div>

                    {/* Toggle Container */}
                    <div className={`relative z-10 flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-colors ${hasAutoAdvanceRule ? 'bg-white dark:bg-neutral-900 border-success-main shadow-md shadow-success-main/10' : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'}`}>
                      <span className={`text-[10px] font-bold uppercase tracking-wider mb-2 text-center leading-tight ${hasAutoAdvanceRule ? 'text-success-main' : 'text-neutral-800'}`}>
                        Avance<br />Automático
                      </span>
                      <Toggle
                        onChange={(e) => handleToggleRule(stage.id, 'auto_advance', !hasAutoAdvanceRule)}
                        checked={hasAutoAdvanceRule}
                      />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
