'use client';

import React, { useState, useEffect } from 'react';
import { Button, Tabs, Toggle } from 'caralstable';
import { CaralIcon, Brand } from 'iconcaral2';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { MilkdownEditorWrapper as MilkdownEditor } from '@/app/components/Editor/MilkdownEditor';
import DocumentCover from '@/app/components/DocumentCover';

export default function DocumentEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [contentDraft, setContentDraft] = useState<any>(null);
  const [settings, setSettings] = useState<any>({
    pageSize: 'A4',
    showFooter: true,
    noTableBorders: false,
    cover: {
      hasCover: false,
      template: 'default',
      hiddenLogos: [] as string[],
      selectedCoverImage: '',
      titleMode: 'logo_name',
      customTitle: '',
      subtitleText: '',
      subtitleColor: '#00B0FF',
      marginTop: 120,
      marginBetween: 10
    }
  });
  const [titleDraft, setTitleDraft] = useState('');

  // Metadata States
  const [metadata, setMetadata] = useState({ tags: '', status: 'draft', restriction: 'public' });
  const [relatedProducts, setRelatedProducts] = useState<string[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'attributes' | 'general' | 'cover'>('attributes');

  const supabase = createClient();
  const router = useRouter();
  const docId = unwrappedParams.id;

  useEffect(() => {
    async function fetchDoc() {
      const { data, error } = await supabase
        .from('portal_documents')
        .select('*')
        .eq('id', docId)
        .single();

      if (error) {
        console.error(error);
        alert('Documento no encontrado');
        router.push('/documentos');
        return;
      }

      setDoc(data);
      setTitleDraft(data.title);

      // Migrar contenido antiguo a multipágina
      let loadedContent = data.content;
      if (loadedContent && typeof loadedContent.text === 'string' && !Array.isArray(loadedContent.pages)) {
        loadedContent = { ...loadedContent, pages: [loadedContent.text] };
        delete loadedContent.text;
      } else if (!loadedContent) {
        loadedContent = { pages: [''] };
      }

      setContentDraft(loadedContent);
      if (data.content?.settings) {
        setSettings({
          pageSize: 'A4',
          showFooter: true,
          noTableBorders: false,
          cover: {
            hasCover: false,
            template: 'default',
            hiddenLogos: [],
            selectedCoverImage: '',
            titleMode: 'logo_name',
            customTitle: '',
            subtitleText: '',
            subtitleColor: '#00B0FF',
            marginTop: 120,
            marginBetween: 10,
            ...(data.content.settings.cover || {})
          },
          ...data.content.settings
        });
      }
      if (data.content?.metadata) {
        setMetadata(data.content.metadata);
      }

      const { data: prodData } = await supabase.from('products').select('id, title, assets, light_image, dark_image, icon_name').order('title');
      if (prodData) setAvailableProducts(prodData);

      if (data.related_products) {
        setRelatedProducts(Array.isArray(data.related_products) ? data.related_products : []);
      }
      setLoading(false);
    }

    if (docId) fetchDoc();
  }, [docId, router, supabase]);

  const handleSave = async () => {
    setIsSaving(true);

    const { data: userData } = await supabase.auth.getUser();
    const userEmail = userData?.user?.email || 'Usuario';

    const newEditEvent = {
      date: new Date().toISOString(),
      user: userEmail,
      action: 'Documento actualizado'
    };

    const { data: currentData } = await supabase.from('portal_documents').select('edit_history').eq('id', docId).single();
    const currentHistory = Array.isArray(currentData?.edit_history) ? currentData.edit_history : [];

    const { error } = await supabase
      .from('portal_documents')
      .update({
        title: titleDraft,
        content: { ...contentDraft, settings, metadata },
        related_products: relatedProducts,
        edit_history: [...currentHistory, newEditEvent],
        updated_at: new Date().toISOString()
      })
      .eq('id', docId);

    setIsSaving(false);

    if (error) {
      console.error(error);
      alert('Error al guardar el documento');
    }
  };

  const handlePageChange = (index: number) => {
    if (index >= 0 && index < contentDraft.pages.length) {
      setCurrentPageIndex(index);
    }
  };

  const handleAddPageBefore = () => {
    const newPages = [...contentDraft.pages];
    newPages.splice(currentPageIndex, 0, '');
    setContentDraft({ ...contentDraft, pages: newPages });
  };

  const handleAddPageAfter = () => {
    const newPages = [...contentDraft.pages];
    newPages.splice(currentPageIndex + 1, 0, '');
    setContentDraft({ ...contentDraft, pages: newPages });
    setCurrentPageIndex(currentPageIndex + 1);
  };

  const handleDeletePage = () => {
    if (contentDraft.pages.length <= 1) return;
    const newPages = [...contentDraft.pages];
    newPages.splice(currentPageIndex, 1);
    setContentDraft({ ...contentDraft, pages: newPages });
    if (currentPageIndex >= newPages.length) {
      setCurrentPageIndex(newPages.length - 1);
    }
  };

  const updateCurrentPageContent = (markdown: string) => {
    const newPages = [...contentDraft.pages];
    newPages[currentPageIndex] = markdown;
    setContentDraft({ ...contentDraft, pages: newPages });
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-neutral-500 animate-pulse">Cargando documento...</span>
      </div>
    );
  }

  const totalPages = contentDraft?.pages?.length || 1;

  // Derived state for cover tab
  const coverProducts = availableProducts.filter(p => relatedProducts.includes(p.id));
  const coverAvailableImages: string[] = [];
  coverProducts.forEach(p => {
    if (p.assets?.cover_images && Array.isArray(p.assets.cover_images)) {
      p.assets.cover_images.forEach((imgUrl: string) => {
        if (!coverAvailableImages.includes(imgUrl)) coverAvailableImages.push(imgUrl);
      });
    }
  });

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-950/50">
      {/* Topbar */}
      <div className="flex items-center justify-between p-4 bg-container border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/documentos')} className="px-2">
            <CaralIcon name="chevronLeft" size={20} />
          </Button>
          <input
            type="text"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            className="text-lg font-bold font-poppins bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border-r border-neutral-200 dark:border-neutral-800 pr-2 mr-2">
            <Button
              variant={isSettingsOpen && sidebarTab === 'cover' ? 'info' : 'ghost'}
              onClick={() => {
                if (!isSettingsOpen || sidebarTab !== 'cover') {
                  setSidebarTab('cover');
                  setIsSettingsOpen(true);
                } else {
                  setIsSettingsOpen(false);
                }
              }}
              title="Configuración de Portada"
            >
              <CaralIcon name="image" size={18} />
            </Button>
            <Button
              variant={isSettingsOpen && sidebarTab !== 'cover' ? 'info' : 'ghost'}
              onClick={() => {
                if (!isSettingsOpen || sidebarTab === 'cover') {
                  setSidebarTab('attributes');
                  setIsSettingsOpen(true);
                } else {
                  setIsSettingsOpen(false);
                }
              }}
              title="Ajustes del documento"
            >
              <CaralIcon name="gear" size={18} />
            </Button>
          </div>
          <Button variant="ghost" onClick={() => window.open(`/d/${docId}`, '_blank')}>
            <CaralIcon name="eye" size={18} className="mr-2" />
            Ver
          </Button>
          <Button variant="info" onClick={handleSave} disabled={isSaving}>
            <CaralIcon name="save" size={18} className="mr-2" />
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>

      {/* Pagination Bar */}
      {doc.type === 'document' && (
        <div className="flex items-center justify-center p-2 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 gap-4 text-sm shadow-sm z-10">
          <Button variant="ghost" size="sm" onClick={handleAddPageBefore} title="Añadir página antes">
            <CaralIcon name="plus" size={14} className="mr-1" /> Antes
          </Button>
          <div className="flex items-center gap-2 font-medium bg-neutral-100 dark:bg-neutral-800 rounded-full px-3 py-1">
            <button onClick={() => handlePageChange(currentPageIndex - 1)} disabled={currentPageIndex === 0} className="disabled:opacity-30 hover:text-blue-500">
              <CaralIcon name="chevronLeft" size={16} />
            </button>
            <span>Página {currentPageIndex + 1} de {totalPages}</span>
            <button onClick={() => handlePageChange(currentPageIndex + 1)} disabled={currentPageIndex === totalPages - 1} className="disabled:opacity-30 hover:text-blue-500">
              <CaralIcon name="chevronRigth" size={16} />
            </button>
          </div>
          <Button variant="ghost" size="sm" onClick={handleAddPageAfter} title="Añadir página después">
            <CaralIcon name="plus" size={14} className="mr-1" /> Después
          </Button>
          {totalPages > 1 && (
            <div className="border-l border-neutral-200 dark:border-neutral-700 pl-4 ml-2">
              <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={handleDeletePage}>
                Eliminar actual
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Editor & Sidebar Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor Area */}
        <div className={`flex-1 overflow-y-auto ${settings.pageSize === 'A4' ? 'bg-neutral-100 dark:bg-neutral-900/50 py-8' : ''} ${settings.noTableBorders ? '[&_.milkdown-table]:!border-none [&_table]:!border-none [&_th]:!border-none [&_td]:!border-none' : ''}`}>
          {doc.type === 'document' ? (
            <div className="flex flex-col gap-8 pb-16">
              {isSettingsOpen && sidebarTab === 'cover' && settings.pageSize === 'A4' && settings.cover?.hasCover && (
                <div className={`mx-auto ${settings.pageSize === 'A4' ? 'w-[794px] min-h-[1123px] bg-white dark:bg-neutral-950 shadow-sm border border-neutral-200 dark:border-neutral-800 mb-12' : 'max-w-4xl mb-12'}`}>
                  <DocumentCover
                    title={titleDraft}
                    products={coverProducts}
                    coverSettings={settings.cover}
                    documentMetadata={metadata}
                    isEditor={true}
                  />
                </div>
              )}
              <div className={`mx-auto ${settings.pageSize === 'A4' ? 'w-[794px] min-h-[1123px] bg-white dark:bg-neutral-950 shadow-xl border border-neutral-200 dark:border-neutral-800' : 'max-w-4xl py-8 px-4'} flex flex-col transition-all duration-300 relative overflow-hidden`}>
                {metadata?.restriction === 'internal' && (
                  <div className="absolute top-60 right-10 z-[100] pointer-events-none -rotate-[15deg] opacity-[0.12]">
                    <div className="border-[8px] border-red-500 rounded-3xl px-8 py-3 bg-white/20 backdrop-blur-sm">
                      <span className="font-black text-4xl text-red-500 tracking-widest whitespace-nowrap">
                        SOLO USO INTERNO
                      </span>
                    </div>
                  </div>
                )}
                <div className={`flex-1 ${settings.pageSize === 'A4' ? 'p-0' : ''}`}>
                  {/* Usar key para forzar re-render cuando cambia la página */}
                  <MilkdownEditor
                    key={`page-${currentPageIndex}`}
                    content={contentDraft?.pages?.[currentPageIndex] || ''}
                    onChange={updateCurrentPageContent}
                  />
                </div>

                {/* Footer */}
                {settings.showFooter && settings.pageSize === 'A4' && (
                  <div className="mt-auto border-t border-neutral-200 dark:border-neutral-800 p-6 flex items-center justify-between opacity-50">
                    <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-400">
                      {titleDraft}
                    </div>
                    <div className="text-xs font-semibold text-neutral-400">
                      {currentPageIndex + 1} / {totalPages}
                    </div>
                    <div className="h-6 opacity-80 grayscale">
                      <img src="/img/logos/logo.png" alt="Seidor" className="h-full object-contain" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col p-4 overflow-y-auto bg-white dark:bg-neutral-950">
              {/* Aquí iría el PresentationBuilder */}
            </div>
          )}
        </div>

        {/* Sidebar Settings */}
        {isSettingsOpen && (
          <div className="w-80 bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 flex flex-col shadow-xl z-10 flex-shrink-0">
            <div className="border-b border-neutral-200 dark:border-neutral-800">
              <Tabs
                tabs={[
                  { label: 'Atributos' },
                  { label: 'Generales' },
                  { label: 'Portada' }
                ]}
                activeIndex={sidebarTab === 'attributes' ? 0 : sidebarTab === 'general' ? 1 : 2}
                onChange={(idx) => {
                  if (idx === 0) setSidebarTab('attributes');
                  else if (idx === 1) setSidebarTab('general');
                  else setSidebarTab('cover');
                }}
              />
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {sidebarTab === 'attributes' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Estado</label>
                    <select
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md p-2"
                      value={metadata.status}
                      onChange={e => setMetadata({ ...metadata, status: e.target.value })}
                    >
                      <option value="draft">Borrador</option>
                      <option value="published">Publicado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Idioma del Documento</label>
                    <select
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md p-2"
                      value={metadata.language || 'es'}
                      onChange={e => setMetadata({ ...metadata, language: e.target.value })}
                    >
                      <option value="es">Español</option>
                      <option value="en">Inglés</option>
                      <option value="pt">Portugués</option>
                      <option value="de">Alemán</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Restricción</label>
                    <select
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md p-2"
                      value={metadata.restriction}
                      onChange={e => setMetadata({ ...metadata, restriction: e.target.value })}
                    >
                      <option value="public">Público (Todos)</option>
                      <option value="internal">Interno (Solo Empleados)</option>
                      <option value="restricted">Restringido (Autorizados)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Descripción</label>
                    <textarea
                      placeholder="Breve descripción del documento..."
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md p-2 text-sm min-h-[80px] resize-y"
                      value={metadata.description || ''}
                      onChange={e => setMetadata({ ...metadata, description: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Etiquetas (separadas por coma)</label>
                    <input
                      type="text"
                      placeholder="ej. SAP, ERP, Manual"
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md p-2"
                      value={metadata.tags || ''}
                      onChange={e => setMetadata({ ...metadata, tags: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Productos Relacionados</label>
                    <div className="max-h-48 overflow-y-auto border border-neutral-200 dark:border-neutral-800 rounded-md p-2 space-y-1 bg-neutral-50 dark:bg-neutral-950">
                      {availableProducts.length === 0 ? (
                        <span className="text-xs text-neutral-500">Cargando productos...</span>
                      ) : (
                        availableProducts.map(prod => (
                          <label key={prod.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-900 p-1.5 rounded transition-colors">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 text-blue-600 focus:ring-blue-500"
                              checked={relatedProducts.includes(prod.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setRelatedProducts([...relatedProducts, prod.id]);
                                } else {
                                  setRelatedProducts(relatedProducts.filter(id => id !== prod.id));
                                }
                              }}
                            />
                            <span className="text-neutral-700 dark:text-neutral-300 select-none truncate">
                              {prod.title}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {sidebarTab === 'general' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-neutral-50 dark:bg-neutral-950">
                    <span className="text-sm font-medium">Formato A4</span>
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={settings.pageSize === 'A4'}
                      onChange={() => setSettings({ ...settings, pageSize: settings.pageSize === 'A4' ? 'auto' : 'A4' })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-neutral-50 dark:bg-neutral-950">
                    <span className="text-sm font-medium">Mostrar Footer (A4)</span>
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={settings.showFooter}
                      onChange={() => setSettings({ ...settings, showFooter: !settings.showFooter })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-neutral-50 dark:bg-neutral-950">
                    <span className="text-sm font-medium">Ocultar bordes de tablas</span>
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={settings.noTableBorders}
                      onChange={() => setSettings({ ...settings, noTableBorders: !settings.noTableBorders })}
                    />
                  </div>
                </div>
              )}

              {sidebarTab === 'cover' && (
                <div className="space-y-6">
                  {/* Activar Portada */}
                  <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-800 bg-[#F5F7FA] dark:bg-neutral-900/50 rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-neutral-900 dark:text-white">Activar portada</span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">Se muestra al inicio del documento publicado</span>
                    </div>
                    <Toggle
                      checked={!!settings.cover?.hasCover}
                      onChange={(checked) => setSettings({ ...settings, cover: { ...settings.cover, hasCover: checked } })}
                    />
                  </div>

                  {settings.cover?.hasCover && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">

                      {/* Seleccionar Portada */}
                      {coverAvailableImages.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-3">Seleccionar Portada</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => setSettings({ ...settings, cover: { ...settings.cover, selectedCoverImage: '' } })}
                              className={`relative aspect-[1/1.4] rounded-xl border-2 transition-all overflow-hidden bg-neutral-100 flex flex-col items-center justify-center ${!settings.cover.selectedCoverImage ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-transparent hover:border-neutral-300'}`}
                            >
                              <span className="text-xs font-semibold text-neutral-500">Auto</span>
                            </button>
                            {coverAvailableImages.map((imgUrl, idx) => (
                              <button
                                key={idx}
                                onClick={() => setSettings({ ...settings, cover: { ...settings.cover, selectedCoverImage: imgUrl } })}
                                className={`relative aspect-[1/1.4] rounded-xl border-2 transition-all overflow-hidden ${settings.cover.selectedCoverImage === imgUrl ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-transparent hover:border-neutral-300'}`}
                              >
                                <img src={imgUrl} className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Contenido */}
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-3">Contenido</h4>

                        <div className="flex items-center gap-3 mb-4">
                          <hr className="flex-1 border-neutral-200 dark:border-neutral-800" />
                          <span className="text-[10px] text-neutral-400">{settings.cover?.marginTop || 120}px</span>
                          <hr className="flex-1 border-neutral-200 dark:border-neutral-800" />
                        </div>
                        <input
                          type="range"
                          min="0" max="800"
                          value={settings.cover?.marginTop || 120}
                          onChange={(e) => setSettings({ ...settings, cover: { ...settings.cover, marginTop: Number(e.target.value) } })}
                          className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer mb-4"
                        />

                        <div className="mb-4">
                          <label className="block text-xs font-medium text-neutral-600 mb-1">Título</label>
                          <select
                            className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg p-2 text-sm"
                            value={settings.cover?.titleMode || 'logo_name'}
                            onChange={e => setSettings({ ...settings, cover: { ...settings.cover, titleMode: e.target.value } })}
                          >
                            <option value="logo_name">Logo + Nombre ({coverProducts[0]?.title || 'producto'})</option>
                            <option value="name">Nombre producto ({coverProducts[0]?.title || 'producto'})</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>

                        {settings.cover?.titleMode === 'custom' && (
                          <div className="mb-4">
                            <input
                              type="text"
                              placeholder="Escribe el título"
                              className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg p-2 text-sm"
                              value={settings.cover?.customTitle || ''}
                              onChange={e => setSettings({ ...settings, cover: { ...settings.cover, customTitle: e.target.value } })}
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-3 mb-4 mt-6">
                          <hr className="flex-1 border-neutral-200 dark:border-neutral-800" />
                          <span className="text-[10px] text-neutral-400">{settings.cover?.marginBetween || 10}px</span>
                          <hr className="flex-1 border-neutral-200 dark:border-neutral-800" />
                        </div>
                        <input
                          type="range"
                          min="0" max="100"
                          value={settings.cover?.marginBetween || 10}
                          onChange={(e) => setSettings({ ...settings, cover: { ...settings.cover, marginBetween: Number(e.target.value) } })}
                          className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer mb-4"
                        />

                        <div className="mb-4 flex gap-2 items-end">
                          <div className="w-10 flex flex-col gap-1">
                            <label className="text-xs font-medium text-neutral-600">Color</label>
                            <input
                              type="color"
                              className="w-full h-9 rounded border border-neutral-200 p-0.5 cursor-pointer"
                              value={settings.cover?.subtitleColor || '#000000'}
                              onChange={e => setSettings({ ...settings, cover: { ...settings.cover, subtitleColor: e.target.value } })}
                            />
                          </div>
                          <div className="flex-1 flex flex-col gap-1">
                            <label className="text-xs font-medium text-neutral-600">Subtítulo</label>
                            <input
                              type="text"
                              placeholder="Subtítulo"
                              className="w-full h-9 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2 text-sm"
                              value={settings.cover?.subtitleText || ''}
                              onChange={e => setSettings({ ...settings, cover: { ...settings.cover, subtitleText: e.target.value } })}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Visibilidad de Logos */}
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-3">Visibilidad de Logos</h4>
                        <div className="flex flex-wrap gap-3">
                          {/* Logo Seidor (Hardcoded) */}
                          <button
                            onClick={() => {
                              const currentHidden = settings.cover.hiddenLogos || [];
                              const newHidden = currentHidden.includes('seidor')
                                ? currentHidden.filter((id: string) => id !== 'seidor')
                                : [...currentHidden, 'seidor'];
                              setSettings({ ...settings, cover: { ...settings.cover, hiddenLogos: newHidden } });
                            }}
                            title="Seidor"
                            className={`relative w-12 h-12 rounded-xl border flex items-center justify-center p-2 transition-all ${settings.cover.hiddenLogos?.includes('seidor') ? 'bg-neutral-100 border-neutral-200 grayscale opacity-50' : 'bg-white border-blue-200 ring-2 ring-blue-500/20'}`}
                          >
                            <img src="/img/logos/logo.png" alt="Seidor" className="w-full h-full object-contain" />
                          </button>

                          {/* Logos de productos vinculados */}
                          {coverProducts.map(p => {
                            const isHidden = settings.cover.hiddenLogos?.includes(p.id);
                            const logo = p.light_image || p.dark_image || p.assets?.logo_light || p.assets?.logo_dark;
                            return (
                              <button
                                key={p.id}
                                onClick={() => {
                                  const currentHidden = settings.cover.hiddenLogos || [];
                                  const newHidden = isHidden
                                    ? currentHidden.filter((id: string) => id !== p.id)
                                    : [...currentHidden, p.id];
                                  setSettings({ ...settings, cover: { ...settings.cover, hiddenLogos: newHidden } });
                                }}
                                title={p.title}
                                className={`relative w-12 h-12 rounded-xl border flex items-center justify-center p-2 transition-all ${isHidden ? 'bg-neutral-100 border-neutral-200 grayscale opacity-50' : 'bg-white border-blue-200 ring-2 ring-blue-500/20'}`}
                              >
                                {p.icon_name ? (
                                  <div className="text-blue-500 w-full h-full flex items-center justify-center">
                                    <Brand name={p.icon_name as any} size={24} />
                                  </div>
                                ) : logo ? (
                                  <img src={logo} alt={p.title} className="w-full h-full object-contain" />
                                ) : (
                                  <span className="text-[10px] font-bold truncate">{p.title.substring(0, 3)}</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
