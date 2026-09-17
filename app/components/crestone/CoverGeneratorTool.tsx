"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Drawer } from 'caralstable';
import { CaralIcon } from 'iconcaral2';
import Input from '@/app/components/Input';
import Select from '@/app/components/Select';

interface BackgroundOption {
  id: string;
  title: string;
  file: string;
  left: number;
  top: number;
  width: number;
  height: number;
  origLeft: number;
  origTop: number;
  origWidth: number;
  origHeight: number;
}

interface LogoOption {
  id: string;
  title: string;
  file: string;
}

const backgroundOptions: BackgroundOption[] = [
  { id: '3d1o', title: '3 Destinos | 1 Origen', file: '3destinos1origen.png', left: 850, top: 190, width: 1006, height: 701, origLeft: 1000, origTop: 290, origWidth: 719, origHeight: 501 },
  { id: '3d2o', title: '3 Destinos | 2 Orígenes', file: '3destinos2origen.png', left: 810, top: 170, width: 1045, height: 735, origLeft: 950, origTop: 250, origWidth: 804, origHeight: 566 },
  { id: '5d1o', title: '5 Destinos | 1 Origen', file: '5destinos1origen.png', left: 740, top: 240, width: 1120, height: 582, origLeft: 900, origTop: 300, origWidth: 896, origHeight: 466 },
  { id: '5d2o', title: '5 Destinos | 2 Orígenes', file: '5destinos2origen.png', left: 740, top: 200, width: 1120, height: 671, origLeft: 900, origTop: 270, origWidth: 896, origHeight: 537 },
  { id: '6d1o', title: '6 Destinos | 1 Origen', file: '6destinos1origen.png', left: 710, top: 180, width: 1150, height: 716, origLeft: 880, origTop: 240, origWidth: 959, origHeight: 597 },
  { id: '6d2o', title: '6 Destinos | 2 Orígenes', file: '6Destinos2origenes.png', left: 720, top: 180, width: 1135, height: 723, origLeft: 880, origTop: 240, origWidth: 946, origHeight: 603 },
  { id: '9d1o', title: '9 Destinos | 1 Origen', file: '9destino1origen.png', left: 640, top: 160, width: 1224, height: 745, origLeft: 750, origTop: 200, origWidth: 1113, origHeight: 678 },
  { id: '9d2o', title: '9 Destinos | 2 Orígenes', file: '9destino2origenes.png', left: 640, top: 160, width: 1224, height: 745, origLeft: 750, origTop: 200, origWidth: 1113, origHeight: 678 },
];

const logoOptions: LogoOption[] = [
  { id: 'SAP', title: 'SAP ECC', file: 'SAP.png' },
  { id: 'SAPOdata', title: 'SAP OData', file: 'SAPOdata.png' },
  { id: 'Sappublic', title: 'SAP Public Cloud', file: 'Sappublic.png' },
  { id: 'Odata', title: 'OData', file: 'Odata.png' },
  { id: 'aws', title: 'AWS', file: 'aws.png' },
  { id: 'azure', title: 'Azure', file: 'azure.png' },
  { id: 'azuresql', title: 'Azure SQL', file: 'azuresql.png' },
  { id: 'S3', title: 'Amazon S3', file: 'S3.png' },
  { id: 'Bigquery', title: 'Google BigQuery', file: 'Bigquery.png' },
  { id: 'Googlestorage', title: 'Google Storage', file: 'Googlestorage.png' },
  { id: 'Cloud_storage', title: 'Cloud Storage', file: 'Cloud_storage.png' },
  { id: 'Databricks', title: 'Databricks', file: 'Databricks.png' },
  { id: 'snowflake', title: 'Snowflake', file: 'snowflake.png' },
  { id: 'fabric', title: 'Microsoft Fabric', file: 'fabric.png' },
  { id: 'Saleforce', title: 'Salesforce', file: 'Saleforce.png' },
  { id: 'cloudera', title: 'Cloudera', file: 'cloudera.png' },
  { id: 'inelake', title: 'Inelake', file: 'inelake.png' }
];

