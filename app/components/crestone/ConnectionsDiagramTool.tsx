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
}

interface ConnectionsData {
  origins: ConnectionItem[];
  destinations: ConnectionItem[];
}

function CrestoneLogo({ color1 = "#66B6FF", color2 = "#ffffff", size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        <path d="M23.0629 8.97536C25.5489 8.97536 27.5643 7.02884 27.5643 4.62769C27.5643 2.22655 25.5489 0.280029 23.0629 0.280029C20.5768 0.280029 18.5614 2.22655 18.5614 4.62769C18.5614 7.02884 20.5768 8.97536 23.0629 8.97536Z" fill={color1} />
        <path d="M4.78148 18.3869C7.26757 18.3869 9.28294 16.4403 9.28294 14.0392C9.28294 11.638 7.26757 9.69153 4.78148 9.69153C2.2954 9.69153 0.280029 11.638 0.280029 14.0392C0.280029 16.4403 2.2954 18.3869 4.78148 18.3869Z" fill={color1} />
        <path d="M27.7201 23.3724C27.7201 25.7735 25.7047 27.72 23.2186 27.72C20.7325 27.72 18.7172 25.7735 18.7172 23.3724C18.7172 20.9712 20.7325 19.0247 23.2186 19.0247C25.7047 19.0247 27.7201 20.9712 27.7201 23.3724Z" fill={color1} />
        <path d="M8.84239 18.5205C10.2395 20.6674 12.7205 22.0082 15.8806 22.0082H17.2155C17.109 22.4466 17.0514 22.9028 17.0514 23.3724C17.0514 24.5943 17.433 25.7297 18.0861 26.675H15.6389C9.59397 26.675 5.12963 23.8349 3.02051 19.7483C3.57845 19.9088 4.16947 19.9961 4.78147 19.9961C6.33709 19.9961 7.75757 19.4385 8.84239 18.5205Z" fill={color2} />
        <path d="M17.0966 6.14145H15.8802C12.748 6.14145 10.2823 7.47326 8.87873 9.58865C7.78907 8.65233 6.35448 8.08267 4.78111 8.08267C4.18484 8.08267 3.60915 8.16605 3.06371 8.3184C5.19059 4.27622 9.63516 1.47467 15.639 1.47467H17.8308C17.2386 2.38917 16.8953 3.46966 16.8953 4.62768C16.8953 5.15098 16.9655 5.6579 17.097 6.14145H17.0966Z" fill={color2} />
      </g>
    </svg>
  );
}

interface ConnectionCardProps {
  title: string;
  icon: string;
  brand: boolean;
  theme: 'light' | 'dark';
  width?: string;
}

