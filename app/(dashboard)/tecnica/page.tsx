'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/app/context/LanguageContext';
import { CaralIcon, Brand } from 'iconcaral2';
import { Button, Tabs, Drawer } from 'caralstable';
import { createClient } from '@/utils/supabase/client';
import Modal from '@/app/components/Modal';
import Input from '@/app/components/Input';
import Select from '@/app/components/Select';
import IconPickerModal from '@/app/components/IconPickerModal';
import { extractLanguageContent } from '@/utils/multilingual-content';
import { MilkdownEditorWrapper } from '@/app/components/Editor/MilkdownEditor';
import ProductWebhooksManager from '@/app/components/ProductWebhooksManager';
import { dispatchProductWebhooksAction } from '@/app/actions/webhookActions';

export interface IndexEntry {
  id: string;
  title: string;
  description: string;
  docId?: string;
  docSlug?: string;
  docTitle?: string;
}

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  docId?: string;
  docSlug?: string;
  docTitle?: string;
}

export interface ReleaseFeature {
  id: string;
  title: string;
  description: string;
  title_es?: string;
  title_en?: string;
  description_es?: string;
  description_en?: string;
  iconName?: string;
  isBrandIcon?: boolean;
  pngUrl?: string;
  pngName?: string;
  gifUrl?: string;
  gifName?: string;
}

export interface ReleaseVersion {
  id: string;
  version: string;
  isPublished: boolean;
  title: string;
  description: string;
  title_es?: string;
  title_en?: string;
  description_es?: string;
  description_en?: string;
  pngUrl?: string;
  pngName?: string;
  gifUrl?: string;
  gifName?: string;
  features?: ReleaseFeature[];
}

export interface BlogEntry {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  content: string;
  title_es?: string;
  title_en?: string;
  content_es?: string;
  content_en?: string;
  coverUrl?: string;
  coverName?: string;
}

