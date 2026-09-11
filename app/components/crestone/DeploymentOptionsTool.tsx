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

function CrestoneLogo({ color1 = "#66B6FF", color2 = "#ffffff", size = 30 }) {
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
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      border: isDark ? '2px solid #334155' : '2px solid #cbd5e1',
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
      color: isDark ? '#f1f5f9' : '#0c1d4a',
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
        {brand ? (
          <Brand name={icon as any} size={30} />
        ) : (
          <CaralIcon name={icon as any} size={30} color={isDark ? '#f1f5f9' : '#0c1d4a'} />
        )}
      </div>
      <span style={{
        fontFamily: "'Poppins', 'Outfit', 'Inter', sans-serif",
        fontSize: '13px',
        fontWeight: 500,
        color: isDark ? '#f1f5f9' : '#0c1d4a',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {title}
      </span>
    </div>
  );
}

function CrestoneCard({ theme }: { theme: 'light' | 'dark' }) {
  const isDark = theme === 'dark';
  return (
    <div style={{
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      border: isDark ? '2px solid #334155' : '2px solid #cbd5e1',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 14px',
      width: '260px',
      height: '50px',
      boxSizing: 'border-box',
      overflow: 'hidden',
      position: 'relative',
      boxShadow: isDark
        ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
        : '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CrestoneLogo size={30} color1="#3b82f6" color2={isDark ? '#ffffff' : '#0c1d4a'} />
      </div>
      <span style={{
        fontFamily: "'Poppins', 'Outfit', 'Inter', sans-serif",
        fontSize: '13px',
        fontWeight: 800,
        color: isDark ? '#ffffff' : '#0c1d4a',
        letterSpacing: '0.5px'
      }}>
        CRESTONE
      </span>
    </div>
  );
}

export default function DeploymentOptionsTool() {
  const canvasRef = useRef<HTMLDivElement>(null);

  const bgLight = '/img/crestone/ppt/bgdespliegue.png';
  const bgDark = '/img/crestone/ppt/bgdesplieguedark.png';

  const [data, setData] = useState<ConnectionsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [selectedOriginId, setSelectedOriginId] = useState<string>('');
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [deploymentMode, setDeploymentMode] = useState<'ambas' | 'cloud' | 'self-hosted'>('ambas');
  const [showTitles, setShowTitles] = useState<boolean>(true);
  const [originLabel, setOriginLabel] = useState<string>('');
  const [analyticsDestinationId, setAnalyticsDestinationId] = useState<string>('none');
  const [lang, setLang] = useState<'es' | 'en'>('es');

  useEffect(() => {
    let active = true;
    fetch('https://raw.githubusercontent.com/SeidorA/DocuCrestone/refs/heads/main/static/api/connections.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch connections');
        return res.json();
      })
      .then((jsonData: ConnectionsData) => {
        if (active) {
          setData(jsonData);
          if (jsonData.origins.length > 0) setSelectedOriginId(jsonData.origins[0].id);
          const defaultDest = jsonData.destinations.find(d => d.id === 'snowflake') || jsonData.destinations[0];
          if (defaultDest) setSelectedDestinationId(defaultDest.id);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          const fallback = fallbackData as ConnectionsData;
          setData(fallback);
          if (fallback.origins.length > 0) setSelectedOriginId(fallback.origins[0].id);
          const defaultDest = fallback.destinations.find(d => d.id === 'snowflake') || fallback.destinations[0];
          if (defaultDest) setSelectedDestinationId(defaultDest.id);
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
          {lang === 'en' ? 'Loading deployment data...' : 'Cargando datos de despliegue...'}
        </p>
      </div>
    );
  }

  const selectedOrigin = data.origins.find(o => o.id === selectedOriginId) || data.origins[0];
  const selectedDestination = data.destinations.find(d => d.id === selectedDestinationId) || data.destinations[0];

  const activeBg = theme === 'light' ? bgLight : bgDark;
  const isDark = theme === 'dark';
  const textColorMain = isDark ? '#ffffff' : '#0c1d4a';
  const textColorSub = '#00a2ff';
  const networkLabelColor = isDark ? '#cbd5e1' : '#2e3a59';
  const arrowColor = isDark ? '#ffffff' : '#0c1d4a';

  const glassStyle = isDark ? {
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    border: '1.5px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
  } : {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    border: '1.5px solid rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.04)'
  };

  const cloudOffset = deploymentMode === 'cloud' ? 120 : 0;
  const selfHostedOffset = deploymentMode === 'self-hosted' ? -130 : 0;

  const hasAnalytics = analyticsDestinationId && analyticsDestinationId !== 'none';
  const analyticsDestination = hasAnalytics ? (data?.destinations.find(d => d.id === analyticsDestinationId) || data?.destinations[0]) : null;

  const startX = hasAnalytics ? 40 : 120;
  const spacing = hasAnalytics ? 300 : 390;

  const col1X = startX;
  const col2X = startX + spacing;
  const col3X = startX + spacing * 2;
  const col4X = startX + spacing * 3;

  const flow1BoxLeft = col2X - 50;
  const flow1BoxWidth = 360;

  const flow2BoxLeft = col1X;
  const flow2BoxWidth = (col2X - col1X) + 260 + 50;
  const flow2OriginX = col1X + 30;

  const downloadPng = async () => {
    if (typeof window === 'undefined' || !canvasRef.current) return;

    try {
      setIsDownloading(true);
      const { toPng } = await import('html-to-image');

      const dataUrl = await toPng(canvasRef.current, {
        pixelRatio: 2.5,
        style: {
          transform: 'scale(1)',
        }
      });

      const link = document.createElement('a');
      link.download = `crestone-opciones-despliegue-${theme}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error generating PNG image:', error);
      alert(lang === 'en' ? 'Failed to generate image.' : 'Error al generar la imagen.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Intro Header */}
      <div className="bg-container border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold font-poppins text-neutral-900 dark:text-white mb-2">
              {lang === 'en' ? 'Deployment Options Generator' : 'Generador de Opciones de Despliegue'}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-3xl leading-relaxed">
              {lang === 'en'
                ? 'Customize the deployment architectures diagram by choosing source and target destinations. Export it as a high-resolution slide.'
                : 'Personaliza el diagrama de arquitecturas de despliegue seleccionando el origen y destino en la nube. Descarga la diapositiva en alta resolución para presentaciones.'}
            </p>
          </div>
          <Button
            variant="info"
            onClick={downloadPng}
            disabled={isDownloading}
            className="shrink-0 flex items-center gap-2"
          >
            <CaralIcon name="arrowDownToLine" size={18} />
            {isDownloading ? (lang === 'en' ? 'Downloading...' : 'Descargando...') : (lang === 'en' ? 'Download Slide (PNG)' : 'Descargar Diapositiva (PNG)')}
          </Button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Controls Sidebar */}
        <div className="xl:col-span-4 bg-container border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs flex flex-col gap-5 max-h-[85vh] overflow-y-auto">
          {/* Theme */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              {lang === 'en' ? 'Canvas Background' : 'Fondo del Lienzo'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['light', 'dark'] as const).map((tVal) => (
                <button
                  key={tVal}
                  onClick={() => setTheme(tVal)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize border transition-all ${
                    theme === tVal
                      ? 'bg-info-main/10 border-info-main text-info-main'
                      : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {tVal === 'light' ? (lang === 'en' ? 'Light' : 'Claro') : (lang === 'en' ? 'Dark' : 'Oscuro')}
                </button>
              ))}
            </div>
          </div>

          {/* Origin / Source */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              {lang === 'en' ? 'Origin / Source' : 'Origen / Source'}
            </label>
            <select
              value={selectedOriginId}
              onChange={(e) => setSelectedOriginId(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
            >
              {data.origins.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
            </select>
          </div>

          {/* Destination */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              {lang === 'en' ? 'Destination' : 'Destino'}
            </label>
            <select
              value={selectedDestinationId}
              onChange={(e) => setSelectedDestinationId(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
            >
              {data.destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </div>

          {/* Origin Custom Label */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              {lang === 'en' ? 'Origin Label' : 'Etiqueta de Origen'}
            </label>
            <input
              type="text"
              value={originLabel}
              onChange={(e) => setOriginLabel(e.target.value)}
              placeholder={lang === 'en' ? 'e.g. SAP ERP 6.0' : 'ej. SAP ERP 6.0'}
              className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
            />
          </div>

          {/* Analytics Layer */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              {lang === 'en' ? 'Analytics Layer' : 'Capa de Analítica'}
            </label>
            <select
              value={analyticsDestinationId}
              onChange={(e) => setAnalyticsDestinationId(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
            >
              <option value="none">{lang === 'en' ? 'None' : 'Ninguna'}</option>
              {data.destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </div>

          {/* Deployment Mode */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              {lang === 'en' ? 'Deployment Mode' : 'Modo de Despliegue'}
            </label>
            <select
              value={deploymentMode}
              onChange={(e) => setDeploymentMode(e.target.value as 'ambas' | 'cloud' | 'self-hosted')}
              className="w-full text-xs px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
            >
              <option value="ambas">{lang === 'en' ? 'Both' : 'Ambas'}</option>
              <option value="cloud">Cloud</option>
              <option value="self-hosted">Self Hosted</option>
            </select>
          </div>

          {/* Show Titles Toggle */}
          <label className="flex items-center justify-between text-xs font-medium cursor-pointer pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <span>{lang === 'en' ? 'Show Titles' : 'Mostrar Títulos'}</span>
            <input
              type="checkbox"
              checked={showTitles}
              onChange={(e) => setShowTitles(e.target.checked)}
              className="rounded accent-info-main"
            />
          </label>
        </div>

        {/* Canvas Preview Area */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          <div className="w-full overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 p-6 flex justify-center shadow-inner">
            <div
              id="deployment-options-canvas"
              ref={canvasRef}
              style={{
                width: '1280px',
                height: '720px',
                position: 'relative',
                backgroundImage: `url(${activeBg})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                overflow: 'hidden',
                flexShrink: 0,
                boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
                borderRadius: '8px',
                userSelect: 'none'
              }}
            >
              {/* SVG Connections & Arrowheads Layer */}
              <svg style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 2,
                pointerEvents: 'none'
              }}>
                <defs>
                  <marker
                    id="arrowheadDeployment"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={arrowColor} />
                  </marker>
                </defs>

                {(deploymentMode === 'ambas' || deploymentMode === 'cloud') && (
                  <>
                    <g>
                      <circle cx={col1X + 260} cy={245 + cloudOffset} r="5" fill={arrowColor} />
                      <line x1={col1X + 260} y1={245 + cloudOffset} x2={col2X - 6} y2={245 + cloudOffset} stroke={arrowColor} strokeWidth="2.5" markerEnd="url(#arrowheadDeployment)" />
                    </g>
                    <g>
                      <circle cx={col2X + 260} cy={245 + cloudOffset} r="5" fill={arrowColor} />
                      <line x1={col2X + 260} y1={245 + cloudOffset} x2={col3X - 6} y2={245 + cloudOffset} stroke={arrowColor} strokeWidth="2.5" markerEnd="url(#arrowheadDeployment)" />
                    </g>
                    {hasAnalytics && (
                      <g>
                        <circle cx={col3X + 260} cy={245 + cloudOffset} r="5" fill={arrowColor} />
                        <line x1={col3X + 260} y1={245 + cloudOffset} x2={col4X - 6} y2={245 + cloudOffset} stroke={arrowColor} strokeWidth="2.5" markerEnd="url(#arrowheadDeployment)" />
                      </g>
                    )}
                  </>
                )}

                {(deploymentMode === 'ambas' || deploymentMode === 'self-hosted') && (
                  <>
                    <g>
                      <circle cx={flow2OriginX + 260} cy={510 + selfHostedOffset} r="5" fill={arrowColor} />
                      <line x1={flow2OriginX + 260} y1={510 + selfHostedOffset} x2={col2X - 6} y2={510 + selfHostedOffset} stroke={arrowColor} strokeWidth="2.5" markerEnd="url(#arrowheadDeployment)" />
                    </g>
                    <g>
                      <circle cx={col2X + 260} cy={510 + selfHostedOffset} r="5" fill={arrowColor} />
                      <line x1={col2X + 260} y1={510 + selfHostedOffset} x2={col3X - 6} y2={510 + selfHostedOffset} stroke={arrowColor} strokeWidth="2.5" markerEnd="url(#arrowheadDeployment)" />
                    </g>
                    {hasAnalytics && (
                      <g>
                        <circle cx={col3X + 260} cy={510 + selfHostedOffset} r="5" fill={arrowColor} />
                        <line x1={col3X + 260} y1={510 + selfHostedOffset} x2={col4X - 6} y2={510 + selfHostedOffset} stroke={arrowColor} strokeWidth="2.5" markerEnd="url(#arrowheadDeployment)" />
                      </g>
                    )}
                  </>
                )}
              </svg>

              {/* Main Slide Title */}
              {showTitles && (
                <div style={{
                  position: 'absolute',
                  top: '60px',
                  left: '80px',
                  zIndex: 2
                }}>
                  <h1 style={{
                    margin: 0,
                    fontFamily: "'Poppins', 'Outfit', 'Inter', sans-serif",
                    fontSize: '40px',
                    fontWeight: 800,
                    color: textColorMain,
                    letterSpacing: '-0.5px'
                  }}>
                    {lang === 'en' ? 'Deployment Options' : 'Opciones de Despliegue'}
                  </h1>
                </div>
              )}

              {/* FLOW 1: Despliegue Cloud */}
              {(deploymentMode === 'ambas' || deploymentMode === 'cloud') && (
                <>
                  {showTitles && (
                    <div style={{
                      position: 'absolute',
                      top: `${135 + cloudOffset}px`,
                      left: '80px',
                      zIndex: 2
                    }}>
                      <h2 style={{
                        margin: 0,
                        fontFamily: "'Poppins', 'Outfit', 'Inter', sans-serif",
                        fontSize: '24px',
                        fontWeight: 700,
                        color: textColorSub,
                        letterSpacing: '-0.2px'
                      }}>
                        {lang === 'en' ? 'Cloud Deployment' : 'Despliegue Cloud'}
                      </h2>
                    </div>
                  )}

                  <div style={{ position: 'absolute', top: `${185 + cloudOffset}px`, left: `${col1X}px`, width: '260px', textAlign: 'center', fontFamily: "'Poppins', 'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: networkLabelColor, zIndex: 2 }}>
                    Customer Network
                  </div>
                  <div style={{ position: 'absolute', top: `${185 + cloudOffset}px`, left: `${col2X}px`, width: '260px', textAlign: 'center', fontFamily: "'Poppins', 'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: networkLabelColor, zIndex: 2 }}>
                    Crestone Network
                  </div>
                  <div style={{ position: 'absolute', top: `${185 + cloudOffset}px`, left: `${col3X}px`, width: '260px', textAlign: 'center', fontFamily: "'Poppins', 'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: networkLabelColor, zIndex: 2 }}>
                    Destination Network
                  </div>
                  {hasAnalytics && (
                    <div style={{ position: 'absolute', top: `${185 + cloudOffset}px`, left: `${col4X}px`, width: '260px', textAlign: 'center', fontFamily: "'Poppins', 'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: networkLabelColor, zIndex: 2 }}>
                      Analytics Layer
                    </div>
                  )}

                  <div style={{ position: 'absolute', top: `${220 + cloudOffset}px`, left: `${col1X}px`, zIndex: 3 }}>
                    <ConnectionCard title={selectedOrigin.title} icon={selectedOrigin.iconName || 'file'} brand={selectedOrigin.useBrand} theme={theme} />
                  </div>
                  {originLabel && (
                    <div style={{ position: 'absolute', top: `${280 + cloudOffset}px`, left: `${col1X}px`, width: '260px', textAlign: 'center', fontFamily: "'Poppins', 'Inter', sans-serif", fontSize: '14px', fontWeight: 700, color: textColorMain, zIndex: 3 }}>
                      {originLabel}
                    </div>
                  )}

                  <div style={{ position: 'absolute', top: `${175 + cloudOffset}px`, left: `${flow1BoxLeft}px`, width: `${flow1BoxWidth}px`, height: '140px', borderRadius: '12px', pointerEvents: 'none', zIndex: 1, ...glassStyle }} />
                  <div style={{ position: 'absolute', top: `${220 + cloudOffset}px`, left: `${col2X}px`, zIndex: 3 }}>
                    <CrestoneCard theme={theme} />
                  </div>
                  <div style={{ position: 'absolute', top: `${220 + cloudOffset}px`, left: `${col3X}px`, zIndex: 3 }}>
                    <ConnectionCard title={selectedDestination.title} icon={selectedDestination.iconName || 'file'} brand={selectedDestination.useBrand} theme={theme} />
                  </div>
                  {hasAnalytics && analyticsDestination && (
                    <div style={{ position: 'absolute', top: `${220 + cloudOffset}px`, left: `${col4X}px`, zIndex: 3 }}>
                      <ConnectionCard title={analyticsDestination.title} icon={analyticsDestination.iconName || 'file'} brand={analyticsDestination.useBrand} theme={theme} />
                    </div>
                  )}
                </>
              )}

              {/* FLOW 2: Despliegue Self Hosted */}
              {(deploymentMode === 'ambas' || deploymentMode === 'self-hosted') && (
                <>
                  {showTitles && (
                    <div style={{
                      position: 'absolute',
                      top: `${380 + selfHostedOffset}px`,
                      left: '80px',
                      zIndex: 2
                    }}>
                      <h2 style={{
                        margin: 0,
                        fontFamily: "'Poppins', 'Outfit', 'Inter', sans-serif",
                        fontSize: '24px',
                        fontWeight: 700,
                        color: textColorSub,
                        letterSpacing: '-0.2px'
                      }}>
                        {lang === 'en' ? 'Self Hosted Deployment' : 'Despliegue Self Hosted'}
                      </h2>
                    </div>
                  )}

                  <div style={{ position: 'absolute', top: `${430 + selfHostedOffset}px`, left: `${col1X}px`, width: `${flow2BoxWidth}px`, textAlign: 'center', fontFamily: "'Poppins', 'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: networkLabelColor, zIndex: 2 }}>
                    Customer Network
                  </div>
                  <div style={{ position: 'absolute', top: `${430 + selfHostedOffset}px`, left: `${col3X}px`, width: '260px', textAlign: 'center', fontFamily: "'Poppins', 'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: networkLabelColor, zIndex: 2 }}>
                    Destination Network
                  </div>
                  {hasAnalytics && (
                    <div style={{ position: 'absolute', top: `${430 + selfHostedOffset}px`, left: `${col4X}px`, width: '260px', textAlign: 'center', fontFamily: "'Poppins', 'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: networkLabelColor, zIndex: 2 }}>
                      Analytics Layer
                    </div>
                  )}

                  <div style={{ position: 'absolute', top: `${450 + selfHostedOffset}px`, left: `${flow2BoxLeft}px`, width: `${flow2BoxWidth}px`, height: '120px', borderRadius: '12px', pointerEvents: 'none', zIndex: 1, ...glassStyle }} />
                  <div style={{ position: 'absolute', top: `${485 + selfHostedOffset}px`, left: `${flow2OriginX}px`, zIndex: 3 }}>
                    <ConnectionCard title={selectedOrigin.title} icon={selectedOrigin.iconName || 'file'} brand={selectedOrigin.useBrand} theme={theme} />
                  </div>
                  {originLabel && (
                    <div style={{ position: 'absolute', top: `${545 + selfHostedOffset}px`, left: `${flow2OriginX}px`, width: '260px', textAlign: 'center', fontFamily: "'Poppins', 'Inter', sans-serif", fontSize: '14px', fontWeight: 700, color: textColorMain, zIndex: 3 }}>
                      {originLabel}
                    </div>
                  )}

                  <div style={{ position: 'absolute', top: `${485 + selfHostedOffset}px`, left: `${col2X}px`, zIndex: 3 }}>
                    <CrestoneCard theme={theme} />
                  </div>
                  <div style={{ position: 'absolute', top: `${485 + selfHostedOffset}px`, left: `${col3X}px`, zIndex: 3 }}>
                    <ConnectionCard title={selectedDestination.title} icon={selectedDestination.iconName || 'file'} brand={selectedDestination.useBrand} theme={theme} />
                  </div>
                  {hasAnalytics && analyticsDestination && (
                    <div style={{ position: 'absolute', top: `${485 + selfHostedOffset}px`, left: `${col4X}px`, zIndex: 3 }}>
                      <ConnectionCard title={analyticsDestination.title} icon={analyticsDestination.iconName || 'file'} brand={analyticsDestination.useBrand} theme={theme} />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