function ConnectionCard({ title, icon, brand, theme, width = '250px' }: ConnectionCardProps) {
  const isDark = theme === 'dark';
  const cleanTitle = title
    .replace(/\s*(source|destini|destination)\s*connections?/gi, '')
    .replace(/\s*(source|destini|destination)\b/gi, '')
    .replace(/\s*connection\b/gi, '')
    .trim();

  return (
    <div style={{
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      border: isDark ? '1.5px solid #334155' : '1.5px solid #e2e8f0',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '7px 12px',
      width: width,
      height: '46px',
      boxSizing: 'border-box',
      overflow: 'hidden',
      position: 'relative',
      color: isDark ? '#f8fafc' : '#242528',
      boxShadow: isDark
        ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
        : '0 2px 4px rgba(0, 0, 0, 0.04)',
    }}>
      <div style={{
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {brand ? (
          <Brand name={icon as any} size={22} />
        ) : (
          <CaralIcon name={icon as any} size={20} color={isDark ? '#f1f5f9' : '#242528'} />
        )}
      </div>
      <span style={{
        fontFamily: "'Poppins', sans-serif",
        fontSize: '12px',
        fontWeight: 500,
        color: isDark ? '#f8fafc' : '#1e293b',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {cleanTitle}
      </span>
    </div>
  );
}

const translations = {
  en: {
    generatorTitle: 'Connections Diagram Generator',
    generatorSubtitle: 'Interactive diagram of the Crestone ecosystem. Customize background, cards, path colors and download in 16:9 high resolution.',
    mainTitle: 'Matriz de Conexión Crestone',
    mainSubtitle: 'Ecosistema de Orígenes SAP y Destinos en la Nube',
    origins: 'Orígenes',
    destinations: 'Destinos',
    settings: 'Configuración General',
    fullscreen: 'Pantalla Completa',
    exitFullscreen: 'Salir de Pantalla Completa',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    resetZoom: 'Ajustar Vista',
    downloadDiagram: 'Descargar Diagrama (PNG 16:9)',
    language: 'Idioma',
    canvasTitle: 'Estilo de Lienzo',
    cardTitle: 'Estilo de Tarjeta',
    columnsTitle: 'Disposición de Columnas',
    twoColumns: '2 Columnas por lado (Recomendado)',
    oneColumn: '1 Columna por lado',
    pathStyleTitle: 'Estilo de Ruta',
    pathColorTitle: 'Colores de Ruta',
    gridTitle: 'Estilo de Rejilla',
    showMainTitleLabel: 'Mostrar Título de Diagrama',
    showMainSubtitleLabel: 'Mostrar Subtítulo de Diagrama',
    showColumnTitlesLabel: 'Mostrar Encabezados',
    customTitleLabel: 'Título Personalizado',
    customSubtitleLabel: 'Subtítulo Personalizado',
    individualAssetsTitle: 'Exportación de Assets Individuales',
    individualAssetsSubtitle: 'Descarga cada origen o destino como PNG independiente en alta resolución.',
    downloadAllOrigins: 'Descargar Todos los Orígenes',
    downloadAllDestinations: 'Descargar Todos los Destinos',
    exportCard: 'Exportar Tarjeta',
    exporting: 'Exportando...',
    downloading: 'Descargando...',
    generatingPng: 'Generando PNG...',
    searchOrigins: 'Search origins...',
    searchDestinations: 'Search destinations...',
    selectAll: 'Select all',
    deselectAll: 'Deselect all',
    noResults: 'No results found',
    close: 'Close',
    light: 'Light',
    dark: 'Dark',
    gradient: 'Gradient',
    transparent: 'Transparent',
    curved: 'Curved',
    orthogonal: 'Orthogonal',
    hidden: 'Hidden',
    auto: 'Auto',
    custom: 'Custom',
    dots: 'Dots',
    lines: 'Lines',
    none: 'None',
  },
  es: {
    generatorTitle: 'Generador de Diagrama de Conexiones',
    generatorSubtitle: 'Diagrama interactivo del ecosistema Crestone. Personaliza el fondo, tarjetas, colores de ruta y descarga en alta resolución 16:9.',
    mainTitle: 'Matriz de Conexión Crestone',
    mainSubtitle: 'Ecosistema de Orígenes SAP y Destinos en la Nube',
    origins: 'Orígenes',
    destinations: 'Destinos',
    settings: 'Configuración General',
    fullscreen: 'Pantalla Completa',
    exitFullscreen: 'Salir de Pantalla Completa',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    resetZoom: 'Ajustar Vista',
    downloadDiagram: 'Descargar Diagrama (PNG 16:9)',
    language: 'Idioma',
    canvasTitle: 'Estilo de Lienzo',
    cardTitle: 'Estilo de Tarjeta',
    columnsTitle: 'Disposición de Columnas',
    twoColumns: '2 Columnas por lado (Recomendado)',
    oneColumn: '1 Columna por lado',
    pathStyleTitle: 'Estilo de Ruta',
    pathColorTitle: 'Colores de Ruta',
    gridTitle: 'Estilo de Rejilla',
    showMainTitleLabel: 'Mostrar Título de Diagrama',
    showMainSubtitleLabel: 'Mostrar Subtítulo de Diagrama',
    showColumnTitlesLabel: 'Mostrar Encabezados',
    customTitleLabel: 'Título Personalizado',
    customSubtitleLabel: 'Subtítulo Personalizado',
    individualAssetsTitle: 'Exportación de Assets Individuales',
    individualAssetsSubtitle: 'Descarga cada origen o destino como PNG independiente en alta resolución.',
    downloadAllOrigins: 'Descargar Todos los Orígenes',
    downloadAllDestinations: 'Descargar Todos los Destinos',
    exportCard: 'Exportar Tarjeta',
    exporting: 'Exportando...',
    downloading: 'Descargando...',
    generatingPng: 'Generando PNG...',
    searchOrigins: 'Buscar orígenes...',
    searchDestinations: 'Buscar destinos...',
    selectAll: 'Seleccionar todos',
    deselectAll: 'Desmarcar todos',
    noResults: 'Sin resultados',
    close: 'Cerrar',
    light: 'Claro',
    dark: 'Oscuro',
    gradient: 'Gradiente',
    transparent: 'Transparente',
    curved: 'Curved',
    orthogonal: 'Orthogonal',
    hidden: 'Hidden',
    auto: 'Auto',
    custom: 'Custom',
    dots: 'Dots',
    lines: 'Lines',
    none: 'None',
  }
};

export interface ConnectionsDiagramToolProps {
  isEmbedded?: boolean;
  bgTheme?: 'light' | 'dark' | 'gradient' | 'transparent';
  activeDrawer?: 'settings' | 'origins' | 'destinations' | null;
  onActiveDrawerChange?: (drawer: 'settings' | 'origins' | 'destinations' | null) => void;
}

export default function ConnectionsDiagramTool({
  isEmbedded = false,
  bgTheme: propBgTheme,
  activeDrawer: propActiveDrawer,
  onActiveDrawerChange,
}: ConnectionsDiagramToolProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Connection Data Loading State
  const [data, setData] = useState<ConnectionsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Separate Drawers state: 'settings' | 'origins' | 'destinations' | null
  const [internalActiveDrawer, setInternalActiveDrawer] = useState<'settings' | 'origins' | 'destinations' | null>(null);
  const activeDrawer = propActiveDrawer !== undefined ? propActiveDrawer : internalActiveDrawer;
  const setActiveDrawer = (val: React.SetStateAction<'settings' | 'origins' | 'destinations' | null>) => {
    const nextVal = typeof val === 'function' ? val(activeDrawer) : val;
    setInternalActiveDrawer(nextVal);
    onActiveDrawerChange?.(nextVal);
  };
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Customization States
  const [bgTheme, setBgTheme] = useState<'light' | 'dark' | 'gradient' | 'transparent'>(propBgTheme || 'light');
  const [cardTheme, setCardTheme] = useState<'light' | 'dark'>(propBgTheme === 'light' ? 'light' : 'dark');

  useEffect(() => {
    if (propBgTheme !== undefined) {
      setBgTheme(propBgTheme);
      if (propBgTheme === 'light') setCardTheme('light');
      if (propBgTheme === 'dark' || propBgTheme === 'gradient') setCardTheme('dark');
    }
  }, [propBgTheme]);
  const [columnsMode, setColumnsMode] = useState<1 | 2>(2); // 2 COLUMNS DEFAULT!
  const [pathType, setPathType] = useState<'curved' | 'orthogonal' | 'hidden'>('curved');
  const [showMainTitle, setShowMainTitle] = useState(true);
  const [showMainSubtitle, setShowMainSubtitle] = useState(true);
  const [showColumnTitles, setShowColumnTitles] = useState(true);
  const [lang, setLang] = useState<'en' | 'es'>('es');
  const t = translations[lang];

  const [customMainTitle, setCustomMainTitle] = useState('');
  const [customMainSubtitle, setCustomMainSubtitle] = useState('');

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingCardId, setDownloadingCardId] = useState<string | null>(null);
  const [downloadingCategory, setDownloadingCategory] = useState<'origins' | 'destinations' | null>(null);

  // Line & Grid Color Customization States
  const [lineColorType, setLineColorType] = useState<'auto' | 'custom'>('custom');
  const [customLineColor, setCustomLineColor] = useState('#34d399');
  const [gridType, setGridType] = useState<'dots' | 'lines' | 'none'>('dots');
  const [gridColor, setGridColor] = useState('#94a3b8');

  // Visibility States for individual cards
  const [visibleOrigins, setVisibleOrigins] = useState<string[]>([]);
  const [visibleDestinations, setVisibleDestinations] = useState<string[]>([]);

  // Search filter states for checklist
  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');

  // 16:9 Canvas Dimensions
  const canvasWidth = 1920;
  const canvasHeight = 1080;

  // Zoom and Pan States
  const [zoom, setZoom] = useState(1);
  const [zoomScale, setZoomScale] = useState({ x: 1, y: 1 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  // Calculate Auto-Fit Zoom based on Container Dimensions (16:9)
  const calculateFitZoom = useCallback(() => {
    if (!viewportRef.current) return { x: 1, y: 1, min: 1 };
    const { clientWidth, clientHeight } = viewportRef.current;
    if (clientWidth === 0 || clientHeight === 0) return { x: 1, y: 1, min: 1 };
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

  // Handle ResizeObserver for exact pixel-perfect height fitting
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

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen?.().catch(() => { });
    } else {
      await document.exitFullscreen?.().catch(() => { });
    }
  };

  // Fetch connections data from Crestone API with local fallback
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
          setVisibleOrigins(jsonData.origins.map(o => o.id));
          setVisibleDestinations(jsonData.destinations.map(d => d.id));
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setData(fallbackData as ConnectionsData);
          setVisibleOrigins((fallbackData as ConnectionsData).origins.map(o => o.id));
          setVisibleDestinations((fallbackData as ConnectionsData).destinations.map(d => d.id));
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading || !data) {
    return (
      <div className="w-full aspect-video rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center p-12">
        <div className="w-10 h-10 border-4 border-info-main/20 border-t-info-main rounded-full animate-spin mb-4" />
        <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
          Cargando diagrama de conexiones...
        </p>
      </div>
    );
  }

  const origins = data.origins;
  const destinations = data.destinations;

  const activeOrigins = origins.filter(o => visibleOrigins.includes(o.id));
  const activeDestinations = destinations.filter(d => visibleDestinations.includes(d.id));

  // Hub coordinates in 16:9 Canvas
  const hubCenterX = 960;
  const hubCenterY = 540;
  const hubInputX = 860;
  const hubOutputX = 1060;

  // Single vs 2-Column Split Calculations
  const itemRowHeight = 54;
  const isTwoCol = columnsMode === 2;

  // Origins Splitting
  const origMid = isTwoCol ? Math.ceil(activeOrigins.length / 2) : activeOrigins.length;
  const origCol1 = activeOrigins.slice(0, origMid); // Outer left column
  const origCol2 = isTwoCol ? activeOrigins.slice(origMid) : []; // Inner left column

  const origCol1Top = Math.max(130, (canvasHeight - origCol1.length * itemRowHeight) / 2);
  const origCol2Top = Math.max(130, (canvasHeight - origCol2.length * itemRowHeight) / 2);

  // Destinations Splitting
  const destMid = isTwoCol ? Math.ceil(activeDestinations.length / 2) : activeDestinations.length;
  const destCol1 = activeDestinations.slice(0, destMid); // Inner right column
  const destCol2 = isTwoCol ? activeDestinations.slice(destMid) : []; // Outer right column

  const destCol1Top = Math.max(130, (canvasHeight - destCol1.length * itemRowHeight) / 2);
  const destCol2Top = Math.max(130, (canvasHeight - destCol2.length * itemRowHeight) / 2);

  // Column Positions in Canvas
  const cardWidth = isTwoCol ? 240 : 280;
  const origCol1X = isTwoCol ? 40 : 100;
  const origCol2X = isTwoCol ? 300 : 100;
  const destCol1X = isTwoCol ? 1380 : 1540;
  const destCol2X = isTwoCol ? 1640 : 1540;

  // Download Trigger
  const downloadPng = async () => {
    if (typeof window === 'undefined' || !canvasRef.current) return;

    try {
      setIsDownloading(true);
      const { toPng } = await import('html-to-image');

      const dataUrl = await toPng(canvasRef.current, {
        pixelRatio: 2,
        width: 1920,
        height: 1080,
        backgroundColor: bgTheme === 'transparent' ? 'transparent' : undefined,
        style: {
          transform: 'none',
          transformOrigin: '0 0',
          position: 'static',
          left: '0px',
          top: '0px',
          margin: '0px',
          width: '1920px',
          height: '1080px',
        }
      });

      const link = document.createElement('a');
      link.download = `crestone-connections-16x9-${bgTheme}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error creating connections PNG:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Download single card as high-res PNG
  const downloadSingleCard = async (id: string, title: string) => {
    if (typeof window === 'undefined') return;
    const element = document.getElementById(`card-export-${id}`);
    if (!element) return;

    try {
      setDownloadingCardId(id);
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(element, {
        pixelRatio: 3,
        backgroundColor: bgTheme === 'transparent' ? 'transparent' : undefined,
        style: {
          transform: 'scale(1)',
        }
      });

      const link = document.createElement('a');
      const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      link.download = `crestone-card-${safeTitle}-${bgTheme}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error creating single card PNG:', error);
    } finally {
      setDownloadingCardId(null);
    }
  };

  const getContainerStyle = () => {
    switch (bgTheme) {
      case 'light':
        return { backgroundColor: '#ffffff', color: '#0f172a' };
      case 'dark':
        return { backgroundColor: '#07153a', color: '#f8fafc' };
      case 'gradient':
        return {
          background: 'linear-gradient(135deg, #07153a 0%, #0c2356 50%, #07153a 100%)',
          color: '#ffffff'
        };
      case 'transparent':
      default:
        return {
          backgroundColor: 'transparent',
          color: cardTheme === 'dark' ? '#f8fafc' : '#0f172a'
        };
    }
  };

  const getLineStroke = (isDestination: boolean) => {
    if (lineColorType === 'custom') {
      return customLineColor;
    }
    if (bgTheme === 'gradient' || bgTheme === 'dark' || (bgTheme === 'transparent' && cardTheme === 'dark')) {
      return isDestination ? 'url(#destGrad)' : 'url(#originGrad)';
    }
    return isDestination ? '#38bdf8' : '#60a5fa';
  };

  // Mouse drag pan handler
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
      y: panStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.25), 3));
  };

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
      {/* 1. Top Bar Controls (Matching Canvas Width) */}
      {!isEmbedded && (
        <div className="w-full flex items-center justify-between z-10 shrink-0 px-1">
          {/* Settings Button (Left) */}
          <Button
            variant='light'
            onClick={() => setActiveDrawer(activeDrawer === 'settings' ? null : 'settings')}
            title={t.settings}
            iconName='gear'
            isIconButton
          >
            {t.settings}
          </Button>

          {/* Presentation / Fullscreen Button (Right) */}
          <Button
            variant={isFullscreen ? 'info' : 'light'}
            onClick={toggleFullscreen}
            title={isFullscreen ? t.exitFullscreen : t.fullscreen}
            iconName="screenView"
            isIconButton
          >
            {isFullscreen ? t.exitFullscreen : t.fullscreen}
          </Button>
        </div>
      )}

      {/* 2. Central 16:9 Viewport Canvas Container: Fitted Perfectly by Height */}
      <div
        ref={viewportRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors ${
          isEmbedded
            ? 'w-full h-full bg-transparent border-none rounded-none shadow-none'
            : `aspect-[16/9] max-w-full w-auto mx-auto rounded-[12px] border border-neutral-200 dark:border-neutral-800 shadow-[0px_0px_8px_0px_rgba(0,0,0,0.25)] bg-white dark:bg-[#07153a]/90 ${
                isFullscreen
                  ? 'h-[calc(100vh-125px)]'
                  : 'h-[calc(100vh-270px)] min-h-[440px] max-h-[820px]'
              }`
        }`}
      >
        {/* Transform Scale Wrapper */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
          className="shrink-0 pointer-events-auto"
        >
          {/* Main 16:9 Canvas (1920x1080) */}
          <div
            ref={canvasRef}
            style={{
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
              boxSizing: 'border-box',
              ...getContainerStyle(),
            }}
          >
            {/* Optional Grid Overlay (Dots / Lines) */}
            {gridType === 'dots' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `radial-gradient(${gridColor} 1.5px, transparent 1.5px)`,
                  backgroundSize: '28px 28px',
                  opacity: bgTheme === 'light' ? 0.35 : 0.2,
                  pointerEvents: 'none',
                  zIndex: 0,
                }}
              />
            )}
            {gridType === 'lines' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `linear-gradient(to right, ${gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`,
                  backgroundSize: '36px 36px',
                  opacity: bgTheme === 'light' ? 0.2 : 0.12,
                  pointerEvents: 'none',
                  zIndex: 0,
                }}
              />
            )}

            {/* Title Header */}
            {(showMainTitle || showMainSubtitle) && (
              <div
                style={{
                  position: 'absolute',
                  top: '30px',
                  left: 0,
                  width: '100%',
                  textAlign: 'center',
                  zIndex: 3,
                }}
              >
                {showMainTitle && (
                  <h1
                    style={{
                      margin: 0,
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '34px',
                      fontWeight: 800,
                      letterSpacing: '-0.5px',
                      background: 'linear-gradient(90deg, #0191FF, #00C6FF)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {customMainTitle || t.mainTitle}
                  </h1>
                )}
                {showMainSubtitle && (
                  <p
                    style={{
                      margin: '4px 0 0 0',
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '15px',
                      fontWeight: 500,
                      opacity: bgTheme === 'light' ? 0.7 : 0.8,
                    }}
                  >
                    {customMainSubtitle || t.mainSubtitle}
                  </p>
                )}
              </div>
            )}

            {/* SVG Connecting Paths */}
            {pathType !== 'hidden' && (
              <svg
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              >
                <defs>
                  <linearGradient id="originGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#66B6FF" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#0191FF" stopOpacity={0.9} />
                  </linearGradient>
                  <linearGradient id="destGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0191FF" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#66B6FF" stopOpacity={0.6} />
                  </linearGradient>
                </defs>

                {/* 1. Origins Column 1 (Outer Left) -> Hub */}
                {origCol1.map((_, i) => {
                  const cardY = origCol1Top + i * itemRowHeight + 23;
                  const startX = origCol1X + cardWidth;
                  const d =
                    pathType === 'curved'
                      ? `M ${startX} ${cardY} C ${startX + 180} ${cardY}, ${hubInputX - 200} ${hubCenterY}, ${hubInputX} ${hubCenterY}`
                      : `M ${startX} ${cardY} L ${startX + 140} ${cardY} L ${startX + 140} ${hubCenterY} L ${hubInputX} ${hubCenterY}`;

                  return (
                    <g key={`orig-col1-path-${i}`}>
                      <path d={d} fill="none" stroke={getLineStroke(false)} strokeWidth="2.2" />
                      <circle cx={startX} cy={cardY} r="4" fill={getLineStroke(false)} />
                    </g>
                  );
                })}

                {/* 2. Origins Column 2 (Inner Left) -> Hub */}
                {origCol2.map((_, i) => {
                  const cardY = origCol2Top + i * itemRowHeight + 23;
                  const startX = origCol2X + cardWidth;
                  const d =
                    pathType === 'curved'
                      ? `M ${startX} ${cardY} C ${startX + 120} ${cardY}, ${hubInputX - 120} ${hubCenterY}, ${hubInputX} ${hubCenterY}`
                      : `M ${startX} ${cardY} L ${startX + 90} ${cardY} L ${startX + 90} ${hubCenterY} L ${hubInputX} ${hubCenterY}`;

                  return (
                    <g key={`orig-col2-path-${i}`}>
                      <path d={d} fill="none" stroke={getLineStroke(false)} strokeWidth="2.2" />
                      <circle cx={startX} cy={cardY} r="4" fill={getLineStroke(false)} />
                    </g>
                  );
                })}

                {/* 3. Hub -> Destinations Column 1 (Inner Right) */}
                {destCol1.map((_, j) => {
                  const cardY = destCol1Top + j * itemRowHeight + 23;
                  const targetX = destCol1X;
                  const d =
                    pathType === 'curved'
                      ? `M ${hubOutputX} ${hubCenterY} C ${hubOutputX + 120} ${hubCenterY}, ${targetX - 120} ${cardY}, ${targetX} ${cardY}`
                      : `M ${hubOutputX} ${hubCenterY} L ${targetX - 90} ${hubCenterY} L ${targetX - 90} ${cardY} L ${targetX} ${cardY}`;

                  return (
                    <g key={`dest-col1-path-${j}`}>
                      <path d={d} fill="none" stroke={getLineStroke(true)} strokeWidth="2.2" />
                      <circle cx={targetX} cy={cardY} r="4" fill={getLineStroke(true)} />
                    </g>
                  );
                })}

                {/* 4. Hub -> Destinations Column 2 (Outer Right) */}
                {destCol2.map((_, j) => {
                  const cardY = destCol2Top + j * itemRowHeight + 23;
                  const targetX = destCol2X;
                  const d =
                    pathType === 'curved'
                      ? `M ${hubOutputX} ${hubCenterY} C ${hubOutputX + 200} ${hubCenterY}, ${targetX - 180} ${cardY}, ${targetX} ${cardY}`
                      : `M ${hubOutputX} ${hubCenterY} L ${targetX - 140} ${hubCenterY} L ${targetX - 140} ${cardY} L ${targetX} ${cardY}`;

                  return (
                    <g key={`dest-col2-path-${j}`}>
                      <path d={d} fill="none" stroke={getLineStroke(true)} strokeWidth="2.2" />
                      <circle cx={targetX} cy={cardY} r="4" fill={getLineStroke(true)} />
                    </g>
                  );
                })}

                {/* Hub Junction Pins */}
                <circle cx={hubInputX} cy={hubCenterY} r="5" fill={getLineStroke(false)} />
                <circle cx={hubOutputX} cy={hubCenterY} r="5" fill={getLineStroke(true)} />
              </svg>
            )}

            {/* Left Header Title: Orígenes */}
            {showColumnTitles && (
              <div
                style={{
                  position: 'absolute',
                  top: '80px',
                  left: `${origCol1X}px`,
                  width: isTwoCol ? `${cardWidth * 2 + 20}px` : `${cardWidth}px`,
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '15px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1.2px',
                  paddingBottom: '6px',
                  borderBottom: '2px solid rgba(1, 145, 255, 0.4)',
                  color: bgTheme === 'light' ? '#0f172a' : '#f8fafc',
                  zIndex: 2,
                }}
              >
                {t.origins}
              </div>
            )}

            {/* Column 1: Origins Sub-col 1 (Outer Left) */}
            <div
              style={{
                position: 'absolute',
                left: `${origCol1X}px`,
                top: `${origCol1Top}px`,
                width: `${cardWidth}px`,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                zIndex: 2,
              }}
            >
              {origCol1.map((item) => (
                <ConnectionCard
                  key={item.id}
                  title={item.title}
                  icon={item.iconName || 'file'}
                  brand={item.useBrand}
                  theme={cardTheme}
                  width={`${cardWidth}px`}
                />
              ))}
            </div>

            {/* Column 2: Origins Sub-col 2 (Inner Left, in 2-col mode) */}
            {isTwoCol && origCol2.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  left: `${origCol2X}px`,
                  top: `${origCol2Top}px`,
                  width: `${cardWidth}px`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  zIndex: 2,
                }}
              >
                {origCol2.map((item) => (
                  <ConnectionCard
                    key={item.id}
                    title={item.title}
                    icon={item.iconName || 'file'}
                    brand={item.useBrand}
                    theme={cardTheme}
                    width={`${cardWidth}px`}
                  />
                ))}
              </div>
            )}

            {/* Center: Crestone Core Hub */}
            <div
              style={{
                position: 'absolute',
                left: '860px',
                top: '440px',
                width: '200px',
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
              }}
            >
              {/* Outer Dashed Orbit */}
              <div
                style={{
                  width: '180px',
                  height: '180px',
                  borderRadius: '50%',
                  border: bgTheme === 'light' ? '3px dashed #cbd5e1' : '3px dashed rgba(1, 145, 255, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {/* Inner Dark Badge */}
                <div
                  style={{
                    width: '136px',
                    height: '136px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #07153a 0%, #1e1b4b 100%)',
                    boxShadow: '0 0 35px rgba(1, 145, 255, 0.5)',
                    border: '2px solid rgba(1, 145, 255, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CrestoneLogo size={62} color1="#66B6FF" color2="#ffffff" />
                </div>
              </div>

              {/* Crestone Text Label Pill */}
              <div
                style={{
                  marginTop: '16px',
                  backgroundColor: cardTheme === 'dark' ? '#1e293b' : '#ffffff',
                  border: cardTheme === 'dark' ? '2px solid #334155' : '2px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                  borderRadius: '10px',
                  padding: '6px 20px',
                  textAlign: 'center',
                  width: '180px',
                }}
              >
                <div
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 800,
                    fontSize: '13px',
                    letterSpacing: '2.5px',
                    color: cardTheme === 'dark' ? '#ffffff' : '#07153a',
                  }}
                >
                  CRESTONE
                </div>
              </div>
            </div>

            {/* Right Header Title: Destinos */}
            {showColumnTitles && (
              <div
                style={{
                  position: 'absolute',
                  top: '80px',
                  left: `${destCol1X}px`,
                  width: isTwoCol ? `${cardWidth * 2 + 20}px` : `${cardWidth}px`,
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '15px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1.2px',
                  paddingBottom: '6px',
                  borderBottom: '2px solid rgba(1, 145, 255, 0.4)',
                  color: bgTheme === 'light' ? '#0f172a' : '#f8fafc',
                  zIndex: 2,
                }}
              >
                {t.destinations}
              </div>
            )}

            {/* Column 3: Destinations Sub-col 1 (Inner Right) */}
            <div
              style={{
                position: 'absolute',
                left: `${destCol1X}px`,
                top: `${destCol1Top}px`,
                width: `${cardWidth}px`,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                zIndex: 2,
              }}
            >
              {destCol1.map((item) => (
                <ConnectionCard
                  key={item.id}
                  title={item.title}
                  icon={item.iconName || 'file'}
                  brand={item.useBrand}
                  theme={cardTheme}
                  width={`${cardWidth}px`}
                />
              ))}
            </div>

            {/* Column 4: Destinations Sub-col 2 (Outer Right, in 2-col mode) */}
            {isTwoCol && destCol2.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  left: `${destCol2X}px`,
                  top: `${destCol2Top}px`,
                  width: `${cardWidth}px`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  zIndex: 2,
                }}
              >
                {destCol2.map((item) => (
                  <ConnectionCard
                    key={item.id}
                    title={item.title}
                    icon={item.iconName || 'file'}
                    brand={item.useBrand}
                    theme={cardTheme}
                    width={`${cardWidth}px`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Bottom Action Bar (Matching Canvas Width) */}
      {!isEmbedded && (
        <div className="w-full mt-2 flex items-center justify-between z-10 shrink-0 px-1">
          {/* Left: Orígenes Toggle Button */}
          <Button
            variant='light'
            onClick={() => setActiveDrawer(activeDrawer === 'origins' ? null : 'origins')}
            title={t.origins}
            iconName='arrowUp'
          >
            {t.origins} ({activeOrigins.length}/{origins.length})
          </Button>

          {/* Center: Zoom Controls & Primary Download Button */}
          <div className="flex items-center gap-[8px]">
            {/* Zoom In (+) */}
            <Button
              variant='light'
              onClick={() => setZoom((z) => Math.min(z + 0.15, 2.8))}
              title={t.zoomIn}
              iconName='plus'
              isIconButton
            />
            {/* Zoom Out (-) */}
            <Button
              variant='light'
              onClick={() => setZoom((z) => Math.max(z - 0.15, 0.3))}
              title={t.zoomOut}
              iconName='less'
              isIconButton
            />
            {/* Reset View & Fit (⤢) */}
            <Button
              variant='light'
              onClick={resetView}
              title={t.resetZoom}
              disabled={isDownloading}
              iconName="arrowsMove"
              isIconButton
            />

            {/* Download 16:9 Diagram Button (Primary Blue) */}
            <Button
              variant='info'
              onClick={downloadPng}
              title={t.downloadDiagram}
              disabled={isDownloading}
              iconName="arrowDownToLine"
              isIconButton
            />
          </div>

          {/* Right: Destinos Toggle Button */}
          <Button
            variant='light'
            onClick={() => setActiveDrawer(activeDrawer === 'destinations' ? null : 'destinations')}
            title={t.destinations}
            iconName='arrowDown'
          >
            {t.destinations} ({activeDestinations.length}/{destinations.length})
          </Button>
        </div>
      )}

      {/* 4. Caralstable Drawer Component */}
      <Drawer
        isOpen={Boolean(activeDrawer)}
        onClose={() => setActiveDrawer(null)}
        title={
          activeDrawer === 'settings'
            ? t.settings
            : activeDrawer === 'origins'
            ? `${t.origins} (${visibleOrigins.length}/${origins.length})`
            : activeDrawer === 'destinations'
            ? `${t.destinations} (${visibleDestinations.length}/${destinations.length})`
            : ''
        }
        size="md"
      >
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* DRAWER 1: General Settings (Matching screenshot) */}
          {activeDrawer === 'settings' && (
            <div className="space-y-4">
              {/* Idioma */}
              <Select
                label={t.language}
                value={lang}
                onChange={(e) => setLang(e.target.value as any)}
                options={[
                  { value: 'es', label: 'Español' },
                  { value: 'en', label: 'English' },
                ]}
              />

              <div className="border-b border-neutral-200 dark:border-neutral-800 pt-1 pb-2" />

              {/* Estilo de Lienzo */}
              <Select
                label={t.canvasTitle}
                value={bgTheme}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setBgTheme(val);
                  if (val === 'light') setCardTheme('light');
                  if (val === 'dark' || val === 'gradient') setCardTheme('dark');
                }}
                options={[
                  { value: 'light', label: t.light },
                  { value: 'dark', label: t.dark },
                  { value: 'gradient', label: t.gradient },
                  { value: 'transparent', label: t.transparent },
                ]}
              />

              {/* Estilo de Tarjeta */}
              <Select
                label={t.cardTitle}
                value={cardTheme}
                onChange={(e) => setCardTheme(e.target.value as any)}
                options={[
                  { value: 'dark', label: t.dark },
                  { value: 'light', label: t.light },
                ]}
              />

              {/* Disposición de Columnas (2 Columnas por defecto) */}
              <Select
                label={t.columnsTitle}
                value={columnsMode}
                onChange={(e) => setColumnsMode(Number(e.target.value) as 1 | 2)}
                options={[
                  { value: 2, label: t.twoColumns },
                  { value: 1, label: t.oneColumn },
                ]}
              />

              <div className="border-b border-neutral-200 dark:border-neutral-800 pt-1 pb-2" />

              {/* Estilo de Ruta */}
              <Select
                label={t.pathStyleTitle}
                value={pathType}
                onChange={(e) => setPathType(e.target.value as any)}
                options={[
                  { value: 'curved', label: t.curved },
                  { value: 'orthogonal', label: t.orthogonal },
                  { value: 'hidden', label: t.hidden },
                ]}
              />

              {/* Colores de Ruta */}
              <div>
                <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1.5">
                  {t.pathColorTitle}
                </label>
                <div className="flex items-center gap-2.5">
                  <div className="flex-1">
                    <Select
                      value={lineColorType}
                      onChange={(e) => setLineColorType(e.target.value as any)}
                      options={[
                        { value: 'custom', label: t.custom },
                        { value: 'auto', label: t.auto },
                      ]}
                    />
                  </div>
                  {/* Color Swatch Picker */}
                  <label
                    className="w-[44px] h-[40px] shrink-0 rounded-[8px] border border-[#94a3b8] dark:border-neutral-700 overflow-hidden relative cursor-pointer shadow-2xs"
                    style={{ backgroundColor: lineColorType === 'custom' ? customLineColor : '#0191ff' }}
                    title="Seleccionar Color"
                  >
                    <input
                      type="color"
                      value={customLineColor}
                      onChange={(e) => {
                        setCustomLineColor(e.target.value);
                        setLineColorType('custom');
                      }}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Estilo de Rejilla */}
              <div>
                <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1.5">
                  {t.gridTitle}
                </label>
                <div className="flex items-center gap-2.5">
                  <div className="flex-1">
                    <Select
                      value={gridType}
                      onChange={(e) => setGridType(e.target.value as any)}
                      options={[
                        { value: 'dots', label: t.dots },
                        { value: 'lines', label: t.lines },
                        { value: 'none', label: t.none },
                      ]}
                    />
                  </div>
                  {/* Grid Color Swatch Picker */}
                  <label
                    className="w-[44px] h-[40px] shrink-0 rounded-[8px] border border-[#94a3b8] dark:border-neutral-700 overflow-hidden relative cursor-pointer shadow-2xs"
                    style={{ backgroundColor: gridColor }}
                    title="Color de Rejilla"
                  >
                    <input
                      type="color"
                      value={gridColor}
                      onChange={(e) => setGridColor(e.target.value)}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div className="border-b border-neutral-200 dark:border-neutral-800 pt-2 pb-2" />

              {/* Títulos y Opciones adicionales */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between text-xs font-medium cursor-pointer text-neutral-700 dark:text-neutral-300">
                  <span>{t.showMainTitleLabel}</span>
                  <input
                    type="checkbox"
                    checked={showMainTitle}
                    onChange={(e) => setShowMainTitle(e.target.checked)}
                    className="rounded accent-info-main w-4 h-4"
                  />
                </label>
                <label className="flex items-center justify-between text-xs font-medium cursor-pointer text-neutral-700 dark:text-neutral-300">
                  <span>{t.showMainSubtitleLabel}</span>
                  <input
                    type="checkbox"
                    checked={showMainSubtitle}
                    onChange={(e) => setShowMainSubtitle(e.target.checked)}
                    className="rounded accent-info-main w-4 h-4"
                  />
                </label>
                <label className="flex items-center justify-between text-xs font-medium cursor-pointer text-neutral-700 dark:text-neutral-300">
                  <span>{t.showColumnTitlesLabel}</span>
                  <input
                    type="checkbox"
                    checked={showColumnTitles}
                    onChange={(e) => setShowColumnTitles(e.target.checked)}
                    className="rounded accent-info-main w-4 h-4"
                  />
                </label>

                <div className="pt-2 space-y-3">
                  <Input
                    label={t.customTitleLabel}
                    placeholder={t.mainTitle}
                    value={customMainTitle}
                    onChange={(e) => setCustomMainTitle(e.target.value)}
                  />
                  <Input
                    label={t.customSubtitleLabel}
                    placeholder={t.mainSubtitle}
                    value={customMainSubtitle}
                    onChange={(e) => setCustomMainSubtitle(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* DRAWER 2: Orígenes Selection List */}
          {activeDrawer === 'origins' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  {t.origins} ({visibleOrigins.length}/{origins.length})
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibleOrigins(origins.map(o => o.id))}
                    className="text-xs font-medium text-info-main hover:underline cursor-pointer"
                  >
                    {t.selectAll}
                  </button>
                  <span className="text-neutral-300 dark:text-neutral-700">|</span>
                  <button
                    type="button"
                    onClick={() => setVisibleOrigins([])}
                    className="text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 cursor-pointer"
                  >
                    {t.deselectAll}
                  </button>
                </div>
              </div>

              {/* Search Bar with Reusable Input */}
              <Input
                placeholder={t.searchOrigins}
                value={originSearch}
                onChange={(e) => setOriginSearch(e.target.value)}
                leftIcon="search"
              />

              {/* Origin List Checkboxes */}
              <div className="space-y-1.5 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
                {origins
                  .filter((o) =>
                    o.title.toLowerCase().includes(originSearch.toLowerCase())
                  )
                  .map((o) => (
                    <label
                      key={o.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                        visibleOrigins.includes(o.id)
                          ? 'border-info-main/40 bg-info-main/5 dark:bg-info-main/10'
                          : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <input
                          type="checkbox"
                          checked={visibleOrigins.includes(o.id)}
                          onChange={(e) => {
                            if (e.target.checked) setVisibleOrigins([...visibleOrigins, o.id]);
                            else setVisibleOrigins(visibleOrigins.filter(id => id !== o.id));
                          }}
                          className="rounded accent-info-main w-4 h-4 cursor-pointer shrink-0"
                        />
                        <div className="w-6 h-6 flex items-center justify-center rounded bg-neutral-100 dark:bg-neutral-700 shrink-0">
                          {o.useBrand ? (
                            <Brand name={(o.iconName || 'file') as any} size={16} />
                          ) : (
                            <CaralIcon name={(o.iconName || 'file') as any} size={16} />
                          )}
                        </div>
                        <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate">
                          {o.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          downloadSingleCard(o.id, o.title);
                        }}
                        disabled={downloadingCardId === o.id}
                        className="p-1 text-neutral-400 hover:text-info-main rounded transition-colors shrink-0"
                        title={t.exportCard}
                      >
                        <CaralIcon name="arrowDownToLine" size={15} />
                      </button>
                    </label>
                  ))}
              </div>
            </div>
          )}

          {/* DRAWER 3: Destinos Selection List */}
          {activeDrawer === 'destinations' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  {t.destinations} ({visibleDestinations.length}/{destinations.length})
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibleDestinations(destinations.map(d => d.id))}
                    className="text-xs font-medium text-info-main hover:underline cursor-pointer"
                  >
                    {t.selectAll}
                  </button>
                  <span className="text-neutral-300 dark:text-neutral-700">|</span>
                  <button
                    type="button"
                    onClick={() => setVisibleDestinations([])}
                    className="text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 cursor-pointer"
                  >
                    {t.deselectAll}
                  </button>
                </div>
              </div>

              {/* Search Bar with Reusable Input */}
              <Input
                placeholder={t.searchDestinations}
                value={destSearch}
                onChange={(e) => setDestSearch(e.target.value)}
                leftIcon="search"
              />

              {/* Destination List Checkboxes */}
              <div className="space-y-1.5 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
                {destinations
                  .filter((d) =>
                    d.title.toLowerCase().includes(destSearch.toLowerCase())
                  )
                  .map((d) => (
                    <label
                      key={d.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                        visibleDestinations.includes(d.id)
                          ? 'border-info-main/40 bg-info-main/5 dark:bg-info-main/10'
                          : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <input
                          type="checkbox"
                          checked={visibleDestinations.includes(d.id)}
                          onChange={(e) => {
                            if (e.target.checked) setVisibleDestinations([...visibleDestinations, d.id]);
                            else setVisibleDestinations(visibleDestinations.filter(id => id !== d.id));
                          }}
                          className="rounded accent-info-main w-4 h-4 cursor-pointer shrink-0"
                        />
                        <div className="w-6 h-6 flex items-center justify-center rounded bg-neutral-100 dark:bg-neutral-700 shrink-0">
                          {d.useBrand ? (
                            <Brand name={(d.iconName || 'file') as any} size={16} />
                          ) : (
                            <CaralIcon name={(d.iconName || 'file') as any} size={16} />
                          )}
                        </div>
                        <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate">
                          {d.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          downloadSingleCard(d.id, d.title);
                        }}
                        disabled={downloadingCardId === d.id}
                        className="p-1 text-neutral-400 hover:text-info-main rounded transition-colors shrink-0"
                        title={t.exportCard}
                      >
                        <CaralIcon name="arrowDownToLine" size={15} />
                      </button>
                    </label>
                  ))}
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {/* Hidden Export Elements for Individual Download */}
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px' }}>
        {[...origins, ...destinations].map((item) => (
          <div
                  key={`export-node-${item.id}`}
                  id={`card-export-${item.id}`}
                  style={{
                    padding: '20px',
                    boxSizing: 'border-box',
                    display: 'inline-block',
                    ...getContainerStyle(),
                  }}
                >
                  <ConnectionCard
                    title={item.title}
                    icon={item.iconName || 'file'}
                    brand={item.useBrand}
                    theme={cardTheme}
                  />
                </div>
              ))}
            </div>
    </div>
  );
}