export default function TecnicaPage() {
  const { t, language } = useTranslation();
  const supabase = createClient();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'api' | 'index' | 'faq' | 'release' | 'blog'>('api');
  const [copied, setCopied] = useState(false);

  // Estados para la pestaña Index
  const [indexLang, setIndexLang] = useState<'es' | 'en'>('es');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [copiedSection, setCopiedSection] = useState(false);

  // Datos editables de la pestaña Index por producto e idioma
  const [indexDataMap, setIndexDataMap] = useState<Record<string, { title: string; description: string; discoverTitle: string }>>({});

  // Entradas / Tarjetas de la pestaña Index
  const [indexEntriesMap, setIndexEntriesMap] = useState<Record<string, IndexEntry[]>>({});

  // Estados para la pestaña FAQ
  const [faqLang, setFaqLang] = useState<'es' | 'en'>('es');
  const [isFaqLangDropdownOpen, setIsFaqLangDropdownOpen] = useState(false);
  const [copiedFaqSection, setCopiedFaqSection] = useState(false);
  const [faqDataMap, setFaqDataMap] = useState<Record<string, { title: string; description: string }>>({});
  const [faqEntriesMap, setFaqEntriesMap] = useState<Record<string, FaqEntry[]>>({});
  const [expandedFaqIds, setExpandedFaqIds] = useState<string[]>([]);

  // Estados para la pestaña Release
  const [releaseLang, setReleaseLang] = useState<'es' | 'en'>('es');
  const [isReleaseLangDropdownOpen, setIsReleaseLangDropdownOpen] = useState(false);
  const [copiedReleaseSection, setCopiedReleaseSection] = useState(false);
  const [productReleasesMap, setProductReleasesMap] = useState<Record<string, ReleaseVersion[]>>({});
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  // Modal para agregar nueva versión en Release
  const [isAddVersionModalOpen, setIsAddVersionModalOpen] = useState(false);
  const [newVersionTag, setNewVersionTag] = useState('');

  // Modal selector de ícono para Release Features
  const [featureIconPicker, setFeatureIconPicker] = useState<{
    isOpen: boolean;
    featureId: string | null;
    initialIconName: string;
    initialIsBrand: boolean;
  }>({
    isOpen: false,
    featureId: null,
    initialIconName: '',
    initialIsBrand: false,
  });

  // Estados para la pestaña Blog
  const [blogLang, setBlogLang] = useState<'es' | 'en'>('es');
  const [isBlogLangDropdownOpen, setIsBlogLangDropdownOpen] = useState(false);
  const [copiedBlogSection, setCopiedBlogSection] = useState(false);
  const [productBlogMap, setProductBlogMap] = useState<Record<string, BlogEntry[]>>({});
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(null);

  // Modal para agregar nueva entrada de Blog
  const [isAddBlogModalOpen, setIsAddBlogModalOpen] = useState(false);
  const [newBlogTitle, setNewBlogTitle] = useState('');
  const [newBlogSlug, setNewBlogSlug] = useState('');

  // Drawer para FAQ (Crear / Editar)
  const [isFaqDrawerOpen, setIsFaqDrawerOpen] = useState(false);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqLinkedDocId, setFaqLinkedDocId] = useState('');
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);

  // Drawer para crear/editar entrada en Index
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [entryTitle, setEntryTitle] = useState('');
  const [entryDescription, setEntryDescription] = useState('');
  const [entryLinkedDocId, setEntryLinkedDocId] = useState('');
  const [publicModules, setPublicModules] = useState<any[]>([]);
  const [publicDocs, setPublicDocs] = useState<any[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [loadingPublicDocs, setLoadingPublicDocs] = useState(false);

  // Modal para agregar nueva documentación
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [productsRes, modulesRes] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .order('order_index', { ascending: true })
          .order('created_at', { ascending: false }),
        supabase
          .from('modules')
          .select('id, product_id, allowed_roles, is_hidden')
          .eq('is_hidden', false)
      ]);

      if (productsRes.error) throw productsRes.error;
      if (modulesRes.error) throw modulesRes.error;

      const rawProducts = productsRes.data || [];
      const rawModules = modulesRes.data || [];

      // Filtrar productos que tengan al menos un módulo público
      const productIdsWithPublicModules = new Set(
        rawModules
          .filter((m: any) => Array.isArray(m.allowed_roles) && m.allowed_roles.includes('public'))
          .map((m: any) => m.product_id)
      );

      const filteredProducts = rawProducts.filter((p: any) => productIdsWithPublicModules.has(p.id));

      // Hidratar estados locales desde la columna technical_docs_config
      const loadedIndexDataMap: Record<string, any> = {};
      const loadedIndexEntriesMap: Record<string, any> = {};
      const loadedFaqDataMap: Record<string, any> = {};
      const loadedFaqEntriesMap: Record<string, any> = {};
      const loadedReleasesMap: Record<string, any> = {};
      const loadedBlogMap: Record<string, any> = {};

      filteredProducts.forEach((p: any) => {
        const config = p.technical_docs_config || {};
        if (config.index) {
          if (config.index.es) loadedIndexDataMap[`${p.id}_es`] = config.index.es;
          if (config.index.en) loadedIndexDataMap[`${p.id}_en`] = config.index.en;
          if (Array.isArray(config.index.entries)) loadedIndexEntriesMap[p.id] = config.index.entries;
        }
        if (config.faq) {
          if (config.faq.es) loadedFaqDataMap[`${p.id}_es`] = config.faq.es;
          if (config.faq.en) loadedFaqDataMap[`${p.id}_en`] = config.faq.en;

          const esItems = config.faq.items_es || config.faq.es?.items || config.faq.items || [];
          const enItems = config.faq.items_en || config.faq.en?.items || [];

          if (Array.isArray(esItems)) loadedFaqEntriesMap[`${p.id}_es`] = esItems;
          if (Array.isArray(enItems)) loadedFaqEntriesMap[`${p.id}_en`] = enItems;
        }
        if (Array.isArray(config.releases) && config.releases.length > 0) {
          loadedReleasesMap[p.id] = config.releases;
        }
        if (Array.isArray(config.blog) && config.blog.length > 0) {
          loadedBlogMap[p.id] = config.blog;
        }
      });

      setIndexDataMap(prev => ({ ...prev, ...loadedIndexDataMap }));
      setIndexEntriesMap(prev => ({ ...prev, ...loadedIndexEntriesMap }));
      setFaqDataMap(prev => ({ ...prev, ...loadedFaqDataMap }));
      setFaqEntriesMap(prev => ({ ...prev, ...loadedFaqEntriesMap }));
      setProductReleasesMap(prev => ({ ...prev, ...loadedReleasesMap }));
      setProductBlogMap(prev => ({ ...prev, ...loadedBlogMap }));

      setProducts(filteredProducts);
      if (filteredProducts.length > 0) {
        if (!selectedProductId || !filteredProducts.some(p => p.id === selectedProductId)) {
          setSelectedProductId(filteredProducts[0].id);
        }
      } else {
        setSelectedProductId(null);
      }
    } catch (err) {
      console.error('Error cargando documentaciones técnicas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTechnicalDocsConfig = async () => {
    if (!selectedProductId) return;
    try {
      setIsSaving(true);
      const prodId = selectedProductId;

      const esFaqItems = faqEntriesMap[`${prodId}_es`] || faqEntriesMap[prodId] || [];
      const enFaqItems = faqEntriesMap[`${prodId}_en`] || [];

      const configPayload = {
        index: {
          es: indexDataMap[`${prodId}_es`] || getCurrentIndexDataForLang(prodId, 'es'),
          en: indexDataMap[`${prodId}_en`] || getCurrentIndexDataForLang(prodId, 'en'),
          entries: indexEntriesMap[prodId] || []
        },
        faq: {
          es: {
            ...(faqDataMap[`${prodId}_es`] || getCurrentFaqDataForLang(prodId, 'es')),
            items: esFaqItems
          },
          en: {
            ...(faqDataMap[`${prodId}_en`] || getCurrentFaqDataForLang(prodId, 'en')),
            items: enFaqItems
          },
          items_es: esFaqItems,
          items_en: enFaqItems,
          items: esFaqItems
        },
        releases: productReleasesMap[prodId] || getProductReleases(),
        blog: productBlogMap[prodId] || getProductBlogEntries()
      };

      const { error } = await supabase
        .from('products')
        .update({ technical_docs_config: configPayload })
        .eq('id', prodId);

      if (error) throw error;

      // Actualizar producto en la lista local
      setProducts(prev => prev.map(p => p.id === prodId ? { ...p, technical_docs_config: configPayload } : p));
      setProductReleasesMap(prev => ({ ...prev, [prodId]: configPayload.releases }));
      setProductBlogMap(prev => ({ ...prev, [prodId]: configPayload.blog }));

      // Disparar Webhooks a todos los destinos configurados en segundo plano
      dispatchProductWebhooksAction(prodId, 'config.updated', {
        productSlug: selectedProduct?.slug,
        tab: activeTab,
      }).catch(e => console.error('[Webhook Dispatch Error]', e));

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      console.error('Error guardando configuración técnica:', err);
      alert('Error guardando configuración: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsSaving(false);
    }
  };

  const getCurrentIndexDataForLang = (prodId: string, lang: 'es' | 'en') => {
    const key = `${prodId}_${lang}`;
    if (indexDataMap[key]) return indexDataMap[key];
    const prod = products.find(p => p.id === prodId);
    const prodTitle = prod?.title || 'Crestone';
    const defaultDescEs = `${prodTitle} es un software innovador de integración de datos diseñado para empresas que buscan una solución eficiente para sincronizar, transformar y transferir datos entre diversos sistemas empresariales, como ERP, CRM, bases de datos y plataformas de análisis de datos.\n\nEste producto está diseñado para ofrecer una experiencia de usuario intuitiva, permitiendo a los usuarios no técnicos gestionar flujos de datos complejos con facilidad.`;
    const defaultDescEn = `${prodTitle} is an innovative data integration software designed for companies looking for an efficient solution to synchronize, transform and transfer data between diverse business systems, such as ERP, CRM, databases and data analysis platforms.\n\nThis product is designed to offer an intuitive user experience, allowing non-technical users to manage complex data flows with ease.`;
    return {
      title: `${prodTitle} Docs`,
      description: lang === 'es' ? defaultDescEs : defaultDescEn,
      discoverTitle: `Discover ${prodTitle}`
    };
  };

  const getCurrentFaqDataForLang = (prodId: string, lang: 'es' | 'en') => {
    const key = `${prodId}_${lang}`;
    if (faqDataMap[key]) return faqDataMap[key];
    const defaultDescEs = `¡Bienvenido a la sección de preguntas frecuentes! Hemos recopilado respuestas a las dudas más comunes para que encuentres información rápidamente.\n\nSi deseas explorar todas las preguntas, consulta los enlaces donde encontrarás todas las respuestas generadas por los usuarios.`;
    const defaultDescEn = `Welcome to the FAQ section! We've compiled answers to the most common questions so you can find information quickly.\n\nIf you want to explore all the questions, go to this link. Where you will find all the answers made by the users.`;
    return {
      title: lang === 'es' ? 'Preguntas Frecuentes' : 'Frequently asked questions',
      description: lang === 'es' ? defaultDescEs : defaultDescEn
    };
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const getCurrentIndexData = () => {
    if (!selectedProduct) {
      return {
        title: 'Docs',
        description: '',
        discoverTitle: 'Discover'
      };
    }

    const key = `${selectedProduct.id}_${indexLang}`;
    if (indexDataMap[key]) {
      return indexDataMap[key];
    }

    const prodTitle = selectedProduct.title || 'Crestone';
    const defaultDescEs = `${prodTitle} es un software innovador de integración de datos diseñado para empresas que buscan una solución eficiente para sincronizar, transformar y transferir datos entre diversos sistemas empresariales, como ERP, CRM, bases de datos y plataformas de análisis de datos.\n\nEste producto está diseñado para ofrecer una experiencia de usuario intuitiva, permitiendo a los usuarios no técnicos gestionar flujos de datos complejos con facilidad.`;
    const defaultDescEn = `${prodTitle} is an innovative data integration software designed for companies looking for an efficient solution to synchronize, transform and transfer data between diverse business systems, such as ERP, CRM, databases and data analysis platforms.\n\nThis product is designed to offer an intuitive user experience, allowing non-technical users to manage complex data flows with ease.`;

    return {
      title: `${prodTitle} Docs`,
      description: indexLang === 'es' ? defaultDescEs : defaultDescEn,
      discoverTitle: `Discover ${prodTitle}`
    };
  };

  const updateCurrentIndexData = (updates: Partial<{ title: string; description: string; discoverTitle: string }>) => {
    if (!selectedProduct) return;
    const key = `${selectedProduct.id}_${indexLang}`;
    const current = getCurrentIndexData();
    setIndexDataMap(prev => ({
      ...prev,
      [key]: { ...current, ...updates }
    }));
  };

  const handleCopy = () => {
    const textToCopy = `Docs_search= ${selectedProduct?.title || selectedProduct?.slug || 'Crestone'}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchPublicDocsForProduct = async (prodId: string) => {
    try {
      setLoadingPublicDocs(true);
      const { data: rawModules, error: modErr } = await supabase
        .from('modules')
        .select('id, title, allowed_roles, order_index')
        .eq('product_id', prodId)
        .eq('is_hidden', false)
        .order('order_index', { ascending: true });

      if (modErr) throw modErr;

      const pubMods = (rawModules || []).filter(
        (m: any) => Array.isArray(m.allowed_roles) && m.allowed_roles.includes('public')
      );

      setPublicModules(pubMods);

      if (pubMods.length === 0) {
        setPublicDocs([]);
        return;
      }

      const publicModuleIds = pubMods.map((m: any) => m.id);

      const { data: docs, error: docsErr } = await supabase
        .from('documentation')
        .select('id, title, slug, module_id, section, type, order_index')
        .eq('product_id', prodId)
        .in('module_id', publicModuleIds)
        .order('order_index', { ascending: true });

      if (docsErr) throw docsErr;
      setPublicDocs(docs || []);
    } catch (err) {
      console.error('Error cargando documentos públicos:', err);
    } finally {
      setLoadingPublicDocs(false);
    }
  };

  // Secciones calculadas a partir de los documentos públicos y el módulo seleccionado
  const availableSections = React.useMemo(() => {
    const sectionsMap = new Map<string, string>();

    // 1. Elementos de documentación de tipo 'section'
    publicDocs
      .filter((d) => d.type === 'section' && (!selectedModuleId || d.module_id === selectedModuleId))
      .forEach((s) => {
        const title = extractLanguageContent(s.title, indexLang) || s.title || s.slug;
        sectionsMap.set(s.id, title);
      });

    // 2. Documentos con atributo 'section'
    publicDocs
      .filter((d) => (!selectedModuleId || d.module_id === selectedModuleId) && d.section && d.section !== 'General')
      .forEach((d) => {
        if (!sectionsMap.has(d.section)) {
          const parentDoc = publicDocs.find((p) => p.id === d.section);
          const title = parentDoc
            ? extractLanguageContent(parentDoc.title, indexLang) || parentDoc.title || parentDoc.slug
            : d.section;
          sectionsMap.set(d.section, title);
        }
      });

    return Array.from(sectionsMap.entries()).map(([id, title]) => ({ id, title }));
  }, [publicDocs, selectedModuleId, indexLang]);

  // Documentos filtrados por módulo y sección
  const filteredDocs = React.useMemo(() => {
    return publicDocs.filter((doc) => {
      if (doc.type === 'section') return false;
      if (selectedModuleId && doc.module_id !== selectedModuleId) return false;
      if (selectedSectionId && doc.section !== selectedSectionId && doc.id !== selectedSectionId) return false;
      return true;
    });
  }, [publicDocs, selectedModuleId, selectedSectionId]);

  const handleOpenAddEntryDrawer = () => {
    if (selectedProduct) {
      fetchPublicDocsForProduct(selectedProduct.id);
    }
    setEntryTitle('');
    setEntryDescription('');
    setEntryLinkedDocId('');
    setSelectedModuleId('');
    setSelectedSectionId('');
    setIsDrawerOpen(true);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryTitle.trim() || !selectedProduct) return;

    const linkedDoc = publicDocs.find(d => d.id === entryLinkedDocId);

    const newEntry: IndexEntry = {
      id: Date.now().toString(),
      title: entryTitle.trim(),
      description: entryDescription.trim(),
      docId: linkedDoc?.id,
      docSlug: linkedDoc?.slug,
      docTitle: linkedDoc?.title ? extractLanguageContent(linkedDoc.title, indexLang) : undefined
    };

    const prodKey = selectedProduct.id;
    setIndexEntriesMap(prev => ({
      ...prev,
      [prodKey]: [...(prev[prodKey] || []), newEntry]
    }));

    setIsDrawerOpen(false);
  };

  const handleDeleteEntry = (entryId: string) => {
    if (!selectedProduct) return;
    const prodKey = selectedProduct.id;
    setIndexEntriesMap(prev => ({
      ...prev,
      [prodKey]: (prev[prodKey] || []).filter(e => e.id !== entryId)
    }));
  };

  // --- HANDLERS PARA FAQ ---
  const getCurrentFaqData = () => {
    if (!selectedProduct) {
      return {
        title: 'Frequently asked questions',
        description: ''
      };
    }

    const key = `${selectedProduct.id}_${faqLang}`;
    if (faqDataMap[key]) {
      return faqDataMap[key];
    }

    const defaultDescEs = `¡Bienvenido a la sección de preguntas frecuentes! Hemos recopilado respuestas a las dudas más comunes para que encuentres información rápidamente.\n\nSi deseas explorar todas las preguntas, consulta los enlaces donde encontrarás todas las respuestas generadas por los usuarios.`;
    const defaultDescEn = `Welcome to the FAQ section! We've compiled answers to the most common questions so you can find information quickly.\n\nIf you want to explore all the questions, go to this link. Where you will find all the answers made by the users.`;

    return {
      title: faqLang === 'es' ? 'Preguntas Frecuentes' : 'Frequently asked questions',
      description: faqLang === 'es' ? defaultDescEs : defaultDescEn
    };
  };

  const getCurrentFaqEntries = (): FaqEntry[] => {
    if (!selectedProduct) return [];
    const key = `${selectedProduct.id}_${faqLang}`;
    if (faqEntriesMap[key]) return faqEntriesMap[key];
    // Fallback inicial si solo existía la clave sin sufijo de idioma
    if (faqLang === 'es' && faqEntriesMap[selectedProduct.id]) {
      return faqEntriesMap[selectedProduct.id];
    }
    return [];
  };

  const updateCurrentFaqData = (updates: Partial<{ title: string; description: string }>) => {
    if (!selectedProduct) return;
    const key = `${selectedProduct.id}_${faqLang}`;
    const current = getCurrentFaqData();
    setFaqDataMap(prev => ({
      ...prev,
      [key]: { ...current, ...updates }
    }));
  };

  const handleOpenAddFaqDrawer = () => {
    if (selectedProduct) {
      fetchPublicDocsForProduct(selectedProduct.id);
    }
    setEditingFaqId(null);
    setFaqQuestion('');
    setFaqAnswer('');
    setFaqLinkedDocId('');
    setSelectedModuleId('');
    setSelectedSectionId('');
    setIsFaqDrawerOpen(true);
  };

  const handleOpenEditFaqDrawer = (item: FaqEntry) => {
    if (selectedProduct) {
      fetchPublicDocsForProduct(selectedProduct.id);
    }
    setEditingFaqId(item.id);
    setFaqQuestion(item.question);
    setFaqAnswer(item.answer);
    setFaqLinkedDocId(item.docId || '');
    if (item.docId) {
      const doc = publicDocs.find(d => d.id === item.docId);
      if (doc) {
        setSelectedModuleId(doc.module_id || '');
        setSelectedSectionId(doc.section || '');
      }
    }
    setIsFaqDrawerOpen(true);
  };

  const handleSaveFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQuestion.trim() || !faqAnswer.trim() || !selectedProduct) return;

    const linkedDoc = publicDocs.find(d => d.id === faqLinkedDocId);
    const prodKey = `${selectedProduct.id}_${faqLang}`;

    if (editingFaqId) {
      setFaqEntriesMap(prev => ({
        ...prev,
        [prodKey]: (prev[prodKey] || []).map(faq =>
          faq.id === editingFaqId
            ? {
              ...faq,
              question: faqQuestion.trim(),
              answer: faqAnswer.trim(),
              docId: linkedDoc?.id,
              docSlug: linkedDoc?.slug,
              docTitle: linkedDoc?.title ? extractLanguageContent(linkedDoc.title, faqLang) : undefined
            }
            : faq
        )
      }));
    } else {
      const newFaq: FaqEntry = {
        id: Date.now().toString(),
        question: faqQuestion.trim(),
        answer: faqAnswer.trim(),
        docId: linkedDoc?.id,
        docSlug: linkedDoc?.slug,
        docTitle: linkedDoc?.title ? extractLanguageContent(linkedDoc.title, faqLang) : undefined
      };
      setFaqEntriesMap(prev => ({
        ...prev,
        [prodKey]: [...(prev[prodKey] || []), newFaq]
      }));
      setExpandedFaqIds(prev => [...prev, newFaq.id]);
    }

    setIsFaqDrawerOpen(false);
  };

  const handleDeleteFaq = (faqId: string) => {
    if (!selectedProduct) return;
    const prodKey = `${selectedProduct.id}_${faqLang}`;
    setFaqEntriesMap(prev => ({
      ...prev,
      [prodKey]: (prev[prodKey] || []).filter(f => f.id !== faqId)
    }));
  };

  const toggleFaqExpand = (faqId: string) => {
    setExpandedFaqIds(prev =>
      prev.includes(faqId) ? prev.filter(id => id !== faqId) : [...prev, faqId]
    );
  };

  // --- HANDLERS PARA RELEASE ---
  const getDefaultReleases = (): ReleaseVersion[] => [
    {
      id: '1',
      version: '1.97.02',
      isPublished: true,
      title: 'Actualización de motor Crestone v1.97.02',
      description: 'Mejoras en el motor de sincronización en tiempo real, optimizaciones en los conectores de base de datos y reducción de latencia en webhooks.',
      title_es: 'Actualización de motor Crestone v1.97.02',
      title_en: 'Crestone Core Update v1.97.02',
      description_es: 'Mejoras en el motor de sincronización en tiempo real, optimizaciones en los conectores de base de datos y reducción de latencia en webhooks.',
      description_en: 'Real-time synchronization engine improvements, database connector optimizations, and reduced webhook latency.',
      pngUrl: '',
      gifUrl: '',
      features: [
        {
          id: 'f1',
          title: 'Conector Snowflake de alta velocidad',
          title_es: 'Conector Snowflake de alta velocidad',
          title_en: 'High-speed Snowflake Connector',
          description: 'Soporte nativo para stream ingestion con compresión Zstandard y balanceo de carga automático entre clusters.',
          description_es: 'Soporte nativo para stream ingestion con compresión Zstandard y balanceo de carga automático entre clusters.',
          description_en: 'Native stream ingestion support with Zstandard compression and automatic load balancing across clusters.',
          iconName: 'database',
          isBrandIcon: false,
          pngUrl: '',
          pngName: '',
          gifUrl: '',
          gifName: ''
        },
        {
          id: 'f2',
          title: 'Transformación de esquemas en caliente',
          title_es: 'Transformación de esquemas en caliente',
          title_en: 'Hot Schema Transformations',
          description: 'Capacidad de mutar esquemas JSON en tránsito sin interrumpir el flujo activo de mensajes.',
          description_es: 'Capacidad de mutar esquemas JSON en tránsito sin interrumpir el flujo activo de mensajes.',
          description_en: 'Ability to mutate JSON schemas in transit without interrupting active message pipelines.',
          iconName: 'code',
          isBrandIcon: false,
          pngUrl: '',
          pngName: '',
          gifUrl: '',
          gifName: ''
        }
      ]
    },
    {
      id: '2',
      version: '1.97.01',
      isPublished: false,
      title: 'Hotfix de seguridad y tokens',
      description: 'Actualización del middleware de tokens de acceso y soporte para rotación automática de claves API.',
      title_es: 'Hotfix de seguridad y tokens',
      title_en: 'Security and token hotfix',
      description_es: 'Actualización del middleware de tokens de acceso y soporte para rotación automática de claves API.',
      description_en: 'Access token middleware update and support for automatic API key rotation.',
      pngUrl: '',
      gifUrl: '',
      features: [
        {
          id: 'f3',
          title: 'Rotación automática de tokens Bearer',
          title_es: 'Rotación automática de tokens Bearer',
          title_en: 'Automatic Bearer Token Rotation',
          description: 'Renovación transparente de credenciales OAuth sin desautenticar sesiones activas.',
          description_es: 'Renovación transparente de credenciales OAuth sin desautenticar sesiones activas.',
          description_en: 'Seamless OAuth credential renewal without disconnecting active client sessions.',
          iconName: 'shield',
          isBrandIcon: false,
          pngUrl: '',
          pngName: '',
          gifUrl: '',
          gifName: ''
        }
      ]
    },
    {
      id: '3',
      version: '1.96.01',
      isPublished: false,
      title: 'Integración con docuportal',
      description: 'Soporte para la API de consumo público y exportación de esquemas JSON.',
      title_es: 'Integración con docuportal',
      title_en: 'Integration with docuportal',
      description_es: 'Soporte para la API de consumo público y exportación de esquemas JSON.',
      description_en: 'Support for public consumption API and JSON schema export.',
      pngUrl: '',
      gifUrl: '',
      features: []
    }
  ];

  const getProductReleases = (): ReleaseVersion[] => {
    if (!selectedProduct) return [];
    const prodId = selectedProduct.id;
    if (productReleasesMap[prodId]) {
      return productReleasesMap[prodId];
    }
    return getDefaultReleases();
  };

  const getActiveRelease = (): ReleaseVersion | null => {
    const releases = getProductReleases();
    if (releases.length === 0) return null;
    let found = releases[0];
    if (selectedVersionId) {
      const match = releases.find(r => r.id === selectedVersionId);
      if (match) found = match;
    }

    const title = releaseLang === 'en'
      ? (found.title_en || found.title || `Release ${found.version}`)
      : (found.title_es || found.title || `Release ${found.version}`);

    const description = releaseLang === 'en'
      ? (found.description_en ?? found.description ?? '')
      : (found.description_es ?? found.description ?? '');

    const features = (found.features || []).map(f => ({
      ...f,
      title: releaseLang === 'en' ? (f.title_en || f.title || '') : (f.title_es || f.title || ''),
      description: releaseLang === 'en' ? (f.description_en ?? f.description ?? '') : (f.description_es ?? f.description ?? ''),
      iconName: f.iconName || '',
      isBrandIcon: f.isBrandIcon || false,
    }));

    return {
      ...found,
      title,
      description,
      features
    };
  };

  const updateActiveRelease = (updates: Partial<ReleaseVersion>) => {
    if (!selectedProduct) return;
    const prodId = selectedProduct.id;
    const releases = getProductReleases();
    const active = getActiveRelease();
    if (!active) return;

    const payload: Partial<ReleaseVersion> = { ...updates };
    if (updates.title !== undefined) {
      if (releaseLang === 'en') {
        payload.title_en = updates.title;
        if (!active.title_es) payload.title_es = active.title;
      } else {
        payload.title_es = updates.title;
        payload.title = updates.title;
      }
    }
    if (updates.description !== undefined) {
      if (releaseLang === 'en') {
        payload.description_en = updates.description;
        if (!active.description_es) payload.description_es = active.description;
      } else {
        payload.description_es = updates.description;
        payload.description = updates.description;
      }
    }

    const updated = releases.map(r => r.id === active.id ? { ...r, ...payload } : r);
    setProductReleasesMap(prev => ({
      ...prev,
      [prodId]: updated
    }));
  };

  const handleCreateVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionTag.trim() || !selectedProduct) return;

    const prodId = selectedProduct.id;
    const releases = getProductReleases();

    const newRelease: ReleaseVersion = {
      id: Date.now().toString(),
      version: newVersionTag.trim(),
      isPublished: true,
      title: `${selectedProduct.title || 'Product'} Release v${newVersionTag.trim()}`,
      title_es: `${selectedProduct.title || 'Product'} Release v${newVersionTag.trim()}`,
      title_en: `${selectedProduct.title || 'Product'} Release v${newVersionTag.trim()}`,
      description: '',
      description_es: '',
      description_en: '',
      pngUrl: '',
      gifUrl: '',
      features: []
    };

    setProductReleasesMap(prev => ({
      ...prev,
      [prodId]: [newRelease, ...releases]
    }));
    setSelectedVersionId(newRelease.id);
    setNewVersionTag('');
    setIsAddVersionModalOpen(false);
  };

  const handleDeleteRelease = (releaseId: string) => {
    if (!selectedProduct) return;
    const prodId = selectedProduct.id;
    const releases = getProductReleases();
    const updated = releases.filter(r => r.id !== releaseId);
    setProductReleasesMap(prev => ({
      ...prev,
      [prodId]: updated
    }));
    if (selectedVersionId === releaseId) {
      setSelectedVersionId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleAddFeature = () => {
    const active = getActiveRelease();
    if (!active) return;
    const currentFeatures = active.features || [];
    const newFeature: ReleaseFeature = {
      id: Date.now().toString(),
      title: '',
      title_es: '',
      title_en: '',
      description: '',
      description_es: '',
      description_en: '',
      iconName: '',
      isBrandIcon: false,
      pngUrl: '',
      pngName: '',
      gifUrl: '',
      gifName: ''
    };
    updateActiveRelease({
      features: [...currentFeatures, newFeature]
    });
  };

  const handleUpdateFeature = (featureId: string, updates: Partial<ReleaseFeature>) => {
    const active = getActiveRelease();
    if (!active) return;
    const currentFeatures = active.features || [];

    const updatedFeatures = currentFeatures.map(f => {
      if (f.id !== featureId) return f;
      const updated: ReleaseFeature = { ...f, ...updates };
      if (updates.title !== undefined) {
        if (releaseLang === 'en') {
          updated.title_en = updates.title;
          if (!f.title_es) updated.title_es = f.title;
        } else {
          updated.title_es = updates.title;
          updated.title = updates.title;
        }
      }
      if (updates.description !== undefined) {
        if (releaseLang === 'en') {
          updated.description_en = updates.description;
          if (!f.description_es) updated.description_es = f.description;
        } else {
          updated.description_es = updates.description;
          updated.description = updates.description;
        }
      }
      return updated;
    });

    updateActiveRelease({ features: updatedFeatures });
  };

  const handleDeleteFeature = (featureId: string) => {
    const active = getActiveRelease();
    if (!active) return;
    const currentFeatures = active.features || [];
    updateActiveRelease({
      features: currentFeatures.filter(f => f.id !== featureId)
    });
  };

  const handleFeatureFileUpload = (featureId: string, type: 'png' | 'gif', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (type === 'png') {
        handleUpdateFeature(featureId, { pngUrl: result, pngName: file.name });
      } else {
        handleUpdateFeature(featureId, { gifUrl: result, gifName: file.name });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFeatureFileRemove = (featureId: string, type: 'png' | 'gif') => {
    if (type === 'png') {
      handleUpdateFeature(featureId, { pngUrl: '', pngName: '' });
    } else {
      handleUpdateFeature(featureId, { gifUrl: '', gifName: '' });
    }
  };

  // --- HANDLERS PARA BLOG ---
  const getDefaultBlogEntries = (): BlogEntry[] => [
    {
      id: '1',
      title: 'Arquitectura de Datos y Alta Disponibilidad',
      slug: 'arquitectura-datos-alta-disponibilidad',
      isPublished: true,
      content: `# Arquitectura de Datos y Alta Disponibilidad\n\nEn esta publicación exploramos cómo estructurar pipelines de sincronización escalables, tolerantes a fallos y con mínima latencia.\n\n### Puntos clave:\n- **Conexiones resilientes** con reintentos exponenciales.\n- **Transformación de esquemas en caliente** sin bloquear transacciones.\n- Monitoreo continuo mediante endpoints de telemetría.`,
      title_es: 'Arquitectura de Datos y Alta Disponibilidad',
      title_en: 'Data Architecture and High Availability',
      content_es: `# Arquitectura de Datos y Alta Disponibilidad\n\nEn esta publicación exploramos cómo estructurar pipelines de sincronización escalables, tolerantes a fallos y con mínima latencia.\n\n### Puntos clave:\n- **Conexiones resilientes** con reintentos exponenciales.\n- **Transformación de esquemas en caliente** sin bloquear transacciones.\n- Monitoreo continuo mediante endpoints de telemetría.`,
      content_en: `# Data Architecture and High Availability\n\nIn this post we explore how to build scalable, fault-tolerant synchronization pipelines with minimal latency.\n\n### Key points:\n- **Resilient connections** with exponential backoff.\n- **Live schema transformation** without blocking transactions.\n- Continuous monitoring via telemetry endpoints.`
    },
    {
      id: '2',
      title: 'Guía rápida: Integración REST en 5 minutos',
      slug: 'guia-rapida-integracion-rest',
      isPublished: true,
      content: `# Guía rápida: Integración REST en 5 minutos\n\nAprende a consumir la documentación y endpoints técnicos desde cualquier aplicación web o backend utilizando la API REST pública.\n\n\`\`\`javascript\nconst res = await fetch('/api/public/docs?product=crestone&include_content=true');\nconst data = await res.json();\nconsole.log(data);\n\`\`\``,
      title_es: 'Guía rápida: Integración REST en 5 minutos',
      title_en: 'Quick Guide: REST Integration in 5 Minutes',
      content_es: `# Guía rápida: Integración REST en 5 minutos\n\nAprende a consumir la documentación y endpoints técnicos desde cualquier aplicación web o backend utilizando la API REST pública.\n\n\`\`\`javascript\nconst res = await fetch('/api/public/docs?product=crestone&include_content=true');\nconst data = await res.json();\nconsole.log(data);\n\`\`\``,
      content_en: `# Quick Guide: REST Integration in 5 Minutes\n\nLearn how to consume documentation and technical endpoints from any web or backend application using the public REST API.\n\n\`\`\`javascript\nconst res = await fetch('/api/public/docs?product=crestone&include_content=true');\nconst data = await res.json();\nconsole.log(data);\n\`\`\``
    }
  ];

  const getProductBlogEntries = (): BlogEntry[] => {
    if (!selectedProduct) return [];
    const prodId = selectedProduct.id;
    if (productBlogMap[prodId]) {
      return productBlogMap[prodId];
    }
    return getDefaultBlogEntries();
  };

  const getActiveBlog = (): BlogEntry | null => {
    const entries = getProductBlogEntries();
    if (entries.length === 0) return null;
    let found = entries[0];
    if (selectedBlogId) {
      const match = entries.find(b => b.id === selectedBlogId);
      if (match) found = match;
    }

    const title = blogLang === 'en'
      ? (found.title_en || found.title || '')
      : (found.title_es || found.title || '');

    const content = blogLang === 'en'
      ? (found.content_en ?? found.content ?? '')
      : (found.content_es ?? found.content ?? '');

    return {
      ...found,
      title,
      content
    };
  };

  const updateActiveBlog = (updates: Partial<BlogEntry>) => {
    if (!selectedProduct) return;
    const prodId = selectedProduct.id;
    const entries = getProductBlogEntries();
    const active = getActiveBlog();
    if (!active) return;

    const payload: Partial<BlogEntry> = { ...updates };
    if (updates.title !== undefined) {
      if (blogLang === 'en') {
        payload.title_en = updates.title;
        if (!active.title_es) payload.title_es = active.title;
      } else {
        payload.title_es = updates.title;
        payload.title = updates.title;
      }
    }
    if (updates.content !== undefined) {
      if (blogLang === 'en') {
        payload.content_en = updates.content;
        if (!active.content_es) payload.content_es = active.content;
      } else {
        payload.content_es = updates.content;
        payload.content = updates.content;
      }
    }

    const updated = entries.map(b => b.id === active.id ? { ...b, ...payload } : b);
    setProductBlogMap(prev => ({
      ...prev,
      [prodId]: updated
    }));
  };

  const handleCreateBlogEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlogTitle.trim() || !selectedProduct) return;

    const prodId = selectedProduct.id;
    const entries = getProductBlogEntries();

    const slug = newBlogSlug.trim() || newBlogTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const newEntry: BlogEntry = {
      id: Date.now().toString(),
      title: newBlogTitle.trim(),
      slug: slug,
      isPublished: true,
      content: `# ${newBlogTitle.trim()}\n\nEscribe aquí el contenido de tu publicación técnica...`,
      title_es: newBlogTitle.trim(),
      title_en: newBlogTitle.trim(),
      content_es: `# ${newBlogTitle.trim()}\n\nEscribe aquí el contenido de tu publicación técnica...`,
      content_en: `# ${newBlogTitle.trim()}\n\nWrite your technical blog content here...`
    };

    setProductBlogMap(prev => ({
      ...prev,
      [prodId]: [newEntry, ...entries]
    }));
    setSelectedBlogId(newEntry.id);
    setNewBlogTitle('');
    setNewBlogSlug('');
    setIsAddBlogModalOpen(false);
  };

  const handleDeleteBlogEntry = (blogId: string) => {
    if (!selectedProduct) return;
    const prodId = selectedProduct.id;
    const entries = getProductBlogEntries();
    const updated = entries.filter(b => b.id !== blogId);
    setProductBlogMap(prev => ({
      ...prev,
      [prodId]: updated
    }));
    if (selectedBlogId === blogId) {
      setSelectedBlogId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleBlogCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      updateActiveBlog({ coverUrl: result, coverName: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setIsCreating(true);
      const slug = newTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .insert([
          {
            title: newTitle.trim(),
            slug: slug,
            icon_name: 'cubeInCube',
            order_index: products.length,
          },
        ])
        .select()
        .single();

      if (prodError) throw prodError;

      if (prodData) {
        // Crear módulo público por defecto para que aparezca inmediatamente en Técnica
        await supabase.from('modules').insert([
          {
            product_id: prodData.id,
            title: 'General',
            slug: 'general',
            allowed_roles: ['public'],
            order_index: 0,
            is_hidden: false
          }
        ]);

        await fetchProducts();
        setSelectedProductId(prodData.id);
        setNewTitle('');
        setIsAddModalOpen(false);
      }
    } catch (err: any) {
      alert('Error creando documentación: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Cabecera idéntica a Base de Conocimiento y Figma */}
      <div className="w-full bg-container flex items-center justify-between rounded-xl p-4 mb-1 border border-neutral-200/60 dark:border-neutral-800">
        <div>
          <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100">
            {t('tecnica.headerTitle', 'Documentación Técnica')}
          </h3>
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            {t('tecnica.headerSubtitle', 'Gestiona los productos, módulos y documentos de la documentación técnica.')}
          </p>
        </div>

        {/* Botón info estilo portal */}
        <Button
          variant="info"
          isIconButton
          iconName="circleInfo"
          title={t('tecnica.headerSubtitle', 'Gestiona los productos, módulos y documentos de la documentación técnica.')}
        />
      </div>

      {loading ? (
        <div className="w-full bg-container rounded-xl p-12 flex flex-col items-center justify-center min-h-[450px] text-neutral-500">
          <CaralIcon name="loader" size={28} className="animate-spin mb-3 text-sky-500" />
          <p className="text-sm">{t('content.loading', 'Cargando...')}</p>
        </div>
      ) : products.length === 0 ? (
        /* Empty state cuando no hay ninguna documentación */
        <div className="w-full bg-container rounded-xl flex items-center justify-center min-h-[450px] text-center border border-neutral-200 dark:border-neutral-800 p-8">
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 flex items-center justify-center mb-4 shadow-xs">
            <CaralIcon name="upRightFromSquare" size={28} />
          </div>
          <h4 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
            {t('tecnica.emptyTitle', 'Espacio de Documentación Técnica')}
          </h4>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-md mt-2 mb-4">
            {t('tecnica.emptyDescription', 'Estructura y layout inicial listos para integrar la gestión técnica de productos y recursos.')}
          </p>
          <Button
            variant="info"
            isIconButton
            iconName="plus"
            onClick={() => setIsAddModalOpen(true)}
            title={t('tecnica.addDocumentation', 'Agregar Documentación')}
          />
        </div>
      ) : (
        /* Layout de 2 Columnas fiel al diseño de Figma */
        <div className="w-full flex gap-4 h-[calc(100vh-215px)] min-h-[550px]">
          {/* COLUMNA 1: Documentaciones */}
          <div className="w-[320px] shrink-0 bg-container rounded-xl p-4 flex flex-col gap-3 shadow-2xs border border-neutral-200/70 dark:border-neutral-800 overflow-hidden">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                {t('tecnica.documentations', 'Documentaciones')}
              </h4>
              <Button
                variant="info"
                isIconButton
                iconName="plus"
                onClick={() => setIsAddModalOpen(true)}
                title={t('tecnica.addDocumentation', 'Agregar Documentación')}
              />
            </div>

            <div className="h-px w-full bg-neutral-200 dark:bg-neutral-800 my-0.5" />

            {/* Listado de Documentaciones */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1">
              {products.map((prod) => {
                const isSelected = prod.id === selectedProductId;
                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => setSelectedProductId(prod.id)}
                    className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all ${isSelected
                      ? 'bg-info-light text-info-dark! border-info-dark'
                      : 'text-neutral-800 hover:bg-neutral-600 font-medium'
                      }`}
                  >
                    <div className="w-7 h-7 flex items-center justify-center shrink-0">
                      {prod.icon_name && prod.use_brand ? (
                        <Brand name={prod.icon_name as any} size={22} />
                      ) : prod.icon_name ? (
                        <CaralIcon name={prod.icon_name as any} size={22} />
                      ) : (
                        <CaralIcon name="cubeInCube" size={22} />
                      )}
                    </div>
                    <span className="truncate text-base">{prod.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* COLUMNA 2: Detalle y Conexión */}
          <div className="flex-1 bg-container rounded-xl p-6 flex flex-col gap-6 shadow-2xs border border-neutral-200/70 dark:border-neutral-800 overflow-y-auto">
            {/* Barra Superior: Tabs caralstable + Botón Guardar Cambios */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200/70 dark:border-neutral-800/80 pb-4">
              <div className="w-fit">
                <Tabs
                  tabs={[
                    { label: 'API' },
                    { label: 'Index' },
                    { label: 'FAQ' },
                    { label: 'Relece' },
                    { label: 'Blog' }
                  ]}
                  activeIndex={
                    activeTab === 'api' ? 0 :
                      activeTab === 'index' ? 1 :
                        activeTab === 'faq' ? 2 :
                          activeTab === 'release' ? 3 : 4
                  }
                  onChange={(idx) => {
                    const tabs: ('api' | 'index' | 'faq' | 'release' | 'blog')[] = ['api', 'index', 'faq', 'release', 'blog'];
                    setActiveTab(tabs[idx] || 'api');
                  }}
                />
              </div>

              {activeTab !== 'api' && (
                <Button
                  onClick={handleSaveTechnicalDocsConfig}
                  disabled={isSaving}
                  iconName={savedSuccess ? 'check' : 'save'}
                  variant={savedSuccess ? 'success' : 'info'}
                  size='md'
                  className='flex items-center gap-2'
                >
                  {savedSuccess ? '¡Guardado con éxito!' : 'Guardar cambios'}
                </Button>

              )}
            </div>

            {/* Contenido según Tab Activo */}
            {activeTab === 'api' && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    {t('tecnica.connectTitle', 'Conecta con Docuportal')}
                  </h3>
                  <p className="text-sm text-neutral-800 dark:text-neutral-400 mt-1">
                    {t('tecnica.connectSubtitle', 'Sigue este tutorial para conectar tu aplicación o proyecto docuportal con la documentación técnica de este producto.')}
                  </p>
                </div>

                {/* PASO 1: Variables de entorno .env */}
                <div className="flex flex-col gap-2 p-5 rounded-2xl bg-neutral-50/70 dark:bg-neutral-900/50 border border-neutral-200/80 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <h4 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                      Configura el archivo <code className="text-xs px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-sky-600 dark:text-sky-400 font-mono">.env</code> en Docuportal
                    </h4>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 ml-8">
                    Copia y pega estas variables en el archivo <code className="text-xs font-mono text-neutral-800 dark:text-neutral-200">.env</code> o <code className="text-xs font-mono text-neutral-800 dark:text-neutral-200">.env.local</code> en la raíz de tu proyecto <strong>docuportal</strong>:
                  </p>

                  <div className="mt-2 ml-8 relative bg-[#080b11] dark:bg-[#05070a] border border-neutral-800 rounded-xl p-4 font-mono text-xs text-neutral-300 shadow-inner group">
                    <div className="flex justify-between items-start mb-2 border-b border-neutral-800/80 pb-2">
                      <span className="text-neutral-500 text-[11px] font-sans font-medium">.env / .env.local</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName={copied ? 'check' : 'copy'}
                        className={`text-neutral-400 hover:text-white ${copied ? 'text-green-400!' : ''}`}
                        onClick={() => {
                          const envText = `# Configuración de conexión Docuportal\nNEXT_PUBLIC_PORTAL_API_URL=${typeof window !== 'undefined' ? window.location.origin : ''}/api/public/docs\nNEXT_PUBLIC_PRODUCT_SLUG=${selectedProduct?.slug || 'crestone'}\nNEXT_PUBLIC_DOCS_SEARCH_KEY=Docs_search=${selectedProduct?.title || 'Crestone'}`;
                          navigator.clipboard.writeText(envText);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                      >
                        {copied ? '¡Copiado!' : 'Copiar .env'}
                      </Button>
                    </div>
                    <pre className="overflow-x-auto leading-relaxed text-neutral-300">
                      <span className="text-neutral-500"># Configuración de conexión Docuportal</span>{'\n'}
                      <span className="text-sky-400">NEXT_PUBLIC_PORTAL_API_URL</span>=<span className="text-emerald-400">{typeof window !== 'undefined' ? window.location.origin : 'https://portal.seidoranalytics.com'}</span>/api/public/docs{'\n'}
                      <span className="text-sky-400">NEXT_PUBLIC_PRODUCT_SLUG</span>=<span className="text-amber-300">{selectedProduct?.slug || 'crestone'}</span>{'\n'}
                      <span className="text-sky-400">NEXT_PUBLIC_DOCS_SEARCH_KEY</span>=<span className="text-cyan-300">Docs_search={selectedProduct?.title || 'Crestone'}</span>
                    </pre>
                  </div>
                </div>

                {/* PASO 2: Clave de Búsqueda Rápida */}
                <div className="flex flex-col gap-2 p-5 rounded-2xl bg-neutral-50/70 dark:bg-neutral-900/50 border border-neutral-200/80 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <h4 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                      Clave de Búsqueda de Documentación
                    </h4>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 ml-8">
                    Identificador de comando rápido para vincular este producto en el buscador o asistente:
                  </p>

                  <div className="mt-2 ml-8 bg-[#080b11] dark:bg-[#05070a] border border-neutral-800 rounded-xl px-4 py-3 flex items-center justify-between text-sm font-mono shadow-inner">
                    <div className="flex items-center gap-2 select-all overflow-x-auto">
                      <span className="text-cyan-400 font-bold">Docs_search=</span>
                      <span className="text-neutral-200 font-semibold">{selectedProduct?.title || 'Crestone'}</span>
                    </div>

                    <Button
                      variant="ghost"
                      isIconButton
                      iconName={copied ? 'check' : 'copy'}
                      className={`text-neutral-400 hover:text-white shrink-0 ${copied ? 'text-green-400!' : ''}`}
                      onClick={handleCopy}
                      title={copied ? t('tecnica.copied', 'Copiado') : 'Copiar'}
                    />
                  </div>
                </div>

                {/* PASO 3: Endpoint REST Directo */}
                <div className="flex flex-col gap-2 p-5 rounded-2xl bg-neutral-50/70 dark:bg-neutral-900/50 border border-neutral-200/80 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      3
                    </span>
                    <h4 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                      Endpoint de Consumo REST
                    </h4>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 ml-8">
                    Consulta el JSON con todos los módulos y artículos públicos de <strong>{selectedProduct?.title}</strong>:
                  </p>

                  <div className="mt-2 ml-8 bg-[#080b11] dark:bg-[#05070a] border border-neutral-800 rounded-xl px-4 py-3 flex items-center justify-between text-xs font-mono shadow-inner">
                    <div className="flex items-center gap-2 select-all overflow-x-auto text-neutral-300">
                      <span className="text-emerald-400 font-bold">GET</span>
                      <span>/api/public/docs?product={selectedProduct?.slug || 'crestone'}&include_content=true</span>
                    </div>

                    <Button
                      variant="ghost"
                      isIconButton
                      iconName={copied ? 'check' : 'copy'}
                      className={`text-neutral-400 hover:text-white shrink-0 ${copied ? 'text-green-400!' : ''}`}
                      onClick={() => {
                        const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/public/docs?product=${selectedProduct?.slug || 'crestone'}&include_content=true`;
                        navigator.clipboard.writeText(url);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      title={copied ? 'Copiado' : 'Copiar URL'}
                    />
                  </div>
                </div>

                {/* PASO 4: Webhooks para Sincronización Automática */}
                {selectedProduct && (
                  <ProductWebhooksManager
                    productId={selectedProduct.id}
                    productSlug={selectedProduct.slug}
                    productTitle={selectedProduct.title}
                  />
                )}
              </div>
            )}

            {activeTab === 'index' && (
              <div className="flex flex-col gap-6 relative min-h-[500px]">
                {/* Selector de idioma */}
                <div className="relative w-fit">
                  <button
                    type="button"
                    onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100/80 dark:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200/80 dark:hover:bg-neutral-700 transition-all cursor-pointer shadow-2xs"
                  >
                    <span>{indexLang === 'es' ? 'Español' : 'English'}</span>
                    <CaralIcon name="chevronDown" size={14} className={`transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isLangDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-32 bg-container rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 py-1 z-30">
                      <button
                        type="button"
                        onClick={() => {
                          setIndexLang('es');
                          setIsLangDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 ${indexLang === 'es' ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-neutral-700 dark:text-neutral-300'
                          }`}
                      >
                        Español
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIndexLang('en');
                          setIsLangDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 ${indexLang === 'en' ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-neutral-700 dark:text-neutral-300'
                          }`}
                      >
                        English
                      </button>
                    </div>
                  )}
                </div>

                {/* Título y descripción principal del Index (Editables) */}
                {(() => {
                  const currentIndexData = getCurrentIndexData();
                  return (
                    <div className="flex flex-col gap-4">
                      {/* Título editable */}
                      <div className="flex flex-col gap-1">
                        <input
                          type="text"
                          value={currentIndexData.title}
                          onChange={(e) => updateCurrentIndexData({ title: e.target.value })}
                          placeholder="Título de la documentación..."
                          className="text-3xl font-extrabold text-neutral-950 dark:text-neutral-50 tracking-tight bg-transparent border-b border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-sky-500 focus:outline-hidden transition-colors w-full max-w-3xl py-1"
                        />
                      </div>

                      {/* Descripción editable */}
                      <div className="flex flex-col gap-1 ">
                        <textarea
                          rows={4}
                          value={currentIndexData.description}
                          onChange={(e) => updateCurrentIndexData({ description: e.target.value })}
                          placeholder="Escribe la descripción general de la documentación..."
                          className="w-full text-sm text-neutral-800 leading-relaxed hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-sky-500 rounded-xl p-3.5 focus:outline-hidden resize-y transition-colors font-sans"
                        />
                      </div>

                      {/* Subsección editable: Discover {Product} */}
                      <div className="flex flex-col gap-1 mt-2">
                        <input
                          type="text"
                          value={currentIndexData.discoverTitle}
                          onChange={(e) => updateCurrentIndexData({ discoverTitle: e.target.value })}
                          placeholder="Título de la subsección (ej. Discover Crestone)..."
                          className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 bg-transparent border-b border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-sky-500 focus:outline-hidden transition-colors w-full max-w-xl py-1"
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Grilla de Tarjetas con enlaces internos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {/* Tarjeta 1 - Botón de crear entrada */}
                  <div
                    onClick={handleOpenAddEntryDrawer}
                    className="flex flex-col rounded-2xl border border-dashed border-sky-300/80 dark:border-sky-800/80 hover:border-sky-500 dark:hover:border-sky-400 overflow-hidden bg-white/60 dark:bg-neutral-900/60 shadow-2xs hover:shadow-md transition-all group cursor-pointer"
                  >
                    <div className="h-32 bg-slate-100/90 dark:bg-neutral-800/80 flex items-center justify-center border-b border-sky-200/80 dark:border-neutral-700/80">
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-700 text-sky-500 dark:text-sky-400 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                        <CaralIcon name="plus" size={20} />
                      </div>
                    </div>
                    <div className="p-4 flex flex-col gap-1">
                      <h4 className="font-bold text-base text-sky-600 dark:text-sky-400 group-hover:underline cursor-pointer">
                        Create a entry
                      </h4>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-normal">
                        Create a new entry in the documentation.
                      </p>
                    </div>
                  </div>

                  {/* Entradas creadas por el usuario */}
                  {selectedProduct && (indexEntriesMap[selectedProduct.id] || []).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex flex-col rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900 shadow-2xs hover:shadow-md transition-all group relative"
                    >
                      <div className="h-32 bg-slate-100/90 dark:bg-neutral-800/80 flex items-center justify-center border-b border-neutral-200 dark:border-neutral-700/80 p-4 relative">
                        <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-500 dark:text-sky-400 flex items-center justify-center border border-sky-200 dark:border-sky-800 shadow-2xs">
                          <CaralIcon name="fileText" size={20} />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEntry(entry.id);
                          }}
                          className="absolute top-3 right-3 p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Eliminar tarjeta"
                        >
                          <CaralIcon name="trash" size={14} />
                        </button>
                      </div>
                      <div className="p-4 flex flex-col gap-2 flex-1 justify-between">
                        <div>
                          <h4 className="font-bold text-base text-neutral-900 dark:text-neutral-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                            {entry.title}
                          </h4>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-normal mt-1 line-clamp-3">
                            {entry.description}
                          </p>
                        </div>
                        {entry.docSlug && (
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-sky-600 dark:text-sky-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                            <CaralIcon name="link" size={12} />
                            <span className="truncate">/{entry.docSlug}</span>
                            {entry.docTitle && <span className="text-neutral-400 dark:text-neutral-500 truncate">({entry.docTitle})</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Botón Inferior: Copysection */}
                <div className="w-full flex justify-center mt-6 pb-2">
                  <button
                    type="button"
                    onClick={() => {
                      const sectionCode = `<IndexDiscoverGrid product="${selectedProduct?.slug || 'crestone'}" lang="${indexLang}" />`;
                      navigator.clipboard.writeText(sectionCode);
                      setCopiedSection(true);
                      setTimeout(() => setCopiedSection(false), 2000);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-[#080e1b] hover:bg-[#11192e] text-white text-sm font-semibold flex items-center gap-2.5 shadow-lg border border-neutral-700/60 transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <CaralIcon name="code" size={18} className="text-sky-400" />
                    <span>{copiedSection ? '¡Sección Copiada!' : 'Copysection'}</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'faq' && (
              <div className="flex flex-col gap-6 relative min-h-[500px]">
                {/* Selector de idioma */}
                <div className="relative w-fit">
                  <button
                    type="button"
                    onClick={() => setIsFaqLangDropdownOpen(!isFaqLangDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100/80 dark:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200/80 dark:hover:bg-neutral-700 transition-all cursor-pointer shadow-2xs"
                  >
                    <span>{faqLang === 'es' ? 'Español' : 'English'}</span>
                    <CaralIcon
                      name="chevronDown"
                      size={14}
                      className={`transition-transform ${isFaqLangDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isFaqLangDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-32 bg-container rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 py-1 z-30">
                      <button
                        type="button"
                        onClick={() => {
                          setFaqLang('es');
                          setIsFaqLangDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 ${faqLang === 'es'
                          ? 'text-sky-600 dark:text-sky-400 font-bold'
                          : 'text-neutral-700 dark:text-neutral-300'
                          }`}
                      >
                        Español
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFaqLang('en');
                          setIsFaqLangDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 ${faqLang === 'en'
                          ? 'text-sky-600 dark:text-sky-400 font-bold'
                          : 'text-neutral-700 dark:text-neutral-300'
                          }`}
                      >
                        English
                      </button>
                    </div>
                  )}
                </div>

                {/* Título y descripción de FAQ (Editables) */}
                {(() => {
                  const currentFaqData = getCurrentFaqData();
                  return (
                    <div className="flex flex-col gap-4">
                      {/* Título editable */}
                      <div className="flex flex-col gap-1">
                        <input
                          type="text"
                          value={currentFaqData.title}
                          onChange={(e) => updateCurrentFaqData({ title: e.target.value })}
                          placeholder="Frequently asked questions..."
                          className="text-3xl font-extrabold text-neutral-950 dark:text-neutral-50 tracking-tight bg-transparent border-b border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-sky-500 focus:outline-hidden transition-colors w-full max-w-3xl py-1"
                        />
                      </div>

                      {/* Descripción editable */}
                      <div className="flex flex-col gap-1">
                        <textarea
                          rows={4}
                          value={currentFaqData.description}
                          onChange={(e) => updateCurrentFaqData({ description: e.target.value })}
                          placeholder="Escribe la descripción de las preguntas frecuentes..."
                          className="w-full text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-sky-500 rounded-xl p-3.5 focus:outline-hidden resize-y transition-colors font-sans"
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Botón "+ Add question" según el diseño de Figma */}
                <div
                  onClick={handleOpenAddFaqDrawer}
                  className="bg-neutral-200/70 hover:bg-neutral-300/70 dark:bg-neutral-800/80 dark:hover:bg-neutral-700/80 rounded-xl p-3.5 flex items-center gap-2.5 transition-colors cursor-pointer group shadow-2xs border border-transparent hover:border-neutral-300 dark:hover:border-neutral-700"
                >
                  <div className="text-neutral-800 dark:text-neutral-200 group-hover:scale-110 transition-transform">
                    <CaralIcon name="plus" size={18} />
                  </div>
                  <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Add question
                  </span>
                </div>

                {/* Lista de preguntas y respuestas */}
                <div className="flex flex-col gap-3">
                  {selectedProduct && getCurrentFaqEntries().length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 text-sm text-neutral-500 dark:text-neutral-400">
                      No hay preguntas agregadas todavía en {faqLang === 'es' ? 'Español' : 'Inglés'}. Haz clic en <strong>Add question</strong> para agregar la primera.
                    </div>
                  ) : (
                    selectedProduct &&
                    getCurrentFaqEntries().map((faq, idx) => {
                      const isExpanded = expandedFaqIds.includes(faq.id);
                      return (
                        <div
                          key={faq.id}
                          className="flex flex-col rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-2xs transition-all"
                        >
                          {/* Cabecera de la pregunta */}
                          <div
                            onClick={() => toggleFaqExpand(faq.id)}
                            className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors select-none"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 text-xs font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <h4 className="font-semibold text-base text-neutral-900 dark:text-neutral-100 truncate">
                                {faq.question}
                              </h4>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditFaqDrawer(faq);
                                }}
                                iconName='edit'
                                title='Editar'
                                isIconButton
                                variant='ghost'
                                size='sm'
                              />

                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFaq(faq.id);
                                }}
                                iconName='trash'
                                title='Eliminar'
                                isIconButton
                                variant='danger'
                                hasBorder
                                size='sm'
                              />

                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFaqExpand(faq.id);
                                }}
                                iconName={isExpanded ? 'chevronUp' : 'chevronDown'}
                                title='Ver'
                                isIconButton
                                variant='ghost'
                                size='sm'
                                className={`text-neutral-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
                                  }`}
                              />


                            </div>
                          </div>

                          {/* Respuesta expandible */}
                          {isExpanded && (
                            <div className="px-5 pb-5 pt-1 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed border-t border-neutral-100 dark:border-neutral-800/60 bg-neutral-50/40 dark:bg-neutral-900/40 flex flex-col gap-3">
                              <p className="whitespace-pre-wrap">{faq.answer}</p>

                              {faq.docSlug && (
                                <div className="flex items-center gap-1.5 text-xs font-medium text-sky-600 dark:text-sky-400 pt-2 border-t border-neutral-200/60 dark:border-neutral-800">
                                  <CaralIcon name="link" size={13} />
                                  <span>Documento vinculado:</span>
                                  <span className="font-mono underline">/{faq.docSlug}</span>
                                  {faq.docTitle && <span className="text-neutral-500">({faq.docTitle})</span>}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {activeTab === 'release' && (
              <div className="flex flex-col gap-6 relative min-h-[500px]">
                {/* Contenedor de 2 columnas según el diseño de Figma */}
                <div className="flex sm:flex-col md:flex-row gap-6 items-start w-full">
                  {/* Columna Izquierda: Lista de Versiones */}
                  <div className="sm:w-full md:w-64 shrink-0 flex flex-col gap-2.5 pb-4 md:pb-0 md:pr-6">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                        Versiones ({getProductReleases().length})
                      </span>
                    </div>

                    {getProductReleases().map((rel) => {
                      const isActive = (getActiveRelease()?.id === rel.id);
                      return (
                        <div
                          key={rel.id}
                          onClick={() => setSelectedVersionId(rel.id)}
                          className={`group flex items-center justify-between py-3 px-2 rounded-xl transition-all cursor-pointer font-semibold text-sm ${isActive
                            ? 'bg-info-main text-white shadow-xs font-bold'
                            : 'bg-neutral-100/70 hover:bg-neutral-200/70 dark:bg-neutral-800/60 dark:hover:bg-neutral-700/70 text-neutral-800 dark:text-neutral-200'
                            }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="truncate">{rel.version}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {rel.isPublished ? (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                                }`}>
                                Publicada
                              </span>
                            ) : (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${isActive ? 'bg-white/20 text-white' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                                }`}>
                                Borrador
                              </span>
                            )}


                          </div>
                        </div>
                      );
                    })}

                    {/* Botón "+ Add Version" */}
                    <Button
                      onClick={() => {
                        setNewVersionTag('');
                        setIsAddVersionModalOpen(true);
                      }}
                      variant='light'
                      iconName='plus'
                      className='border-neutral-800'
                    >
                      Agregar Versión
                    </Button>

                  </div>

                  {/* Columna Derecha: Detalle de la versión activa */}
                  {(() => {
                    const activeRelease = getActiveRelease();
                    if (!activeRelease) {
                      return (
                        <div className="flex-1 p-12 text-center text-sm text-neutral-500">
                          Selecciona o agrega una versión para ver sus detalles.
                        </div>
                      );
                    }

                    const featuresList = activeRelease.features || [];

                    return (
                      <div className="flex-1 w-full flex flex-col gap-6">
                        {/* Barra Superior: Selector de Idioma y Publicar versión */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between pb-2 border-b border-neutral-200/70 dark:border-neutral-800">
                          {/* Selector de idioma para la versión actual */}
                          <div className="relative w-fit">
                            <button
                              type="button"
                              onClick={() => setIsReleaseLangDropdownOpen(!isReleaseLangDropdownOpen)}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100/80 dark:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200/80 dark:hover:bg-neutral-700 transition-all cursor-pointer shadow-2xs"
                            >
                              <span>{releaseLang === 'es' ? 'Español' : 'English'}</span>
                              <CaralIcon
                                name="chevronDown"
                                size={14}
                                className={`transition-transform ${isReleaseLangDropdownOpen ? 'rotate-180' : ''}`}
                              />
                            </button>

                            {isReleaseLangDropdownOpen && (
                              <div className="absolute top-full left-0 mt-1 w-32 bg-container rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 py-1 z-30">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReleaseLang('es');
                                    setIsReleaseLangDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 ${releaseLang === 'es'
                                    ? 'text-sky-600 dark:text-sky-400 font-bold'
                                    : 'text-neutral-700 dark:text-neutral-300'
                                    }`}
                                >
                                  Español
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReleaseLang('en');
                                    setIsReleaseLangDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 ${releaseLang === 'en'
                                    ? 'text-sky-600 dark:text-sky-400 font-bold'
                                    : 'text-neutral-700 dark:text-neutral-300'
                                    }`}
                                >
                                  English
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Controles de Publicación y Acciones */}
                          <div className="flex items-center gap-3">
                            <div className="bg-sky-100/90 dark:bg-sky-950/50 border border-sky-200/80 dark:border-sky-800/80 rounded-xl py-2 px-3.5 flex items-center gap-3 shadow-2xs w-fit">
                              <span className="font-semibold text-xs text-sky-800 dark:text-sky-300">
                                Publicar versión
                              </span>

                              <button
                                type="button"
                                onClick={() => updateActiveRelease({ isPublished: !activeRelease.isPublished })}
                                className={`w-10 h-5.5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 ${activeRelease.isPublished ? 'bg-sky-500 justify-end' : 'bg-neutral-300 dark:bg-neutral-700 justify-start'
                                  }`}
                                title={activeRelease.isPublished ? 'Despublicar versión' : 'Publicar versión'}
                              >
                                <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                              </button>
                            </div>
                            <Button
                              variant='danger'
                              onClick={() => handleDeleteRelease(activeRelease.id)}
                              title='Eliminar versión'
                              iconName='trash'
                              isIconButton
                            />
                          </div>
                        </div>

                        {/* 1. Datos Generales de la Versión (Número, Título, Descripción) */}
                        <div className="flex flex-col gap-4 p-5 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200/80 dark:border-neutral-800">
                          {/* Número de versión */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs uppercase tracking-wider text-neutral-800">
                              1. Número de Versión
                            </label>
                            <input
                              type="text"
                              value={activeRelease.version}
                              onChange={(e) => updateActiveRelease({ version: e.target.value })}
                              placeholder="Ej. 1.97.02"
                              className="font-mono text-xl font-bold text-neutral-900 p-2 rounded-xl border-transparent focus:outline-none focus:border-none bg-transparent  w-full"
                            />
                          </div>

                          {/* Título del Release */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs uppercase tracking-wider text-neutral-800">
                              2. Título de la Versión ({releaseLang.toUpperCase()})
                            </label>
                            <input
                              type="text"
                              value={activeRelease.title}
                              onChange={(e) => updateActiveRelease({ title: e.target.value })}
                              placeholder="Ej. Actualización de motor Crestone v1.97.02"
                              className="font-mono text-xl font-bold text-neutral-900 p-2 rounded-xl border-transparent focus:outline-none focus:border-none bg-transparent  w-full"
                            />
                          </div>

                          {/* Descripción general del Release */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs uppercase tracking-wider text-neutral-800">
                              3. Descripción General ({releaseLang.toUpperCase()})
                            </label>
                            <textarea
                              rows={3}
                              value={activeRelease.description}
                              onChange={(e) => updateActiveRelease({ description: e.target.value })}
                              placeholder="Describe un resumen general de lo que incluye este release..."
                              className="w-full text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 focus:border-sky-500 focus:outline-hidden resize-y transition-colors font-sans"
                            />
                          </div>
                        </div>

                        {/* 2. Sección de Features / Novedades de la Versión */}
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CaralIcon name="lightning" size={20} className="text-sky-500" />
                              <h4 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                                Features / Novedades de la Versión
                              </h4>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-bold">
                                {featuresList.length}
                              </span>
                            </div>

                            <Button
                              variant="info"
                              size="sm"
                              iconName="plus"
                              onClick={handleAddFeature}
                              className="flex items-center gap-1.5"
                            >
                              <span>Agregar Feature</span>
                            </Button>
                          </div>

                          {featuresList.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/30 p-8 flex flex-col items-center justify-center text-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-500 flex items-center justify-center">
                                <CaralIcon name="sparkles" size={22} />
                              </div>
                              <div className="flex flex-col gap-1 max-w-sm">
                                <h5 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                                  No hay features agregadas a esta versión
                                </h5>
                                <p className="text-xs text-neutral-500">
                                  Agrega cada una de las funcionalidades destacadas de esta versión con su título, descripción y dos imágenes (GIF y PNG/JPG).
                                </p>
                              </div>
                              <Button
                                variant="info"
                                size="sm"
                                iconName="plus"
                                onClick={handleAddFeature}
                              >
                                Agregar primera Feature
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-5">
                              {featuresList.map((feat, fIdx) => (
                                <div
                                  key={feat.id || fIdx}
                                  className="rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/60 p-5 flex flex-col gap-4 shadow-2xs"
                                >
                                  {/* Cabecera de la Feature */}
                                  <div className="flex items-center justify-between pb-3 border-b border-neutral-200/70 dark:border-neutral-800">
                                    <div className="flex items-center gap-2.5">
                                      <span className="w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                        {fIdx + 1}
                                      </span>
                                      <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                                        Feature #{fIdx + 1}
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteFeature(feat.id)}
                                      className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                                      title="Eliminar Feature"
                                    >
                                      <CaralIcon name="trash" size={16} />
                                    </button>
                                  </div>

                                  {/* Título e Ícono de la Feature */}
                                  <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                                      Título e Ícono de la Feature * ({releaseLang.toUpperCase()})
                                    </label>
                                    <div className="flex items-center gap-2">
                                      {/* Selector de Ícono para la Feature */}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setFeatureIconPicker({
                                            isOpen: true,
                                            featureId: feat.id,
                                            initialIconName: feat.iconName || '',
                                            initialIsBrand: feat.isBrandIcon || false,
                                          })
                                        }
                                        className="h-10 px-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 shrink-0 transition-colors cursor-pointer group shadow-2xs"
                                        title={feat.iconName ? `Ícono: ${feat.iconName} (clic para cambiar)` : "Seleccionar ícono para esta feature"}
                                      >
                                        {feat.iconName ? (
                                          feat.isBrandIcon ? (
                                            <Brand name={feat.iconName as any} size={20} />
                                          ) : (
                                            <CaralIcon name={feat.iconName as any} size={20} className="text-sky-500" />
                                          )
                                        ) : (
                                          <div className="w-5 h-5 rounded-lg border border-dashed border-neutral-400 dark:border-neutral-600 flex items-center justify-center text-neutral-400 group-hover:text-sky-500 group-hover:border-sky-500 transition-colors">
                                            <CaralIcon name="plus" size={12} />
                                          </div>
                                        )}
                                        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 max-w-[100px] truncate">
                                          {feat.iconName || "Elegir Ícono"}
                                        </span>
                                        {feat.iconName && (
                                          <span
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              handleUpdateFeature(feat.id, { iconName: '', isBrandIcon: false });
                                            }}
                                            className="p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-red-500 transition-colors"
                                            title="Quitar ícono"
                                          >
                                            <CaralIcon name="x" size={12} />
                                          </span>
                                        )}
                                      </button>

                                      <input
                                        type="text"
                                        value={feat.title}
                                        onChange={(e) => handleUpdateFeature(feat.id, { title: e.target.value })}
                                        placeholder="Ej. Conector Snowflake de alta velocidad"
                                        className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 focus:border-sky-500 focus:outline-hidden transition-colors w-full h-10"
                                      />
                                    </div>
                                  </div>

                                  {/* Descripción de la Feature */}
                                  <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                                      Descripción de la Feature * ({releaseLang.toUpperCase()})
                                    </label>
                                    <textarea
                                      rows={3}
                                      value={feat.description}
                                      onChange={(e) => handleUpdateFeature(feat.id, { description: e.target.value })}
                                      placeholder="Describe los detalles, capacidades o mejoras de esta funcionalidad..."
                                      className="w-full text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed px-3.5 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 focus:border-sky-500 focus:outline-hidden resize-y transition-colors font-sans"
                                    />
                                  </div>

                                  {/* Subida de 2 Imágenes: PNG/JPG y GIF */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                    {/* 1. Imagen Estática (PNG / JPG / WEBP) */}
                                    <div className="flex flex-col gap-2">
                                      <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                                        <CaralIcon name="image" size={14} className="text-sky-500" />
                                        <span>1. Imagen (PNG / JPG)</span>
                                      </label>
                                      <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/50 p-3.5 min-h-[140px] flex flex-col items-center justify-center gap-2">
                                        {feat.pngUrl ? (
                                          <div className="relative w-full flex flex-col items-center group">
                                            <img
                                              src={feat.pngUrl}
                                              alt={`Feature ${fIdx + 1} PNG`}
                                              className="max-h-32 rounded-lg object-contain border border-neutral-200 dark:border-neutral-700 shadow-2xs"
                                            />
                                            <div className="mt-2 flex items-center justify-between w-full px-1">
                                              <span className="text-[11px] text-neutral-500 font-mono truncate max-w-[130px]">
                                                {feat.pngName || 'image.png'}
                                              </span>
                                              <div className="flex items-center gap-2">
                                                <label className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer">
                                                  Cambiar
                                                  <input
                                                    type="file"
                                                    accept="image/png,image/jpeg,image/jpg,image/webp"
                                                    className="hidden"
                                                    onChange={(e) => handleFeatureFileUpload(feat.id, 'png', e)}
                                                  />
                                                </label>
                                                <button
                                                  type="button"
                                                  onClick={() => handleFeatureFileRemove(feat.id, 'png')}
                                                  className="text-xs text-red-500 hover:underline font-semibold cursor-pointer"
                                                >
                                                  Eliminar
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          <label className="px-4 py-2 rounded-lg bg-[#07153a] hover:bg-[#0e2154] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-2xs transition-all hover:scale-105">
                                            <CaralIcon name="plus" size={14} className="text-sky-400" />
                                            <span>Add image.png / jpg</span>
                                            <input
                                              type="file"
                                              accept="image/png,image/jpeg,image/jpg,image/webp"
                                              className="hidden"
                                              onChange={(e) => handleFeatureFileUpload(feat.id, 'png', e)}
                                            />
                                          </label>
                                        )}
                                      </div>
                                    </div>

                                    {/* 2. Animación GIF (.gif) */}
                                    <div className="flex flex-col gap-2">
                                      <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                                        <CaralIcon name="video" size={14} className="text-amber-500" />
                                        <span>2. Animación (.GIF)</span>
                                      </label>
                                      <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/50 p-3.5 min-h-[140px] flex flex-col items-center justify-center gap-2">
                                        {feat.gifUrl ? (
                                          <div className="relative w-full flex flex-col items-center group">
                                            <img
                                              src={feat.gifUrl}
                                              alt={`Feature ${fIdx + 1} GIF`}
                                              className="max-h-32 rounded-lg object-contain border border-neutral-200 dark:border-neutral-700 shadow-2xs"
                                            />
                                            <div className="mt-2 flex items-center justify-between w-full px-1">
                                              <span className="text-[11px] text-neutral-500 font-mono truncate max-w-[130px]">
                                                {feat.gifName || 'image.gif'}
                                              </span>
                                              <div className="flex items-center gap-2">
                                                <label className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer">
                                                  Cambiar
                                                  <input
                                                    type="file"
                                                    accept="image/gif"
                                                    className="hidden"
                                                    onChange={(e) => handleFeatureFileUpload(feat.id, 'gif', e)}
                                                  />
                                                </label>
                                                <button
                                                  type="button"
                                                  onClick={() => handleFeatureFileRemove(feat.id, 'gif')}
                                                  className="text-xs text-red-500 hover:underline font-semibold cursor-pointer"
                                                >
                                                  Eliminar
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          <label className="px-4 py-2 rounded-lg bg-[#07153a] hover:bg-[#0e2154] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-2xs transition-all hover:scale-105">
                                            <CaralIcon name="plus" size={14} className="text-sky-400" />
                                            <span>Add image.gif</span>
                                            <input
                                              type="file"
                                              accept="image/gif"
                                              className="hidden"
                                              onChange={(e) => handleFeatureFileUpload(feat.id, 'gif', e)}
                                            />
                                          </label>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}

                              {/* Botón inferior para agregar feature */}
                              <button
                                type="button"
                                onClick={handleAddFeature}
                                className="w-full py-3 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-sky-500 dark:hover:border-sky-400 bg-white/60 dark:bg-neutral-900/40 text-neutral-700 dark:text-neutral-300 text-sm font-semibold flex items-center justify-center gap-2 hover:text-sky-600 dark:hover:text-sky-400 transition-all cursor-pointer shadow-2xs"
                              >
                                <CaralIcon name="plus" size={16} />
                                <span>Agregar otra Feature</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>


              </div>
            )}

            {activeTab === 'blog' && (
              <div className="flex flex-col gap-6 relative min-h-[500px]">
                {/* Contenedor de 2 columnas para Blog */}
                <div className="flex gap-6 items-start w-full">
                  {/* Columna Izquierda: Lista de Entradas de Blog */}
                  <div className="w-64 shrink-0 flex flex-col gap-2.5 border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800 pb-4 md:pb-0 md:pr-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                      Entradas de Blog
                    </span>

                    {getProductBlogEntries().length === 0 ? (
                      <div className="p-4 text-xs text-neutral-400 text-center rounded-xl border border-dashed border-neutral-300 dark:border-neutral-800">
                        No hay entradas aún.
                      </div>
                    ) : (
                      getProductBlogEntries().map((entry) => {
                        const isActive = (getActiveBlog()?.id === entry.id);
                        return (
                          <div
                            key={entry.id}
                            onClick={() => setSelectedBlogId(entry.id)}
                            className={`flex flex-col gap-1 p-3 rounded-xl transition-all cursor-pointer text-sm ${isActive
                              ? 'bg-sky-400/90 dark:bg-sky-500 text-white shadow-xs font-semibold'
                              : 'bg-neutral-100/70 hover:bg-neutral-200/70 dark:bg-neutral-800/60 dark:hover:bg-neutral-700/70 text-neutral-800 dark:text-neutral-200'
                              }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate font-medium">
                                {blogLang === 'en' && entry.title_en ? entry.title_en : (entry.title_es || entry.title)}
                              </span>
                              {entry.isPublished ? (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                                  }`}>
                                  Publicada
                                </span>
                              ) : (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                                  }`}>
                                  Borrador
                                </span>
                              )}
                            </div>
                            <span className={`text-[11px] font-mono truncate ${isActive ? 'text-white/80' : 'text-neutral-500 dark:text-neutral-400'}`}>
                              /{entry.slug}
                            </span>
                          </div>
                        );
                      })
                    )}

                    {/* Botón "+ Add Post" */}
                    <button
                      type="button"
                      onClick={() => {
                        setNewBlogTitle('');
                        setNewBlogSlug('');
                        setIsAddBlogModalOpen(true);
                      }}
                      className="mt-2 w-full py-2.5 px-4 rounded-xl border border-dashed border-neutral-300 hover:border-sky-500 dark:border-neutral-700 dark:hover:border-sky-400 bg-white/40 dark:bg-neutral-900/40 text-neutral-700 dark:text-neutral-300 text-sm font-semibold flex items-center justify-center gap-2 hover:text-sky-600 dark:hover:text-sky-400 transition-all cursor-pointer shadow-2xs"
                    >
                      <CaralIcon name="plus" size={16} />
                      <span>Add Post</span>
                    </button>
                  </div>

                  {/* Columna Derecha: Editor de la Entrada Activa con Milkdown */}
                  {(() => {
                    const activeBlog = getActiveBlog();
                    if (!activeBlog) {
                      return (
                        <div className="flex-1 p-12 text-center text-sm text-neutral-500">
                          Selecciona o crea una entrada de blog para editarla.
                        </div>
                      );
                    }

                    return (
                      <div className="flex-1 w-full flex flex-col gap-5">
                        {/* Barra Superior: Selector de Idioma, Publicar entrada y Eliminar */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                          {/* Selector de idioma para la entrada actual */}
                          <div className="relative w-fit">
                            <button
                              type="button"
                              onClick={() => setIsBlogLangDropdownOpen(!isBlogLangDropdownOpen)}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100/80 dark:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200/80 dark:hover:bg-neutral-700 transition-all cursor-pointer shadow-2xs"
                            >
                              <span>{blogLang === 'es' ? 'Español' : 'English'}</span>
                              <CaralIcon
                                name="chevronDown"
                                size={14}
                                className={`transition-transform ${isBlogLangDropdownOpen ? 'rotate-180' : ''}`}
                              />
                            </button>

                            {isBlogLangDropdownOpen && (
                              <div className="absolute top-full left-0 mt-1 w-32 bg-container rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 py-1 z-30">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBlogLang('es');
                                    setIsBlogLangDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 ${blogLang === 'es'
                                    ? 'text-sky-600 dark:text-sky-400 font-bold'
                                    : 'text-neutral-700 dark:text-neutral-300'
                                    }`}
                                >
                                  Español
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBlogLang('en');
                                    setIsBlogLangDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 ${blogLang === 'en'
                                    ? 'text-sky-600 dark:text-sky-400 font-bold'
                                    : 'text-neutral-700 dark:text-neutral-300'
                                    }`}
                                >
                                  English
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Switch Publicar entrada */}
                            <div className="bg-sky-100/90 dark:bg-sky-950/50 border border-sky-200/80 dark:border-sky-800/80 rounded-xl py-2 px-3.5 flex items-center gap-3 shadow-2xs w-fit">
                              <span className="font-semibold text-xs text-sky-800 dark:text-sky-300">
                                Publicar entrada
                              </span>

                              <button
                                type="button"
                                onClick={() => updateActiveBlog({ isPublished: !activeBlog.isPublished })}
                                className={`w-10 h-5.5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 ${activeBlog.isPublished ? 'bg-sky-500 justify-end' : 'bg-neutral-300 dark:bg-neutral-700 justify-start'
                                  }`}
                                title={activeBlog.isPublished ? 'Despublicar entrada' : 'Publicar entrada'}
                              >
                                <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                              </button>
                            </div>

                            {/* Botón Eliminar entrada */}
                            <Button
                              variant='danger'
                              onClick={() => handleDeleteBlogEntry(activeBlog.id)}
                              title='Eliminar'
                              iconName='trash'
                              isIconButton
                            />

                          </div>
                        </div>

                        {/* Título editable */}
                        <div className="flex flex-col gap-1">
                          <input
                            type="text"
                            value={activeBlog.title}
                            onChange={(e) => updateActiveBlog({ title: e.target.value })}
                            placeholder="Título del artículo de blog..."
                            className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 bg-transparent border-b border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-sky-500 focus:outline-hidden transition-colors w-full py-1"
                          />
                        </div>



                        {/* Slug editable */}
                        <div className="flex items-center gap-2 text-md text-neutral-800 bg-neutral-200 rounded-lg px-3 py-2 border border-neutral-200 dark:border-neutral-800">
                          <CaralIcon name="link" size={26} />
                          <span className="shrink-0">/blog/</span>
                          <input
                            type="text"
                            value={activeBlog.slug}
                            onChange={(e) => updateActiveBlog({ slug: e.target.value })}
                            placeholder="slug-del-articulo"
                            className="bg-transparent border-none focus:outline-none w-full font-mono text-neutral-900 dark:text-neutral-200"
                          />
                        </div>

                        {/* Portada / Cover Image */}
                        <div className="flex flex-col gap-2">
                          <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-100/70 dark:bg-neutral-800/50 p-3 flex items-center justify-between">
                            {activeBlog.coverUrl ? (
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={activeBlog.coverUrl}
                                    alt="Cover preview"
                                    className="w-12 h-12 object-cover rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-2xs"
                                  />
                                  <span className="text-xs text-neutral-600 dark:text-neutral-400 truncate max-w-xs font-mono">
                                    {activeBlog.coverName || 'portada.png'}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => updateActiveBlog({ coverUrl: '', coverName: '' })}
                                  className="text-xs text-red-500 hover:underline font-semibold cursor-pointer"
                                >
                                  Eliminar portada
                                </button>
                              </div>
                            ) : (
                              <label className="px-4 py-2 rounded-lg bg-[#07153a] hover:bg-[#0e2154] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm transition-all hover:scale-105">
                                <CaralIcon name="plus" size={14} className="text-sky-400" />
                                <span>Add cover.png</span>
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp"
                                  className="hidden"
                                  onChange={handleBlogCoverUpload}
                                />
                              </label>
                            )}
                          </div>
                        </div>

                        {/* Editor Milkdown Simple */}
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                            Contenido del Blog (Milkdown Editor)
                          </label>
                          <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 shadow-2xs p-4 min-h-[400px]">
                            <MilkdownEditorWrapper
                              key={`${activeBlog.id}_${blogLang}`}
                              content={activeBlog.content || ''}
                              onChange={(md) => updateActiveBlog({ content: md })}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Botón Inferior: Copysection */}
                <div className="w-full flex justify-center mt-6 pb-2">
                  <button
                    type="button"
                    onClick={() => {
                      const sectionCode = `<BlogSection product="${selectedProduct?.slug || 'crestone'}" slug="${getActiveBlog()?.slug || 'latest'}" lang="${blogLang}" />`;
                      navigator.clipboard.writeText(sectionCode);
                      setCopiedBlogSection(true);
                      setTimeout(() => setCopiedBlogSection(false), 2000);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-[#080e1b] hover:bg-[#11192e] text-white text-sm font-semibold flex items-center gap-2.5 shadow-lg border border-neutral-700/60 transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <CaralIcon name="code" size={18} className="text-sky-400" />
                    <span>{copiedBlogSection ? '¡Sección Blog Copiada!' : 'Copysection'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal para Crear Nueva Documentación */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={t('tecnica.newDocModalTitle', 'Nueva Documentación Técnica')}
        width="sm"
      >
        <form onSubmit={handleCreateDoc} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
              {t('tecnica.docNameLabel', 'Nombre del Producto o Documentación')}
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={t('tecnica.docNamePlaceholder', 'Ej. Crestone, Portal Core...')}
              className="w-full px-3 py-2 border rounded-lg bg-neutral-50 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsAddModalOpen(false)}
            >
              {t('tecnica.cancelButton', 'Cancelar')}
            </Button>
            <Button
              variant="info"
              type="submit"
              isLoading={isCreating}
            >
              {t('tecnica.createButton', 'Crear')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Drawer para Crear Entrada en Index */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Crear Entrada en Index"
        position="right"
        size="m"
        className="dark:bg-neutral-900 dark:text-white p-0 flex flex-col"
      >
        <form onSubmit={handleSaveEntry} className="flex flex-col h-full justify-between p-6">
          <div className="flex flex-col gap-5">
            {/* Título */}
            <Input
              label="Título de la entrada"
              required
              value={entryTitle}
              onChange={(e) => setEntryTitle(e.target.value)}
              placeholder="Ej. Introducción y Arquitectura"
            />

            {/* Descripción */}
            <Input
              label="Descripción"
              type="textarea"
              rows={4}
              required
              value={entryDescription}
              onChange={(e) => setEntryDescription(e.target.value)}
              placeholder="Breve resumen o contenido que describe esta sección..."
            />



            {/* Enlace a Base de Conocimientos Pública */}
            <div className="flex flex-col gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Vincular con Base de Conocimientos
                </span>
                {loadingPublicDocs && <span className="text-xs text-sky-500 font-normal">Cargando...</span>}
              </div>

              {loadingPublicDocs ? (
                <div className="p-3 text-xs text-neutral-500 animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                  Buscando módulos y artículos públicos...
                </div>
              ) : publicModules.length === 0 ? (
                <div className="p-3.5 rounded-xl border border-dashed border-amber-300 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  No hay módulos públicos registrados para este producto. Puedes continuar sin vincular o crear módulos públicos primero en la Base de Conocimientos.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {/* 1. Módulos */}
                  <Select
                    label="1. Módulo"
                    value={selectedModuleId}
                    onChange={(e) => {
                      setSelectedModuleId(e.target.value);
                      setSelectedSectionId('');
                      setEntryLinkedDocId('');
                    }}
                  >
                    <option value="">-- Todos los módulos públicos --</option>
                    {publicModules.map((m) => (
                      <option key={m.id} value={m.id}>
                        {extractLanguageContent(m.title, indexLang) || m.title || 'Módulo sin título'}
                      </option>
                    ))}
                  </Select>

                  {/* 2. Secciones */}
                  <Select
                    label="2. Sección"
                    value={selectedSectionId}
                    onChange={(e) => {
                      setSelectedSectionId(e.target.value);
                      setEntryLinkedDocId('');
                    }}
                    disabled={availableSections.length === 0}
                  >
                    <option value="">
                      {availableSections.length === 0 ? '-- Sin secciones en este módulo --' : '-- Todas las secciones --'}
                    </option>
                    {availableSections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.title}
                      </option>
                    ))}
                  </Select>

                  {/* 3. Documentos */}
                  <Select
                    label="3. Documento"
                    value={entryLinkedDocId}
                    onChange={(e) => setEntryLinkedDocId(e.target.value)}
                    disabled={filteredDocs.length === 0}
                  >
                    <option value="">
                      {filteredDocs.length === 0 ? '-- No hay documentos disponibles --' : '-- Seleccionar documento --'}
                    </option>
                    {filteredDocs.map((doc) => {
                      const docName = extractLanguageContent(doc.title, indexLang) || doc.title || doc.slug;
                      return (
                        <option key={doc.id} value={doc.id}>
                          {docName} ({doc.slug ? `/${doc.slug}` : 'sin slug'})
                        </option>
                      );
                    })}
                  </Select>
                </div>
              )}
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Selecciona el módulo y la sección para filtrar y vincular el documento público correspondiente.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-800 mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDrawerOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="info"
              disabled={!entryTitle.trim() || !entryDescription.trim()}
            >
              Guardar Entrada
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Drawer para Crear/Editar FAQ */}
      <Drawer
        isOpen={isFaqDrawerOpen}
        onClose={() => setIsFaqDrawerOpen(false)}
        title={editingFaqId ? 'Editar Pregunta Frecuente' : 'Agregar Pregunta Frecuente'}
        position="right"
        size="m"
        className="dark:bg-neutral-900 dark:text-white p-0 flex flex-col"
      >
        <form onSubmit={handleSaveFaq} className="flex flex-col h-full justify-between p-6">
          <div className="flex flex-col gap-5">
            {/* Pregunta */}
            <Input
              label="Pregunta *"
              required
              value={faqQuestion}
              onChange={(e) => setFaqQuestion(e.target.value)}
              placeholder="Ej. ¿Cómo puedo configurar la autenticación de la API?"
            />

            {/* Respuesta */}
            <Input
              label="Respuesta *"
              type="textarea"
              rows={4}
              required
              value={faqAnswer}
              onChange={(e) => setFaqAnswer(e.target.value)}
              placeholder="Escribe la respuesta detallada a esta pregunta..."
            />

            {/* Enlace opcional a Base de Conocimientos Pública */}
            <div className="flex flex-col gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Vincular con Base de Conocimientos (Opcional)
                </span>
                {loadingPublicDocs && <span className="text-xs text-sky-500 font-normal">Cargando...</span>}
              </div>

              {loadingPublicDocs ? (
                <div className="p-3 text-xs text-neutral-500 animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                  Buscando módulos y artículos públicos...
                </div>
              ) : publicModules.length === 0 ? (
                <div className="p-3.5 rounded-xl border border-dashed border-amber-300 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  No hay módulos públicos registrados para este producto. Puedes guardar la pregunta sin vinculación.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {/* 1. Módulos */}
                  <Select
                    label="1. Módulo"
                    value={selectedModuleId}
                    onChange={(e) => {
                      setSelectedModuleId(e.target.value);
                      setSelectedSectionId('');
                      setFaqLinkedDocId('');
                    }}
                  >
                    <option value="">-- Todos los módulos públicos --</option>
                    {publicModules.map((m) => (
                      <option key={m.id} value={m.id}>
                        {extractLanguageContent(m.title, faqLang) || m.title || 'Módulo sin título'}
                      </option>
                    ))}
                  </Select>

                  {/* 2. Secciones */}
                  <Select
                    label="2. Sección"
                    value={selectedSectionId}
                    onChange={(e) => {
                      setSelectedSectionId(e.target.value);
                      setFaqLinkedDocId('');
                    }}
                    disabled={availableSections.length === 0}
                  >
                    <option value="">
                      {availableSections.length === 0 ? '-- Sin secciones en este módulo --' : '-- Todas las secciones --'}
                    </option>
                    {availableSections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.title}
                      </option>
                    ))}
                  </Select>

                  {/* 3. Documentos */}
                  <Select
                    label="3. Documento"
                    value={faqLinkedDocId}
                    onChange={(e) => setFaqLinkedDocId(e.target.value)}
                    disabled={filteredDocs.length === 0}
                  >
                    <option value="">
                      {filteredDocs.length === 0 ? '-- No hay documentos disponibles --' : '-- Sin enlace directo --'}
                    </option>
                    {filteredDocs.map((doc) => {
                      const docName = extractLanguageContent(doc.title, faqLang) || doc.title || doc.slug;
                      return (
                        <option key={doc.id} value={doc.id}>
                          {docName} ({doc.slug ? `/${doc.slug}` : 'sin slug'})
                        </option>
                      );
                    })}
                  </Select>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-800 mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsFaqDrawerOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="info"
              disabled={!faqQuestion.trim() || !faqAnswer.trim()}
            >
              {editingFaqId ? 'Guardar Cambios' : 'Agregar Pregunta'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Modal para Crear Nueva Versión de Release */}
      <Modal
        isOpen={isAddVersionModalOpen}
        onClose={() => setIsAddVersionModalOpen(false)}
        title="Nueva Versión de Release"
        width="sm"
      >
        <form onSubmit={handleCreateVersion} className="flex flex-col gap-4">
          <Input
            label="Número de Versión"
            required
            value={newVersionTag}
            onChange={(e) => setNewVersionTag(e.target.value)}
            placeholder="Ej. 1.98.00"
            helperText="Ingresa el identificador semántico de la versión."
          />

          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsAddVersionModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="info"
              type="submit"
              disabled={!newVersionTag.trim()}
            >
              Crear Versión
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal para Crear Nueva Entrada de Blog */}
      <Modal
        isOpen={isAddBlogModalOpen}
        onClose={() => setIsAddBlogModalOpen(false)}
        title="Nueva Entrada de Blog"
        width="sm"
      >
        <form onSubmit={handleCreateBlogEntry} className="flex flex-col gap-4">
          <Input
            label="Título de la entrada"
            required
            value={newBlogTitle}
            onChange={(e) => setNewBlogTitle(e.target.value)}
            placeholder="Ej. Novedades de rendimiento en la v2"
          />

          <Input
            label="Slug personalizado (opcional)"
            value={newBlogSlug}
            onChange={(e) => setNewBlogSlug(e.target.value)}
            placeholder="Ej. novedades-rendimiento-v2"
            helperText="Si lo dejas en blanco, se generará automáticamente a partir del título."
          />

          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsAddBlogModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="info"
              type="submit"
              disabled={!newBlogTitle.trim()}
            >
              Crear Entrada
            </Button>
          </div>
        </form>
      </Modal>
      {/* Modal Selector de Ícono para Release Features */}
      <IconPickerModal
        isOpen={featureIconPicker.isOpen}
        onClose={() => setFeatureIconPicker(prev => ({ ...prev, isOpen: false, featureId: null }))}
        initialIconName={featureIconPicker.initialIconName}
        initialIsBrand={featureIconPicker.initialIsBrand}
        onSelect={(iconName, isBrand) => {
          if (featureIconPicker.featureId) {
            handleUpdateFeature(featureIconPicker.featureId, {
              iconName,
              isBrandIcon: isBrand,
            });
          }
          setFeatureIconPicker(prev => ({ ...prev, isOpen: false, featureId: null }));
        }}
      />
    </div>
  );
}