const presets: {
  [bgId: string]: {
    logos: string[];
    positions: { [logoId: string]: { left: number; top: number } };
  }
} = {
  '3d1o': {
    logos: ['azure', 'fabric', 'SAP', 'snowflake'],
    positions: {
      'azure': { left: 1104, top: 458 },
      'fabric': { left: 1375, top: 358 },
      'SAP': { left: 1466, top: 621 },
      'snowflake': { left: 1096, top: 600 }
    }
  },
  '3d2o': {
    logos: ['azure', 'fabric', 'SAPOdata', 'snowflake', 'SAP'],
    positions: {
      'azure': { left: 1054, top: 418 },
      'fabric': { left: 1520, top: 520 },
      'SAPOdata': { left: 1330, top: 304 },
      'snowflake': { left: 1046, top: 560 },
      'SAP': { left: 1340, top: 650 }
    }
  },
  '5d1o': {
    logos: ['S3', 'Saleforce', 'SAP', 'azure', 'snowflake', 'aws'],
    positions: {
      'S3': { left: 1090, top: 408 },
      'Saleforce': { left: 1531, top: 441 },
      'SAP': { left: 1410, top: 600 },
      'azure': { left: 1108, top: 593 },
      'snowflake': { left: 1013, top: 536 },
      'aws': { left: 1280, top: 360 }
    }
  },
  '5d2o': {
    logos: ['aws', 'S3', 'Saleforce', 'SAPOdata', 'SAP', 'azure', 'snowflake'],
    positions: {
      'aws': { left: 1326, top: 648 },
      'S3': { left: 1090, top: 378 },
      'Saleforce': { left: 1531, top: 411 },
      'SAPOdata': { left: 1275, top: 330 },
      'SAP': { left: 1536, top: 499 },
      'azure': { left: 1108, top: 563 },
      'snowflake': { left: 1013, top: 506 }
    }
  },
  '6d1o': {
    logos: ['snowflake', 'Bigquery', 'aws', 'SAPOdata', 'Googlestorage', 'fabric', 'azure'],
    positions: {
      'snowflake': { left: 1037, top: 487 },
      'Bigquery': { left: 1174, top: 300 },
      'aws': { left: 1392, top: 341 },
      'SAPOdata': { left: 1620, top: 433 },
      'Googlestorage': { left: 1516, top: 627 },
      'fabric': { left: 992, top: 572 },
      'azure': { left: 1200, top: 700 }
    }
  },
  '6d2o': {
    logos: ['Databricks', 'Bigquery', 'snowflake', 'SAPOdata', 'SAP', 'S3', 'fabric', 'azure'],
    positions: {
      'Databricks': { left: 1013, top: 477 },
      'Bigquery': { left: 1140, top: 281 },
      'snowflake': { left: 1578, top: 450 },
      'SAPOdata': { left: 1330, top: 340 },
      'SAP': { left: 1613, top: 538 },
      'S3': { left: 1401, top: 695 },
      'fabric': { left: 968, top: 561 },
      'azure': { left: 1165, top: 690 }
    }
  },
  '9d1o': {
    logos: ['Saleforce', 'Googlestorage', 'fabric', 'Bigquery', 'Odata', 'azure', 'snowflake', 'aws', 'Databricks', 'SAP'],
    positions: {
      'Saleforce': { left: 926, top: 305 },
      'Googlestorage': { left: 1355, top: 273 },
      'fabric': { left: 1141, top: 306 },
      'Bigquery': { left: 1615, top: 395 },
      'Odata': { left: 1421, top: 390 },
      'azure': { left: 980, top: 450 },
      'snowflake': { left: 1130, top: 600 },
      'aws': { left: 1523, top: 645 },
      'Databricks': { left: 1109, top: 693 },
      'SAP': { left: 1007, top: 532 }
    }
  },
  '9d2o': {
    logos: ['Saleforce', 'Googlestorage', 'fabric', 'Bigquery', 'Odata', 'azure', 'snowflake', 'aws', 'Databricks', 'SAP', 'SAPOdata'],
    positions: {
      'Saleforce': { left: 926, top: 305 },
      'Googlestorage': { left: 1355, top: 273 },
      'fabric': { left: 1141, top: 306 },
      'Bigquery': { left: 1615, top: 395 },
      'Odata': { left: 1421, top: 390 },
      'azure': { left: 1600, top: 543 },
      'snowflake': { left: 980, top: 450 },
      'aws': { left: 1130, top: 600 },
      'Databricks': { left: 1369, top: 674 },
      'SAP': { left: 1109, top: 693 },
      'SAPOdata': { left: 1007, top: 532 }
    }
  }
};

