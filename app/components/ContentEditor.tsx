import React, { useState, useEffect } from 'react';
import { Button } from 'caralstable';
import { MilkdownEditorWrapper } from '@/app/components/Editor/MilkdownEditor';
import RoadmapEditor from '@/app/components/Editor/RoadmapEditor';
import BattlecardEditor from '@/app/components/Editor/BattlecardEditor';
import IconPickerModal from '@/app/components/IconPickerModal';
import { CaralIcon, Brand } from 'iconcaral2';
import { useTranslation } from '@/app/context/LanguageContext';
import { parseMultilingualContent, composeMultilingualContent, extractLanguageContent } from '@/utils/multilingual-content';
import { createClient } from '@/utils/supabase/client';
import Modal from '@/app/components/Modal';

interface ContentEditorProps {
  isOpen: boolean;
  docToEdit: any | null;
  productId?: string;
  defaultDocType?: 'document' | 'section' | 'roadmap' | 'battlecard';
  availableRoles?: any[];
  allDocs?: any[];
  currentModuleId?: string | null;
  initialExpanded?: boolean;
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
  onMoved?: () => void;
}

export default function ContentEditor({
  isOpen,
  docToEdit,
  productId,
  defaultDocType = 'document',
  availableRoles = [],
  allDocs = [],
  currentModuleId,
  initialExpanded = false,
  onClose,
  onSave,
  onMoved
}: ContentEditorProps) {
  const { t } = useTranslation();
  const [docTitleEs, setDocTitleEs] = useState('');
  const [docTitleEn, setDocTitleEn] = useState('');
  const [docSidenameEs, setDocSidenameEs] = useState('');
  const [docSidenameEn, setDocSidenameEn] = useState('');
  const [docSlug, setDocSlug] = useState('');
  const [docSection, setDocSection] = useState('General');
  const [docOrderIndex, setDocOrderIndex] = useState(0);
  const [docContent, setDocContent] = useState('');
  const [contentEs, setContentEs] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [activeLang, setActiveLang] = useState<'es' | 'en'>('es');
  const [docStatus, setDocStatus] = useState('published');
  const [docIconName, setDocIconName] = useState('');
  const [docUseBrand, setDocUseBrand] = useState(false);
  const [docHideToc, setDocHideToc] = useState(false);
  const [docDescriptionEs, setDocDescriptionEs] = useState('');
  const [docDescriptionEn, setDocDescriptionEn] = useState('');
  const [docType, setDocType] = useState<'document' | 'section' | 'roadmap' | 'release_note' | 'battlecard'>('document');
  const [docAllowedRoles, setDocAllowedRoles] = useState<string[]>([]);

  // Expand / Fullscreen state
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [showGutenbergSidebar, setShowGutenbergSidebar] = useState(true);

  useEffect(() => {
    if (initialExpanded) {
      setIsExpanded(true);
    }
  }, [initialExpanded]);

  // Move document modal state
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [selectedMoveTarget, setSelectedMoveTarget] = useState<string>('General');
  const [moveSearch, setMoveSearch] = useState('');
  const [isMoving, setIsMoving] = useState(false);

  // Release Note specific state
  const [docBaseUrl, setDocBaseUrl] = useState('');
  const [imgFolder, setImgFolder] = useState('');
  const [saving, setSaving] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [editorKey, setEditorKey] = useState('');

  // Handle Escape key to exit fullscreen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded && !isMoveModalOpen && !isIconPickerOpen) {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, isMoveModalOpen, isIconPickerOpen]);

  const getCurrentSectionName = (secId: string) => {
    if (!secId || secId === 'General') return t('content.rootLocation', 'Raíz del módulo');
    const sec = (allDocs || []).find(d => d.id === secId);
    if (sec) {
      return extractLanguageContent(sec.sidename, activeLang) || extractLanguageContent(sec.title, activeLang);
    }
    return secId;
  };

  const availableSections = (allDocs || []).filter(
    d => d.type === 'section' &&
      (!currentModuleId || d.module_id === currentModuleId) &&
      d.id !== docToEdit?.id
  );

  const filteredSections = availableSections.filter(sec => {
    if (!moveSearch.trim()) return true;
    const title = (extractLanguageContent(sec.sidename, activeLang) || extractLanguageContent(sec.title, activeLang) || '').toLowerCase();
    return title.includes(moveSearch.toLowerCase());
  });

  const handleOpenMoveModal = () => {
    setSelectedMoveTarget(docSection || 'General');
    setMoveSearch('');
    setIsMoveModalOpen(true);
  };

  const handleConfirmMove = async () => {
    try {
      setIsMoving(true);
      const targetSec = selectedMoveTarget === 'General' ? 'General' : (selectedMoveTarget || 'General');
      setDocSection(targetSec);

      if (docToEdit?.id) {
        const dbSecValue = targetSec === 'General' ? null : targetSec;
        const supabase = createClient();
        const { error } = await supabase
          .from('documentation')
          .update({ section: dbSecValue })
          .eq('id', docToEdit.id);

        if (error) throw error;
        if (onMoved) onMoved();
      }

      setIsMoveModalOpen(false);
    } catch (err: any) {
      alert("Error al mover: " + err.message);
    } finally {
      setIsMoving(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (docToEdit) {
        const parsedTitle = parseMultilingualContent(docToEdit.title || '');
        setDocTitleEs(parsedTitle.es);
        setDocTitleEn(parsedTitle.en);

        const parsedSidename = parseMultilingualContent(docToEdit.sidename || '');
        setDocSidenameEs(parsedSidename.es);
        setDocSidenameEn(parsedSidename.en);

        setDocSlug(docToEdit.slug || '');
        setDocSection(docToEdit.section || 'General');
        setDocOrderIndex(docToEdit.order_index || 0);
        setDocContent(docToEdit.content || '');

        // Parse multilingual content for documents
        const parsedMulti = parseMultilingualContent(docToEdit.content || '');
        setContentEs(parsedMulti.es);
        setContentEn(parsedMulti.en);
        setActiveLang('es');

        setDocStatus(docToEdit.status || 'published');
        setDocIconName(docToEdit.icon_name || '');
        setDocUseBrand(docToEdit.use_brand || false);
        setDocHideToc(docToEdit.hide_toc || false);
        setDocType(docToEdit.type || defaultDocType);
        setDocAllowedRoles(docToEdit.allowed_roles || []);
        setEditorKey(docToEdit.id || ('doc-' + Date.now()));

        if (docToEdit.type === 'release_note') {
          try {
            const parsed = JSON.parse(docToEdit.description || '{}');
            setDocBaseUrl(parsed.docBaseUrl || '');
            setImgFolder(parsed.imgFolder || '');
            setDocDescriptionEs('');
            setDocDescriptionEn('');
          } catch {
            // fallback
            setDocBaseUrl('');
            setImgFolder(docToEdit.description || '');
            setDocDescriptionEs('');
            setDocDescriptionEn('');
          }
        } else {
          const parsedDesc = parseMultilingualContent(docToEdit.description || '');
          setDocDescriptionEs(parsedDesc.es);
          setDocDescriptionEn(parsedDesc.en);
        }
      } else {
        setDocTitleEs('');
        setDocTitleEn('');
        setDocSidenameEs('');
        setDocSidenameEn('');
        setDocSlug('');
        setDocSection('General');
        setDocOrderIndex(0);
        setDocContent('');
        setContentEs('');
        setContentEn('');
        setActiveLang('es');
        setDocStatus('published');
        setDocIconName('');
        setDocUseBrand(false);
        setDocHideToc(false);
        setDocDescriptionEs('');
        setDocDescriptionEn('');
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

  const handleTitleChange = (newTitle: string) => {
    if (activeLang === 'es') {
      setDocTitleEs(newTitle);
      if (!docToEdit?.id) {
        setDocSlug(generateSlug(newTitle));
      }
    } else {
      setDocTitleEn(newTitle);
      if (!docToEdit?.id && !docTitleEs) {
        setDocSlug(generateSlug(newTitle));
      }
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
      let finalContent = '';
      if (docType === 'document') {
        finalContent = composeMultilingualContent({ es: contentEs, en: contentEn });
      } else if (docType === 'section') {
        finalContent = '';
      } else {
        finalContent = docContent;
      }

      const finalTitle = composeMultilingualContent({ es: docTitleEs, en: docTitleEn });
      const finalSidename = (docSidenameEs || docSidenameEn)
        ? composeMultilingualContent({ es: docSidenameEs, en: docSidenameEn })
        : null;
      const finalDescription = docType === 'release_note'
        ? JSON.stringify({ docBaseUrl, imgFolder })
        : composeMultilingualContent({ es: docDescriptionEs, en: docDescriptionEn });

      const payload = {
        title: finalTitle,
        sidename: finalSidename,
        slug: docSlug,
        section: docSection,
        order_index: Number(docOrderIndex),
        content: finalContent,
        status: docStatus,
        icon_name: docIconName,
        use_brand: docUseBrand,
        hide_toc: docHideToc,
        description: finalDescription,
        type: docType,
        allowed_roles: docAllowedRoles
      };
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  const getDocTypeLabel = () => {
    switch (docType) {
      case 'section': return t('content.typeSection', 'Sección');
      case 'roadmap': return t('content.typeRoadmap', 'Roadmap');
      case 'battlecard': return t('content.typeBattlecard', 'Battlecard');
      case 'release_note': return t('content.typeReleaseNote', 'Release Note');
      default: return t('content.typeDocument', 'Documento');
    }
  };

  if (!isOpen) return null;

  // --- GUTENBERG EXPANDED VIEW ---
  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col w-screen h-screen bg-full animate-in fade-in duration-200">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          <input type="submit" data-submit="true" style={{ display: 'none' }} />

          {/* Top Bar (Gutenberg Header) */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-container shrink-0 z-20">
            {/* Left side */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                title={t('content.collapseEditor', 'Restaurar tamaño')}
              >
                <CaralIcon name="chevronLeft" size={18} />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-neutral-800">
                  {docToEdit
                    ? `${t('content.editDocPrefix', 'Editar ')}${getDocTypeLabel()}`
                    : `${docType === 'section' ? t('content.newDocPrefix', 'Nueva ') : t('content.newDocPrefixMasc', 'Nuevo ')}${getDocTypeLabel()}`
                  }
                </span>
                {docSection && docSection !== 'General' && (
                  <span
                    className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700"
                    title={getCurrentSectionName(docSection)}
                  >
                    <CaralIcon name="folder" size={12} />
                    <span className="truncate max-w-[160px]">{getCurrentSectionName(docSection)}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language switcher quick tabs */}
              <div className="flex items-center gap-1 bg-neutral-200 dark:bg-neutral-800 p-1 rounded-lg border border-neutral-300 dark:border-neutral-700">
                <button
                  type="button"
                  onClick={() => setActiveLang('es')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${activeLang === 'es' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                    }`}
                >
                  <span>ES 🇪🇸</span>
                  {(docTitleEs.trim().length > 0 || contentEs.trim().length > 0) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLang('en')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${activeLang === 'en' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                    }`}
                >
                  <span>EN 🇬🇧</span>
                  {(docTitleEn.trim().length > 0 || contentEn.trim().length > 0) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  )}
                </button>
              </div>

              {/* Move to section button */}
              <button
                type="button"
                onClick={handleOpenMoveModal}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-info-main hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-all cursor-pointer"
                title={t('content.moveDocTooltip', 'Mover documento a otra sección o subsección')}
              >
                <CaralIcon name="folder" size={14} />
                <span>{t('content.moveToSection', 'Mover a subsección')}</span>
              </button>

              {/* Toggle Gutenberg Inspector button (Gear) */}
              <button
                type="button"
                onClick={() => setShowGutenbergSidebar(!showGutenbergSidebar)}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${showGutenbergSidebar
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                title={t('content.toggleSidebar', 'Ajustes del Documento')}
              >
                <CaralIcon name="gear" size={16} />
              </button>

              {/* Cancel Button */}
              <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
                {t('content.cancel', 'Cancelar')}
              </Button>

              {/* Publish / Update Button */}
              <Button
                type="submit"
                data-submit="true"
                variant="info"
                disabled={saving}
                className="text-xs"
              >
                {saving ? t('content.saving', 'Guardando...') : (docToEdit ? t('content.updateDoc', 'Actualizar Documento') : t('content.saveAndPublish', 'Guardar y Publicar'))}
              </Button>

              {/* Collapse to normal size */}
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
                title={t('content.collapseEditor', 'Restaurar tamaño normal')}
              >
                <CaralIcon name="arrowsMinimize" size={16} />
              </button>
            </div>
          </div>

          {/* Main Body: Canvas on Left/Center + Settings Sidebar on Right */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Center / Left Writing Canvas */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-full">
              <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
                {/* Large Gutenberg Title Header */}
                <div className="pb-4 border-b border-neutral-200 dark:border-neutral-800">
                  <input
                    required
                    type="text"
                    value={activeLang === 'es' ? docTitleEs : docTitleEn}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full bg-transparent border-none outline-none font-poppins font-bold text-3xl md:text-4xl text-neutral-900 dark:text-white placeholder-neutral-400"
                    placeholder={docType === 'section' ? t('content.placeholderSection', 'Título de la Sección') : t('content.placeholderDoc', 'Título del Documento')}
                  />
                  <div className="flex items-center gap-2 mt-2 text-xs text-neutral-400">
                    <span className="font-semibold text-neutral-600 dark:text-neutral-400">
                      {activeLang === 'es' ? '🇪🇸 Español' : '🇬🇧 English'}
                    </span>
                    <span>•</span>
                    <span className="font-mono">/{docSlug || 'slug'}</span>
                    {docSidenameEs && activeLang === 'es' && (
                      <>
                        <span>•</span>
                        <span>Sidebar: <i>{docSidenameEs}</i></span>
                      </>
                    )}
                    {docSidenameEn && activeLang === 'en' && (
                      <>
                        <span>•</span>
                        <span>Sidebar: <i>{docSidenameEn}</i></span>
                      </>
                    )}
                  </div>
                </div>

                {/* Editor Milkdown */}
                {docType === 'document' && (
                  <div className="flex-1 flex flex-col min-h-[550px]">
                    <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs">
                      <MilkdownEditorWrapper
                        key={`${editorKey}-${activeLang}`}
                        content={activeLang === 'es' ? contentEs : contentEn}
                        onChange={(markdown) => {
                          if (activeLang === 'es') {
                            setContentEs(markdown);
                          } else {
                            setContentEn(markdown);
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Editor Roadmap */}
                {docType === 'roadmap' && (
                  <div className="flex-1 flex flex-col min-h-[550px]">
                    <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs">
                      <RoadmapEditor
                        key={editorKey}
                        content={docContent}
                        onChange={(jsonString) => setDocContent(jsonString)}
                      />
                    </div>
                  </div>
                )}

                {/* Editor Battlecard */}
                {docType === 'battlecard' && (
                  <div className="flex-1 flex flex-col min-h-[550px]">
                    <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs">
                      <BattlecardEditor
                        key={editorKey}
                        content={docContent}
                        productId={productId}
                        onChange={(jsonString) => setDocContent(jsonString)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Inspector Sidebar (Gutenberg Settings Panel) */}
            {showGutenbergSidebar && (
              <div className="w-80 sm:w-96 shrink-0 border-l border-neutral-200 dark:border-neutral-800 bg-container overflow-y-auto p-5 flex flex-col gap-6 animate-in slide-in-from-right-4 duration-200 shadow-lg">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                    {t('content.docSettings', 'Ajustes del Documento')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowGutenbergSidebar(false)}
                    className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    title={t('content.close', 'Cerrar panel')}
                  >
                    <CaralIcon name="close" size={14} />
                  </button>
                </div>

                {/* Bloque 1: Idioma de Edición */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {t('common.language', 'Idioma de Edición')}
                  </label>
                  <div className="flex items-center gap-1.5 bg-neutral-200 dark:bg-neutral-800 p-1 rounded-lg border border-neutral-300 dark:border-neutral-700">
                    <button
                      type="button"
                      onClick={() => setActiveLang('es')}
                      className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${activeLang === 'es' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                        }`}
                    >
                      <span>🇪🇸 Español</span>
                      {(docTitleEs.trim().length > 0 || contentEs.trim().length > 0) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveLang('en')}
                      className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${activeLang === 'en' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                        }`}
                    >
                      <span>🇬🇧 English</span>
                      {(docTitleEn.trim().length > 0 || contentEn.trim().length > 0) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Bloque 2: Enlace & Sidebar */}
                <div className="flex flex-col gap-3 p-3.5 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <CaralIcon name="link" size={14} className="text-blue-500" />
                    {t('content.permalinkSection', 'Enlace y Barra Lateral')}
                  </span>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      {t('content.sidenameLabel', 'Nombre en Sidebar (Opcional)')} ({activeLang === 'es' ? 'ES 🇪🇸' : 'EN 🇬🇧'})
                    </label>
                    <input
                      value={activeLang === 'es' ? docSidenameEs : docSidenameEn}
                      onChange={(e) => activeLang === 'es' ? setDocSidenameEs(e.target.value) : setDocSidenameEn(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-2.5 py-1.5 bg-white dark:bg-neutral-900 text-xs"
                      placeholder={t('content.sidenamePlaceholder', 'Ej: Inicio Rápido')}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      {t('content.slugLabel', 'Slug (URL amigable)')}
                    </label>
                    <input
                      required
                      value={docSlug}
                      onChange={(e) => setDocSlug(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-2.5 py-1.5 bg-white dark:bg-neutral-900 font-mono text-xs"
                      placeholder={docType === 'section' ? t('content.placeholderSlugSection', 'ej: introduccion') : t('content.placeholderSlugDoc', 'ej: guia-de-inicio-rapido')}
                    />
                  </div>

                  {/* Ubicación / Mover */}
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-xs text-neutral-800">{t('content.currentLocation', 'Ubicación:')}</span>
                    <button
                      type="button"
                      onClick={handleOpenMoveModal}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <CaralIcon name="folder" size={12} />
                      <span className="truncate max-w-[130px]">{getCurrentSectionName(docSection)}</span>
                    </button>
                  </div>
                </div>

                {/* Bloque 3: Apariencia & ToC */}
                <div className="flex flex-col gap-3 p-3.5 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <CaralIcon name="image" size={14} className="text-purple-500" />
                    {t('content.appearanceSection', 'Apariencia y Visualización')}
                  </span>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">{t('content.iconLabel', 'Icono')}</label>
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center shrink-0">
                        {docIconName ? (
                          docUseBrand ? (
                            <Brand name={docIconName as any} size={18} />
                          ) : (
                            <CaralIcon name={docIconName as any} size={18} className="text-blue-600 dark:text-blue-400" />
                          )
                        ) : (
                          <CaralIcon name="image" size={18} className="text-neutral-400" />
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsIconPickerOpen(true)}
                        className="flex-1 justify-start text-xs text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 py-1.5"
                      >
                        {docIconName ? t('content.changeIcon', 'Cambiar...') : t('content.selectIcon', 'Seleccionar...')}
                      </Button>
                      {docIconName && (
                        <button
                          type="button"
                          onClick={() => {
                            setDocIconName('');
                            setDocUseBrand(false);
                          }}
                          className="text-red-500 hover:text-red-700 p-1.5 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                          title={t('content.removeIcon', 'Eliminar ícono')}
                        >
                          <CaralIcon name="trash" size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={docHideToc}
                      onChange={(e) => setDocHideToc(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    {t('content.hideToc', 'Ocultar la Tabla de Contenidos')}
                  </label>
                </div>

                {/* Bloque 4: Estado y Visibilidad */}
                <div className="flex flex-col gap-3 p-3.5 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <CaralIcon name="shield" size={14} className="text-emerald-500" />
                    {t('content.visibilitySection', 'Estado y Visibilidad')}
                  </span>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">{t('content.status', 'Estado')}</label>
                    <select
                      value={docStatus}
                      onChange={(e) => setDocStatus(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-2.5 py-1.5 bg-white dark:bg-neutral-900 text-xs"
                    >
                      <option value="published">{t('content.statusPublished', 'Publicado')}</option>
                      <option value="draft">{t('content.statusDraft', 'Borrador')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">{t('content.allowedRoles', 'Roles Permitidos')}</label>
                    <div className="flex flex-wrap gap-1.5">
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
                            className={`px-3 py-1 text-sm rounded-full border transition-colors cursor-pointer ${isAllowed
                              ? 'bg-info-light text-info-hard border-main-hard'
                              : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100'
                              }`}
                          >
                            {role.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bloque 5: SEO / Descripción */}
                <div className="flex flex-col gap-2 p-3.5 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <CaralIcon name="file" size={14} className="text-amber-500" />
                    {t('content.seoDesc', 'Descripción (SEO)')} ({activeLang === 'es' ? 'ES 🇪🇸' : 'EN 🇬🇧'})
                  </span>
                  <textarea
                    value={activeLang === 'es' ? docDescriptionEs : docDescriptionEn}
                    onChange={(e) => activeLang === 'es' ? setDocDescriptionEs(e.target.value) : setDocDescriptionEn(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-2.5 py-1.5 bg-white dark:bg-neutral-900 text-xs resize-y"
                    placeholder={t('content.seoDescPlaceholder', 'Breve descripción...')}
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>
        </form>

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

        {/* Modal para Mover a otra Subsección */}
        {isMoveModalOpen && (
          <Modal
            isOpen={isMoveModalOpen}
            onClose={() => setIsMoveModalOpen(false)}
            title={t('content.moveDocTitle', 'Mover documento a otra sección')}
            width="md"
          >
            <div className="flex flex-col gap-4">
              <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-between text-xs">
                <span className="text-neutral-800 font-medium">{t('content.currentLocation', 'Ubicación actual:')}</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <CaralIcon name="folder" size={14} className="text-blue-500" />
                  {getCurrentSectionName(docSection)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                  {t('content.selectDestinationSection', 'Selecciona la sección de destino:')}
                </label>

                {availableSections.length > 3 && (
                  <div className="relative mb-2">
                    <input
                      type="text"
                      value={moveSearch}
                      onChange={(e) => setMoveSearch(e.target.value)}
                      placeholder={t('content.searchSection', 'Buscar sección...')}
                      className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 pl-8 bg-inherit text-xs"
                    />
                    <div className="absolute left-2.5 top-2 text-neutral-400 pointer-events-none">
                      <CaralIcon name="search" size={12} />
                    </div>
                  </div>
                )}

                <div className="max-h-60 overflow-y-auto flex flex-col gap-1 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 bg-neutral-50/50 dark:bg-neutral-900/50">
                  <button
                    type="button"
                    onClick={() => setSelectedMoveTarget('General')}
                    className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${(selectedMoveTarget === 'General' || !selectedMoveTarget)
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <CaralIcon name="folder" size={14} className={(selectedMoveTarget === 'General' || !selectedMoveTarget) ? 'text-white' : 'text-neutral-800'} />
                      <span>{t('content.rootLocation', 'Raíz del módulo (Sin sección)')}</span>
                    </div>
                    {(selectedMoveTarget === 'General' || !selectedMoveTarget) && (
                      <CaralIcon name="check" size={14} />
                    )}
                  </button>

                  {filteredSections.map(sec => {
                    const isSelected = selectedMoveTarget === sec.id;
                    const secTitle = extractLanguageContent(sec.sidename, activeLang) || extractLanguageContent(sec.title, activeLang);
                    const isParentSection = !sec.section || sec.section === 'General';
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => setSelectedMoveTarget(sec.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${!isParentSection ? 'pl-6' : ''
                          } ${isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <CaralIcon name="folder" size={14} className={isSelected ? 'text-white' : 'text-blue-500'} />
                          <span className="truncate">{secTitle}</span>
                          {!isParentSection && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${isSelected ? 'bg-blue-700 text-blue-100' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-800'}`}>
                              Sub-sección
                            </span>
                          )}
                        </div>
                        {isSelected && <CaralIcon name="check" size={14} />}
                      </button>
                    );
                  })}

                  {filteredSections.length === 0 && moveSearch && (
                    <p className="text-xs text-neutral-400 text-center py-4">
                      No se encontraron secciones para "{moveSearch}"
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                <Button type="button" variant="ghost" onClick={() => setIsMoveModalOpen(false)}>
                  {t('content.cancel', 'Cancelar')}
                </Button>
                <Button
                  type="button"
                  variant="info"
                  onClick={handleConfirmMove}
                  disabled={isMoving}
                >
                  {isMoving ? t('content.moving', 'Moviendo...') : t('content.confirmMove', 'Mover aquí')}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // --- STANDARD DRAWER / PANEL VIEW ---
  return (
    <div className="flex-1 flex flex-col h-full bg-full border-l border-neutral-200 dark:border-neutral-800 animate-in slide-in-from-right-4 duration-300 fade-in">
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-container shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">
            {docToEdit
              ? `${t('content.editDocPrefix', 'Editar ')}${getDocTypeLabel()}`
              : `${docType === 'section' ? t('content.newDocPrefix', 'Nueva ') : t('content.newDocPrefixMasc', 'Nuevo ')}${getDocTypeLabel()}`
            }
          </h2>
          {docSection && docSection !== 'General' && (
            <span
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700"
              title={getCurrentSectionName(docSection)}
            >
              <CaralIcon name="folder" size={12} />
              <span className="truncate max-w-[160px]">{getCurrentSectionName(docSection)}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Botón: Mover a otra subsección */}
          <button
            type="button"
            onClick={handleOpenMoveModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-info-main hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-all cursor-pointer"
            title={t('content.moveDocTooltip', 'Mover documento a otra sección o subsección')}
          >
            <CaralIcon name="folder" size={14} />
            <span>{t('content.moveToSection', 'Mover a subsección')}</span>
          </button>

          {/* Botón: Expandir a pantalla completa / Restaurar */}
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-info-main hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-all cursor-pointer"
            title={t('content.expandEditor', 'Expandir a pantalla completa')}
          >
            <CaralIcon name="arrowsMaximize" size={14} />
            <span>{t('content.expandEditorBtn', 'Expandir')}</span>
          </button>

          <Button type="button" variant="ghost" onClick={onClose}>{t('content.close', 'Cerrar')}</Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-full relative">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-5xl mx-auto w-full pb-6">
          {/* Hidden submit button ensures Enter key triggers a valid save */}
          <input type="submit" data-submit="true" style={{ display: 'none' }} />

          {/* Selector Global de Idioma para el Documento */}
          <div className="flex items-center justify-between p-3 bg-container rounded-xl border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <CaralIcon name="globe" size={18} className="text-neutral-800" />
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                {t('common.language', 'Idioma de Edición')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-neutral-500 p-2 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => setActiveLang('es')}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${activeLang === 'es'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-900 hover:text-neutral-700'
                  }`}
              >

                <span>Español</span>
                {(docTitleEs.trim().length > 0 || contentEs.trim().length > 0) && (
                  <span className={`w-1.5 h-1.5 rounded-full ${activeLang === 'es' ? 'bg-white' : 'bg-emerald-500'}`} title="Contenido presente"></span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveLang('en')}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${activeLang === 'en'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-900 hover:text-neutral-700'
                  }`}
              >

                <span>English</span>
                {(docTitleEn.trim().length > 0 || contentEn.trim().length > 0) && (
                  <span className={`w-1.5 h-1.5 rounded-full ${activeLang === 'en' ? 'bg-white' : 'bg-emerald-500'}`} title="Content present"></span>
                )}
              </button>
            </div>
          </div>

          {/* Fila 1: Título, Sidename y Slug */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {docType === 'section' ? t('content.titleSection', 'Título de la Sección') : t('content.titleDoc', 'Título del Documento')} ({activeLang === 'es' ? 'ES 🇪🇸' : 'EN 🇬🇧'})
              </label>
              <input
                required
                value={activeLang === 'es' ? docTitleEs : docTitleEn}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit text-sm"
                placeholder={docType === 'section' ? t('content.placeholderSection', 'Ej: Introducción') : t('content.placeholderDoc', 'Ej: Guía de Inicio Rápido')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 truncate" title={t('content.sidenameTooltip', 'Nombre alternativo o reducido que se mostrará en el sidebar')}>
                {t('content.sidenameLabel', 'Nombre en Sidebar (Opcional)')} ({activeLang === 'es' ? 'ES 🇪🇸' : 'EN 🇬🇧'})
              </label>
              <input
                value={activeLang === 'es' ? docSidenameEs : docSidenameEn}
                onChange={(e) => activeLang === 'es' ? setDocSidenameEs(e.target.value) : setDocSidenameEn(e.target.value)}
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit text-sm"
                placeholder={t('content.sidenamePlaceholder', 'Ej: Inicio Rápido')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('content.slugLabel', 'Slug (URL amigable)')}</label>
              <input
                required
                value={docSlug}
                onChange={(e) => setDocSlug(e.target.value)}
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit font-mono text-sm"
                placeholder={docType === 'section' ? t('content.placeholderSlugSection', 'ej: introduccion') : t('content.placeholderSlugDoc', 'ej: guia-de-inicio-rapido')}
              />
            </div>
          </div>

          {/* Fila 2: Sección y Orden (Ocultos temporalmente según requerimiento) */}

          {/* Fila 3: Icono y SEO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('content.iconLabel', 'Icono')}</label>
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
                <div className="flex items-center gap-2 flex-1">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsIconPickerOpen(true)}
                    className="w-full justify-start text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    {docIconName ? t('content.changeIcon', 'Cambiar Ícono...') : t('content.selectIcon', 'Seleccionar Ícono...')}
                  </Button>
                  {docIconName && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setDocIconName('');
                        setDocUseBrand(false);
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 p-2 shrink-0 border border-neutral-300 dark:border-neutral-700"
                      title={t('content.removeIcon', 'Eliminar ícono')}
                    >
                      <CaralIcon name="trash" size={18} />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {docType === 'release_note' ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{t('content.baseUrl', 'URL Base')}</label>
                    <input
                      type="text"
                      value={docBaseUrl}
                      onChange={(e) => setDocBaseUrl(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit text-sm"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{t('content.folder', 'Carpeta')}</label>
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
                  <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    {t('content.seoDesc', 'Descripción (SEO)')} ({activeLang === 'es' ? 'ES 🇪🇸' : 'EN 🇬🇧'})
                  </label>
                  <textarea
                    value={activeLang === 'es' ? docDescriptionEs : docDescriptionEn}
                    onChange={(e) => activeLang === 'es' ? setDocDescriptionEs(e.target.value) : setDocDescriptionEn(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit text-sm resize-y"
                    placeholder={t('content.seoDescPlaceholder', 'Breve descripción...')}
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
                {t('content.hideToc', 'Ocultar la Tabla de Contenidos')}
              </label>
            </div>
          </div>

          {/* Fila 4: Status and Roles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('content.status', 'Estado')}</label>
              <select
                value={docStatus}
                onChange={(e) => setDocStatus(e.target.value)}
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit text-sm"
              >
                <option value="published">{t('content.statusPublished', 'Publicado')}</option>
                <option value="draft">{t('content.statusDraft', 'Borrador')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('content.allowedRoles', 'Roles Permitidos (Visibilidad)')}</label>
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
                      className={`px-3 py-2 text-xs rounded-full border transition-colors ${isAllowed
                        ? 'bg-info-light text-info-hard border-main-hard'
                        : 'bg-neutral-100 text-neutral-800 border-transparent hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
                        }`}
                    >
                      {role.name}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-neutral-800 mt-2">
                {docAllowedRoles.length === 0 ? t('content.visibleToAll', "Visible para TODOS los usuarios logueados.") : t('content.visibleToSelected', "Solo visible para los roles seleccionados.")}
              </p>
            </div>
          </div>

          {/* Editor Milkdown (Solo para Documentos con soporte Multi-idioma) */}
          {docType === 'document' && (
            <div className="mt-4 flex-1 flex flex-col min-h-[400px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-poppins font-semibold text-blue-600 dark:text-blue-400">
                  {t('content.contentHeading', 'Contenido')} ({activeLang === 'es' ? 'Español 🇪🇸' : 'English 🇬🇧'})
                </h2>
              </div>

              <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
                <MilkdownEditorWrapper
                  key={`${editorKey}-${activeLang}`}
                  content={activeLang === 'es' ? contentEs : contentEn}
                  onChange={(markdown) => {
                    if (activeLang === 'es') {
                      setContentEs(markdown);
                    } else {
                      setContentEn(markdown);
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Editor Roadmap (Solo para Roadmaps) */}
          {docType === 'roadmap' && (
            <div className="mt-4 flex-1 flex flex-col min-h-[400px]">
              <h2 className="text-xl font-poppins font-semibold mb-4 text-blue-600 dark:text-blue-400">
                {t('content.roadmapBuilder', 'Roadmap Builder')}
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
                {t('content.battlecardBuilder', 'Battlecard Builder')}
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
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>{t('content.cancel', 'Cancelar')}</Button>
            <Button type="submit" data-submit="true" variant="info" disabled={saving}>
              {saving ? t('content.saving', 'Guardando...') : (docToEdit ? t('content.updateDoc', 'Actualizar Documento') : t('content.saveAndPublish', 'Guardar y Publicar'))}
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

      {/* Modal para Mover a otra Subsección */}
      {isMoveModalOpen && (
        <Modal
          isOpen={isMoveModalOpen}
          onClose={() => setIsMoveModalOpen(false)}
          title={t('content.moveDocTitle', 'Mover documento a otra sección')}
          width="md"
        >
          <div className="flex flex-col gap-4">
            {/* Ubicación actual */}
            <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-between text-xs">
              <span className="text-neutral-800 font-medium">{t('content.currentLocation', 'Ubicación actual:')}</span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <CaralIcon name="folder" size={14} className="text-blue-500" />
                {getCurrentSectionName(docSection)}
              </span>
            </div>

            {/* Selector de destino */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                {t('content.selectDestinationSection', 'Selecciona la sección de destino:')}
              </label>

              {/* Buscador de secciones */}
              {availableSections.length > 3 && (
                <div className="relative mb-2">
                  <input
                    type="text"
                    value={moveSearch}
                    onChange={(e) => setMoveSearch(e.target.value)}
                    placeholder={t('content.searchSection', 'Buscar sección...')}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 pl-8 bg-inherit text-xs"
                  />
                  <div className="absolute left-2.5 top-2 text-neutral-400 pointer-events-none">
                    <CaralIcon name="search" size={12} />
                  </div>
                </div>
              )}

              {/* Lista de opciones de destino */}
              <div className="max-h-60 overflow-y-auto flex flex-col gap-1 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 bg-neutral-50/50 dark:bg-neutral-900/50">
                {/* Opción Raíz */}
                <button
                  type="button"
                  onClick={() => setSelectedMoveTarget('General')}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${(selectedMoveTarget === 'General' || !selectedMoveTarget)
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <CaralIcon name="folder" size={14} className={(selectedMoveTarget === 'General' || !selectedMoveTarget) ? 'text-white' : 'text-neutral-800'} />
                    <span>{t('content.rootLocation', 'Raíz del módulo (Sin sección)')}</span>
                  </div>
                  {(selectedMoveTarget === 'General' || !selectedMoveTarget) && (
                    <CaralIcon name="check" size={14} />
                  )}
                </button>

                {/* Secciones disponibles */}
                {filteredSections.map(sec => {
                  const isSelected = selectedMoveTarget === sec.id;
                  const secTitle = extractLanguageContent(sec.sidename, activeLang) || extractLanguageContent(sec.title, activeLang);
                  const isParentSection = !sec.section || sec.section === 'General';
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setSelectedMoveTarget(sec.id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${!isParentSection ? 'pl-6' : ''
                        } ${isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <CaralIcon name="folder" size={14} className={isSelected ? 'text-white' : 'text-blue-500'} />
                        <span className="truncate">{secTitle}</span>
                        {!isParentSection && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${isSelected ? 'bg-blue-700 text-blue-100' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-800'}`}>
                            Sub-sección
                          </span>
                        )}
                      </div>
                      {isSelected && <CaralIcon name="check" size={14} />}
                    </button>
                  );
                })}

                {filteredSections.length === 0 && moveSearch && (
                  <p className="text-xs text-neutral-400 text-center py-4">
                    No se encontraron secciones para "{moveSearch}"
                  </p>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-neutral-200 dark:border-neutral-700">
              <Button type="button" variant="ghost" onClick={() => setIsMoveModalOpen(false)}>
                {t('content.cancel', 'Cancelar')}
              </Button>
              <Button
                type="button"
                variant="info"
                onClick={handleConfirmMove}
                disabled={isMoving}
              >
                {isMoving ? t('content.moving', 'Moviendo...') : t('content.confirmMove', 'Mover aquí')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
