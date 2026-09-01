"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { CaralIcon, Brand } from 'iconcaral2';
import { Button, Drawer, TextInput } from 'caralstable';

interface Archivo {
  name: string;
  MediaType?: string;
  Path?: string;
  Description?: string;
  restrictedRoles?: string[];
}

const AVAILABLE_ROLES = [
  'Sales', 'IT', 'Partners', 'People & culture', 'Developers', 'Products'
];

const Archivos = ({ source }: { source: string }) => {
  const [archivos, setArchivos] = useState<Archivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Permissions & Drawer
  const [canEdit, setCanEdit] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingArchivos, setEditingArchivos] = useState<Archivo[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Drag and drop & Accordion state
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('roles(name)')
            .eq('user_id', user.id)
            .single();

          const roleName = roleData?.roles?.name?.toLowerCase();
          
          if (roleName) {
            setUserRole(roleName);
          }

          if (roleName === 'admin' || roleName === 'administrador' || roleName === 'editor') {
            setCanEdit(true);
          }
        }
      } catch (err) {
        console.error('Error checking permissions:', err);
      }
    };

    checkPermissions();
  }, [supabase]);

  useEffect(() => {
    const cargarArchivos = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!source) {
          throw new Error('No se especificó un identificador de archivo');
        }

        const { data, error } = await supabase
          .from('Archivos')
          .select('*')
          .eq('id', source)
          .single();

        if (error) throw error;

        let archivosData: Archivo[] = [];
        if (data && Array.isArray(data.Hijos)) {
          archivosData = data.Hijos;
        }

        setArchivos(archivosData);
        setEditingArchivos(archivosData);
      } catch (err: any) {
        console.error('Error cargando archivos:', err);
        if (err.code !== 'PGRST116') { // Ignore "Rows not found" for empty state handling
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    cargarArchivos();
  }, [source, supabase]);

  const getIconoArchivo = (mediaType?: string) => {
    if (!mediaType) return getIconoDefault();

    const tipo = mediaType.toLowerCase();

    if (tipo.includes('pdf')) return <Brand name="PDF" size={24} />;
    if (tipo.includes('docx')) return <Brand name="DOCX" size={24} />;
    if (tipo.includes('xlsx')) return <Brand name="XLSX" size={24} />;
    if (tipo.includes('video')) return <CaralIcon name='play' />;
    if (tipo.includes('pptx')) return <CaralIcon name='file' color='#c43e1c' />;
    if (tipo.includes('image')) return <CaralIcon name='file' />;
    if (tipo.includes('excel') || tipo.includes('spreadsheet')) return <CaralIcon name='file' />;
    if (tipo.includes('powerpoint') || tipo.includes('presentation')) return <CaralIcon name='file' />;

    return getIconoDefault();
  };

  const getIconoDefault = () => <CaralIcon name='file' />;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('Archivos')
        .upsert({ id: source, Hijos: editingArchivos }, { onConflict: 'id' });

      if (error) throw error;

      setArchivos(editingArchivos);
      setIsDrawerOpen(false);
    } catch (err: any) {
      console.error('Error saving archivos:', err);
      alert('Error al guardar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddFile = () => {
    setEditingArchivos([...editingArchivos, { name: 'Nuevo Archivo', Path: '', MediaType: 'link' }]);
  };

  const handleUpdateFile = (index: number, field: keyof Archivo, value: string) => {
    const updated = [...editingArchivos];
    updated[index] = { ...updated[index], [field]: value };
    setEditingArchivos(updated);
  };

  const handleRemoveFile = (index: number) => {
    const updated = [...editingArchivos];
    updated.splice(index, 1);
    setEditingArchivos(updated);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === dropIndex) return;
    
    const newArchivos = [...editingArchivos];
    const draggedItem = newArchivos[draggedItemIndex];
    newArchivos.splice(draggedItemIndex, 1);
    newArchivos.splice(dropIndex, 0, draggedItem);
    
    setEditingArchivos(newArchivos);
    setDraggedItemIndex(null);
  };

  const visibleArchivos = archivos.filter(archivo => {
    // Admins y Editors siempre ven todos los archivos
    if (canEdit) return true;
    
    // Si el archivo no tiene roles restringidos, todos pueden verlo
    if (!archivo.restrictedRoles || archivo.restrictedRoles.length === 0) return true;
    
    // Si el usuario no tiene rol y hay restricciones, no puede verlo
    if (!userRole) return false;
    
    // Verificar si el rol del usuario está en la lista de roles permitidos del archivo
    return archivo.restrictedRoles.some(role => role.toLowerCase() === userRole);
  });

  if (loading) {
    return (
      <div className="bg-container border border-gray-200 dark:border-gray-800 p-5 my-4 flex flex-col shadow-sm">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 animate-pulse flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                </div>
              </div>
              <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-container border border-gray-200 dark:border-gray-800 p-5 my-4 flex flex-col shadow-sm">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-4 flex items-center">
          <div className="text-red-500 mr-3">
            <CaralIcon name='triangleExclamation' size={20} />
          </div>
          <p className="text-red-600 dark:text-red-400 font-medium">Error al cargar: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-container rounded-xl border border-gray-200 dark:border-gray-800 my-4 flex flex-col shadow-sm overflow-hidden">
      <div className="p-2 sm:p-4">
        {visibleArchivos.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 flex flex-col items-center justify-center text-center">
            <div className="text-gray-400 mb-2">
              <CaralIcon name='file' size={32} />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No se encontraron archivos asociados.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {visibleArchivos.map((archivo, index) => (
              <button
                key={index}
                className="group w-full py-4 px-4 bg-transparent border-b border-gray-100 dark:border-gray-800/50 last:border-b-0 flex justify-between items-center transition-all duration-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                onClick={() => {
                  if (archivo.Path) {
                    window.open(archivo.Path, '_blank');
                  } else {
                    console.log('No hay enlace disponible para:', archivo.name);
                  }
                }}
                title={`Abrir ${archivo.name}`}
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="flex justify-center items-center h-12 w-12 aspect-square rounded-full bg-blue-50/50 dark:bg-gray-800 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-gray-700 transition-colors shadow-sm border border-blue-100/50 dark:border-gray-700/50">
                    {getIconoArchivo(archivo.MediaType)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-[15px] leading-tight mb-1">
                      {archivo.name}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs">
                      {archivo.Description
                        ? archivo.Description
                        : `Archivo tipo ${archivo.MediaType || 'desconocido'}`}
                    </div>
                  </div>
                </div>
                <div className="text-gray-300 dark:text-gray-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-transform transform group-hover:translate-x-1">
                  <CaralIcon name='chevronRigth' size={20} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {canEdit && (
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="w-full bg-slate-400/80 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 py-3 px-6 flex justify-end items-center gap-2 text-sm font-medium transition-colors"
        >
          <CaralIcon name="edit" size={16} />
          Editar
        </button>
      )}

      <Drawer
        isOpen={isDrawerOpen}
        size='lg'
        onClose={() => {
          setEditingArchivos([...archivos]);
          setIsDrawerOpen(false);
        }}
        title="Gestión de Archivos"
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {editingArchivos.map((file, i) => (
              <div 
                key={i} 
                className={`border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 transition-all duration-200 overflow-hidden shadow-sm ${draggedItemIndex === i ? 'opacity-50 scale-[0.98]' : 'opacity-100'}`}
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, i)}
                onDragEnd={() => setDraggedItemIndex(null)}
              >
                {/* Header (Drag handle & Delete) */}
                <div className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 px-3 py-2 flex justify-between items-center cursor-grab active:cursor-grabbing">
                  <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded p-1.5 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors pointer-events-none">
                    <CaralIcon name="arrowsMove" size={16} />
                  </div>
                  <button
                    onClick={() => handleRemoveFile(i)}
                    className="bg-white dark:bg-neutral-800 border border-red-200 dark:border-red-900/50 rounded p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors z-10"
                    title="Eliminar archivo"
                  >
                    <CaralIcon name="trash" size={16} />
                  </button>
                </div>

                {/* Form Body */}
                <div className="p-4 space-y-4">
                  <div className="flex gap-4">
                    <div className="w-1/3 flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Tipo</label>
                      <select
                        value={file.MediaType || ''}
                        onChange={(e) => handleUpdateFile(i, 'MediaType', e.target.value)}
                        className="w-full text-sm p-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">Seleccionar</option>
                        <option value="video/webm">Video/webm</option>
                        <option value="video/mp4">Video/mp4</option>
                        <option value="application/pdf">PDF</option>
                        <option value="image/png">Imagen PNG</option>
                        <option value="image/jpeg">Imagen JPEG</option>
                      </select>
                    </div>
                    <div className="w-2/3 flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Nombre</label>
                      <TextInput
                        value={file.name}
                        onChange={(e: any) => handleUpdateFile(i, 'name', e.target.value)}
                        placeholder="Ej: Presentación Comercial"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Enlace (URL)</label>
                    <TextInput
                      value={file.Path || ''}
                      onChange={(e: any) => handleUpdateFile(i, 'Path', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Descripcion</label>
                    <TextInput
                      value={file.Description || ''}
                      onChange={(e: any) => handleUpdateFile(i, 'Description', e.target.value)}
                      placeholder="Opcional"
                      multiline
                      rows={3}
                    />
                  </div>
                </div>

                {/* Restringir vista Accordion */}
                <div className="border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/30">
                  <button
                    onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                    className="w-full px-4 py-3 flex justify-between items-center text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                  >
                    Restringir vista
                    <CaralIcon name={expandedIndex === i ? 'chevronUp' : 'chevronDown'} size={16} />
                  </button>
                  
                  {expandedIndex === i && (
                    <div className="px-4 pb-4 pt-1 grid grid-cols-2 gap-y-3 gap-x-4 border-t border-neutral-100 dark:border-neutral-800">
                      {AVAILABLE_ROLES.map((role) => (
                        <label key={role} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={file.restrictedRoles?.includes(role) || false}
                            onChange={(e) => {
                              const current = file.restrictedRoles || [];
                              const updated = e.target.checked
                                ? [...current, role]
                                : current.filter(r => r !== role);
                              handleUpdateFile(i, 'restrictedRoles', updated);
                            }}
                            className="w-4 h-4 rounded border-neutral-300 text-blue-500 focus:ring-blue-500 bg-white dark:bg-neutral-800 dark:border-neutral-600"
                          />
                          <span className="text-xs text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200 transition-colors">
                            {role}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <Button
              onClick={handleAddFile}
              variant='ghost'
              hasBorder
              className='W-full'
            >
              <CaralIcon name="plus" size={18} />
              Añadir Archivo
            </Button>
          </div>

          <div className="p-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex justify-end gap-3 mt-auto">
            <Button
              variant="light"
              hasBorder
              onClick={() => {
                setEditingArchivos([...archivos]);
                setIsDrawerOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="info"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default Archivos;
