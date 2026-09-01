'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { CaralIcon } from 'iconcaral2';

export default function RoleMatrixClient({ initialRoles, initialProducts, initialModules, initialDocs, initialPolicies }: { initialRoles: any[], initialProducts: any[], initialModules: any[], initialDocs: any[], initialPolicies: any[] }) {
  const [roles, setRoles] = useState(initialRoles.filter(r => r.name.toLowerCase() !== 'admin' && r.name.toLowerCase() !== 'administrador'));
  const [products, setProducts] = useState(initialProducts);
  const [modules, setModules] = useState(initialModules || []);
  const [docs, setDocs] = useState(initialDocs || []);
  const [policies, setPolicies] = useState(initialPolicies || []);
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});

  const screensList = [
    { id: 'oportunidades', title: 'Oportunidades' },
    { id: 'usuarios', title: 'Usuarios' },
    { id: 'roles', title: 'Roles' },
    { id: 'contenido', title: 'Contenido' },
    { id: 'productos', title: 'Productos' },
    { id: 'configuracion', title: 'Configuración' },
    { id: 'tickets', title: 'Tickets' },
    { id: 'developer-settings', title: 'Developer Settings' },
    { id: 'docs', title: 'Documentación' },
    { id: 'sugerencias', title: 'Sugerencias' },
    { id: 'mi-portal', title: 'Mi Portal' }
  ];

  // Sections state
  const [screensOpen, setScreensOpen] = useState(true);
  const [contentOpen, setContentOpen] = useState(true);
  const [productsOpen, setProductsOpen] = useState(true);
  const [modulesOpen, setModulesOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);

  const supabase = createClient();

  const handleChangeAccess = async (resourceType: string, resourceId: string, roleName: string, newLevel: string) => {
    const loadingKey = `${resourceType}-${resourceId}-${roleName}`;
    setLoadingItems(prev => ({ ...prev, [loadingKey]: true }));

    try {
      const existingPolicyIndex = policies.findIndex(p => p.resource_type === resourceType && p.resource_id === resourceId && p.role_name === roleName);
      
      let newPolicies = [...policies];
      
      if (newLevel === 'Sin acceso') {
        if (existingPolicyIndex >= 0) {
          // Remover politica localmente
          newPolicies.splice(existingPolicyIndex, 1);
          setPolicies(newPolicies);
          
          // Remover en DB
          const { error } = await supabase
            .from('role_policies')
            .delete()
            .match({ resource_type: resourceType, resource_id: resourceId, role_name: roleName });
            
          if (error) throw error;
        }
      } else {
        if (existingPolicyIndex >= 0) {
          // Actualizar politica localmente
          newPolicies[existingPolicyIndex].access_level = newLevel;
          setPolicies(newPolicies);
          
          // Actualizar en DB
          const { error } = await supabase
            .from('role_policies')
            .update({ access_level: newLevel })
            .match({ resource_type: resourceType, resource_id: resourceId, role_name: roleName });
            
          if (error) throw error;
        } else {
          // Insertar nueva politica
          const newPolicyObj = { role_name: roleName, resource_type: resourceType, resource_id: resourceId, access_level: newLevel };
          
          const { data, error } = await supabase
            .from('role_policies')
            .insert([newPolicyObj])
            .select()
            .single();
            
          if (error) throw error;
          if (data) {
            setPolicies([...newPolicies, data]);
          }
        }
      }

    } catch (error: any) {
      alert("Error al actualizar permisos: " + error.message);
      // Revert in real life here, keeping it simple for now
    } finally {
      setLoadingItems(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleBulkChangeAccess = async (resourceType: string, roleName: string, newLevel: string) => {
    let resourcesToUpdate: any[] = [];
    if (resourceType === 'screen') resourcesToUpdate = screensList;
    else if (resourceType === 'product') resourcesToUpdate = products;
    else if (resourceType === 'module') resourcesToUpdate = modules;
    else if (resourceType === 'documentation') resourcesToUpdate = docs;
    else return;
    
    // Set loading for all resources in this column
    const newLoadingItems = { ...loadingItems };
    resourcesToUpdate.forEach(r => {
      newLoadingItems[`${resourceType}-${r.id}-${roleName}`] = true;
    });
    setLoadingItems(newLoadingItems);

    try {
      // Create operations
      const toDeleteIds: string[] = [];
      const toUpsert: any[] = [];
      let nextPolicies = [...policies];

      resourcesToUpdate.forEach(r => {
        const existingIndex = nextPolicies.findIndex(pol => pol.resource_type === resourceType && pol.resource_id === r.id && pol.role_name === roleName);
        
        if (newLevel === 'Sin acceso') {
          if (existingIndex >= 0) {
            toDeleteIds.push(r.id);
            nextPolicies = nextPolicies.filter(pol => !(pol.resource_type === resourceType && pol.resource_id === r.id && pol.role_name === roleName));
          }
        } else {
          if (existingIndex >= 0) {
            nextPolicies[existingIndex].access_level = newLevel;
            toUpsert.push({ id: nextPolicies[existingIndex].id, role_name: roleName, resource_type: resourceType, resource_id: r.id, access_level: newLevel });
          } else {
            toUpsert.push({ role_name: roleName, resource_type: resourceType, resource_id: r.id, access_level: newLevel });
          }
        }
      });

      setPolicies(nextPolicies); // Optimistic partial update

      if (newLevel === 'Sin acceso' && toDeleteIds.length > 0) {
        const { error } = await supabase
          .from('role_policies')
          .delete()
          .in('resource_id', toDeleteIds)
          .eq('resource_type', resourceType)
          .eq('role_name', roleName);
        if (error) throw error;
      } else if (toUpsert.length > 0) {
        const { error, data } = await supabase
          .from('role_policies')
          .upsert(toUpsert, { onConflict: 'role_name,resource_type,resource_id' })
          .select();
        
        if (error) throw error;
        // Re-fetch or merge complete policies if needed, simple refresh of state for IDs
        if (data) {
           const refreshedPolicies = [...policies.filter(pol => !(pol.resource_type === resourceType && pol.role_name === roleName)), ...data];
           setPolicies(refreshedPolicies);
        }
      }

    } catch (error: any) {
      alert("Error al actualizar masivamente: " + error.message);
    } finally {
      // Remove loading
      setLoadingItems(prev => {
        const reset = { ...prev };
        resourcesToUpdate.forEach(r => {
          reset[`${resourceType}-${r.id}-${roleName}`] = false;
        });
        return reset;
      });
    }
  };

  const handleAddRole = async () => {
    const roleName = window.prompt("Ingrese el nombre del nuevo rol:");
    if (!roleName || roleName.trim() === "") return;

    try {
      const { data, error } = await supabase
        .from('roles')
        .insert([{ name: roleName.trim() }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setRoles([...roles, data]);
      }
    } catch (error: any) {
      alert("Error al agregar el rol: " + error.message);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="overflow-x-auto bg-container rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
            <tr>
              <th className="px-6 py-4 font-semibold text-neutral-900 dark:text-neutral-100 min-w-[250px]">
                <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 rounded-md border border-neutral-200 dark:border-neutral-700 px-3 py-2 w-full max-w-xs">
                  <CaralIcon name="search" size={18} className="text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Buscar sección"
                    className="bg-transparent outline-none text-sm w-full font-normal"
                  />
                </div>
              </th>
              {roles.map(role => (
                <th key={role.id} className="px-6 py-4 font-semibold text-neutral-900 dark:text-neutral-100 text-center border-l border-neutral-200 dark:border-neutral-800">
                  {role.name}
                </th>
              ))}
              <th className="px-6 py-4 font-semibold text-center border-l border-neutral-200 dark:border-neutral-800 w-16">
                <button
                  onClick={handleAddRole}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors mx-auto"
                  title="Agregar nuevo rol"
                >
                  <CaralIcon name="plus" size={18} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {/* Seccion: Contenido */}
            <tr>
              <td className="p-0">
                <div
                  className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  onClick={() => setContentOpen(!contentOpen)}
                >
                  <span className="font-bold text-base text-neutral-900 dark:text-white">Contenido</span>
                  <CaralIcon name={contentOpen ? "chevronUp" : "chevronDown"} size={20} className="text-neutral-500" />
                </div>
              </td>
              {roles.map(role => (
                <td key={`bulk-cont-${role.id}`} className="px-6 py-2 text-center border-l border-neutral-200 dark:border-neutral-800 relative">
                  <select
                    onChange={(e) => {
                      handleBulkChangeAccess('screen', role.name, e.target.value);
                      handleBulkChangeAccess('product', role.name, e.target.value);
                      handleBulkChangeAccess('module', role.name, e.target.value);
                      handleBulkChangeAccess('documentation', role.name, e.target.value);
                      e.target.value = ""; // Reset after selection
                    }}
                    className="w-full max-w-[110px] rounded-md border border-neutral-400 dark:border-neutral-600 px-2 py-1 text-xs font-bold appearance-none text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-neutral-500 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors mx-auto uppercase"
                    style={{ textAlignLast: 'center' }}
                  >
                    <option value="" disabled selected>Aplicar a todo</option>
                    <option value="Sin acceso">Sin acceso</option>
                    <option value="Lectura">Lectura</option>
                    <option value="Edición">Edición</option>
                    <option value="Total">Total</option>
                  </select>
                </td>
              ))}
              <td className="border-l border-neutral-200 dark:border-neutral-800"></td>
            </tr>

            {contentOpen && (
              <>
                {/* Sub-seccion: Pantallas */}
                <tr className="bg-neutral-50/30 dark:bg-neutral-900/30">
                  <td className="p-0 border-t border-neutral-200 dark:border-neutral-800">
                    <div 
                      className="px-6 pl-10 py-3 flex items-center justify-between cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                      onClick={() => setScreensOpen(!screensOpen)}
                    >
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">Pantallas</span>
                      <CaralIcon name={screensOpen ? "chevronUp" : "chevronDown"} size={18} className="text-neutral-500" />
                    </div>
                  </td>
                  {roles.map(role => (
                    <td key={`bulk-screen-${role.id}`} className="px-6 py-2 text-center border-l border-t border-neutral-200 dark:border-neutral-500 relative">
                      <select
                        onChange={(e) => {
                          handleBulkChangeAccess('screen', role.name, e.target.value);
                          e.target.value = ""; // Reset after selection
                        }}
                        className="w-full max-w-[110px] rounded-md border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-[10px] font-semibold appearance-none text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-neutral-500 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors mx-auto uppercase"
                        style={{ textAlignLast: 'center' }}
                      >
                        <option value="" disabled selected>Aplicar a todos</option>
                        <option value="Sin acceso">Sin acceso</option>
                        <option value="Lectura">Lectura</option>
                        <option value="Edición">Edición</option>
                        <option value="Total">Total</option>
                      </select>
                    </td>
                  ))}
                  <td className="border-l border-t border-neutral-200 dark:border-neutral-800"></td>
                </tr>

                {screensOpen && screensList.map(screen => (
                  <tr key={`screen-${screen.id}`} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="px-6 pl-14 py-4 font-medium text-neutral-700 dark:text-neutral-300">
                      {screen.title}
                    </td>
                    {roles.map(role => {
                      const policy = policies.find(pol => pol.resource_type === 'screen' && pol.resource_id === screen.id && pol.role_name === role.name);
                      const currentLevel = policy ? policy.access_level : 'Sin acceso';
                      const isLoading = loadingItems[`screen-${screen.id}-${role.name}`];
                      
                      const getLevelStyle = (level: string) => {
                        switch (level) {
                          case 'Lectura': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
                          case 'Edición': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
                          case 'Total': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
                          default: return 'bg-neutral-300/10 text-neutral-700 border-neutral-200 dark:border-neutral-700';
                        }
                      };

                      return (
                        <td key={role.id} className="px-6 py-4 text-center border-l border-neutral-200 dark:border-neutral-800 relative">
                          {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-neutral-900/50 z-10 rounded-md">
                              <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin"></div>
                            </div>
                          )}
                          <select
                            disabled={isLoading}
                            value={currentLevel}
                            onChange={(e) => handleChangeAccess('screen', screen.id, role.name, e.target.value)}
                            className={`
                              w-full max-w-[110px] rounded-md border px-2 py-1.5 text-xs font-semibold appearance-none text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors mx-auto
                              ${getLevelStyle(currentLevel)}
                              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                            style={{ textAlignLast: 'center' }}
                          >
                            <option value="Sin acceso">Sin acceso</option>
                            <option value="Lectura">Lectura</option>
                            <option value="Edición">Edición</option>
                            <option value="Total">Total</option>
                          </select>
                        </td>
                      );
                    })}
                    <td className="border-l border-neutral-200 dark:border-neutral-800"></td>
                  </tr>
                ))}

                {/* Sub-seccion: Productos */}
                <tr className="bg-neutral-50/30 dark:bg-neutral-900/30">
                  <td className="p-0 border-t border-neutral-200 dark:border-neutral-800">
                    <div
                      className="px-6 pl-10 py-3 flex items-center justify-between cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                      onClick={() => setProductsOpen(!productsOpen)}
                    >
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">Productos</span>
                      <CaralIcon name={productsOpen ? "chevronUp" : "chevronDown"} size={18} className="text-neutral-500" />
                    </div>
                  </td>
                  {roles.map(role => (
                    <td key={`bulk-prod-${role.id}`} className="px-6 py-2 text-center border-l border-t border-neutral-200 dark:border-neutral-500 relative">
                      <select
                        onChange={(e) => {
                          handleBulkChangeAccess('product', role.name, e.target.value);
                          e.target.value = ""; // Reset after selection
                        }}
                        className="w-full max-w-[110px] rounded-md border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-[10px] font-semibold appearance-none text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-neutral-500 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors mx-auto uppercase"
                        style={{ textAlignLast: 'center' }}
                      >
                        <option value="" disabled selected>Aplicar a todos</option>
                        <option value="Sin acceso">Sin acceso</option>
                        <option value="Lectura">Lectura</option>
                        <option value="Edición">Edición</option>
                        <option value="Total">Total</option>
                      </select>
                    </td>
                  ))}
                  <td className="border-l border-t border-neutral-200 dark:border-neutral-800"></td>
                </tr>

                {productsOpen && products.map(product => (
                  <tr key={product.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="px-6 pl-14 py-4 font-medium text-neutral-700 dark:text-neutral-300">
                      {product.title}
                    </td>
                    {roles.map(role => {
                      const policy = policies.find(pol => pol.resource_type === 'product' && pol.resource_id === product.id && pol.role_name === role.name);
                      const currentLevel = policy ? policy.access_level : 'Sin acceso';
                      const isLoading = loadingItems[`${product.id}-${role.name}`];

                      const getLevelStyle = (level: string) => {
                        switch (level) {
                          case 'Lectura': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
                          case 'Edición': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
                          case 'Total': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
                          default: return 'bg-neutral-300/10 text-neutral-700 border-neutral-200 dark:border-neutral-700';
                        }
                      };

                      return (
                        <td key={role.id} className="px-6 py-4 text-center border-l border-neutral-200 dark:border-neutral-800 relative">
                          {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-neutral-900/50 z-10 rounded-md">
                              <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin"></div>
                            </div>
                          )}
                          <select
                            disabled={isLoading}
                            value={currentLevel}
                            onChange={(e) => handleChangeAccess('product', product.id, role.name, e.target.value)}
                            className={`
                              w-full max-w-[110px] rounded-md border px-2 py-1.5 text-xs font-semibold appearance-none text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors mx-auto
                              ${getLevelStyle(currentLevel)}
                              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                            style={{ textAlignLast: 'center' }}
                          >
                            <option value="Sin acceso">Sin acceso</option>
                            <option value="Lectura">Lectura</option>
                            <option value="Edición">Edición</option>
                            <option value="Total">Total</option>
                          </select>
                        </td>
                      );
                    })}
                    <td className="border-l border-neutral-200 dark:border-neutral-800"></td>
                  </tr>
                ))}

                {/* Sub-seccion: Módulos (Placeholder) */}
                <tr className="bg-neutral-50/30 dark:bg-neutral-900/30">
                  <td className="p-0 border-t border-neutral-200 dark:border-neutral-800">
                    <div
                      className="px-6 pl-10 py-3 flex items-center justify-between cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                      onClick={() => setModulesOpen(!modulesOpen)}
                    >
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">Módulos</span>
                      <CaralIcon name={modulesOpen ? "chevronUp" : "chevronDown"} size={18} className="text-neutral-500" />
                    </div>
                  </td>
                  {roles.map(role => (
                    <td key={`bulk-mod-${role.id}`} className="px-6 py-2 text-center border-l border-t border-neutral-200 dark:border-neutral-800 relative">
                      <select
                        onChange={(e) => {
                          handleBulkChangeAccess('module', role.name, e.target.value);
                          e.target.value = ""; // Reset after selection
                        }}
                        className="w-full max-w-[110px] rounded-md border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-[10px] font-semibold appearance-none text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-neutral-500 bg-white dark:bg-neutral-300/10 text-neutral-800 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors mx-auto uppercase"
                        style={{ textAlignLast: 'center' }}
                      >
                        <option value="" disabled selected>Aplicar a todos</option>
                        <option value="Sin acceso">Sin acceso</option>
                        <option value="Lectura">Lectura</option>
                        <option value="Edición">Edición</option>
                        <option value="Total">Total</option>
                      </select>
                    </td>
                  ))}
                  <td className="border-l border-t border-neutral-200 dark:border-neutral-800"></td>
                </tr>
                {modulesOpen && modules.map(module => (
                  <tr key={module.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="px-6 pl-14 py-4 font-medium text-neutral-700 dark:text-neutral-300">
                      {module.title}
                    </td>
                    {roles.map(role => {
                      const policy = policies.find(pol => pol.resource_type === 'module' && pol.resource_id === module.id && pol.role_name === role.name);
                      const currentLevel = policy ? policy.access_level : 'Sin acceso';
                      const isLoading = loadingItems[`module-${module.id}-${role.name}`];
                      
                      const getLevelStyle = (level: string) => {
                        switch (level) {
                          case 'Lectura': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
                          case 'Edición': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
                          case 'Total': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
                          default: return 'bg-neutral-300/10 text-neutral-700 border-neutral-200 dark:border-neutral-700';
                        }
                      };

                      return (
                        <td key={role.id} className="px-6 py-4 text-center border-l border-neutral-200 dark:border-neutral-800 relative">
                          {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-neutral-900/50 z-10 rounded-md">
                              <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin"></div>
                            </div>
                          )}
                          <select
                            disabled={isLoading}
                            value={currentLevel}
                            onChange={(e) => handleChangeAccess('module', module.id, role.name, e.target.value)}
                            className={`
                              w-full max-w-[110px] rounded-md border px-2 py-1.5 text-xs font-semibold appearance-none text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors mx-auto
                              ${getLevelStyle(currentLevel)}
                              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                            style={{ textAlignLast: 'center' }}
                          >
                            <option value="Sin acceso">Sin acceso</option>
                            <option value="Lectura">Lectura</option>
                            <option value="Edición">Edición</option>
                            <option value="Total">Total</option>
                          </select>
                        </td>
                      );
                    })}
                    <td className="border-l border-neutral-200 dark:border-neutral-800"></td>
                  </tr>
                ))}

                {/* Sub-seccion: Documentos (Placeholder) */}
                <tr className="bg-neutral-50/30 dark:bg-neutral-900/30">
                  <td className="p-0 border-t border-neutral-200 dark:border-neutral-800">
                    <div
                      className="px-6 pl-10 py-3 flex items-center justify-between cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                      onClick={() => setDocsOpen(!docsOpen)}
                    >
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">Documentos</span>
                      <CaralIcon name={docsOpen ? "chevronUp" : "chevronDown"} size={18} className="text-neutral-500" />
                    </div>
                  </td>
                  {roles.map(role => (
                    <td key={`bulk-doc-${role.id}`} className="px-6 py-2 text-center border-l border-t border-neutral-200 dark:border-neutral-800 relative">
                      <select
                        onChange={(e) => {
                          handleBulkChangeAccess('documentation', role.name, e.target.value);
                          e.target.value = ""; // Reset after selection
                        }}
                        className="w-full max-w-[110px] rounded-md border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-[10px] font-semibold appearance-none text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-neutral-500 bg-white dark:bg-neutral-300/10 text-neutral-800 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors mx-auto uppercase"
                        style={{ textAlignLast: 'center' }}
                      >
                        <option value="" disabled selected>Aplicar a todos</option>
                        <option value="Sin acceso">Sin acceso</option>
                        <option value="Lectura">Lectura</option>
                        <option value="Edición">Edición</option>
                        <option value="Total">Total</option>
                      </select>
                    </td>
                  ))}
                  <td className="border-l border-t border-neutral-200 dark:border-neutral-800"></td>
                </tr>
                {docsOpen && docs.map(doc => (
                  <tr key={doc.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="px-6 pl-14 py-4 font-medium text-neutral-700 dark:text-neutral-300">
                      {doc.title}
                    </td>
                    {roles.map(role => {
                      const policy = policies.find(pol => pol.resource_type === 'documentation' && pol.resource_id === doc.id && pol.role_name === role.name);
                      const currentLevel = policy ? policy.access_level : 'Sin acceso';
                      const isLoading = loadingItems[`documentation-${doc.id}-${role.name}`];
                      
                      const getLevelStyle = (level: string) => {
                        switch (level) {
                          case 'Lectura': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
                          case 'Edición': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
                          case 'Total': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
                          default: return 'bg-neutral-300/10 text-neutral-700 border-neutral-200 dark:border-neutral-700';
                        }
                      };

                      return (
                        <td key={role.id} className="px-6 py-4 text-center border-l border-neutral-200 dark:border-neutral-800 relative">
                          {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-neutral-900/50 z-10 rounded-md">
                              <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin"></div>
                            </div>
                          )}
                          <select
                            disabled={isLoading}
                            value={currentLevel}
                            onChange={(e) => handleChangeAccess('documentation', doc.id, role.name, e.target.value)}
                            className={`
                              w-full max-w-[110px] rounded-md border px-2 py-1.5 text-xs font-semibold appearance-none text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors mx-auto
                              ${getLevelStyle(currentLevel)}
                              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                            style={{ textAlignLast: 'center' }}
                          >
                            <option value="Sin acceso">Sin acceso</option>
                            <option value="Lectura">Lectura</option>
                            <option value="Edición">Edición</option>
                            <option value="Total">Total</option>
                          </select>
                        </td>
                      );
                    })}
                    <td className="border-l border-neutral-200 dark:border-neutral-800"></td>
                  </tr>
                ))}
              </>
            )}

          </tbody>
        </table>
      </div>
    </div>
  );
}
