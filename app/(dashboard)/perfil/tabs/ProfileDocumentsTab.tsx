'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button, TextInput } from 'caralstable';
import { CaralIcon } from 'iconcaral2';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/app/context/LanguageContext';
import BookmarkButton from '@/app/components/BookmarkButton';
import Modal from '@/app/components/Modal';

export default function ProfileDocumentsTab({ user }: { user: any }) {
  const { t } = useTranslation();
  const router = useRouter();
  const supabase = createClient();

  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal para crear documento
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('portal_documents')
        .select('id, title, type, updated_at, content, edit_history')
        .order('updated_at', { ascending: false });

      if (!error && data) {
        setDocuments(data);
      }
    } catch (err) {
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setIsCreating(true);

    try {
      const userIdentifier = user.email || user.user_metadata?.full_name || 'Usuario';
      const defaultSettings = {
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
        },
      };

      const { data, error } = await supabase
        .from('portal_documents')
        .insert({
          title: newTitle.trim(),
          type: 'document',
          content: {
            pages: [`# ${newTitle.trim()}\n\nComienza a escribir tu documento aquí...`],
            settings: defaultSettings,
            metadata: {
              tags: '',
              status: 'draft',
              restriction: 'public',
              language: 'es',
              description: '',
            },
          },
          edit_history: [
            {
              date: new Date().toISOString(),
              user: userIdentifier,
              action: 'Creación del documento',
            },
          ],
        })
        .select()
        .single();

      setIsCreating(false);

      if (error) {
        alert('Error al crear documento: ' + error.message);
        return;
      }

      setIsModalOpen(false);
      setNewTitle('');
      router.push(`/documentos/edit/${data.id}`);
    } catch (err: any) {
      alert('Error al crear documento: ' + err.message);
      setIsCreating(false);
    }
  };

  const userEmail = user?.email || '';
  const userId = user?.id || '';
  const userFullName = user?.user_metadata?.full_name || '';

  // Filtra únicamente documentos creados por el usuario
  const myDocs = documents.filter((doc) => {
    const creator = doc.edit_history?.[0]?.user || '';
    if (!creator) return true;
    return (
      (userEmail && creator.includes(userEmail)) ||
      (userId && creator.includes(userId)) ||
      (userFullName && creator.includes(userFullName))
    );
  });

  const filteredDocs = myDocs.filter((doc) => {
    if (search.trim()) {
      const query = search.toLowerCase();
      const matchTitle = doc.title?.toLowerCase().includes(query);
      const matchTags = doc.content?.metadata?.tags?.toLowerCase().includes(query);
      if (!matchTitle && !matchTags) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-poppins text-neutral-900 dark:text-white">
            {t('profile.myDocuments', 'Mis Documentos')}
          </h2>
          <p className="text-sm text-neutral-800 dark:text-neutral-400 mt-1">
            {t('profile.myDocsSubtitle', 'Consulta y gestiona los documentos tipo A4 creados por ti.')}
          </p>
        </div>

        <Button
          variant="info"
          iconName="plus"
          onClick={() => setIsModalOpen(true)}
          isIconButton
        >
          {t('documents.createDocument', 'Crear Documento')}
        </Button>
      </div>

      {/* Search Bar & Document Count */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
          {filteredDocs.length} {filteredDocs.length === 1 ? t('profile.document', 'documento') : t('profile.documents', 'documentos')}
        </span>

        {/* Search Bar */}
        <div className="w-full md:w-80">
          <TextInput
            placeholder={t('profile.searchDocumentsPlaceholder', 'Buscar por título o etiquetas...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs"
          />
        </div>
      </div>

      {/* Grid of Documents */}
      {loading ? (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-12 text-center text-neutral-500">
          {t('common.loading', 'Cargando documentos...')}
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-3">
            <CaralIcon name="file" size={24} />
          </div>
          <h3 className="font-poppins font-semibold text-neutral-800 dark:text-neutral-200 text-base">
            {t('profile.noDocumentsFound', 'No se encontraron documentos')}
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mt-1 mb-4">
            {search.trim()
              ? t('profile.noDocumentsFound', 'No hay documentos que coincidan con tu búsqueda.')
              : t('profile.noDocumentsSubtitle', 'Aún no has creado ningún documento tipo A4. ¡Comienza creando el primero!')}
          </p>
          <Button variant="light" onClick={() => setIsModalOpen(true)} className="rounded-xl">
            {t('profile.createDocument', 'Crear documento')}
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {filteredDocs.map((doc) => {
            const coverImg =
              doc.content?.settings?.cover?.selectedCoverImage ||
              doc.content?.metadata?.coverUrl ||
              `https://placehold.co/600x400/e2e8f0/64748b?text=${encodeURIComponent(doc.title)}`;

            return (
              <div
                key={doc.id}
                className="group relative flex flex-col rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-full/50 overflow-hidden shadow-xs hover:shadow-md hover:border-blue-500/40 transition-all duration-200"
              >
                {/* Cover Preview Image */}
                <div
                  onClick={() => router.push(`/documentos/edit/${doc.id}`)}
                  className="h-36 relative bg-neutral-100 dark:bg-neutral-800 overflow-hidden cursor-pointer"
                >
                  <img
                    src={coverImg}
                    alt={doc.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Bookmark Overlay Button */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <BookmarkButton
                      url={`/documentos/edit/${doc.id}`}
                      title={doc.title}
                      category="Documentos A4"
                      size={15}
                      className="p-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-lg text-white shadow-xs"
                    />
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-2.5 right-2.5">
                    {doc.content?.metadata?.status === 'published' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-600/90 text-white rounded-md uppercase tracking-wider backdrop-blur-sm">
                        Publicado
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/90 text-white rounded-md uppercase tracking-wider backdrop-blur-sm">
                        Borrador
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1 justify-between">
                  <div>
                    <h3
                      onClick={() => router.push(`/documentos/edit/${doc.id}`)}
                      className="font-poppins font-semibold text-sm text-neutral-900 line-clamp-2 hover:text-blue-600 cursor-pointer transition-colors"
                    >
                      {doc.title}
                    </h3>

                    <p className="text-[11px] text-neutral-800  mt-1">
                      Última edición: {new Date(doc.updated_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="flex items-center gap-2 pt-3 mt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <Button
                      size="sm"
                      onClick={() => router.push(`/documentos/edit/${doc.id}`)}
                      className="flex-1 text-xs rounded-lg"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="info"
                      hasBorder
                      size="sm"
                      onClick={() => router.push(`/d/${doc.id}`)}
                      title="Ver documento público"
                    >
                      <CaralIcon name="eye" size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear Documento */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Crear Nuevo Documento A4"
        >
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                Título del documento
              </label>
              <TextInput
                placeholder="Ej: Propuesta Comercial Q3"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button variant="info" onClick={handleCreate} isLoading={isCreating}>
                Crear y Editar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
