"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Brand, CaralIcon } from 'iconcaral2';
import { Button, Drawer } from 'caralstable';
import Input from '@/app/components/Input';
import Select from '@/app/components/Select';
import fallbackData from '../connections.json';

interface ConnectionItem {
  id: string;
  title: string;
  description: string;
  iconName: string | null;
  useBrand: boolean;
  link: string;
  tag?: string;
}

interface ConnectionsData {
  origins: ConnectionItem[];
  destinations: ConnectionItem[];
}

const translations = {
  es: {
    toolTitle: 'Listado de Orígenes y Destinos',
    toolSubtitle: 'Genera y exporta la diapositiva de compatibilidad e integraciones de Crestone en alta resolución 16:9.',
    settings: 'Configuración',
    fullscreen: 'Pantalla Completa',
    exitFullscreen: 'Salir de Pantalla Completa',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    resetZoom: 'Ajustar Vista',
    downloadSlide: 'Descargar Diapositiva (PNG 16:9)',
    language: 'Idioma',
    canvasTheme: 'Tema del Lienzo',
    light: 'Claro (Light)',
    dark: 'Oscuro (Dark)',
    gradient: 'Gradiente',
    transparent: 'Transparente',
    origins: 'Orígenes',
    destinations: 'Destinos',
    searchOrigins: 'Buscar orígenes...',
    searchDestinations: 'Buscar destinos...',
    selectAll: 'Seleccionar todos',
    deselectAll: 'Desmarcar todos',
    noResults: 'Sin resultados',
    close: 'Cerrar',
    mainTitle: 'Ecosistema de Compatibilidad',
    mainSubtitle: 'Integración de Orígenes SAP hacia Destinos Cloud & Analytics',
    customTitleLabel: 'Título Principal',
    customSubtitleLabel: 'Subtítulo / Cliente',
    showTitleLabel: 'Mostrar Título Principal',
    showSubtitleLabel: 'Mostrar Subtítulo',
    showSectionHeadersLabel: 'Mostrar Cabeceras (Orígenes / Destinos)',
    groupByTagLabel: 'Agrupar por categorías / Tags',
    selectedBadge: 'seleccionados',
    allTags: 'Todos',
    downloading: 'Descargando...',
    generatingPng: 'Generando PNG...',
    loadingData: 'Cargando datos de conexiones...',
  },
  en: {
    toolTitle: 'Origins & Destinations List',
    toolSubtitle: 'Generate and export the Crestone compatibility and integration slide in high-resolution 16:9.',
    settings: 'Settings',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit Fullscreen',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    resetZoom: 'Reset Fit',
    downloadSlide: 'Download Slide (PNG 16:9)',
    language: 'Language',
    canvasTheme: 'Canvas Theme',
    light: 'Light',
    dark: 'Dark',
    gradient: 'Gradient',
    transparent: 'Transparent',
    origins: 'Origins',
    destinations: 'Destinations',
    searchOrigins: 'Search origins...',
    searchDestinations: 'Search destinations...',
    selectAll: 'Select all',
    deselectAll: 'Deselect all',
    noResults: 'No results found',
    close: 'Close',
    mainTitle: 'Supported Compatibility & Integrations',
    mainSubtitle: 'Integration from SAP Origins to Cloud & Analytics Destinations',
    customTitleLabel: 'Main Title',
    customSubtitleLabel: 'Subtitle / Customer',
    showTitleLabel: 'Show Main Title',
    showSubtitleLabel: 'Show Subtitle',
    showSectionHeadersLabel: 'Show Section Headers (Origins / Destinations)',
    groupByTagLabel: 'Group by Categories / Tags',
    selectedBadge: 'selected',
    allTags: 'All',
    downloading: 'Downloading...',
    generatingPng: 'Generating PNG...',
    loadingData: 'Loading connections data...',
  }
};

export interface OriginsDestinationsToolProps {
  isEmbedded?: boolean;
  theme?: 'light' | 'dark' | 'gradient' | 'transparent';
  activeDrawer?: 'settings' | 'origins' | 'destinations' | null;
  onActiveDrawerChange?: (drawer: 'settings' | 'origins' | 'destinations' | null) => void;
}

