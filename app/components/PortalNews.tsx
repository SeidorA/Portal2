'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Brand, CaralIcon } from 'iconcaral2';
import { Button } from 'caralstable';
import { useTranslation } from '@/app/context/LanguageContext';

export interface NewsItem {
  id: string;
  badge: string;
  badgeType?: 'ai' | 'new' | 'feature' | 'security';
  titleKey: string;
  defaultTitle: string;
  descKey: string;
  defaultDesc: string;
  ctaTextKey: string;
  defaultCtaText: string;
  ctaHref: string;
  bgGradient: string;
  iconName?: string;
  brandName?: string;
  mockVisualType: 'ai_chat' | 'docs_a4' | 'landscape_cards' | 'api_tokens' | 'role_matrix' | 'opportunities';
}

const NEWS_DATA: NewsItem[] = [
  {
    id: 'pac-tokens',
    badge: 'Desarrolladores & API',
    badgeType: 'security',
    titleKey: 'news.item4Title',
    defaultTitle: 'Personal Access Tokens (PAC) y MCP',
    descKey: 'news.item4Desc',
    defaultDesc: 'Genera tokens de acceso con scopes configurables y conecta agentes IA como Antigravity, Claude o Cursor mediante el protocolo MCP.',
    ctaTextKey: 'news.item4Cta',
    defaultCtaText: 'Ver Developer Settings',
    ctaHref: '/perfil',
    bgGradient: 'from-emerald-950/80 via-teal-950/70 to-slate-900',
    iconName: 'code',
    mockVisualType: 'api_tokens',
  },

  {
    id: 'doc-a4',
    badge: 'Nuevo Editor',
    badgeType: 'new',
    titleKey: 'news.item2Title',
    defaultTitle: 'Los documentos pueden vivir en portal',
    descKey: 'news.item2Desc',
    defaultDesc: 'Crea propuestas comerciales, manuales e informes con diseño paginado A4, portadas personalizadas y descarga directa en PDF.',
    ctaTextKey: 'news.item2Cta',
    defaultCtaText: 'Crear Documento',
    ctaHref: '/documentos',
    bgGradient: 'from-blue-900/80 via-cyan-900/70 to-slate-900',
    iconName: 'file',
    mockVisualType: 'docs_a4',
  },

  {
    id: 'landscape-cards',
    badge: 'Dashboard 2.0',
    badgeType: 'feature',
    titleKey: 'news.item3Title',
    defaultTitle: 'Nueva experiencia visual en el Inicio',
    descKey: 'news.item3Desc',
    defaultDesc: 'Tarjetas apaisadas de alta fidelidad para tus páginas vistas recientemente y documentos favoritos con previsualización gráfica instantánea.',
    ctaTextKey: 'news.item3Cta',
    defaultCtaText: 'Ir al Dashboard',
    ctaHref: '/dashboard',
    bgGradient: 'from-slate-900 via-blue-950/80 to-slate-900',
    iconName: 'house',
    mockVisualType: 'landscape_cards',
  },

  {
    id: 'role-matrix',
    badge: 'Control de Accesos',
    badgeType: 'security',
    titleKey: 'news.item5Title',
    defaultTitle: 'Matriz granular de Roles y Políticas',
    descKey: 'news.item5Desc',
    defaultDesc: 'Controla con precisión qué usuarios y roles pueden ver o editar productos, pantallas de administración y bases de conocimiento.',
    ctaTextKey: 'news.item5Cta',
    defaultCtaText: 'Gestionar Roles',
    ctaHref: '/roles',
    bgGradient: 'from-amber-950/80 via-stone-900 to-slate-900',
    iconName: 'gear',
    mockVisualType: 'role_matrix',
  },

  {
    id: 'opportunities',
    badge: 'Nuevo Módulo',
    badgeType: 'feature',
    titleKey: 'news.itemOpportunitiesTitle',
    defaultTitle: 'Creador y Gestión de Oportunidades',
    descKey: 'news.itemOpportunitiesDesc',
    defaultDesc: 'Gestiona requerimientos técnicos, aprueba features faltantes y sigue el avance comercial en tableros Kanban interactivos.',
    ctaTextKey: 'news.itemOpportunitiesCta',
    defaultCtaText: 'Ver Oportunidades',
    ctaHref: '/oportunidades',
    bgGradient: 'from-indigo-950/80 via-purple-950/70 to-slate-900',
    iconName: 'list',
    mockVisualType: 'opportunities',
  },

  /* 
  // Oculto temporalmente hasta su implementación completa
  {
    id: 'ai-assistant',
    badge: '✦ AI Assisted (Beta)',
    badgeType: 'ai',
    titleKey: 'news.item1Title',
    defaultTitle: 'Asistente Inteligente Daiana integrado',
    descKey: 'news.item1Desc',
    defaultDesc: 'Resuelve dudas, encuentra guías oficiales y navega por el portal con el nuevo asistente conversacional potenciado por inteligencia artificial.',
    ctaTextKey: 'news.item1Cta',
    defaultCtaText: 'Probar Daiana',
    ctaHref: '/mi-portal',
    bgGradient: 'from-purple-900/80 via-indigo-900/70 to-slate-900',
    brandName: 'Daiana',
    mockVisualType: 'ai_chat',
  },
  */
];