function CrestoneLogo({ color1 = "#0191FF", color2 = "#1b2c6d", size = 70 }) {
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

const getScaledPositions = (bgId: string) => {
  const bg = backgroundOptions.find(b => b.id === bgId);
  const preset = presets[bgId];
  if (!bg || !preset) return {};

  const scaled: { [id: string]: { left: number, top: number } } = {};
  const logoW = 139;
  const logoH = 98;

  preset.logos.forEach(logoId => {
    const origPos = preset.positions[logoId];
    if (origPos) {
      const rx = origPos.left - bg.origLeft + logoW / 2;
      const ry = origPos.top - bg.origTop + logoH / 2;
      const scaleX = bg.width / bg.origWidth;
      const scaleY = bg.height / bg.origHeight;
      scaled[logoId] = {
        left: Math.round(bg.left + rx * scaleX - logoW / 2),
        top: Math.round(bg.top + ry * scaleY - logoH / 2)
      };
    }
  });
  return scaled;
};

const translations = {
  en: {
    generatorTitle: 'Presentation Cover Generator',
    generatorSubtitle: 'Select a corporate background diagram and customize titles and connections in high resolution 16:9.',
    settings: 'Cover Settings',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit Fullscreen',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    resetZoom: 'Reset Fit',
    downloadPng: 'Download Cover (PNG 16:9)',
    downloading: 'Downloading...',
    generatingPng: 'Generating PNG...',
    language: 'Language',
    labelCoverTitle: 'Cover Title',
    labelCoverSubtitle: 'Cover Subtitle',
    labelCoverTag: 'Footer Environment',
    labelBgImage: 'Diagram Background',
    labelTheme: 'Background Theme',
    labelDestinations: 'Active Connections',
    searchDestPlaceholder: 'Search connections...',
    noResults: 'No connections found',
    resetPositions: 'Reset Positions',
    themeLight: 'Light Theme',
    themeDark: 'Dark Theme',
    dragHelper: 'Drag the logo cards inside the canvas or double-click to replace them!',
    modalTitle: 'Change Connection',
    modalSearchPlaceholder: 'Search replacement...',
    modalCancel: 'Cancel',
    modalAlreadyActive: 'Already active',
    doubleClickHint: 'Double-click to change logo',
  },
  es: {
    generatorTitle: 'Generador de Portadas',
    generatorSubtitle: 'Selecciona un fondo de diagrama corporativo y personaliza títulos y conexiones en alta resolución 16:9.',
    settings: 'Configuración de Portada',
    fullscreen: 'Pantalla Completa',
    exitFullscreen: 'Salir de Pantalla Completa',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    resetZoom: 'Ajustar Vista',
    downloadPng: 'Descargar Portada (PNG 16:9)',
    downloading: 'Descargando...',
    generatingPng: 'Generando PNG...',
    language: 'Idioma',
    labelCoverTitle: 'Título de Portada',
    labelCoverSubtitle: 'Subtítulo de Portada',
    labelCoverTag: 'Entorno / Tag',
    labelBgImage: 'Diagrama de Fondo',
    labelTheme: 'Tema de Fondo',
    labelDestinations: 'Conexiones Activas',
    searchDestPlaceholder: 'Buscar conexiones...',
    noResults: 'No se encontraron conexiones',
    resetPositions: 'Restaurar Posiciones',
    themeLight: 'Claro (Light)',
    themeDark: 'Oscuro (Dark)',
    dragHelper: '¡Arrastra los logos dentro del lienzo o haz doble clic para reemplazarlos!',
    modalTitle: 'Cambiar Conexión',
    modalSearchPlaceholder: 'Buscar reemplazo...',
    modalCancel: 'Cancelar',
    modalAlreadyActive: 'Ya activa',
    doubleClickHint: 'Doble clic para cambiar conexión',
  }
};

export interface CoverGeneratorToolProps {
  isEmbedded?: boolean;
  coverTitle?: string;
  coverSubtitle?: string;
  coverTag?: string;
  selectedBgId?: string;
  theme?: 'dark' | 'light';
  isDrawerOpen?: boolean;
  onDrawerOpenChange?: (open: boolean) => void;
  onConfigChange?: (config: any) => void;
}

export default function CoverGeneratorTool({
  isEmbedded = false,
  coverTitle: propCoverTitle,
  coverSubtitle: propCoverSubtitle,
  coverTag: propCoverTag,
  selectedBgId: propSelectedBgId,
  theme: propTheme,
  isDrawerOpen: propIsDrawerOpen,
  onDrawerOpenChange,
  onConfigChange,
}: CoverGeneratorToolProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const [coverTitle, setCoverTitle] = useState(propCoverTitle || 'CRESTONE');
  const [coverSubtitle, setCoverSubtitle] = useState(propCoverSubtitle || 'Matriz de Integración y Destinos Soportados');
  const [coverTag, setCoverTag] = useState(propCoverTag || 'crestone.seidoranalytics.com/');
  const [selectedBgId, setSelectedBgId] = useState<string>(propSelectedBgId || '9d2o');
  const [theme, setTheme] = useState<'dark' | 'light'>(propTheme || 'dark');
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const t = translations[lang];

  useEffect(() => {
    if (propCoverTitle !== undefined) setCoverTitle(propCoverTitle);
  }, [propCoverTitle]);

  useEffect(() => {
    if (propCoverSubtitle !== undefined) setCoverSubtitle(propCoverSubtitle);
  }, [propCoverSubtitle]);

  useEffect(() => {
    if (propCoverTag !== undefined) setCoverTag(propCoverTag);
  }, [propCoverTag]);

  useEffect(() => {
    if (propSelectedBgId !== undefined) {
      setSelectedBgId(propSelectedBgId);
      if (presets[propSelectedBgId]) {
        setActiveLogos(presets[propSelectedBgId].logos);
        setCardPositions(getScaledPositions(propSelectedBgId));
      }
    }
  }, [propSelectedBgId]);

  useEffect(() => {
    if (propTheme !== undefined) setTheme(propTheme);
  }, [propTheme]);

  const [activeLogos, setActiveLogos] = useState<string[]>(presets['9d2o'].logos);
  const [searchQuery, setSearchQuery] = useState('');
  const [cardPositions, setCardPositions] = useState<{ [id: string]: { left: number; top: number } }>(() => getScaledPositions('9d2o'));
  const [editingLogoId, setEditingLogoId] = useState<string | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  // Drawer and presentation states
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // 16:9 Canvas Dimensions
  const canvasWidth = 1920;
  const canvasHeight = 1080;

  // Zoom & Pan states
  const [zoom, setZoom] = useState(1);
  const [zoomScale, setZoomScale] = useState({ x: 1, y: 1 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const dragCanvasStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  const basePath = '/img/crestone/portada/';
  const bgSlideDark = '/img/crestone/portada/bgdark.jpg';
  const bgSlideLight = '/img/crestone/portada/bgligth.jpg';

  // Calculate Auto-Fit Zoom based on Container Dimensions (16:9)
  const calculateFitZoom = useCallback(() => {
    if (!viewportRef.current) return { x: 1, y: 1, min: 1 };
    const { clientWidth, clientHeight } = viewportRef.current;
    if (clientWidth === 0 || clientHeight === 0) return { x: 1, y: 1, min: 1 };
    const scaleX = clientWidth / canvasWidth;
    const scaleY = clientHeight / canvasHeight;
    return { x: scaleX, y: scaleY, min: Math.min(scaleX, scaleY) };
  }, [canvasWidth, canvasHeight]);

  // Update zoom when container size changes
  useEffect(() => {
    const updateZoom = () => {
      const fit = calculateFitZoom();
      setZoom(fit.min);
      setZoomScale({ x: fit.x, y: fit.y });
      setPan({ x: 0, y: 0 });
    };

    updateZoom();

    const currentViewport = viewportRef.current;
    const observer = new ResizeObserver(() => {
      updateZoom();
    });

    if (currentViewport) {
      observer.observe(currentViewport);
    }

    return () => {
      if (currentViewport) {
        observer.unobserve(currentViewport);
      }
      observer.disconnect();
    };
  }, [calculateFitZoom]);

  // Handle Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {
        setIsFullscreen(!isFullscreen);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {
        setIsFullscreen(false);
      });
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => {
        const fit = calculateFitZoom();
        setZoom(fit.min);
        setZoomScale({ x: fit.x, y: fit.y });
        setPan({ x: 0, y: 0 });
      }, 100);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [calculateFitZoom]);

  const selectedBg = backgroundOptions.find(bg => bg.id === selectedBgId) || backgroundOptions[6];
  const filteredLogos = logoOptions.filter(logo => logo.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSelectBg = (bgId: string) => {
    setSelectedBgId(bgId);
    if (presets[bgId]) {
      setActiveLogos(presets[bgId].logos);
      setCardPositions(getScaledPositions(bgId));
    }
  };

  const handleReplaceLogo = (oldId: string, newId: string) => {
    if (oldId === newId) {
      setEditingLogoId(null);
      setModalSearchQuery('');
      return;
    }

    setActiveLogos(prev => prev.map(id => id === oldId ? newId : id));
    setCardPositions(prev => {
      const copy = { ...prev };
      if (copy[oldId]) {
        copy[newId] = copy[oldId];
        delete copy[oldId];
      }
      return copy;
    });

    setEditingLogoId(null);
    setModalSearchQuery('');
  };

  const handleToggleLogo = (id: string) => {
    if (activeLogos.includes(id)) {
      setActiveLogos(activeLogos.filter(item => item !== id));
      const newPos = { ...cardPositions };
      delete newPos[id];
      setCardPositions(newPos);
    } else {
      setActiveLogos([...activeLogos, id]);
    }
  };

  // Canvas Pan Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (isEmbedded || e.button !== 0) return;
    setIsDraggingCanvas(true);
    dragCanvasStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { x: pan.x, y: pan.y };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isEmbedded || !isDraggingCanvas) return;
    const dx = e.clientX - dragCanvasStartRef.current.x;
    const dy = e.clientY - dragCanvasStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingCanvas(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (isEmbedded) return;
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.25), 3));
  };

  // Draggable Logo Handlers
  const handleLogoMouseDown = (e: React.MouseEvent, id: string, index: number) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const defaultPos = { left: 800 + (index % 5) * 160, top: 880 + Math.floor(index / 5) * 110 };
    const currentPos = cardPositions[id] || defaultPos;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startX) / zoom;
      const deltaY = (moveEvent.clientY - startY) / zoom;
      setCardPositions(prev => ({
        ...prev,
        [id]: {
          left: Math.max(0, Math.min(1780, Math.round(currentPos.left + deltaX))),
          top: Math.max(0, Math.min(980, Math.round(currentPos.top + deltaY))),
        }
      }));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const downloadPng = async () => {
    if (typeof window === 'undefined' || !canvasRef.current) return;
    try {
      setIsDownloading(true);
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(canvasRef.current, {
        pixelRatio: 2,
        width: 1920,
        height: 1080,
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
      link.download = `crestone-portada-${selectedBg.file}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error creating cover PNG:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const bgImgUrl = `${basePath}${selectedBg.file}`;

  const [internalDrawerOpen, setInternalDrawerOpen] = useState(false);
  const isDrawerOpen = propIsDrawerOpen !== undefined ? propIsDrawerOpen : internalDrawerOpen;
  const setDrawerOpen = (val: boolean) => {
    setInternalDrawerOpen(val);
    onDrawerOpenChange?.(val);
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
      {/* 1. Top Bar Controls */}
      {!isEmbedded && (
        <div className="w-full flex items-center justify-between z-10 shrink-0 px-1">
          {/* Settings Button (Left) */}
          <Button
            variant="light"
            onClick={() => setDrawerOpen(true)}
            title={t.settings}
            iconName="gear"
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
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
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
          ref={canvasRef}
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDraggingCanvas ? 'none' : 'transform 0.15s ease-out',
            position: 'relative',
            overflow: 'hidden',
            backgroundImage: `url(${theme === 'light' ? bgSlideLight : bgSlideDark})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: theme === 'light' ? '#0f172a' : '#ffffff',
            fontFamily: "'Poppins', 'Outfit', 'Inter', sans-serif",
            flexShrink: 0,
            userSelect: 'none'
          }}
        >
          {/* Tech Dot Grid */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: theme === 'light'
                ? 'radial-gradient(rgba(15, 23, 42, 0.08) 1.5px, transparent 1.5px)'
                : 'radial-gradient(rgba(255, 255, 255, 0.05) 1.5px, transparent 1.5px)',
              backgroundSize: '32px 32px',
              pointerEvents: 'none',
              zIndex: 0
            }}
          />

          {/* Selected Diagram Background */}
          <img
            src={bgImgUrl}
            alt={selectedBg.title}
            style={{
              position: 'absolute',
              left: `${selectedBg.left}px`,
              top: `${selectedBg.top}px`,
              width: `${selectedBg.width}px`,
              height: `${selectedBg.height}px`,
              pointerEvents: 'none',
              zIndex: 1
            }}
          />

          {/* Title Panel */}
          <div
            style={{
              position: 'absolute',
              left: '152px',
              top: '410px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              maxWidth: '800px',
              zIndex: 3,
              pointerEvents: 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              <CrestoneLogo color1={theme === 'light' ? '#0191FF' : '#66B6FF'} color2={theme === 'light' ? '#1b2c6d' : '#ffffff'} size={70} />
              <h1
                style={{
                  fontFamily: "'Poppins', 'Outfit', 'Inter', sans-serif",
                  fontSize: '80px',
                  fontWeight: 800,
                  lineHeight: 1.07,
                  margin: 0,
                  letterSpacing: '-1.5px',
                  background: 'linear-gradient(90deg, #0191FF, #66B6FF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {coverTitle}
              </h1>
            </div>
            <p
              style={{
                fontSize: '32px',
                fontWeight: 400,
                margin: 0,
                color: theme === 'light' ? '#1e293b' : '#e2e8f0',
                opacity: 0.9,
                textShadow: theme === 'light' ? '0 1px 4px rgba(255, 255, 255, 0.60)' : '0 2px 6px rgba(0, 0, 0, 0.3)'
              }}
            >
              {coverSubtitle}
            </p>
          </div>

          {/* Footer Tag Panel */}
          <div
            style={{
              position: 'absolute',
              bottom: '60px',
              left: '100px',
              right: '100px',
              zIndex: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              borderTop: theme === 'light' ? '1.5px solid rgba(15, 23, 42, 0.15)' : '1.5px solid rgba(255, 255, 255, 0.12)',
              paddingTop: '20px',
              pointerEvents: 'none'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: theme === 'light' ? '#475569' : '#94a3b8', letterSpacing: '1.5px' }}>
                {lang === 'es' ? 'Más Información' : 'More Information'}
              </span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: theme === 'light' ? '#0f172a' : '#ffffff' }}>
                crestone.io
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: theme === 'light' ? '#475569' : '#94a3b8', letterSpacing: '1.5px' }}>
                {lang === 'es' ? 'Entorno' : 'Environment'}
              </span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#10b981' }}>
                ● {coverTag}
              </span>
            </div>
          </div>

          {/* Draggable Logos */}
          {activeLogos.map((logoId, index) => {
            const logoInfo = logoOptions.find(l => l.id === logoId);
            if (!logoInfo) return null;

            const logoImgUrl = `${basePath}${logoInfo.file}`;
            const defaultPos = { left: 800 + (index % 5) * 160, top: 880 + Math.floor(index / 5) * 110 };
            const finalPos = cardPositions[logoId] || defaultPos;

            return (
              <div
                key={logoId}
                style={{
                  position: 'absolute',
                  left: `${finalPos.left}px`,
                  top: `${finalPos.top}px`,
                  width: '139px',
                  height: '98px',
                  cursor: 'grab',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseDown={(e) => handleLogoMouseDown(e, logoId, index)}
                onDoubleClick={() => setEditingLogoId(logoId)}
                title={`${t.dragHelper} | ${t.doubleClickHint}`}
              >
                <img
                  src={logoImgUrl}
                  alt={logoInfo.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    pointerEvents: 'none',
                    filter: 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.35))'
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Bottom Bar Floating Controls */}
      {!isEmbedded && (
        <div className="w-full flex items-center justify-between z-10 shrink-0 px-1">
          {/* Left: Zoom & Position Controls */}
          <div className="flex items-center gap-1.5 bg-container/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-xl p-1 shadow-sm">
            <Button
              variant="light"
              onClick={() => setZoom((prev) => Math.min(prev + 0.1, 3))}
              title={t.zoomIn}
              iconName="zoomIn"
              isIconButton
            >
              {t.zoomIn}
            </Button>
            <Button
              variant="light"
              onClick={() => setZoom((prev) => Math.max(prev - 0.1, 0.25))}
              title={t.zoomOut}
              iconName="zoomOut"
              isIconButton
            >
              {t.zoomOut}
            </Button>
            <Button
              variant="light"
              onClick={() => {
                const fit = calculateFitZoom();
                setZoom(fit.min);
                setZoomScale({ x: fit.x, y: fit.y });
                setPan({ x: 0, y: 0 });
              }}
              title={t.resetZoom}
              iconName="sync"
              isIconButton
            >
              {t.resetZoom}
            </Button>
            <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 mx-1" />
            <Button
              variant="ghost"
              onClick={() => setCardPositions(getScaledPositions(selectedBgId))}
              title={t.resetPositions}
              className="text-xs"
            >
              {t.resetPositions}
            </Button>
          </div>

          {/* Right: Download Action */}
          <Button
            variant="info"
            onClick={downloadPng}
            disabled={isDownloading}
            title={t.downloadPng}
            iconName="arrowDownToLine"
          >
            {isDownloading ? t.generatingPng : t.downloadPng}
          </Button>
        </div>
      )}

      {/* 4. Caralstable Drawer Component (Gear Button Configuration) */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={t.settings}
        size="md"
      >
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Idioma */}
          <Select
            label={t.language}
            value={lang}
            onChange={(e) => setLang(e.target.value as 'es' | 'en')}
            options={[
              { value: 'es', label: 'Español' },
              { value: 'en', label: 'English' },
            ]}
          />

          <div className="border-b border-neutral-200 dark:border-neutral-800 pt-1 pb-2" />

          {/* Título de Portada */}
          <Input
            label={t.labelCoverTitle}
            value={coverTitle}
            onChange={(e) => setCoverTitle(e.target.value)}
          />

          {/* Subtítulo de Portada */}
          <Input
            label={t.labelCoverSubtitle}
            value={coverSubtitle}
            onChange={(e) => setCoverSubtitle(e.target.value)}
          />

          {/* Tag / Entorno */}
          <Input
            label={t.labelCoverTag}
            value={coverTag}
            onChange={(e) => setCoverTag(e.target.value)}
          />

          <div className="border-b border-neutral-200 dark:border-neutral-800 pt-1 pb-2" />

          {/* Tema del Fondo */}
          <Select
            label={t.labelTheme}
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}
            options={[
              { value: 'dark', label: t.themeDark },
              { value: 'light', label: t.themeLight },
            ]}
          />

          {/* Diagrama de Fondo */}
          <Select
            label={t.labelBgImage}
            value={selectedBgId}
            onChange={(e) => handleSelectBg(e.target.value)}
            options={backgroundOptions.map((bg) => ({
              value: bg.id,
              label: bg.title,
            }))}
          />

          <div className="border-b border-neutral-200 dark:border-neutral-800 pt-1 pb-2" />

          {/* Conexiones / Logos Activos */}
          <div>
            <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-2">
              {t.labelDestinations} ({activeLogos.length})
            </label>

            <Input
              placeholder={t.searchDestPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon="search"
            />

            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 mt-3">
              {filteredLogos.map((logo) => {
                const isActive = activeLogos.includes(logo.id);
                const logoImgUrl = `${basePath}${logo.file}`;
                return (
                  <button
                    key={logo.id}
                    type="button"
                    onClick={() => handleToggleLogo(logo.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'border-info-main/40 bg-info-main/10 text-info-main'
                        : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300'
                    }`}
                  >
                    <img src={logoImgUrl} className="w-8 h-6 object-contain shrink-0" alt={logo.title} />
                    <span className="text-xs font-semibold truncate flex-1">{logo.title}</span>
                    <input
                      type="checkbox"
                      checked={isActive}
                      readOnly
                      className="rounded accent-info-main w-3.5 h-3.5 pointer-events-none shrink-0"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="light"
              onClick={() => setCardPositions(getScaledPositions(selectedBgId))}
              className="w-full text-xs"
            >
              {t.resetPositions}
            </Button>
          </div>
        </div>
      </Drawer>

      {/* 5. Replace Logo Modal Overlay (on double click) */}
      {editingLogoId !== null && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => { setEditingLogoId(null); setModalSearchQuery(''); }}
        >
          <div
            className="w-full max-w-lg bg-container border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                {t.modalTitle}: <span className="text-info-main">{logoOptions.find(l => l.id === editingLogoId)?.title}</span>
              </h3>
              <button
                type="button"
                className="text-neutral-500 hover:text-neutral-800 dark:hover:text-white text-xl cursor-pointer"
                onClick={() => { setEditingLogoId(null); setModalSearchQuery(''); }}
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
              <Input
                placeholder={t.modalSearchPlaceholder}
                value={modalSearchQuery}
                onChange={(e) => setModalSearchQuery(e.target.value)}
                leftIcon="search"
                autoFocus
              />

              <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                {logoOptions
                  .filter(logo => logo.title.toLowerCase().includes(modalSearchQuery.toLowerCase()))
                  .map((logo) => {
                    const isActive = activeLogos.includes(logo.id);
                    const isSelf = logo.id === editingLogoId;
                    const logoImgUrl = `${basePath}${logo.file}`;
                    return (
                      <button
                        key={logo.id}
                        type="button"
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center relative cursor-pointer ${
                          isSelf
                            ? 'border-info-main bg-info-main/10 text-info-main'
                            : isActive
                            ? 'opacity-40 cursor-not-allowed border-neutral-200 dark:border-neutral-800'
                            : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:border-info-main/50'
                        }`}
                        onClick={() => {
                          if (!isActive || isSelf) {
                            handleReplaceLogo(editingLogoId, logo.id);
                          }
                        }}
                        disabled={isActive && !isSelf}
                      >
                        <img src={logoImgUrl} className="w-12 h-8 object-contain mb-1.5" alt={logo.title} />
                        <span className="text-2xs font-semibold truncate w-full">{logo.title}</span>
                        {isActive && !isSelf && (
                          <span className="absolute top-1.5 right-1.5 text-3xs font-bold uppercase bg-neutral-300 dark:bg-neutral-700 px-1 py-0.5 rounded">
                            {t.modalAlreadyActive}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>

            <div className="flex justify-end px-6 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40">
              <Button
                variant="ghost"
                onClick={() => { setEditingLogoId(null); setModalSearchQuery(''); }}
                className="text-xs"
              >
                {t.modalCancel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
