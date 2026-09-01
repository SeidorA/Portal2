'use client';

import React, { useState, useEffect } from 'react';
import { Button, Tabs, TextInput, Drawer, Timeline } from 'caralstable';
import { CaralIcon } from 'iconcaral2';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function DocumentosPage() {
  const [activeTab, setActiveTab] = useState<'documentos' | 'presentaciones'>('documentos');
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [copyStatus, setCopyStatus] = useState<'link' | 'insert' | null>(null);

  const openDrawer = (doc: any) => {
    setSelectedDoc(doc);
    setIsDrawerOpen(true);
  };

  const handleCopyLink = () => {
    if (!selectedDoc) return;
    const url = `${window.location.origin}/d/${selectedDoc.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyStatus('link');
      setTimeout(() => setCopyStatus(null), 2000);
    });
  };

  const handleCopyInsert = () => {
    if (!selectedDoc) return;
    const insertCode = `<DocInsert id="${selectedDoc.id}" />`;
    navigator.clipboard.writeText(insertCode).then(() => {
      setCopyStatus('insert');
      setTimeout(() => setCopyStatus(null), 2000);
    });
  };

  const supabase = createClient();
  const router = useRouter();

  const loadDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('portal_documents')
      .select('id, title, type, updated_at, content, edit_history')
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setDocuments(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setIsCreating(true);

    const docType = activeTab === 'documentos' ? 'document' : 'presentation';
    const defaultContent = docType === 'document' ? { text: `# ${newTitle}\n\nEscribe aquí...` } : { slides: [] };

    const { data, error } = await supabase
      .from('portal_documents')
      .insert({
        title: newTitle.trim(),
        type: docType,
        content: defaultContent
      })
      .select()
      .single();

    setIsCreating(false);

    if (error) {
      console.error(error);
      alert('Error creando el archivo');
    } else if (data) {
      setIsModalOpen(false);
      setNewTitle('');
      router.push(`/documentos/edit/${data.id}`);
    }
  };

  const filteredDocs = documents.filter(d => d.type === (activeTab === 'documentos' ? 'document' : 'presentation'));

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-end justify-between bg-container rounded-lg p-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-neutral-900">
            Documentos y Presentaciones
          </h1>
          <p className="text-sm text-neutral-800 mt-1">
            Gestiona tus documentos de texto y presentaciones interactivas.
          </p>

          {/* Tabs */}
          <div className="w-full mt-4">
            <Tabs
              tabs={[
                { label: 'Documentos' },
                { label: 'Presentaciones' }
              ]}
              activeIndex={activeTab === 'documentos' ? 0 : 1}
              onChange={(idx) => setActiveTab(idx === 0 ? 'documentos' : 'presentaciones')}
            />
          </div>
        </div>
        <Button variant="info" onClick={() => setIsModalOpen(true)} iconName='plus' size='md'>
          Crear {activeTab === 'documentos' ? 'Documento' : 'Presentación'}
        </Button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex justify-center p-12">
          <span className="text-neutral-500 animate-pulse">Cargando...</span>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-container rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm mt-4">
          <CaralIcon
            name={activeTab === 'documentos' ? 'file' : 'screenChart'}
            size={48}

          />
          <h3 className="text-lg text-neutral-900">
            Aún no hay {activeTab === 'documentos' ? 'documentos' : 'presentaciones'}
          </h3>
          <p className="text-sm text-neutral-800 mt-2 text-center max-w-sm">
            Haz clic en el botón superior derecho para crear tu primer {activeTab === 'documentos' ? 'documento' : 'presentación'}.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
          {filteredDocs.map(doc => (
            <div
              key={doc.id}
              className="bg-container border border-neutral-200 dark:border-neutral-800 rounded-lg hover:shadow-md transition-shadow flex flex-col overflow-hidden relative group"
            >
              <div className="p-3 flex justify-between items-center">
                <h3 className="font-medium text-neutral-900 mb-1 line-clamp-2">{doc.title}</h3>
                {/* Dots button */}

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    openDrawer(doc);
                  }}
                  iconName='dots'
                  isIconButton
                  variant='light'
                />
              </div>
              {/* Cover Image */}
              <div
                className="h-40 w-full bg-neutral-100 dark:bg-neutral-800 relative cursor-pointer group/cover"
                onClick={() => router.push(`/documentos/edit/${doc.id}`)}
              >
                <img
                  src={doc.content?.settings?.cover?.selectedCoverImage || doc.content?.metadata?.coverUrl || `https://placehold.co/600x400/e2e8f0/64748b?text=${encodeURIComponent(doc.title)}`}
                  alt={doc.title}
                  className="w-full h-full object-cover"
                />
                {(doc.content?.settings?.cover?.selectedCoverImage || doc.content?.metadata?.coverUrl) && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 flex items-end p-3 transition-opacity">
                    <span className="text-white font-bold text-sm leading-tight line-clamp-2 drop-shadow-md">
                      {doc.title}
                    </span>
                  </div>
                )}

                {/* Overlay for type icon */}
                <div className="absolute top-2 right-2 p-1.5 bg-black/30 backdrop-blur-sm rounded-md text-white">
                  <CaralIcon name={doc.type === 'document' ? 'file' : 'screenChart'} size={18} />
                </div>
              </div>

              {/* Card content */}
              <div className="p-4 flex flex-col flex-1 relative bg-white dark:bg-container">
                <div className="flex justify-between items-start gap-2">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => router.push(`/documentos/edit/${doc.id}`)}
                  >
                    <div className="flex align-end gap-1 mb-2">
                      <span className='mb-0 text-neutral-800 font-semibold'>Creado por:</span>
                      <p className='mb-0 text-neutral-900 font-semibold truncate max-w-[120px]' title={doc.edit_history?.[0]?.user || 'Desconocido'}>
                        {doc.edit_history?.[0]?.user ? doc.edit_history[0].user.split('@')[0] : 'Desconocido'}
                      </p>
                    </div>
                    <p className="text-xs text-neutral-800">
                      Última edición: {new Date(doc.updated_at).toLocaleDateString()}
                    </p>
                  </div>

                  {doc.content?.metadata?.status === 'published' ? (
                    <span className="text-[10px] font-bold px-2 py-1 bg-success-main/90 text-white rounded-full uppercase tracking-wider backdrop-blur-sm">
                      Publicado
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-1 bg-warning-main/90 text-white rounded-full uppercase tracking-wider backdrop-blur-sm">
                      Borrador
                    </span>
                  )}


                </div>

                {/* Attributes */}
                <div className="flex justify-between gap-1 mt-4 text-sm">
                  <div className="w-[30%] text-center">
                    <span className="text-neutral-800">
                      {doc.content?.metadata?.language?.toUpperCase() || 'ES'}
                    </span>
                  </div>
                  <div className="bg-neutral-500 rounded-full h-full w-0.5"></div>
                  <div className="w-[30%] text-center">
                    <span className="text-neutral-800">
                      {doc.content?.settings?.pageSize === 'A4' ? 'A4' : 'Web'}
                    </span>
                  </div>
                  <div className="bg-neutral-500 rounded-full h-full w-0.5"></div>
                  <div className="w-[30%] text-center">
                    <span className={doc.content?.metadata?.restriction === 'internal' ? 'text-danger-main' : 'text-neutral-800'}>
                      {doc.content?.metadata?.restriction === 'internal' ? 'Uso interno' :
                        doc.content?.metadata?.restriction === 'restricted' ? 'Restringido' : 'Público'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-container rounded-xl w-full max-w-md p-6 shadow-xl flex flex-col gap-4 animate-scale-in">
            <h2 className="text-xl font-bold text-neutral-900 font-poppins">
              Nuevo {activeTab === 'documentos' ? 'Documento' : 'Presentación'}
            </h2>
            <p className="text-sm text-neutral-500">
              Ingresa un título para comenzar.
            </p>

            <TextInput
              label="Título"
              placeholder="Ej. Brochure Comercial"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
              }}
              autoFocus
            />

            <div className="flex justify-end gap-2 mt-2">
              <Button variant="ghost" onClick={() => { setIsModalOpen(false); setNewTitle(''); }} disabled={isCreating}>
                Cancelar
              </Button>
              <Button variant="info" onClick={handleCreate} disabled={!newTitle.trim() || isCreating}>
                {isCreating ? 'Creando...' : 'Crear'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedDoc?.title || 'Documento'}
      >
        {selectedDoc && (
          <div className="flex flex-col gap-8">
            {/* Compartir */}
            <div className="bg-neutral-500 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 relative">
              <div className="absolute top-4 right-4 text-neutral-800">
                <CaralIcon name="arrowUp" />
              </div>
              <h3 className="text-base font-bold text-neutral-900 mb-1">Compartir documento</h3>
              <p className="text-xs text-neutral-800 mb-4 max-w-[85%]">
                Recuerda que los documentos pueden tener restricciones de acceso.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="ghost" className="w-full border border-neutral-200 text-sm"
                  iconName={copyStatus === 'link' ? 'check' : 'copy'}
                  onClick={handleCopyLink}
                >
                  {copyStatus === 'link' ? 'Copiado!' : 'Copiar link'}
                </Button>
                <Button variant="info" className="w-full text-sm"
                  iconName={copyStatus === 'insert' ? 'check' : 'link'}
                  onClick={handleCopyInsert}
                >
                  {copyStatus === 'insert' ? 'Copiado!' : 'Insertar'}
                </Button>
              </div>
            </div>

            {/* Historial */}
            <div>
              <h3 className="text-base font-bold text-neutral-900 mb-4">Historial</h3>
              {selectedDoc.edit_history && selectedDoc.edit_history.length > 0 ? (
                <div className="flex flex-col ml-2">
                  {selectedDoc.edit_history.slice().reverse().slice(0, 3).map((hist: any, index: number) => (
                    <Timeline
                      key={index}
                      hideTopLine={index === 0}
                      hideBottomLine={index === Math.min(selectedDoc.edit_history.length, 3) - 1}
                      variant={index === 0 ? 'info' : 'default'}
                    >
                      <div className="flex flex-col mb-4 -mt-2 ml-2 bg-full rounded-lg p-3">
                        <p className="text-[10px] text-neutral-800 mb-1 font-medium">
                          {new Date(hist.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                        <p className="text-xs font-semibold text-neutral-900">
                          {hist.action || 'Editado'} por: <br /><span className="font-normal text-neutral-600">{hist.user}</span>
                        </p>
                      </div>
                    </Timeline>
                  ))}
                  {selectedDoc.edit_history.length > 3 && (
                    <div className="flex justify-center mt-2 relative z-10">
                      <Button variant="ghost" size="sm"
                        iconName='clock'
                      >
                        Ver todo el historial
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-neutral-500">No hay historial disponible.</p>
              )}
            </div>

            {/* Informacion */}
            <div>
              <h3 className="text-base font-bold text-neutral-900 mb-4">Información</h3>
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <span className="text-sm text-neutral-800 w-1/3">Creado Por</span>
                  <span className="text-sm font-semibold text-neutral-900 flex-1 truncate" title={selectedDoc.edit_history?.[0]?.user || 'Desconocido'}>
                    {selectedDoc.edit_history?.[0]?.user || 'Desconocido'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-sm text-neutral-800 w-1/3">Idioma del Documento</span>
                  <span className="text-sm font-semibold text-neutral-900 flex-1">
                    {selectedDoc.content?.metadata?.language === 'en' ? 'Inglés' :
                      selectedDoc.content?.metadata?.language === 'pt' ? 'Portugués' :
                        selectedDoc.content?.metadata?.language === 'de' ? 'Alemán' : 'Español'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-sm text-neutral-800 w-1/3">Restricción</span>
                  <span className="text-sm font-semibold text-neutral-900 flex-1">
                    {selectedDoc.content?.metadata?.restriction === 'internal' ? 'Interno (solo empleados)' :
                      selectedDoc.content?.metadata?.restriction === 'restricted' ? 'Restringido' : 'Público'}
                  </span>
                </div>
                {selectedDoc.content?.metadata?.tags && (
                  <div className="flex gap-2 items-start mt-1">
                    <span className="text-sm text-neutral-800 w-1/3 mt-1">Tags</span>
                    <div className="flex flex-wrap gap-1 flex-1">
                      {selectedDoc.content.metadata.tags.split(',').map((tag: string, i: number) => {
                        const t = tag.trim();
                        if (!t) return null;
                        return (
                          <span key={i} className="text-[10px] px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800">
                            {t}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 mt-1">
                  <span className="text-sm text-neutral-800 w-1/3">Formato</span>
                  <span className="text-sm font-semibold text-neutral-900 flex-1">
                    {selectedDoc.content?.settings?.pageSize === 'A4' ? 'A4' : 'Web'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
