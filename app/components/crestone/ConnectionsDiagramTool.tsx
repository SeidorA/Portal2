"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Brand, CaralIcon } from 'iconcaral2';
import { Button } from 'caralstable';
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

function CrestoneLogo({ color1 = "#66B6FF", color2 = "#ffffff", size = 48 }) {
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
}

function ConnectionCard({ title, icon, brand, theme }: ConnectionCardProps) {
  const isDark = theme === 'dark';
  return (
    <div style={{
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
      border: isDark ? '2px solid #334155' : '2px solid #e2e8f0',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 14px',
      width: '260px',
      height: '50px',
      boxSizing: 'border-box',
      overflow: 'hidden',
      position: 'relative',
      color: isDark ? '#f1f5f9' : '#242528',
      boxShadow: isDark
        ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
        : '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      <div style={{
        width: '30px',
        height: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {brand ? <Brand name={icon as any} size={30} /> : <CaralIcon name={icon as any} size={30} color={isDark ? '#f1f5f9' : '#242528'} />}
      </div>
      <span style={{
        fontFamily: "'Poppins', 'Outfit', 'Inter', sans-serif",
        fontSize: '13px',
        fontWeight: 500,
        color: isDark ? '#f1f5f9' : '#242528',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {title}
      </span>
    </div>
  );
}

const translations = {
  en: {
    generatorTitle: 'Connections Diagram Generator',
    generatorSubtitle: 'Customize and download the current Crestone ecosystem map. This diagram updates dynamically from your system\'s data and can be downloaded as a high-resolution transparent PNG, perfect for PowerPoint slides, web portals, or internal docs.',
    mainTitle: 'Crestone Connection Matrix',
    mainSubtitle: 'Ecosystem of SAP Origins and Target Cloud Destinations',
    origins: 'Source',
    destinations: 'Destinations',
    canvasTitle: 'Canvas Style',
    cardTitle: 'Card Style',
    pathColorTitle: 'Path Colors',
    gridTitle: 'Grid Style',
    pathStyleTitle: 'Path Style',
    showMainTitleLabel: 'Show Diagram Title',
    showMainSubtitleLabel: 'Show Diagram Subtitle',
    showColumnTitlesLabel: 'Show Column Headers',
    languageLabel: 'Title Language',
    customTitleLabel: 'Custom Diagram Title',
    customSubtitleLabel: 'Custom Diagram Subtitle',
    downloadDiagram: 'Download Diagram (PNG)',
    individualAssetsTitle: 'Individual Assets Export',
    individualAssetsSubtitle: 'Export each connection source or destination card as a high-resolution (3x) standalone PNG asset. Each asset is rendered with custom padding and inherits the active Canvas and Card styles selected above.',
    downloadAllOrigins: 'Download All Origins',
    downloadAllDestinations: 'Download All Destinations',
    exportCard: 'Export Card',
    exporting: 'Exporting...',
    downloading: 'Downloading...',
    generatingPng: 'Generating PNG...',
    searchOrigins: 'Search origins...',
    searchDestinations: 'Search destinations...',
    noResults: 'No results found',
  },
  es: {
    generatorTitle: 'Generador de Diagrama de Conexiones',
    generatorSubtitle: 'Personaliza y descarga el mapa actual del ecosistema Crestone. Este diagrama se actualiza dinámicamente con los datos de tu sistema y puede descargarse como un PNG transparente en alta resolución, ideal para diapositivas de PowerPoint, portales web o documentación interna.',
    mainTitle: 'Matriz de Conexión Crestone',
    mainSubtitle: 'Ecosistema de Orígenes SAP y Destinos en la Nube',
    origins: 'Orígenes',
    destinations: 'Destinos',
    canvasTitle: 'Estilo de Lienzo',
    cardTitle: 'Estilo de Tarjeta',
    pathColorTitle: 'Colores de Ruta',
    gridTitle: 'Estilo de Rejilla',
    pathStyleTitle: 'Estilo de Ruta',
    showMainTitleLabel: 'Mostrar Título de Diagrama',
    showMainSubtitleLabel: 'Mostrar Subtítulo de Diagrama',
    showColumnTitlesLabel: 'Mostrar Cabeceras de Columna',
    languageLabel: 'Idioma de Títulos',
    customTitleLabel: 'Título de Diagrama Personalizado',
    customSubtitleLabel: 'Subtítulo de Diagrama Personalizado',
    downloadDiagram: 'Descargar Diagrama (PNG)',
    individualAssetsTitle: 'Exportación de Assets Individuales',
    individualAssetsSubtitle: 'Exporta cada tarjeta de origen o destino como un asset PNG independiente en alta resolución (3x). Cada asset se genera con relleno personalizado y hereda los estilos de lienzo y tarjeta activos seleccionados arriba.',
    downloadAllOrigins: 'Descargar Todos los Orígenes',
    downloadAllDestinations: 'Descargar Todos los Destinos',
    exportCard: 'Exportar Tarjeta',
    exporting: 'Exportando...',
    downloading: 'Descargando...',
    generatingPng: 'Generando PNG...',
    searchOrigins: 'Buscar orígenes...',
    searchDestinations: 'Buscar destinos...',
    noResults: 'Sin resultados',
  }
};

export default function ConnectionsDiagramTool() {
  const canvasRef = useRef<HTMLDivElement>(null);

  // Connection Data Loading State
  const [data, setData] = useState<ConnectionsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Customization States
  const [bgTheme, setBgTheme] = useState<'light' | 'dark' | 'gradient' | 'transparent'>('gradient');
  const [cardTheme, setCardTheme] = useState<'light' | 'dark'>('dark');
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
  const [lineColorType, setLineColorType] = useState<'auto' | 'custom'>('auto');
  const [customLineColor, setCustomLineColor] = useState('#6366f1');
  const [gridType, setGridType] = useState<'dots' | 'lines' | 'none'>('dots');
  const [gridColor, setGridColor] = useState('#64748b');

  // Visibility States for individual cards
  const [visibleOrigins, setVisibleOrigins] = useState<string[]>([]);
  const [visibleDestinations, setVisibleDestinations] = useState<string[]>([]);

  // Search filter states for checklist
  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');

  // Fetch connections data from Crestone API with local fallback
  useEffect(() => {
    let active = true;
    fetch('https://raw.githubusercontent.com/SeidorA/DocuCrestone/refs/heads/main/static/api/connections.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch live connections');
        }
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
      <div className="flex flex-col items-center justify-center p-16 rounded-2xl bg-container border border-neutral-200 dark:border-neutral-800 my-6">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-info-main rounded-full animate-spin mb-4" />
        <p className="text-neutral-600 dark:text-neutral-400 font-medium">
          {lang === 'en' ? 'Loading connections...' : 'Cargando conexiones...'}
        </p>
      </div>
    );
  }

  const origins = data.origins;
  const destinations = data.destinations;

  const activeOrigins = origins.filter(o => visibleOrigins.includes(o.id));
  const activeDestinations = destinations.filter(d => visibleDestinations.includes(d.id));

  // Constants for dimensions and layout calculations (deterministic absolute layout)
  const canvasWidth = 1200;
  const canvasHeight = 1150;
  const columnWidth = 260;

  // Origins Layout Calculations
  const origListHeight = activeOrigins.length > 0 ? (activeOrigins.length * 50 + (activeOrigins.length - 1) * 12) : 0;
  const origStartTop = 85 + (980 - origListHeight) / 2;

  // Destinations Layout Calculations
  const destListHeight = activeDestinations.length > 0 ? (activeDestinations.length * 50 + (activeDestinations.length - 1) * 12) : 0;
  const destStartTop = 85 + (980 - destListHeight) / 2;

  // Hub Center coordinates
  const hubY = 85 + 980 / 2; // 575

  // Download Trigger
  const downloadPng = async () => {
    if (typeof window === 'undefined' || !canvasRef.current) return;

    try {
      setIsDownloading(true);
      const { toPng } = await import('html-to-image');

      const dataUrl = await toPng(canvasRef.current, {
        pixelRatio: 2,
        backgroundColor: bgTheme === 'transparent' ? 'transparent' : undefined,
        style: {
          transform: 'scale(1)',
        }
      });

      const link = document.createElement('a');
      link.download = `crestone-connections-${bgTheme}.png`;
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

  // Download all cards of a specific category sequentially
  const downloadAllCards = async (items: typeof origins, category: 'origins' | 'destinations') => {
    if (typeof window === 'undefined') return;
    try {
      setDownloadingCategory(category);
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await downloadSingleCard(item.id, item.title);
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    } catch (error) {
      console.error(`Error downloading all ${category}:`, error);
    } finally {
      setDownloadingCategory(null);
    }
  };

  const getContainerStyle = () => {
    switch (bgTheme) {
      case 'light':
        return { backgroundColor: '#f8fafc', color: '#0f172a' };
      case 'dark':
        return { backgroundColor: '#0f172a', color: '#f8fafc' };
      case 'gradient':
        return {
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
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
    if (bgTheme === 'gradient' || (bgTheme === 'transparent' && cardTheme === 'dark')) {
      return isDestination ? 'url(#destGrad)' : 'url(#originGrad)';
    }
    if (bgTheme === 'light' || (bgTheme === 'transparent' && cardTheme === 'light')) {
      return '#cbd5e1';
    }
    return '#475569';
  };

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Intro Header */}
      <div className="bg-container border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold font-poppins text-neutral-900 dark:text-white mb-2">
              {t.generatorTitle}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-3xl leading-relaxed">
              {t.generatorSubtitle}
            </p>
          </div>
          <Button
            variant="info"
            onClick={downloadPng}
            disabled={isDownloading}
            className="shrink-0 flex items-center gap-2"
          >
            <CaralIcon name="arrowDownToLine" size={18} />
            {isDownloading ? t.generatingPng : t.downloadDiagram}
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Controls Sidebar, Right Canvas Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Controls Sidebar */}
        <div className="xl:col-span-4 bg-container border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs flex flex-col gap-6 max-h-[85vh] overflow-y-auto">
          {/* Canvas Background */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              {t.canvasTitle}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['gradient', 'dark', 'light', 'transparent'] as const).map((tVal) => (
                <button
                  key={tVal}
                  onClick={() => {
                    setBgTheme(tVal);
                    if (tVal === 'light') setCardTheme('light');
                    if (tVal === 'dark' || tVal === 'gradient') setCardTheme('dark');
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize border transition-all ${
                    bgTheme === tVal
                      ? 'bg-info-main/10 border-info-main text-info-main'
                      : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {tVal}
                </button>
              ))}
            </div>
          </div>

          {/* Card Style */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              {t.cardTitle}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['light', 'dark'] as const).map((tVal) => (
                <button
                  key={tVal}
                  onClick={() => setCardTheme(tVal)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize border transition-all ${
                    cardTheme === tVal
                      ? 'bg-info-main/10 border-info-main text-info-main'
                      : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {tVal}
                </button>
              ))}
            </div>
          </div>

          {/* Path Style */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              {t.pathStyleTitle}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['curved', 'orthogonal', 'hidden'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setPathType(type)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize border transition-all ${
                    pathType === type
                      ? 'bg-info-main/10 border-info-main text-info-main'
                      : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Path Colors */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              {t.pathColorTitle}
            </label>
            <div className="flex gap-2 mb-2">
              {(['auto', 'custom'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setLineColorType(type)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold capitalize border transition-all ${
                    lineColorType === type
                      ? 'bg-info-main/10 border-info-main text-info-main'
                      : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {lineColorType === 'custom' && (
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={customLineColor}
                  onChange={(e) => setCustomLineColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-neutral-300 dark:border-neutral-700 cursor-pointer bg-transparent"
                />
                <span className="text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400">
                  {customLineColor}
                </span>
              </div>
            )}
          </div>

          {/* Grid Style */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              {t.gridTitle}
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {(['none', 'dots', 'lines'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setGridType(type)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize border transition-all ${
                    gridType === type
                      ? 'bg-info-main/10 border-info-main text-info-main'
                      : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {gridType !== 'none' && (
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={gridColor}
                  onChange={(e) => setGridColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-neutral-300 dark:border-neutral-700 cursor-pointer bg-transparent"
                />
                <span className="text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400">
                  {gridColor}
                </span>
              </div>
            )}
          </div>

          {/* Toggles */}
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-col gap-3">
            <label className="flex items-center justify-between text-xs font-medium cursor-pointer">
              <span>{t.showMainTitleLabel}</span>
              <input
                type="checkbox"
                checked={showMainTitle}
                onChange={(e) => setShowMainTitle(e.target.checked)}
                className="rounded accent-info-main"
              />
            </label>

            <label className="flex items-center justify-between text-xs font-medium cursor-pointer">
              <span>{t.showMainSubtitleLabel}</span>
              <input
                type="checkbox"
                checked={showMainSubtitle}
                onChange={(e) => setShowMainSubtitle(e.target.checked)}
                className="rounded accent-info-main"
              />
            </label>

            <label className="flex items-center justify-between text-xs font-medium cursor-pointer">
              <span>{t.showColumnTitlesLabel}</span>
              <input
                type="checkbox"
                checked={showColumnTitles}
                onChange={(e) => setShowColumnTitles(e.target.checked)}
                className="rounded accent-info-main"
              />
            </label>
          </div>

          {/* Language and Custom Titles */}
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-col gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                {t.languageLabel}
              </label>
              <div className="flex gap-2">
                {(['es', 'en'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase border transition-all ${
                      lang === l
                        ? 'bg-info-main/10 border-info-main text-info-main'
                        : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">{t.customTitleLabel}</label>
              <input
                type="text"
                placeholder={t.mainTitle}
                value={customMainTitle}
                onChange={(e) => setCustomMainTitle(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">{t.customSubtitleLabel}</label>
              <input
                type="text"
                placeholder={t.mainSubtitle}
                value={customMainSubtitle}
                onChange={(e) => setCustomMainSubtitle(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          {/* Visible Origins Filter */}
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                {t.origins} ({activeOrigins.length}/{origins.length})
              </label>
              <button
                onClick={() => {
                  if (visibleOrigins.length === origins.length) setVisibleOrigins([]);
                  else setVisibleOrigins(origins.map(o => o.id));
                }}
                className="text-2xs text-info-main font-semibold hover:underline"
              >
                {visibleOrigins.length === origins.length ? 'Desmarcar todos' : 'Todos'}
              </button>
            </div>
            <input
              type="text"
              placeholder={t.searchOrigins}
              value={originSearch}
              onChange={(e) => setOriginSearch(e.target.value)}
              className="w-full text-xs px-3 py-1.5 mb-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
            />
            <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
              {origins
                .filter(o => o.title.toLowerCase().includes(originSearch.toLowerCase()))
                .map((o) => (
                  <label key={o.id} className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 p-1 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleOrigins.includes(o.id)}
                      onChange={(e) => {
                        if (e.target.checked) setVisibleOrigins([...visibleOrigins, o.id]);
                        else setVisibleOrigins(visibleOrigins.filter(id => id !== o.id));
                      }}
                      className="rounded accent-info-main"
                    />
                    <span className="truncate">{o.title}</span>
                  </label>
                ))}
            </div>
          </div>

          {/* Visible Destinations Filter */}
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                {t.destinations} ({activeDestinations.length}/{destinations.length})
              </label>
              <button
                onClick={() => {
                  if (visibleDestinations.length === destinations.length) setVisibleDestinations([]);
                  else setVisibleDestinations(destinations.map(d => d.id));
                }}
                className="text-2xs text-info-main font-semibold hover:underline"
              >
                {visibleDestinations.length === destinations.length ? 'Desmarcar todos' : 'Todos'}
              </button>
            </div>
            <input
              type="text"
              placeholder={t.searchDestinations}
              value={destSearch}
              onChange={(e) => setDestSearch(e.target.value)}
              className="w-full text-xs px-3 py-1.5 mb-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
            />
            <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
              {destinations
                .filter(d => d.title.toLowerCase().includes(destSearch.toLowerCase()))
                .map((d) => (
                  <label key={d.id} className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 p-1 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleDestinations.includes(d.id)}
                      onChange={(e) => {
                        if (e.target.checked) setVisibleDestinations([...visibleDestinations, d.id]);
                        else setVisibleDestinations(visibleDestinations.filter(id => id !== d.id));
                      }}
                      className="rounded accent-info-main"
                    />
                    <span className="truncate">{d.title}</span>
                  </label>
                ))}
            </div>
          </div>
        </div>

        {/* Right Preview Canvas */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          <div className="w-full overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 p-6 flex justify-center shadow-inner">
            <div
              ref={canvasRef}
              style={{
                width: `${canvasWidth}px`,
                height: `${canvasHeight}px`,
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.2)',
                boxSizing: 'border-box',
                flexShrink: 0,
                ...getContainerStyle(),
              }}
            >
              {/* Optional Grid Overlay */}
              {gridType === 'dots' && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: `radial-gradient(${gridColor} 1.5px, transparent 1.5px)`,
                    backgroundSize: '24px 24px',
                    opacity: 0.25,
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                />
              )}
              {gridType === 'lines' && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: `linear-gradient(to right, ${gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`,
                    backgroundSize: '32px 32px',
                    opacity: 0.15,
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                />
              )}

              {/* Title Header */}
              {(showMainTitle || showMainSubtitle) && (
                <div style={{
                  position: 'absolute',
                  top: '28px',
                  left: '0',
                  width: '100%',
                  textAlign: 'center',
                  zIndex: 3
                }}>
                  {showMainTitle && (
                    <h1 style={{
                      margin: 0,
                      fontFamily: "'Poppins', 'Outfit', 'Inter', sans-serif",
                      fontSize: '32px',
                      fontWeight: 800,
                      letterSpacing: '-0.5px',
                      background: 'linear-gradient(90deg, #0191FF, #66B6FF)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}>
                      {customMainTitle || t.mainTitle}
                    </h1>
                  )}
                  {showMainSubtitle && (
                    <p style={{
                      margin: '4px 0 0 0',
                      fontFamily: "'Poppins', 'Outfit', 'Inter', sans-serif",
                      fontSize: '15px',
                      fontWeight: 500,
                      opacity: 0.75,
                    }}>
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
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 1,
                  }}
                >
                  <defs>
                    <linearGradient id="originGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#66B6FF" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#07153A" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="destGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#07153A" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#66B6FF" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>

                  {/* Origins to Hub */}
                  {activeOrigins.map((_, i) => {
                    const cardY = origStartTop + i * 62 + 25;
                    const d = pathType === 'curved'
                      ? `M 320 ${cardY} C 410 ${cardY}, 440 ${hubY}, 525 ${hubY}`
                      : `M 320 ${cardY} L 420 ${cardY} L 420 ${hubY} L 525 ${hubY}`;
                    return (
                      <g key={`orig-path-${i}`}>
                        <path d={d} fill="none" stroke={getLineStroke(false)} strokeWidth="2.5" />
                        <circle cx="320" cy={cardY} r="5" fill={getLineStroke(false)} />
                      </g>
                    );
                  })}

                  {/* Hub to Destinations */}
                  {activeDestinations.map((_, j) => {
                    const cardY = destStartTop + j * 62 + 25;
                    const d = pathType === 'curved'
                      ? `M 675 ${hubY} C 760 ${hubY}, 790 ${cardY}, 880 ${cardY}`
                      : `M 675 ${hubY} L 780 ${hubY} L 780 ${cardY} L 880 ${cardY}`;
                    return (
                      <g key={`dest-path-${j}`}>
                        <path d={d} fill="none" stroke={getLineStroke(true)} strokeWidth="2.5" />
                        <circle cx="880" cy={cardY} r="5" fill={getLineStroke(true)} />
                      </g>
                    );
                  })}

                  {/* Central Hub Pins */}
                  <circle cx="525" cy={hubY} r="5" fill={getLineStroke(false)} />
                  <circle cx="675" cy={hubY} r="5" fill={getLineStroke(true)} />
                </svg>
              )}

              {/* Column 1: Origins */}
              <div style={{
                position: 'absolute',
                left: '60px',
                top: '0',
                width: `${columnWidth}px`,
                height: '100%',
                zIndex: 2,
              }}>
                {showColumnTitles && (
                  <div style={{
                    position: 'absolute',
                    top: '85px',
                    left: '0',
                    width: '100%',
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '16px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    paddingBottom: '8px',
                    borderBottom: '2px solid rgba(99, 102, 241, 0.3)'
                  }}>
                    {t.origins}
                  </div>
                )}
                <div style={{
                  position: 'absolute',
                  top: `${origStartTop}px`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  {activeOrigins.map((item) => (
                    <ConnectionCard
                      key={item.id}
                      title={item.title}
                      icon={item.iconName || 'file'}
                      brand={item.useBrand}
                      theme={cardTheme}
                    />
                  ))}
                </div>
              </div>

              {/* Column 2: Crestone Hub */}
              <div style={{
                position: 'absolute',
                left: '420px',
                top: '0',
                width: '360px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
              }}>
                <div style={{
                  width: '180px',
                  height: '180px',
                  borderRadius: '50%',
                  border: bgTheme === 'light' ? '3px dashed #cbd5e1' : '3px dashed rgba(99, 102, 241, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  marginTop: '60px',
                }}>
                  <div style={{
                    width: '136px',
                    height: '136px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #07153a 0%, #1e1b4b 100%)',
                    boxShadow: '0 0 35px rgba(99, 102, 241, 0.45)',
                    border: '2px solid rgba(99, 102, 241, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <CrestoneLogo size={54} color1="#66B6FF" color2="#ffffff" />
                  </div>
                </div>

                <div style={{
                  marginTop: '20px',
                  backgroundColor: cardTheme === 'dark' ? '#1e293b' : '#ffffff',
                  border: cardTheme === 'dark' ? '2px solid #334155' : '2px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  borderRadius: '12px',
                  padding: '8px 20px',
                  textAlign: 'center',
                  width: '220px',
                }}>
                  <div style={{
                    fontFamily: "'Poppins', 'Outfit', sans-serif",
                    fontWeight: 800,
                    fontSize: '14px',
                    letterSpacing: '2.5px',
                    color: cardTheme === 'dark' ? '#ffffff' : '#07153a',
                  }}>
                    CRESTONE
                  </div>
                </div>
              </div>

              {/* Column 3: Destinations */}
              <div style={{
                position: 'absolute',
                left: '880px',
                top: '0',
                width: `${columnWidth}px`,
                height: '100%',
                zIndex: 2,
              }}>
                {showColumnTitles && (
                  <div style={{
                    position: 'absolute',
                    top: '85px',
                    left: '0',
                    width: '100%',
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '16px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    paddingBottom: '8px',
                    borderBottom: '2px solid rgba(99, 102, 241, 0.3)'
                  }}>
                    {t.destinations}
                  </div>
                )}
                <div style={{
                  position: 'absolute',
                  top: `${destStartTop}px`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  {activeDestinations.map((item) => (
                    <ConnectionCard
                      key={item.id}
                      title={item.title}
                      icon={item.iconName || 'file'}
                      brand={item.useBrand}
                      theme={cardTheme}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Individual Card Assets Export Rack */}
          <div className="bg-container border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold font-poppins text-neutral-900 dark:text-white mb-1">
                  {t.individualAssetsTitle}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  {t.individualAssetsSubtitle}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => downloadAllCards(origins, 'origins')}
                  disabled={Boolean(downloadingCategory)}
                  className="text-xs"
                >
                  <CaralIcon name="arrowDownToLine" size={14} />
                  {downloadingCategory === 'origins' ? t.downloading : t.downloadAllOrigins}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => downloadAllCards(destinations, 'destinations')}
                  disabled={Boolean(downloadingCategory)}
                  className="text-xs"
                >
                  <CaralIcon name="arrowDownToLine" size={14} />
                  {downloadingCategory === 'destinations' ? t.downloading : t.downloadAllDestinations}
                </Button>
              </div>
            </div>

            {/* Hidden Export Elements for Individual Download */}
            <div style={{ position: 'fixed', left: '-9999px', top: '-9999px' }}>
              {[...origins, ...destinations].map((item) => (
                <div
                  key={`export-node-${item.id}`}
                  id={`card-export-${item.id}`}
                  style={{
                    padding: '24px',
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...origins, ...destinations].map((item) => (
                <div
                  key={`card-item-${item.id}`}
                  className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 hover:border-info-main/40 transition-all"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-200 dark:bg-neutral-700 shrink-0">
                      {item.useBrand ? (
                        <Brand name={(item.iconName || 'file') as any} size={20} />
                      ) : (
                        <CaralIcon name={(item.iconName || 'file') as any} size={20} />
                      )}
                    </div>
                    <span className="text-xs font-semibold truncate text-neutral-800 dark:text-neutral-200">
                      {item.title}
                    </span>
                  </div>
                  <button
                    onClick={() => downloadSingleCard(item.id, item.title)}
                    disabled={downloadingCardId === item.id}
                    className="p-1.5 text-neutral-500 hover:text-info-main rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                    title={t.exportCard}
                  >
                    <CaralIcon name="arrowDownToLine" size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
