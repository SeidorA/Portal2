import React, { useState } from 'react';
import { CaralIcon } from 'iconcaral2';
import { Button } from 'caralstable';

interface AccessBuilderProps {
  products: any[];
  stages: any[];
  selectedProduct: string | null;
  onProductChange: (productId: string) => void;
  configData: any[];
  onChange: (newConfig: any[]) => void;
  roles?: any[];
}

export default function AccessBuilder({
  products,
  stages,
  selectedProduct,
  onProductChange,
  configData,
  onChange,
  roles = []
}: AccessBuilderProps) {

  const [activeStageAdd, setActiveStageAdd] = useState<string | null>(null);
  const [newRoleTarget, setNewRoleTarget] = useState<string>('');

  const handleAddRole = (stageId: string, roleId: string) => {
    if (!roleId) return;
    const existingConfig = configData.find(c => c.stage_id === stageId);
    let newConfig = [...configData];

    if (existingConfig) {
      newConfig = newConfig.map(c => {
        if (c.stage_id !== stageId) return c;
        const rawAccess = c.access_roles;
        let accessRoles = Array.isArray(rawAccess) ? rawAccess : [];
        if (!accessRoles.includes(roleId)) {
          accessRoles = [...accessRoles, roleId];
        }
        return { ...c, access_roles: accessRoles };
      });
    } else {
      newConfig.push({
        stage_id: stageId,
        required_fields: [],
        trigger_automations: [],
        access_roles: [roleId]
      });
    }

    onChange(newConfig);
  };

  const handleRemoveRole = (stageId: string, roleIndex: number) => {
    const existingConfig = configData.find(c => c.stage_id === stageId);
    if (!existingConfig) return;

    const newConfig = configData.map(c => {
      if (c.stage_id !== stageId) return c;
      const rawAccess = c.access_roles;
      let accessRoles = Array.isArray(rawAccess) ? [...rawAccess] : [];
      accessRoles.splice(roleIndex, 1);
      return { ...c, access_roles: accessRoles };
    });

    onChange(newConfig);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white">Accesos por Etapa</h3>
          <p className="text-sm text-neutral-800">
            Define qué roles están autorizados para mover una oportunidad hacia cada etapa. Si la lista está vacía, cualquier persona podrá hacerlo.
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
            const rawAccessRoles = config?.access_roles;
            const accessRoles = Array.isArray(rawAccessRoles) ? rawAccessRoles : [];
            const isLastStage = index === stages.length - 1;

            return (
              <React.Fragment key={stage.id}>
                {/* Etapa Columna */}
                <div
                  className="bg-container border-2 border-neutral-200 dark:border-neutral-800 rounded-xl flex flex-col shrink-0 w-[340px] shadow-sm relative self-stretch transition-colors"
                >
                  {/* Encabezado de la Columna */}
                  <div className="flex items-center gap-3 p-4 border-b border-neutral-300 bg-neutral-300/10 rounded-t-xl">
                    <div className={`w-8 h-8 rounded-full bg-${stage.color}-main/10 flex items-center justify-center text-${stage.color}-main shrink-0`}>
                      <CaralIcon name="lock" size={16} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h4 className="font-bold text-neutral-900 truncate">
                        {stage.name}
                      </h4>
                    </div>
                    {isLastStage && <span className="text-[10px] bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold px-2 py-0.5 rounded-full shrink-0">Última</span>}
                  </div>

                  {/* Body: Accesos */}
                  <div className="p-4 flex flex-col gap-4 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CaralIcon name="shield-alert" size={14} className="text-warning-main" />
                      <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Roles Autorizados</span>
                    </div>

                    {accessRoles.map((roleId: string, idx: number) => {
                      const r = roles.find(r => r.id.toString() === roleId.toString());
                      const label = r ? r.name : roleId;

                      return (
                        <div key={idx} className="flex items-start justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
                          <div className="flex items-start gap-2">
                            <CaralIcon name="shield" size={14} className="text-info-main mt-0.5 shrink-0" />
                            <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 leading-tight">Rol: {label}</span>
                          </div>
                          <button onClick={() => handleRemoveRole(stage.id, idx)} className="text-danger-main hover:text-danger-dark p-1 shrink-0 ml-2">
                            <CaralIcon name="x" size={14} />
                          </button>
                        </div>
                      );
                    })}

                    {accessRoles.length === 0 && (
                      <div className="text-xs text-neutral-800 italic text-center py-4 border border-dashed border-neutral-200 dark:border-neutral-700 rounded-lg bg-green-50/50 border-green-200">
                        <span className="text-success-main font-bold block mb-1">Público</span>
                        Cualquier usuario puede mover la oportunidad hacia esta etapa.
                      </div>
                    )}

                    {activeStageAdd !== stage.id && (
                      <button
                        onClick={() => setActiveStageAdd(stage.id)}
                        className="flex items-center justify-center gap-1 text-xs text-info-main font-bold mt-2 hover:bg-info-main/5 p-2 rounded-lg transition-colors border border-transparent hover:border-info-main/20"
                      >
                        <CaralIcon name="plus" size={12} /> Añadir rol
                      </button>
                    )}

                    {activeStageAdd === stage.id && (
                      <div className="flex flex-col gap-2 mt-2 p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50 rounded-lg animate-fade-in">
                        <span className="text-xs font-bold text-neutral-700">Seleccionar Rol:</span>
                        <select
                          className="h-8 px-2 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs w-full"
                          value={newRoleTarget}
                          onChange={(e) => setNewRoleTarget(e.target.value)}
                        >
                          <option value="">Seleccione...</option>
                          {roles.filter(r => !accessRoles.some(id => id.toString() === r.id.toString())).map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>

                        <div className="flex justify-end gap-2 mt-1">
                          <button onClick={() => setActiveStageAdd(null)} className="text-xs text-neutral-800 hover:text-neutral-700 font-medium px-2 py-1">
                            Cancelar
                          </button>
                          <Button
                            variant="info"
                            size="sm"
                            disabled={!newRoleTarget}
                            onClick={() => {
                              handleAddRole(stage.id, newRoleTarget);
                              setActiveStageAdd(null);
                              setNewRoleTarget('');
                            }}
                          >
                            Añadir
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Conector Visual Simple */}
                {!isLastStage && (
                  <div className="flex flex-col items-center justify-center shrink-0 w-[60px] relative">
                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-neutral-200 dark:bg-neutral-800 -translate-y-1/2 z-0"></div>
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 z-10 text-neutral-300 dark:text-neutral-700">
                      <CaralIcon name="chevron-right" size={24} />
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
