import React, { useState, useEffect } from 'react';
import { Button } from 'caralstable';
import { MilkdownEditorWrapper } from '@/app/components/Editor/MilkdownEditor';
import RoadmapEditor from '@/app/components/Editor/RoadmapEditor';
import BattlecardEditor from '@/app/components/Editor/BattlecardEditor';
import IconPickerModal from '@/app/components/IconPickerModal';
import { CaralIcon, Brand } from 'iconcaral2';

interface ContentEditorProps {
  isOpen: boolean;
  docToEdit: any | null;
  productId?: string;
  defaultDocType?: 'document' | 'section' | 'roadmap' | 'battlecard';
  availableRoles?: any[];
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
}

export default function ContentEditor({ isOpen, docToEdit, productId, defaultDocType = 'document', availableRoles = [], onClose, onSave }: ContentEditorProps) {
  const [docTitle, setDocTitle] = useState('');
  const [docSlug, setDocSlug] = useState('');
  const [docSection, setDocSection] = useState('General');
  const [docOrderIndex, setDocOrderIndex] = useState(0);
  const [docContent, setDocContent] = useState('');
  const [docStatus, setDocStatus] = useState('published');
  const [docIconName, setDocIconName] = useState('');
  const [docUseBrand, setDocUseBrand] = useState(false);
  const [docHideToc, setDocHideToc] = useState(false);
  const [docDescription, setDocDescription] = useState('');
  const [docType, setDocType] = useState<'document' | 'section' | 'roadmap' | 'release_note' | 'battlecard'>('document');
  const [docAllowedRoles, setDocAllowedRoles] = useState<string[]>([]);

  // Release Note specific state
  const [docBaseUrl, setDocBaseUrl] = useState('');
  const [imgFolder, setImgFolder] = useState('');
  const [saving, setSaving] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [editorKey, setEditorKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (docToEdit) {
        setDocTitle(docToEdit.title || '');
        setDocSlug(docToEdit.slug || '');
        setDocSection(docToEdit.section || 'General');
        setDocOrderIndex(docToEdit.order_index || 0);
        setDocContent(docToEdit.content || '');
        setDocStatus(docToEdit.status || 'published');
        setDocIconName(docToEdit.icon_name || '');
        setDocUseBrand(docToEdit.use_brand || false);
        setDocHideToc(docToEdit.hide_toc || false);
        setDocType(docToEdit.type || defaultDocType);
        setDocAllowedRoles(docToEdit.allowed_roles || []);
        setEditorKey(docToEdit.id);

        if (docToEdit.type === 'release_note') {
          try {
            const parsed = JSON.parse(docToEdit.description || '{}');
            setDocBaseUrl(parsed.docBaseUrl || '');
            setImgFolder(parsed.imgFolder || '');
            setDocDescription('');
          } catch {
            // fallback
            setDocBaseUrl('');
            setImgFolder(docToEdit.description || '');
            setDocDescription('');
          }
        } else {
          setDocDescription(docToEdit.description || '');
        }
      } else {
        setDocTitle('');
        setDocSlug('');
        setDocSection('General');
        setDocOrderIndex(0);
        setDocContent('');
        setDocStatus('published');
        setDocIconName('');
        setDocUseBrand(false);
        setDocHideToc(false);
        setDocDescription('');
        setDocBaseUrl('');
        setImgFolder('');
        setDocType(defaultDocType);
        setEditorKey('new-' + Date.now());
      }
    }
  }, [isOpen, docToEdit, defaultDocType]);

  const generateSlug = (text: string) => {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setDocTitle(newTitle);
    if (!docToEdit?.id) {
      setDocSlug(generateSlug(newTitle));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ignore rogue form submissions caused by third-party buttons without type="button" (like Tabs)
    const submitter = (e.nativeEvent as any).submitter;
    if (submitter && submitter.getAttribute('data-submit') !== 'true') {
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: docTitle,
        slug: docSlug,
        section: docSection,
        order_index: Number(docOrderIndex),
        content: docType === 'section' ? '' : docContent,
        status: docStatus,
        icon_name: docIconName,
        use_brand: docUseBrand,
        hide_toc: docHideToc,
        description: docType === 'release_note' ? JSON.stringify({ docBaseUrl, imgFolder }) : docDescription,
        type: docType,
        allowed_roles: docAllowedRoles
      };
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-full border-l border-neutral-200 dark:border-neutral-800 animate-in slide-in-from-right-4 duration-300 fade-in">
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-container shrink-0">
        <h2 className="text-xl font-semibold">
          {docToEdit ? 'Editar ' : 'Nueva '}
          {docType === 'section' ? 'Sección' : docType === 'roadmap' ? 'Roadmap' : docType === 'battlecard' ? 'Battlecard' : docType === 'release_note' ? 'Release Note' : 'Documento'}
        </h2>
        <Button type="button" variant="ghost" onClick={onClose}>Cerrar</Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-full relative">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-5xl mx-auto w-full pb-6">
          {/* Hidden submit button ensures Enter key triggers a valid save */}
          <input type="submit" data-submit="true" style={{ display: 'none' }} />

          {/* Fila 1: Título y Slug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Título {docType === 'section' ? 'de la Sección' : 'del Documento'}</label>
              <input
                required
                value={docTitle}
                onChange={handleTitleChange}
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit"
                placeholder={docType === 'section' ? 'Ej: Introducción' : 'Ej: Guía de Inicio Rápido'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug (URL amigable)</label>
              <input
                required
                value={docSlug}
                onChange={(e) => setDocSlug(e.target.value)}
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit font-mono text-sm"
                placeholder={docType === 'section' ? 'ej: introduccion' : 'ej: guia-de-inicio-rapido'}
              />
            </div>
          </div>

          {/* Fila 2: Sección y Orden */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-neutral-50 dark:bg-neutral-950 p-4 rounded-lg border border-neutral-100 dark:border-neutral-800">
            <div>
              <label className="block text-sm font-medium mb-1">Pertenece a la Sección (Opcional)</label>
              <input
                value={docSection}
                onChange={(e) => setDocSection(e.target.value)}
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit text-sm text-neutral-500"
                placeholder="ID de la sección padre"
                readOnly
                title="Para cambiar la sección, usa arrastrar y soltar (próximamente) o créalo desde la columna deseada."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Orden (#)</label>
              <input
                type="number"
                required
                value={docOrderIndex}
                onChange={(e) => setDocOrderIndex(Number(e.target.value))}
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit text-sm"
              />
            </div>
          </div>

          {/* Fila 3: Icono y SEO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/50">
            <div>
              <label className="block text-sm font-medium mb-1">Icono</label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center shrink-0">
                  {docIconName ? (
                    docUseBrand ? (
                      <Brand name={docIconName as any} size={24} />
                    ) : (
                      <CaralIcon name={docIconName as any} size={24} className="text-blue-600 dark:text-blue-400" />
                    )
                  ) : (
                    <CaralIcon name="image" size={24} className="text-neutral-400" />
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsIconPickerOpen(true)}
                  className="w-full justify-start text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  {docIconName ? 'Cambiar Ícono...' : 'Seleccionar Ícono...'}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {docType === 'release_note' ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">URL Base</label>
                    <input
                      type="text"
                      value={docBaseUrl}
                      onChange={(e) => setDocBaseUrl(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit text-sm"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Carpeta</label>
                    <input
                      type="text"
                      value={imgFolder}
                      onChange={(e) => setImgFolder(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit text-sm"
                      placeholder="/img/..."
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Descripción (SEO)</label>
                  <textarea
                    value={docDescription}
                    onChange={(e) => setDocDescription(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit text-sm resize-y"
                    placeholder="Breve descripción..."
                    rows={2}
                  />
                </div>
              )}
              <label className="flex items-center gap-2 text-sm cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={docHideToc}
                  onChange={(e) => setDocHideToc(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                Ocultar la Tabla de Contenidos
              </label>
            </div>
          </div>

          {/* Fila 4: Status and Roles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <select
                value={docStatus}
                onChange={(e) => setDocStatus(e.target.value)}
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit text-sm"
              >
                <option value="published">Publicado</option>
                <option value="draft">Borrador</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Roles Permitidos (Visibilidad)</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {availableRoles.map(role => {
                  const isAllowed = docAllowedRoles.includes(role.name);
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => {
                        if (isAllowed) {
                          setDocAllowedRoles(prev => prev.filter(r => r !== role.name));
                        } else {
                          setDocAllowedRoles(prev => [...prev, role.name]);
                        }
                      }}
                      className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${isAllowed
                          ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                          : 'bg-neutral-100 text-neutral-500 border-transparent hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
                        }`}
                    >
                      {role.name}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                {docAllowedRoles.length === 0 ? "Visible para TODOS los usuarios logueados." : "Solo visible para los roles seleccionados."}
              </p>
            </div>
          </div>

          {/* Editor Milkdown (Solo para Documentos) */}
          {docType === 'document' && (
            <div className="mt-4 flex-1 flex flex-col min-h-[400px]">
              <h2 className="text-xl font-poppins font-semibold mb-4 text-blue-600 dark:text-blue-400">
                Contenido
              </h2>
              <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
                <MilkdownEditorWrapper
                  key={editorKey}
                  content={docContent}
                  onChange={(markdown) => setDocContent(markdown)}
                />
              </div>
            </div>
          )}

          {/* Editor Roadmap (Solo para Roadmaps) */}
          {docType === 'roadmap' && (
            <div className="mt-4 flex-1 flex flex-col min-h-[400px]">
              <h2 className="text-xl font-poppins font-semibold mb-4 text-blue-600 dark:text-blue-400">
                Roadmap Builder
              </h2>
              <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
                <RoadmapEditor
                  key={editorKey}
                  content={docContent}
                  onChange={(jsonString) => setDocContent(jsonString)}
                />
              </div>
            </div>
          )}

          {/* Editor Battlecard (Solo para Battlecards) */}
          {docType === 'battlecard' && (
            <div className="mt-4 flex-1 flex flex-col min-h-[400px]">
              <h2 className="text-xl font-poppins font-semibold mb-4 text-blue-600 dark:text-blue-400">
                Battlecard Builder
              </h2>
              <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
                <BattlecardEditor
                  key={editorKey}
                  content={docContent}
                  productId={productId}
                  onChange={(jsonString) => setDocContent(jsonString)}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 items-center mt-6 sticky bottom-0 bg-full border-t border-neutral-200 dark:border-neutral-800 pt-4 pb-2 z-10">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button type="submit" data-submit="true" variant="info" disabled={saving}>
              {saving ? 'Guardando...' : (docToEdit ? 'Actualizar Documento' : 'Guardar y Publicar')}
            </Button>
          </div>
        </form>
      </div>

      <IconPickerModal
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        initialIconName={docIconName}
        initialIsBrand={docUseBrand}
        onSelect={(iconName, isBrand) => {
          setDocIconName(iconName);
          setDocUseBrand(isBrand);
        }}
      />
    </div>
  );
}
