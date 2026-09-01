'use client'

import React, { useState, useEffect, useRef } from 'react';
import ManagementColumn from '@/app/components/ManagementColumn';
import ManagementItem from '@/app/components/ManagementItem';
import Modal from '@/app/components/Modal';
import ContentEditor from '@/app/components/ContentEditor';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { createClient } from '@/utils/supabase/client';
import { Button } from 'caralstable';
import { CaralIcon } from 'iconcaral2';
import { parseDocusaurusMarkdown } from '@/utils/docusaurus-parser';

export default function ContenidoPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [modulesList, setModulesList] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [sectionPath, setSectionPath] = useState<{ id: string, title: string }[]>([]);
  const currentSection = sectionPath.length > 0 ? sectionPath[sectionPath.length - 1] : null;

  // --- MODAL STATE ---
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleTitle, setModuleTitle] = useState('');

  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docToEdit, setDocToEdit] = useState<any | null>(null);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isAddSubMenuOpen, setIsAddSubMenuOpen] = useState(false);
  const [defaultDocType, setDefaultDocType] = useState<'document' | 'section' | 'roadmap' | 'battlecard'>('document');

  // --- RELEASE NOTES STATE ---
  const [isAddModuleMenuOpen, setIsAddModuleMenuOpen] = useState(false);
  const [isReleaseNoteModalOpen, setIsReleaseNoteModalOpen] = useState(false);
  const [releaseNoteTitle, setReleaseNoteTitle] = useState('Release Notes');
  const [releaseNoteUrl, setReleaseNoteUrl] = useState('');
  const [docBaseUrl, setDocBaseUrl] = useState('https://crestone-help.seidoranalytics.com');
  const [imgFolder, setImgFolder] = useState('/img/relece');

  const [roles, setRoles] = useState<any[]>([]);

  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, modRes, docRes, rolesRes] = await Promise.all([
        supabase.from('products').select('id, title, icon_name').order('order_index', { ascending: true }).order('created_at', { ascending: false }),
        supabase.from('modules').select('*').order('order_index'),
        supabase.from('documentation').select('*').order('order_index'),
        supabase.from('roles').select('*').order('name')
      ]);

      if (prodRes.error) throw prodRes.error;
      if (modRes.error) throw modRes.error;
      if (docRes.error) throw docRes.error;
      if (rolesRes.error) throw rolesRes.error;

      if (prodRes.data) setProducts(prodRes.data);
      if (modRes.data) setModulesList(modRes.data);
      if (docRes.data) setDocs(docRes.data);
      if (rolesRes.data) setRoles(rolesRes.data);
    } catch (error: any) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- DERIVED STATE ---
  const visibleModules = modulesList.filter(m => m.product_id === selectedProduct).sort((a, b) => a.order_index - b.order_index);
  const visibleContent = docs
    .filter(c => c.module_id === selectedModule)
    .sort((a, b) => a.order_index - b.order_index)
    .map(c => ({
      ...c,
      subtitle: `/${c.slug}`,
      isHidden: c.status === 'draft',
    }));

  // --- HANDLERS DND ---
  const handleDragEnd = async (result: any) => {
    const { source, destination, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === 'MODULES') {
      const reorderedModules = Array.from(visibleModules);
      const [movedItem] = reorderedModules.splice(source.index, 1);
      reorderedModules.splice(destination.index, 0, movedItem);

      setModulesList(prev => prev.map(m => {
        if (m.product_id === selectedProduct) {
          const newIndex = reorderedModules.findIndex(rm => rm.id === m.id);
          return { ...m, order_index: newIndex };
        }
        return m;
      }));

      try {
        for (let i = 0; i < reorderedModules.length; i++) {
          await supabase.from('modules').update({ order_index: i }).eq('id', reorderedModules[i].id);
        }
      } catch (err) {
        console.error("Error updating module order", err);
      }
    }

    if (type === 'CONTENT') {
      if (source.droppableId !== destination.droppableId) return;

      let targetList = [];
      if (source.droppableId === 'content-list') {
        targetList = visibleContent.filter(doc => {
          if (!doc.section) return true;
          const parentExists = visibleContent.some(s => s.type === 'section' && s.id === doc.section);
          return !parentExists;
        });
      } else if (source.droppableId === 'section-children-list') {
        targetList = visibleContent.filter(doc => doc.section === currentSection?.id);
      } else {
        return;
      }

      const reorderedList = Array.from(targetList);
      const [movedItem] = reorderedList.splice(source.index, 1);
      reorderedList.splice(destination.index, 0, movedItem);

      // Update state immediately for UX
      setDocs(prev => prev.map(d => {
        const idx = reorderedList.findIndex(rc => rc.id === d.id);
        if (idx !== -1) {
          return { ...d, order_index: idx };
        }
        return d;
      }));

      // Update DB
      try {
        for (let i = 0; i < reorderedList.length; i++) {
          await supabase.from('documentation').update({ order_index: i }).eq('id', reorderedList[i].id);
        }
      } catch (err) {
        console.error("Error updating content order", err);
      }
    }
  };

  // --- HANDLERS ACTIONS ---
  const handleToggleHideModule = async (id: string, currentlyHidden: boolean) => {
    const newStatus = !currentlyHidden;
    setModulesList(prev => prev.map(m => m.id === id ? { ...m, is_hidden: newStatus } : m));
    await supabase.from('modules').update({ is_hidden: newStatus }).eq('id', id);
  };

  const handleDeleteModule = async (id: string) => {
    if (window.confirm("¿Seguro que deseas eliminar este módulo? Se perderán todos sus recursos internos.")) {
      try {
        const { error } = await supabase.from('modules').delete().eq('id', id);
        if (error) throw error;
        if (selectedModule === id) {
          setSelectedModule(null);
          setSectionPath([]);
        }
        fetchData();
      } catch (err: any) {
        alert("Error al eliminar el módulo: " + err.message);
      }
    }
  };

  const handleDeleteContent = async (id: string) => {
    if (window.confirm("¿Seguro que deseas eliminar este recurso?")) {
      try {
        const { error } = await supabase.from('documentation').delete().eq('id', id);
        if (error) throw error;
        // Si el recurso eliminado es una sección y estamos dentro de ella, retrocedemos
        if (sectionPath.some(s => s.id === id)) {
          setSectionPath(prev => prev.filter(s => s.id !== id));
        }
        fetchData();
      } catch (err: any) {
        alert("Error al eliminar el recurso: " + err.message);
      }
    }
  };

  const handleToggleHideContent = async (id: string, currentlyHidden: boolean) => {
    const newStatus = currentlyHidden ? 'published' : 'draft';
    setDocs(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
    await supabase.from('documentation').update({ status: newStatus }).eq('id', id);
  };

  const openModuleModal = (moduleToEdit?: any) => {
    if (moduleToEdit) {
      setEditingModuleId(moduleToEdit.id);
      setModuleTitle(moduleToEdit.title);
    } else {
      setEditingModuleId(null);
      setModuleTitle('');
    }
    setIsModuleModalOpen(true);
  };

  const saveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingModuleId) {
        const { error } = await supabase.from('modules').update({ title: moduleTitle }).eq('id', editingModuleId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('modules').insert([{ title: moduleTitle, product_id: selectedProduct, order_index: visibleModules.length }]);
        if (error) throw error;
      }
      setIsModuleModalOpen(false);
      fetchData();
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  const saveReleaseNoteModule = async () => {
    try {
      // Create the module
      const { data: moduleData, error: modError } = await supabase.from('modules').insert([{
        title: releaseNoteTitle,
        product_id: selectedProduct,
        order_index: visibleModules.length
      }]).select().single();
      if (modError) throw modError;

      // Create the document inside the module
      const { error: docError } = await supabase.from('documentation').insert([{
        title: releaseNoteTitle,
        slug: generateSlug(releaseNoteTitle),
        module_id: moduleData.id,
        product_id: selectedProduct,
        type: 'release_note',
        content: releaseNoteUrl,
        description: JSON.stringify({ docBaseUrl, imgFolder }),
        order_index: 0
      }]);
      if (docError) throw docError;

      setIsReleaseNoteModalOpen(false);
      setReleaseNoteTitle('Release Notes');
      setReleaseNoteUrl('');
      setDocBaseUrl('https://crestone-help.seidoranalytics.com');
      setImgFolder('/img/relece');
      fetchData();
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  const generateSlug = (text: string) => {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const openDocModal = (doc?: any, type: 'document' | 'section' | 'roadmap' | 'battlecard' = 'document', prefillSectionId?: string) => {
    if (doc) {
      setDocToEdit(doc);
      setDefaultDocType(doc.type || 'document');
    } else {
      setDocToEdit(prefillSectionId ? { section: prefillSectionId, type } : null);
      setDefaultDocType(type);
    }
    setIsDocModalOpen(true);
    setIsAddMenuOpen(false);
    setIsAddSubMenuOpen(false);
  };

  const saveDoc = async (payload: any) => {
    try {
      const fullPayload = {
        ...payload,
        module_id: selectedModule,
        product_id: selectedProduct,
      };

      if (docToEdit?.id) {
        const { error } = await supabase.from('documentation').update(fullPayload).eq('id', docToEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('documentation').insert([{ order_index: visibleContent.length, ...fullPayload }]);
        if (error) throw error;
      }
      setIsDocModalOpen(false);
      fetchData();
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  const handleImportDocusaurus = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setLoading(true);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const text = await file.text();
        const parsed = parseDocusaurusMarkdown(text, file.name);
        
        const parentSection = currentSection ? currentSection.id : null;

        const payload = {
          title: parsed.title,
          slug: parsed.slug,
          type: 'document',
          content: parsed.content,
          section: parentSection,
          order_index: visibleContent.length + i,
          icon_name: parsed.icon_name || 'file',
          use_brand: parsed.use_brand,
          status: 'published',
          module_id: selectedModule,
          product_id: selectedProduct,
        };

        const { error } = await supabase.from('documentation').insert([payload]);
        if (error) {
            console.error('Error importing', file.name, error);
            alert(`Error al importar ${file.name}: ${error.message}`);
        }
      }
      setIsAddMenuOpen(false);
      setIsAddSubMenuOpen(false);
      fetchData();
    } catch (err: any) {
      alert("Error en la importación: " + err.message);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <div className="flex h-[calc(100vh-60px)] w-full overflow-hidden rounded-xl bg-container">
        <DragDropContext onDragEnd={handleDragEnd}>

          {/* COLUMNA 1: PRODUCTOS */}
          {!isDocModalOpen && (
            <ManagementColumn title="Productos" isOpen={true}>
              {loading ? (
                <p className="text-sm p-2 text-neutral-500">Cargando...</p>
              ) : products.map((prod) => (
                <ManagementItem
                  key={prod.id}
                  id={prod.id}
                  title={prod.title}
                  iconName={prod.icon_name}
                  useBrand={true}
                  isActive={selectedProduct === prod.id}
                  onClick={() => {
                    setSelectedProduct(prod.id);
                    setSelectedModule(null);
                    setSectionPath([]);
                  }}
                />
              ))}
            </ManagementColumn>
          )}

          {/* COLUMNA 2: MÓDULOS */}
          {!isDocModalOpen && (
            <ManagementColumn
              title="Módulos"
              isOpen={!!selectedProduct}
              actionElement={
                <div className="relative">
                  <Button
                    isIconButton
                    variant="ghost"
                    iconName="plus"
                    onClick={() => setIsAddModuleMenuOpen(!isAddModuleMenuOpen)}
                    className="text-neutral-500 hover:text-info-main"
                  />
                  {isAddModuleMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsAddModuleMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-1 w-64 bg-container border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg z-50 overflow-hidden py-1 text-neutral-900">
                        <button
                          className="p-2 w-full text-left px-4 py-2 hover:bg-neutral-200 hover:text-info-main! flex items-center gap-2"
                          onClick={() => { setIsAddModuleMenuOpen(false); openModuleModal(); }}
                        >
                          <CaralIcon name='folder' /> Sección Custom
                        </button>
                        <button
                          className="p-2 w-full text-left px-4 py-2 hover:bg-neutral-200 hover:text-info-main! flex items-center gap-2"
                          onClick={() => { setIsAddModuleMenuOpen(false); setIsReleaseNoteModalOpen(true); }}
                        >
                          <CaralIcon name='box' /> Release Notes
                        </button>
                      </div>
                    </>
                  )}
                </div>
              }
            >
              <Droppable droppableId="modules-list" type="MODULES">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex flex-col gap-2 min-h-[50px]"
                  >
                    {visibleModules.map((mod, index) => (
                      <Draggable key={mod.id} draggableId={mod.id} index={index}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps}>
                            <ManagementItem
                              id={mod.id}
                              title={mod.title}
                              iconName="folder"
                              useBrand={false}
                              isHidden={mod.is_hidden}
                              isActive={selectedModule === mod.id}
                              dragHandleProps={provided.dragHandleProps}
                              onClick={() => {
                                setSelectedModule(mod.id);
                                setSectionPath([]);
                              }}
                              onEdit={() => openModuleModal(mod)}
                              onToggleHide={() => handleToggleHideModule(mod.id, mod.is_hidden)}
                              onDelete={() => handleDeleteModule(mod.id)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </ManagementColumn>
          )}

          {/* COLUMNA 3: CONTENIDO */}
          <ManagementColumn
            title="Recursos"
            isOpen={!!selectedModule}
            actionElement={
              <div className="relative">
                <Button
                  isIconButton
                  variant="ghost"
                  iconName="plus"
                  onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                  className="text-neutral-500 hover:text-info-main"
                />
                {isAddMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsAddMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-80 bg-container  border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg z-50 overflow-hidden py-1 text-neutral-900">
                      <button
                        className="p-2 mb-3 pt-3 border-b-2 border-neutral-200 dark:border-neutral-800 w-full px-4 py-2 hover:bg-neutral-200 hover:text-info-main! flex items-center gap-2"
                        onClick={() => openDocModal(undefined, 'document')}
                      >
                        <CaralIcon name='file' /> Nuevo Documento (Raíz)
                      </button>

                      <button
                        className="p-2 w-full text-left px-4 py-2 hover:bg-neutral-200 hover:text-info-main! flex items-center gap-2 border-b-2 border-neutral-200 dark:border-neutral-800"
                        onClick={() => openDocModal(undefined, 'roadmap')}
                      >
                        <CaralIcon name='map' /> Nuevo Roadmap (Raíz)
                      </button>
                      
                      <button
                        className="p-2 w-full text-left px-4 py-2 hover:bg-neutral-200 hover:text-info-main! flex items-center gap-2 border-b-2 border-neutral-200 dark:border-neutral-800"
                        onClick={() => openDocModal(undefined, 'battlecard')}
                      >
                        <CaralIcon name='file' /> Nuevo Battlecard (Raíz)
                      </button>

                      <button
                        className="p-2 w-full text-left px-4 py-2 hover:bg-neutral-200 hover:text-info-main! flex items-center gap-2"
                        onClick={() => openDocModal(undefined, 'section')}
                      >
                        <CaralIcon name='folder' /> Nueva Sección
                      </button>
                      <button
                        className="p-2 w-full text-left px-4 py-2 hover:bg-neutral-200 hover:text-info-main! flex items-center gap-2 border-t border-neutral-200 dark:border-neutral-800"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <CaralIcon name='download' /> Importar desde Docusaurus
                      </button>
                    </div>
                  </>
                )}
              </div>
            }
          >
            <Droppable droppableId="content-list" type="CONTENT">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex flex-col gap-2 min-h-[50px]"
                >
                  {visibleContent
                    .filter(doc => {
                      if (!doc.section) return true;
                      // Si tiene un ID de sección pero esa sección no existe en la vista actual, lo mostramos en la raíz
                      const parentExists = visibleContent.some(s => s.type === 'section' && s.id === doc.section);
                      return !parentExists;
                    })
                    .map((doc, index) => (
                      <Draggable key={doc.id} draggableId={doc.id} index={index}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps}>
                            <ManagementItem
                              id={doc.id}
                              title={doc.title}
                              subtitle={doc.subtitle}
                              iconName={doc.icon_name || (doc.type === 'section' ? 'folder' : 'file')}
                              useBrand={doc.use_brand || false}
                              isHidden={doc.isHidden}
                              isActive={currentSection?.id === doc.id && sectionPath.length === 1}
                              dragHandleProps={provided.dragHandleProps}
                              onClick={() => {
                                if (doc.type === 'section') {
                                  setSectionPath([{ id: doc.id, title: doc.title }]);
                                }
                              }}
                              onEdit={() => openDocModal(doc)}
                              onToggleHide={() => handleToggleHideContent(doc.id, doc.isHidden)}
                              onDelete={() => handleDeleteContent(doc.id)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </ManagementColumn>

          {/* COLUMNA 4: HIJOS DE LA SECCIÓN */}
          <ManagementColumn
            title={
              <div className="flex items-center gap-1 overflow-hidden">
                {sectionPath.length > 1 && (
                  <Button
                    isIconButton
                    variant="ghost"
                    iconName="arrowLeft"
                    onClick={() => setSectionPath(prev => prev.slice(0, -1))}
                    className="text-neutral-500 -ml-2 shrink-0"
                  />
                )}
                <span className="truncate" title={currentSection?.title}>{currentSection?.title || 'Documentos'}</span>
              </div>
            }
            isOpen={!!currentSection}
            actionElement={
              currentSection ? (
                <div className="relative">
                  <Button
                    isIconButton
                    variant="ghost"
                    iconName="plus"
                    onClick={() => setIsAddSubMenuOpen(!isAddSubMenuOpen)}
                    className="text-neutral-500 hover:text-info-main"
                  />
                  {isAddSubMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsAddSubMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-1 w-80 bg-container  border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg z-50 overflow-hidden py-1 text-neutral-900">
                        <button
                          className="p-2 mb-3 pt-3 border-b-2 border-neutral-200 dark:border-neutral-800 w-full px-4 py-2 hover:bg-neutral-200 hover:text-info-main! flex items-center gap-2"
                          onClick={() => openDocModal(undefined, 'document', currentSection.id)}
                        >
                          <CaralIcon name='file' /> Nuevo Documento Interno
                        </button>
                        <button
                          className="p-2 w-full text-left px-4 py-2 hover:bg-neutral-200 hover:text-info-main! flex items-center gap-2"
                          onClick={() => openDocModal(undefined, 'section', currentSection.id)}
                        >
                          <CaralIcon name='folder' /> Nueva Sub-Sección
                        </button>
                        <button
                          className="p-2 w-full text-left px-4 py-2 hover:bg-neutral-200 hover:text-info-main! flex items-center gap-2"
                          onClick={() => openDocModal(undefined, 'roadmap', currentSection.id)}
                        >
                          <CaralIcon name='map' /> Nuevo Roadmap Interno
                        </button>
                        <button
                          className="p-2 w-full text-left px-4 py-2 hover:bg-neutral-200 hover:text-info-main! flex items-center gap-2"
                          onClick={() => openDocModal(undefined, 'battlecard', currentSection.id)}
                        >
                          <CaralIcon name='file' /> Nuevo Battlecard Interno
                        </button>
                        <button
                          className="p-2 w-full text-left px-4 py-2 hover:bg-neutral-200 hover:text-info-main! flex items-center gap-2 border-t border-neutral-200 dark:border-neutral-800"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <CaralIcon name='download' /> Importar desde Docusaurus
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : undefined
            }
          >
            <Droppable droppableId="section-children-list" type="CONTENT">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex flex-col gap-2 min-h-[50px]"
                >
                  {visibleContent
                    .filter(doc => doc.section === currentSection?.id)
                    .map((doc, index) => (
                      <Draggable key={doc.id} draggableId={doc.id} index={index}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps}>
                            <ManagementItem
                              id={doc.id}
                              title={doc.title}
                              subtitle={doc.subtitle}
                              iconName={doc.icon_name || (doc.type === 'section' ? 'folder' : 'file')}
                              useBrand={doc.use_brand || false}
                              isHidden={doc.isHidden}
                              isActive={currentSection?.id === doc.id && false} // Sub-secciones de este nivel no están activas porque abren otra columna virtualmente
                              dragHandleProps={provided.dragHandleProps}
                              onClick={() => {
                                if (doc.type === 'section') {
                                  setSectionPath(prev => [...prev, { id: doc.id, title: doc.title }]);
                                }
                              }}
                              onEdit={() => openDocModal(doc)}
                              onToggleHide={() => handleToggleHideContent(doc.id, doc.isHidden)}
                              onDelete={() => handleDeleteContent(doc.id)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </ManagementColumn>

        </DragDropContext>

        {/* --- PANEL LATERAL DE EDICIÓN DE CONTENIDOS (RECURSOS) --- */}
        <ContentEditor
          isOpen={isDocModalOpen}
          docToEdit={docToEdit}
          productId={selectedProduct}
          defaultDocType={defaultDocType}
          availableRoles={roles}
          onClose={() => setIsDocModalOpen(false)}
          onSave={saveDoc}
        />
      </div>

      <input 
        type="file" 
        multiple 
        accept=".md" 
        ref={fileInputRef} 
        onChange={handleImportDocusaurus} 
        style={{ display: 'none' }} 
      />

      {/* --- MODAL DE MÓDULOS --- */}
      {isModuleModalOpen && (
        <Modal isOpen={isModuleModalOpen} onClose={() => setIsModuleModalOpen(false)} title={editingModuleId ? 'Editar Módulo' : 'Nuevo Módulo'} width="sm">
          <form onSubmit={saveModule} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre del Módulo</label>
              <input
                required
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit"
                placeholder="Ej: Recursos"
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" type="button" onClick={() => setIsModuleModalOpen(false)}>Cancelar</Button>
              <Button variant="info" type="submit" disabled={!moduleTitle.trim()}>Guardar</Button>
            </div>
          </form>
        </Modal>
      )}
      {/* Modal para Nuevo Módulo de Release Notes */}
      {isReleaseNoteModalOpen && (
        <Modal
          isOpen={isReleaseNoteModalOpen}
          title="Nuevo Módulo de Release Notes"
          onClose={() => setIsReleaseNoteModalOpen(false)}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Título del Módulo</label>
              <input
                type="text"
                className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 dark:text-white"
                value={releaseNoteTitle}
                onChange={e => setReleaseNoteTitle(e.target.value)}
                placeholder="Ej. Novedades"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">URL del JSON (GitHub Raw)</label>
              <input
                type="text"
                className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 dark:text-white"
                value={releaseNoteUrl}
                onChange={e => setReleaseNoteUrl(e.target.value)}
                placeholder="https://raw.githubusercontent.com/..."
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">URL Base de Documentación (Links)</label>
              <input
                type="text"
                className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 dark:text-white"
                value={docBaseUrl}
                onChange={e => setDocBaseUrl(e.target.value)}
                placeholder="https://crestone-help.seidoranalytics.com"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Ruta de Imágenes</label>
              <input
                type="text"
                className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 dark:text-white"
                value={imgFolder}
                onChange={e => setImgFolder(e.target.value)}
                placeholder="/img/relece"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="ghost" onClick={() => setIsReleaseNoteModalOpen(false)}>Cancelar</Button>
            <Button onClick={saveReleaseNoteModule} disabled={!releaseNoteTitle.trim() || !releaseNoteUrl.trim()}>Crear</Button>
          </div>
        </Modal>
      )}
    </>
  );
}