export default function OriginsDestinationsTool({
  isEmbedded = false,
  theme: propTheme,
  activeDrawer: propActiveDrawer,
  onActiveDrawerChange,
}: OriginsDestinationsToolProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const bgSlideDark = '/img/crestone/ppt/bgdark.png';
  const bgSlideLight = '/img/crestone/ppt/bg.png';

  const [data, setData] = useState<ConnectionsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Active drawer
  const [internalActiveDrawer, setInternalActiveDrawer] = useState<'settings' | 'origins' | 'destinations' | null>(null);
  const activeDrawer = propActiveDrawer !== undefined ? propActiveDrawer : internalActiveDrawer;
  const setActiveDrawer = (val: React.SetStateAction<'settings' | 'origins' | 'destinations' | null>) => {
    const nextVal = typeof val === 'function' ? val(activeDrawer) : val;
    setInternalActiveDrawer(nextVal);
    onActiveDrawerChange?.(nextVal);
  };
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Customization States
  const [theme, setTheme] = useState<'light' | 'dark' | 'gradient' | 'transparent'>(propTheme || 'light');
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const t = translations[lang];

  useEffect(() => {
    if (propTheme !== undefined) setTheme(propTheme);
  }, [propTheme]);

  const [showTitle, setShowTitle] = useState(true);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showSectionHeaders, setShowSectionHeaders] = useState(true);
  const [groupByTag, setGroupByTag] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customSubtitle, setCustomSubtitle] = useState('');

  // Selected items (Active / Filtered)
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>([]);
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);

  // Search filters for Drawers
  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');

  // Download state
  const [isDownloading, setIsDownloading] = useState(false);

  // 16:9 Canvas Dimensions (Full HD)
  const canvasWidth = 1920;
  const canvasHeight = 1080;

  // Zoom & Pan states
  const [zoom, setZoom] = useState(0.5);
  const [zoomScale, setZoomScale] = useState({ x: 1, y: 1 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  // Calculate Auto-Fit Zoom based on Container Dimensions
  const calculateFitZoom = useCallback(() => {
    if (!viewportRef.current) return { x: 0.5, y: 0.5, min: 0.5 };
    const { clientWidth, clientHeight } = viewportRef.current;
    if (clientWidth === 0 || clientHeight === 0) return { x: 0.5, y: 0.5, min: 0.5 };
    const scaleX = clientWidth / canvasWidth;
    const scaleY = clientHeight / canvasHeight;
    return { x: scaleX, y: scaleY, min: Math.min(scaleX, scaleY) };
  }, [canvasWidth, canvasHeight]);

  const resetView = useCallback(() => {
    const fit = calculateFitZoom();
    setZoom(fit.min);
    setZoomScale({ x: fit.x, y: fit.y });
    setPan({ x: 0, y: 0 });
  }, [calculateFitZoom]);

  // Update zoom when container changes
  useEffect(() => {
    if (!viewportRef.current) return;
    const observer = new ResizeObserver(() => {
      const fit = calculateFitZoom();
      setZoom(fit.min);
      setZoomScale({ x: fit.x, y: fit.y });
    });
    observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, [calculateFitZoom]);

  // Load Data
  useEffect(() => {
    let active = true;
    fetch('https://raw.githubusercontent.com/SeidorA/DocuCrestone/refs/heads/main/static/api/connections.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch live connections');
        return res.json();
      })
      .then((jsonData: ConnectionsData) => {
        if (active) {
          setData(jsonData);
          // By default all items are visible
          setSelectedOrigins(jsonData.origins.map(o => o.id));
          setSelectedDestinations(jsonData.destinations.map(d => d.id));
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          const fallback = fallbackData as ConnectionsData;
          setData(fallback);
          setSelectedOrigins(fallback.origins.map(o => o.id));
          setSelectedDestinations(fallback.destinations.map(d => d.id));
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  // Resize observer
  useEffect(() => {
    if (!viewportRef.current) return;
    const observer = new ResizeObserver(() => {
      const fit = calculateFitZoom();
      setZoom(fit.min);
      setZoomScale({ x: fit.x, y: fit.y });
    });
    observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, [calculateFitZoom, loading]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      setTimeout(() => {
        const fit = calculateFitZoom();
        setZoom(fit.min);
        setZoomScale({ x: fit.x, y: fit.y });
        setPan({ x: 0, y: 0 });
      }, 150);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [calculateFitZoom]);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen?.().catch(() => {});
    } else {
      await document.exitFullscreen?.().catch(() => {});
    }
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.08, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.08, 0.2));

  // Wheel zoom handling
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      setZoom((prev) => Math.min(Math.max(prev + delta, 0.2), 2.5));
    }
  };

  // Mouse pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Toggle selection
  const toggleOrigin = (id: string) => {
    setSelectedOrigins(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleDestination = (id: string) => {
    setSelectedDestinations(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Download High-Res PNG
  const downloadPng = async () => {
    if (typeof window === 'undefined' || !canvasRef.current) return;

    try {
      setIsDownloading(true);
      const { toPng } = await import('html-to-image');

      const dataUrl = await toPng(canvasRef.current, {
        pixelRatio: 2,
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor: theme === 'transparent' ? 'transparent' : undefined,
        style: {
          transform: 'none',
          transformOrigin: '0 0',
          position: 'static',
          left: '0px',
          top: '0px',
          margin: '0px',
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
        }
      });

      const link = document.createElement('a');
      link.download = `crestone-origenes-destinos-16x9-${theme}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error creating PNG:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="w-full aspect-video rounded-xl bg-container border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center p-12 my-6 font-poppins">
        <div className="w-10 h-10 border-4 border-info-main/20 border-t-info-main rounded-full animate-spin mb-4" />
        <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
          {t.loadingData}
        </p>
      </div>
    );
  }

  const isDark = theme === 'dark' || theme === 'transparent';
  const textColorMain = isDark ? '#ffffff' : '#0c1d4a';
  const textColorSub = isDark ? '#94a3b8' : '#64748b';

  const getCanvasBackground = () => {
    switch (theme) {
      case 'light':
        return {
          backgroundImage: `url(${bgSlideLight})`,
          backgroundColor: '#ffffff',
          backgroundSize: '100% 100%',
        };
      case 'dark':
        return {
          backgroundImage: `url(${bgSlideDark})`,
          backgroundColor: '#07153a',
          backgroundSize: '100% 100%',
        };
      case 'gradient':
        return {
          background: 'linear-gradient(135deg, #07153a 0%, #0f172a 50%, #1e1b4b 100%)',
        };
      case 'transparent':
        return {
          backgroundColor: 'transparent',
        };
    }
  };

  const renderIcon = (item: ConnectionItem, size = 32) => {
    const iconColor = isDark ? '#ffffff' : '#0c1d4a';
    if (!item.iconName) {
      return <CaralIcon name={"file" as any} size={size} color={iconColor} />;
    }
    const normalized = item.iconName.trim();
    if (item.useBrand) {
      return <Brand name={normalized as any} size={size} />;
    } else {
      return <CaralIcon name={normalized as any} size={size} color={iconColor} />;
    }
  };

  // Helper to sanitize titles: remove 'Source Connection', 'Destination Connection', and standardize names
  const cleanItemTitle = (rawTitle: string): string => {
    let t = rawTitle
      .replace(/\s*(source|destini|destination)\s*connections?/gi, '')
      .replace(/\s*(source|destini|destination)\b/gi, '')
      .replace(/\s*connection\b/gi, '')
      .trim();

    if (/^Microsoft Dynamics 365/i.test(t)) return 'Dynamics 365';
    if (/^Microsoft Fabric/i.test(t)) return 'Fabric';
    if (/^MS SQL Server/i.test(t)) return 'SQL Server';
    if (/^Azure SQL Server/i.test(t)) return 'Azure SQL';
    if (/^Google Cloud Platform/i.test(t)) return 'Google Storage';
    if (/^Google Cloud Big Query/i.test(t)) return 'Google Big Query';
    if (/^Amazon S3$/i.test(t)) return 'AWS';
    return t;
  };

  // Direct element row (no box/card, just icon + text directly)
  const renderDirectItem = (item: ConnectionItem) => {
    const title = cleanItemTitle(item.title);
    const itemHeight = groupByTag ? '38px' : '46px';
    const itemGap = groupByTag ? '12px' : '16px';
    const iconSize = groupByTag ? 26 : 32;
    const fontSize = groupByTag ? '17px' : '20px';

    return (
      <div
        key={item.id}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: itemGap,
          height: itemHeight,
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Icon */}
        <div style={{
          width: `${iconSize + 4}px`,
          height: `${iconSize + 4}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {renderIcon(item, iconSize)}
        </div>

        {/* Title */}
        <span style={{
          fontSize: fontSize,
          fontWeight: 700,
          color: textColorMain,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          letterSpacing: '-0.2px',
          lineHeight: '1.2'
        }}>
          {title}
        </span>
      </div>
    );
  };

  // Grouped rendering: small category header with items
  const renderGroup = (group: { tag: string; items: ConnectionItem[] }) => {
    return (
      <div key={group.tag} style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e2e8f0',
          paddingBottom: '3px',
          marginBottom: '2px',
        }}>
          <span style={{
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            color: isDark ? '#93c5fd' : '#2563eb',
          }}>
            {group.tag}
          </span>
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            color: textColorSub,
            opacity: 0.75,
          }}>
            {group.items.length}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {group.items.map(renderDirectItem)}
        </div>
      </div>
    );
  };

  // Helper to split grouped items across 2 balanced columns
  const getGroupedColumns = (items: ConnectionItem[]) => {
    const groupMap = new Map<string, ConnectionItem[]>();
    items.forEach((item) => {
      const tag = item.tag?.trim() || 'Otros';
      if (!groupMap.has(tag)) groupMap.set(tag, []);
      groupMap.get(tag)!.push(item);
    });

    const groups = Array.from(groupMap.entries()).map(([tag, groupItems]) => ({
      tag,
      items: groupItems,
    }));

    const col1: typeof groups = [];
    const col2: typeof groups = [];
    let count1 = 0;
    let count2 = 0;

    groups.forEach((g) => {
      const weight = g.items.length + 1.2;
      if (count1 <= count2) {
        col1.push(g);
        count1 += weight;
      } else {
        col2.push(g);
        count2 += weight;
      }
    });

    return { col1, col2 };
  };

  // Filter items by selection
  const activeOrigins = data.origins.filter(o => selectedOrigins.includes(o.id));
  const activeDestinations = data.destinations.filter(d => selectedDestinations.includes(d.id));

  // Flat 2-column split (when groupByTag is false)
  const midO = Math.ceil(activeOrigins.length / 2);
  const originsCol1 = activeOrigins.slice(0, midO);
  const originsCol2 = activeOrigins.slice(midO);

  const midD = Math.ceil(activeDestinations.length / 2);
  const destCol1 = activeDestinations.slice(0, midD);
  const destCol2 = activeDestinations.slice(midD);

  // Grouped 2-column split (when groupByTag is true)
  const originsGrouped = getGroupedColumns(activeOrigins);
  const destGrouped = getGroupedColumns(activeDestinations);

  const filteredOrigins = data.origins.filter(o => {
    const clean = cleanItemTitle(o.title);
    return clean.toLowerCase().includes(originSearch.toLowerCase()) || o.title.toLowerCase().includes(originSearch.toLowerCase());
  });
  const filteredDestinations = data.destinations.filter(d => {
    const clean = cleanItemTitle(d.title);
    return clean.toLowerCase().includes(destSearch.toLowerCase()) || d.title.toLowerCase().includes(destSearch.toLowerCase());
  });

  return (
    <div
      ref={containerRef}
      className={`w-full flex flex-col items-center justify-center font-poppins select-none ${
        isEmbedded
          ? 'w-full h-full relative overflow-hidden bg-transparent'
          : isFullscreen
            ? 'fixed inset-0 z-50 bg-neutral-900 p-3 overflow-hidden justify-between'
            : 'relative my-auto gap-2'
      }`}
    >
      {/* 1. Top Bar: Left = Title/Drawer buttons, Right = Fullscreen */}
      {!isEmbedded && (
        <div className="w-full flex items-center justify-between z-10 shrink-0 px-1 py-1">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Drawer trigger: Settings */}
            <Button
              variant={activeDrawer === 'settings' ? 'info' : 'light'}
              onClick={() => setActiveDrawer(prev => prev === 'settings' ? null : 'settings')}
              className="text-xs flex items-center gap-1.5"
            >
              <CaralIcon name={"sliders" as any} size={14} />
              {t.settings}
            </Button>

            {/* Drawer trigger: Origins */}
            <Button
              variant={activeDrawer === 'origins' ? 'info' : 'light'}
              onClick={() => setActiveDrawer(prev => prev === 'origins' ? null : 'origins')}
              className="text-xs flex items-center gap-1.5"
            >
              <CaralIcon name={"arrowRight" as any} size={14} />
              {t.origins} ({activeOrigins.length})
            </Button>

            {/* Drawer trigger: Destinations */}
            <Button
              variant={activeDrawer === 'destinations' ? 'info' : 'light'}
              onClick={() => setActiveDrawer(prev => prev === 'destinations' ? null : 'destinations')}
              className="text-xs flex items-center gap-1.5"
            >
              <CaralIcon name={"arrowLeft" as any} size={14} />
              {t.destinations} ({activeDestinations.length})
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Fullscreen Button */}
            <Button
              variant="light"
              onClick={toggleFullscreen}
              title={isFullscreen ? t.exitFullscreen : t.fullscreen}
              isIconButton
            >
              <CaralIcon name={isFullscreen ? ("minimize" as any) : ("expand" as any)} size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* 2. Interactive Canvas Viewport (Exact Direct Layout from Mockup) */}
      <div
        ref={viewportRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors ${
          isEmbedded
            ? 'w-full h-full bg-transparent border-none rounded-none shadow-none'
            : 'w-full aspect-video rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm bg-neutral-100 dark:bg-neutral-950'
        }`}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div
          ref={canvasRef}
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            position: 'absolute',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0, 0, 0.2, 1)',
            ...getCanvasBackground(),
            fontFamily: "'Poppins', 'Outfit', 'Inter', sans-serif",
            overflow: 'hidden',
            boxSizing: 'border-box',
            padding: '70px 100px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
          }}
        >
          {/* Top Title (if enabled) */}
          {(showTitle || showSubtitle) && (
            <div style={{ marginBottom: '40px', zIndex: 3 }}>
              {showTitle && (
                <h1 style={{
                  margin: 0,
                  fontSize: '44px',
                  fontWeight: 800,
                  color: textColorMain,
                  letterSpacing: '-0.5px'
                }}>
                  {customTitle || t.mainTitle}
                </h1>
              )}
              {showSubtitle && (
                <p style={{
                  margin: '8px 0 0 0',
                  fontSize: '20px',
                  fontWeight: 500,
                  color: textColorSub
                }}>
                  {customSubtitle || t.mainSubtitle}
                </p>
              )}
            </div>
          )}

          {/* Symmetrical 50% / 50% Columns for Origins and Destinations */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '80px',
            flex: 1,
            alignItems: 'start',
          }}>
            {/* Left Side: Origins (50% Width, split in 2 clean columns) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: groupByTag ? '12px' : '20px' }}>
              {showSectionHeaders && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  borderBottom: isDark ? '2px solid rgba(255, 255, 255, 0.15)' : '2px solid #cbd5e1',
                  paddingBottom: '10px',
                  marginBottom: '10px'
                }}>
                  <h2 style={{
                    fontSize: '28px',
                    fontWeight: 800,
                    color: textColorMain,
                    margin: 0,
                    letterSpacing: '-0.3px'
                  }}>
                    {t.origins}
                  </h2>
                </div>
              )}

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                columnGap: '40px',
                rowGap: groupByTag ? '12px' : '20px',
              }}>
                {groupByTag ? (
                  <>
                    {/* Grouped Column 1 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {originsGrouped.col1.map(renderGroup)}
                    </div>
                    {/* Grouped Column 2 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {originsGrouped.col2.map(renderGroup)}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Flat Column 1 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {originsCol1.map(renderDirectItem)}
                    </div>
                    {/* Flat Column 2 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {originsCol2.map(renderDirectItem)}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Side: Destinations (50% Width, split in 2 clean columns) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: groupByTag ? '12px' : '20px' }}>
              {showSectionHeaders && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  borderBottom: isDark ? '2px solid rgba(255, 255, 255, 0.15)' : '2px solid #cbd5e1',
                  paddingBottom: '10px',
                  marginBottom: '10px'
                }}>
                  <h2 style={{
                    fontSize: '28px',
                    fontWeight: 800,
                    color: textColorMain,
                    margin: 0,
                    letterSpacing: '-0.3px'
                  }}>
                    {t.destinations}
                  </h2>
                </div>
              )}

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                columnGap: '40px',
                rowGap: groupByTag ? '12px' : '20px',
              }}>
                {groupByTag ? (
                  <>
                    {/* Grouped Column 1 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {destGrouped.col1.map(renderGroup)}
                    </div>
                    {/* Grouped Column 2 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {destGrouped.col2.map(renderGroup)}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Flat Column 1 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {destCol1.map(renderDirectItem)}
                    </div>
                    {/* Flat Column 2 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {destCol2.map(renderDirectItem)}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Bar: Zoom Controls & PNG Export */}
      {!isEmbedded && (
        <div className="w-full flex items-center justify-between z-10 shrink-0 px-1 py-1">
          {/* Left: Zoom Controls */}
          <div className="flex items-center gap-1.5 bg-container border border-neutral-200 dark:border-neutral-800 rounded-xl p-1 shadow-xs">
            <Button
              variant="light"
              onClick={handleZoomOut}
              title={t.zoomOut}
              iconName="less"
              isIconButton
            />

            <span className="text-xs font-semibold px-2 min-w-[52px] text-center text-neutral-700 dark:text-neutral-300">
              {Math.round(zoom * 100)}%
            </span>

            <Button
              variant="light"
              onClick={handleZoomIn}
              title={t.zoomIn}
              iconName="plus"
              isIconButton
            />

            <Button
              variant="light"
              onClick={resetView}
              title={t.resetZoom}
              iconName="arrowsMove"
              isIconButton
            />
          </div>

          {/* Right: Download PNG 16:9 */}
          <Button
            variant="info"
            onClick={downloadPng}
            disabled={isDownloading}
            iconName="arrowDownToLine"
            className="text-xs font-semibold"
          >
            {isDownloading ? t.generatingPng : t.downloadSlide}
          </Button>
        </div>
      )}

      {/* 4. Unified Drawer Component */}
      <Drawer
        isOpen={Boolean(activeDrawer)}
        onClose={() => setActiveDrawer(null)}
        title={
          activeDrawer === 'settings'
            ? t.settings
            : activeDrawer === 'origins'
            ? `${t.origins} (${activeOrigins.length}/${data.origins.length})`
            : activeDrawer === 'destinations'
            ? `${t.destinations} (${activeDestinations.length}/${data.destinations.length})`
            : ''
        }
      >
        {activeDrawer === 'settings' && (
          <div className="flex flex-col gap-5 p-4 text-sm font-poppins">
            {/* Canvas Theme */}
            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                {t.canvasTheme}
              </label>
              <Select
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                options={[
                  { value: 'light', label: t.light },
                  { value: 'dark', label: t.dark },
                  { value: 'gradient', label: t.gradient },
                  { value: 'transparent', label: t.transparent },
                ]}
              />
            </div>

            {/* Language */}
            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                {t.language}
              </label>
              <Select
                value={lang}
                onChange={(e) => setLang(e.target.value as any)}
                options={[
                  { value: 'es', label: 'Español' },
                  { value: 'en', label: 'English' },
                ]}
              />
            </div>

            {/* Section Headers Toggle */}
            <div className="flex items-center justify-between py-1 border-t border-neutral-200 dark:border-neutral-800">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                {t.showSectionHeadersLabel}
              </span>
              <input
                type="checkbox"
                checked={showSectionHeaders}
                onChange={(e) => setShowSectionHeaders(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* Group by Tag / Category Toggle */}
            <div className="flex items-center justify-between py-1 border-t border-neutral-200 dark:border-neutral-800">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                {t.groupByTagLabel}
              </span>
              <input
                type="checkbox"
                checked={groupByTag}
                onChange={(e) => setGroupByTag(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* Main Title Customization */}
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {t.showTitleLabel}
                </span>
                <input
                  type="checkbox"
                  checked={showTitle}
                  onChange={(e) => setShowTitle(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {showTitle && (
                <Input
                  label={t.customTitleLabel}
                  placeholder={t.mainTitle}
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                />
              )}

              <div className="flex items-center justify-between mt-2">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {t.showSubtitleLabel}
                </span>
                <input
                  type="checkbox"
                  checked={showSubtitle}
                  onChange={(e) => setShowSubtitle(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {showSubtitle && (
                <Input
                  label={t.customSubtitleLabel}
                  placeholder={t.mainSubtitle}
                  value={customSubtitle}
                  onChange={(e) => setCustomSubtitle(e.target.value)}
                />
              )}
            </div>
          </div>
        )}

        {activeDrawer === 'origins' && (
          <div className="flex flex-col gap-4 p-4 text-sm font-poppins">
            <Input
              placeholder={t.searchOrigins}
              value={originSearch}
              onChange={(e) => setOriginSearch(e.target.value)}
            />

            <div className="flex items-center gap-2">
              <Button
                variant="light"
                size="sm"
                onClick={() => setSelectedOrigins(data.origins.map(o => o.id))}
                className="text-xs"
              >
                {t.selectAll}
              </Button>
              <Button
                variant="light"
                size="sm"
                onClick={() => setSelectedOrigins([])}
                className="text-xs"
              >
                {t.deselectAll}
              </Button>
            </div>

            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
              {filteredOrigins.length === 0 ? (
                <p className="text-xs text-neutral-500 py-4 text-center">{t.noResults}</p>
              ) : (
                filteredOrigins.map((item) => {
                  const isSelected = selectedOrigins.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700'
                          : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOrigin(item.id)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="w-7 h-7 flex items-center justify-center shrink-0">
                        {renderIcon(item, 20)}
                      </div>
                      <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                        {cleanItemTitle(item.title)}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeDrawer === 'destinations' && (
          <div className="flex flex-col gap-4 p-4 text-sm font-poppins">
            <Input
              placeholder={t.searchDestinations}
              value={destSearch}
              onChange={(e) => setDestSearch(e.target.value)}
            />

            <div className="flex items-center gap-2">
              <Button
                variant="light"
                size="sm"
                onClick={() => setSelectedDestinations(data.destinations.map(d => d.id))}
                className="text-xs"
              >
                {t.selectAll}
              </Button>
              <Button
                variant="light"
                size="sm"
                onClick={() => setSelectedDestinations([])}
                className="text-xs"
              >
                {t.deselectAll}
              </Button>
            </div>

            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
              {filteredDestinations.length === 0 ? (
                <p className="text-xs text-neutral-500 py-4 text-center">{t.noResults}</p>
              ) : (
                filteredDestinations.map((item) => {
                  const isSelected = selectedDestinations.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700'
                          : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleDestination(item.id)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="w-7 h-7 flex items-center justify-center shrink-0">
                        {renderIcon(item, 20)}
                      </div>
                      <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                        {cleanItemTitle(item.title)}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