interface PortalNewsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PortalNews({ isOpen, onClose }: PortalNewsProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        setActiveIndex((prev) => (prev + 1) % NEWS_DATA.length);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        setActiveIndex((prev) => (prev - 1 + NEWS_DATA.length) % NEWS_DATA.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentItem = NEWS_DATA[activeIndex] || NEWS_DATA[0];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % NEWS_DATA.length);
  };

  const handleCtaClick = () => {
    onClose();
    if (currentItem.ctaHref) {
      router.push(currentItem.ctaHref);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Modal Box: 70vw and 70vh */}
      <div
        className="relative z-10 w-[70vw] h-[70vh] min-w-[320px] min-h-[480px] max-w-6xl max-h-[800px] bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden flex sm:flex-col md:flex-row text-white font-poppins"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          aria-label="Cerrar modal"
          className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-neutral-800/80 hover:bg-neutral-700 border border-white/20 text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md hover:scale-105"
        >
          <CaralIcon name="x" size={16} />
        </button>

        {/* LEFT SIDEBAR: Index of news */}
        <div className="sm:w-full md:w-[32%] lg:w-[28%] bg-neutral-950/90 border-b md:border-b-0 md:border-r border-neutral-800 p-5 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="flex flex-col gap-5">
            {/* Header Title */}
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <CaralIcon name="plane" size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">
                  {t('portalNews.modalTitle', 'Novedades')}
                </h3>
                <span className="text-[11px] text-neutral-400 font-mono">
                  Portal v2.0
                </span>
              </div>
            </div>

            {/* List of items */}
            <nav className="flex flex-col gap-1.5" aria-label="Novedades de la versión">
              {NEWS_DATA.map((item, idx) => {
                const isActive = idx === activeIndex;
                const title = t(item.titleKey, item.defaultTitle);

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveIndex(idx)}
                    className={`group text-left p-3 rounded-xl transition-all duration-150 cursor-pointer flex items-center justify-between gap-2 ${isActive
                      ? 'bg-neutral-800/90 text-white font-medium shadow-inner border-l-3 border-blue-500'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                      }`}
                  >
                    <span className="text-xs line-clamp-2 leading-relaxed">
                      {title}
                    </span>
                    {isActive && (
                      <span className="shrink-0 text-blue-400 opacity-90">
                        <CaralIcon name="chevronRigth" size={14} />
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Next Button */}
          <div className="pt-4 border-t border-neutral-800/80 flex items-center justify-between">
            <span className="text-[11px] text-neutral-500">
              {activeIndex + 1} / {NEWS_DATA.length}
            </span>
            <Button
              variant="ghost"
              className="text-xs px-3 py-1.5 text-white border border-neutral-700 hover:border-neutral-500 rounded-lg cursor-pointer flex items-center"
              onClick={handleNext}
            >
              <span>{t('portalNews.next', 'Siguiente')}</span>
              <span className="ml-1 flex items-center">
                <CaralIcon name="chevronRigth" size={13} />
              </span>
            </Button>
          </div>
        </div>

        {/* RIGHT CONTENT PANE: Showcase & Detail */}
        <div className="flex-1 flex flex-col bg-neutral-900 overflow-y-auto">
          {/* Top Visual Banner */}
          <div
            className={`relative h-[55%] min-h-[220px] w-full bg-gradient-to-br ${currentItem.bgGradient} flex items-center justify-center p-6 overflow-hidden border-b border-neutral-800`}
            style={{
              backgroundImage: `radial-gradient(ellipse at center, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.5) 100%), url('/img/blur2.png')`,
              backgroundBlendMode: 'overlay',
            }}
          >
            {/* Abstract Background Elements */}
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

            {/* Top Badge Overlay */}
            <div className="absolute top-4 left-4 z-20">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-900/80 backdrop-blur-md border border-white/20 text-white shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                <span>{currentItem.badge}</span>
              </div>
            </div>

            {/* Center Visual Mockup depending on type */}
            <div className="relative z-10 flex flex-col items-center justify-center transform transition-transform duration-300 hover:scale-102">
              {currentItem.mockVisualType === 'ai_chat' && (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-purple-400/40 flex items-center justify-center text-white shadow-2xl shadow-purple-500/20 rotate-2">
                    <Brand name="Daiana" size={42} />
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-neutral-900/80 backdrop-blur-md border border-white/15 text-xs text-neutral-200 flex items-center gap-2 shadow-lg">
                    <span className="text-purple-400 flex items-center">
                      <CaralIcon name={"message" as any} size={14} />
                    </span>
                    <span>"¿Cómo creo un nuevo documento A4 en Portal?"</span>
                  </div>
                </div>
              )}

              {currentItem.mockVisualType === 'docs_a4' && (
                <div className="flex items-center gap-4">
                  <div className="w-24 h-32 rounded-xl bg-white/10 backdrop-blur-md border border-cyan-400/40 p-2 shadow-2xl shadow-cyan-500/20 flex flex-col justify-between -rotate-3">
                    <div className="w-8 h-2 rounded bg-cyan-400/60 mb-1" />
                    <div className="flex flex-col gap-1">
                      <div className="w-full h-1.5 rounded bg-white/40" />
                      <div className="w-3/4 h-1.5 rounded bg-white/30" />
                      <div className="w-1/2 h-1.5 rounded bg-white/20" />
                    </div>
                    <div className="text-[9px] text-cyan-300 font-mono">A4 Preview</div>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-xl rotate-6">
                    <CaralIcon name="file" size={32} />
                  </div>
                </div>
              )}

              {currentItem.mockVisualType === 'landscape_cards' && (
                <div className="flex flex-col gap-2 w-64 p-3 rounded-xl bg-neutral-900/90 border border-blue-500/40 backdrop-blur-md shadow-2xl shadow-blue-500/20">
                  <div className="h-14 rounded-lg bg-gradient-to-r from-blue-600/30 to-indigo-600/30 flex items-center justify-center">
                    <span className="text-blue-300 flex items-center">
                      <CaralIcon name="cube" size={24} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Xtract Universal</span>
                    <span className="text-amber-400 flex items-center">
                      <CaralIcon name="bookmark" size={13} />
                    </span>
                  </div>
                </div>
              )}

              {currentItem.mockVisualType === 'api_tokens' && (
                <div className="p-3.5 rounded-xl bg-neutral-950/90 border border-emerald-500/40 font-mono text-[11px] text-emerald-400 shadow-2xl shadow-emerald-500/20 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>MCP Server Status: Online</span>
                  </div>
                  <div className="text-neutral-300">pac_live_9f82d1...b47c</div>
                </div>
              )}

              {currentItem.mockVisualType === 'role_matrix' && (
                <div className="p-3 rounded-xl bg-neutral-950/90 border border-amber-500/40 flex items-center gap-3 shadow-2xl shadow-amber-500/20">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                    <CaralIcon name="gear" size={24} />
                  </div>
                  <div className="flex flex-col text-xs">
                    <span className="font-semibold text-white">Políticas de Roles</span>
                    <span className="text-neutral-400 text-[11px]">Acceso granular por módulos</span>
                  </div>
                </div>
              )}

              {currentItem.mockVisualType === 'opportunities' && (
                <div className="flex items-center gap-3 w-80 p-3 rounded-2xl bg-neutral-950/90 border border-indigo-500/40 shadow-2xl shadow-indigo-500/20">
                  <div className="flex-1 flex flex-col gap-1.5 p-2 rounded-xl bg-neutral-900/90 border border-neutral-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">Kanban</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">3 reqs</span>
                    </div>
                    <div className="text-xs font-semibold text-white truncate">Oportunidad Banco XYZ</div>
                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>En Validación</span>
                    </div>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/50 flex items-center justify-center text-indigo-300 shadow-xl shrink-0 rotate-3">
                    <CaralIcon name="list" size={28} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Info & Action Panel */}
          <div className="flex-1 p-6 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {t(currentItem.titleKey, currentItem.defaultTitle)}
              </h2>
              <p className="text-sm text-neutral-300 leading-relaxed max-w-2xl">
                {t(currentItem.descKey, currentItem.defaultDesc)}
              </p>
            </div>

            {/* Action Row */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="info"
                onClick={handleCtaClick}
                className="cursor-pointer font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 text-sm flex items-center"
              >
                <span>{t(currentItem.ctaTextKey, currentItem.defaultCtaText)}</span>
                <span className="ml-1.5 flex items-center">
                  <CaralIcon name="arrowRight" size={15} />
                </span>
              </Button>

              <button
                onClick={onClose}
                className="text-xs text-neutral-400 hover:text-white px-3 py-2 transition-colors cursor-pointer"
              >
                {t('portalNews.dismiss', 'Cerrar')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
