"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Brand, CaralIcon } from 'iconcaral2';
import { Button, Drawer } from 'caralstable';
import Input from '@/app/components/Input';
import Select from '@/app/components/Select';
import fallbackData from '../connections.json';
import { PDFDocument } from 'pdf-lib';

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
  width?: string;
}

function ConnectionCard({ title, icon, brand, theme, width = '260px' }: ConnectionCardProps) {
  const isDark = theme === 'dark';
  return (
    <div style={{
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      border: isDark ? '1.5px solid #334155' : '1.5px solid #cbd5e1',
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
      color: isDark ? '#f1f5f9' : '#0c1d4a',
      boxShadow: isDark
        ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
        : '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      <div style={{
        width: '26px',
        height: '26px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {brand ? (
          <Brand name={icon as any} size={24} />
        ) : (
          <CaralIcon name={icon as any} size={24} color={isDark ? '#f1f5f9' : '#0c1d4a'} />
        )}
      </div>
      <span style={{
        fontFamily: "'Poppins', 'Outfit', 'Inter', sans-serif",
        fontSize: '12px',
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

interface ClientConnectionCardProps {
  title: string;
  icon: string;
  brand: boolean;
  theme: 'light' | 'dark';
}

function ClientConnectionCard({ title, icon, brand, theme }: ClientConnectionCardProps) {
  const isDark = theme === 'dark';
  return (
    <div style={{
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      border: isDark ? '2px solid #334155' : '2px solid #cbd5e1',
      borderRadius: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      padding: '16px 28px',
      width: '440px',
      height: '110px',
      boxSizing: 'border-box',
      overflow: 'hidden',
      position: 'relative',
      color: isDark ? '#f1f5f9' : '#0c1d4a',
      boxShadow: isDark
        ? '0 12px 20px -3px rgba(0, 0, 0, 0.4), 0 4px 8px -2px rgba(0, 0, 0, 0.3)'
        : '0 6px 16px rgba(0,0,0,0.06)',
    }}>
      <div style={{
        width: '52px',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {brand ? (
          <Brand name={icon as any} size={52} />
        ) : (
          <CaralIcon name={icon as any} size={52} color={isDark ? '#f1f5f9' : '#0c1d4a'} />
        )}
      </div>
      <span style={{
        fontFamily: "'Poppins', 'Outfit', 'Inter', sans-serif",
        fontSize: '24px',
        fontWeight: 600,
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

const slideWrapperStyle: React.CSSProperties = {
  width: '1920px',
  height: '1080px',
  position: 'relative',
  backgroundSize: '100% 100%',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  overflow: 'hidden',
  boxSizing: 'border-box',
  fontFamily: "'Poppins', 'Outfit', 'Inter', sans-serif",
  userSelect: 'none'
};

const mapCoverLogoId = (id: string): string => {
  const map: Record<string, string> = {
    'sap': 'SAP',
    'sapo': 'SAPOdata',
    'sappub': 'Sappublic',
    'odata': 'Odata',
    'salesforce': 'Saleforce',
    'bigquery': 'Bigquery',
    'gstorage': 'Googlestorage',
    'cstorage': 'Cloud_storage',
    'azure-sql': 'azuresql',
  };
  return map[id.toLowerCase()] || id;
};

const getCoverLogosAndPositions = (bgId: string, selO: string[], selD: string[]) => {
  const bg = backgroundOptions.find(b => b.id === bgId);
  const preset = presets[bgId];
  if (!bg || !preset) return [];

  const candidateOrigins = selO.map(mapCoverLogoId);
  const candidateDestinations = selD.map(mapCoverLogoId);

  const matchedItems: { id: string; coverLogoId: string; left: number; top: number }[] = [];
  const assigned = new Set<string>();

  preset.logos.forEach((defaultLogoId) => {
    let chosenLogoId = defaultLogoId;
    const isOriginSlot = ['sap', 'sapo', 'sappub', 'odata', 'salesforce'].includes(defaultLogoId.toLowerCase());

    if (isOriginSlot) {
      const match = candidateOrigins.find(o => !assigned.has(o));
      if (match) {
        chosenLogoId = match;
        assigned.add(match);
      }
    } else {
      const match = candidateDestinations.find(d => !assigned.has(d));
      if (match) {
        chosenLogoId = match;
        assigned.add(match);
      }
    }

    const origPos = preset.positions[defaultLogoId];
    if (origPos) {
      const rx = origPos.left - bg.origLeft + 139 / 2;
      const ry = origPos.top - bg.origTop + 98 / 2;
      const scaleX = bg.width / bg.origWidth;
      const scaleY = bg.height / bg.origHeight;
      matchedItems.push({
        id: defaultLogoId,
        coverLogoId: chosenLogoId,
        left: Math.round(bg.left + rx * scaleX - 139 / 2),
        top: Math.round(bg.top + ry * scaleY - 98 / 2)
      });
    }
  });

  return matchedItems;
};

const translations = {
  es: {
    title: 'Generador de Presentaciones',
    settings: 'Configuración del Deck',
    fullscreen: 'Pantalla Completa',
    exitFullscreen: 'Salir de Pantalla Completa',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    resetZoom: 'Ajustar Vista',
    generateDeck: 'Descargar Presentación (PDF)',
    generatingPdf: 'Compilando PDF...',
    loadingDeck: 'Cargando generador de presentaciones...',
    clientProposal: 'Cliente / Propuesta Para',
    clientPlaceholder: 'ej. Acme Corp / Banco',
    environment: 'Entorno / URL',
    deckTheme: 'Tema del Deck',
    language: 'Idioma',
    light: 'Claro (Light)',
    dark: 'Oscuro (Dark)',
    origins: 'Orígenes',
    destinations: 'Destinos',
    deploymentFocus: 'Foco Slide Despliegue',
    tabCover: '1. Portada',
    tabFullMatrix: '2. Matriz Completa',
    tabClientMatrix: '3. Matriz Cliente',
    tabCompatibility: '4. Compatibilidad',
    tabDeployment: '5. Despliegue',
    moreInfo: 'Más Información',
    envLabel: 'Entorno',
  },
  en: {
    title: 'Presentation Deck Generator',
    settings: 'Deck Settings',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit Fullscreen',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    resetZoom: 'Reset Fit',
    generateDeck: 'Download Deck (PDF)',
    generatingPdf: 'Compiling PDF...',
    loadingDeck: 'Loading deck generator...',
    clientProposal: 'Client / Proposal For',
    clientPlaceholder: 'e.g. Acme Corp',
    environment: 'Environment / URL',
    deckTheme: 'Deck Theme',
    language: 'Language',
    light: 'Light',
    dark: 'Dark',
    origins: 'Origins',
    destinations: 'Destinations',
    deploymentFocus: 'Deployment Slide Focus',
    tabCover: '1. Cover',
    tabFullMatrix: '2. Complete Matrix',
    tabClientMatrix: '3. Client Matrix',
    tabCompatibility: '4. Compatibility',
    tabDeployment: '5. Deployment',
    moreInfo: 'More Information',
    envLabel: 'Environment',
  }
};

export interface DeckGeneratorToolProps {
  isEmbedded?: boolean;
  activeTab?: 'cover' | 'fullMatrix' | 'clientMatrix' | 'compatibility' | 'deployment';
  onActiveTabChange?: (tab: 'cover' | 'fullMatrix' | 'clientMatrix' | 'compatibility' | 'deployment') => void;
  theme?: 'light' | 'dark';
  isDrawerOpen?: boolean;
  onDrawerOpenChange?: (open: boolean) => void;
}

export default function DeckGeneratorTool({
  isEmbedded = false,
  activeTab: propActiveTab,
  onActiveTabChange,
  theme: propTheme,
  isDrawerOpen: propIsDrawerOpen,
  onDrawerOpenChange,
}: DeckGeneratorToolProps = {}) {
  const [internalActiveTab, setInternalActiveTab] = useState<'cover' | 'fullMatrix' | 'clientMatrix' | 'compatibility' | 'deployment'>('cover');
  const activeTab = propActiveTab !== undefined ? propActiveTab : internalActiveTab;
  const setActiveTab = (tab: 'cover' | 'fullMatrix' | 'clientMatrix' | 'compatibility' | 'deployment') => {
    setInternalActiveTab(tab);
    onActiveTabChange?.(tab);
  };
  const [customerName, setCustomerName] = useState('');
  const [environment, setEnvironment] = useState('crestone.seidoranalytics.com/');
  const [theme, setTheme] = useState<'light' | 'dark'>(propTheme || 'light');
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const t = translations[lang];

  useEffect(() => {
    if (propTheme !== undefined) setTheme(propTheme);
  }, [propTheme]);

  const [selectedOrigins, setSelectedOrigins] = useState<string[]>(['sap', 'sapo']);
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(['snowflake', 'fabric', 'azure', 'aws', 'bigquery', 'databricks']);
  const [deployOriginId, setDeployOriginId] = useState<string>('sap');
  const [deployDestinationId, setDeployDestinationId] = useState<string>('snowflake');

  const [data, setData] = useState<ConnectionsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Drawer and Fullscreen
  const [internalDrawerOpen, setInternalDrawerOpen] = useState(false);
  const isDrawerOpen = propIsDrawerOpen !== undefined ? propIsDrawerOpen : internalDrawerOpen;
  const setIsDrawerOpen = (val: boolean) => {
    setInternalDrawerOpen(val);
    onDrawerOpenChange?.(val);
  };
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 16:9 Canvas Dimensions
  const canvasWidth = 1920;
  const canvasHeight = 1080;

  // Zoom & Pan states
  const [zoom, setZoom] = useState(0.4);
  const [zoomScale, setZoomScale] = useState({ x: 0.4, y: 0.4 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Slide element references for capturing PDF
  const coverRef = useRef<HTMLDivElement>(null);
  const fullMatrixRef = useRef<HTMLDivElement>(null);
  const clientMatrixRef = useRef<HTMLDivElement>(null);
  const compatibilityRef = useRef<HTMLDivElement>(null);
  const deploymentRef = useRef<HTMLDivElement>(null);

  const bgPortadaPath = '/img/crestone/portada/';
  const bgSlideDark = '/img/crestone/ppt/bgdark.png';
  const bgSlideLight = '/img/crestone/ppt/bg.png';
  const bgDespliegueDark = '/img/crestone/ppt/bgdesplieguedark.png';
  const bgDespliegueLight = '/img/crestone/ppt/bgdespliegue.png';

  // Calculate Auto-Fit Zoom based on Container Dimensions (16:9)
  const calculateFitZoom = useCallback(() => {
    if (!viewportRef.current) return { x: 0.5, y: 0.5, min: 0.5 };
    const { clientWidth, clientHeight } = viewportRef.current;
    if (clientWidth === 0 || clientHeight === 0) return { x: 0.5, y: 0.5, min: 0.5 };
    const scaleX = clientWidth / canvasWidth;
    const scaleY = clientHeight / canvasHeight;
    return { x: scaleX, y: scaleY, min: Math.min(scaleX, scaleY) };
  }, [canvasWidth, canvasHeight]);

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
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setData(fallbackData as ConnectionsData);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  // Resize observer to update zoom on mount and window change
  useEffect(() => {
    const handleResize = () => {
      const fit = calculateFitZoom();
      setZoom(fit.min);
      setZoomScale({ x: fit.x, y: fit.y });
      setPan({ x: 0, y: 0 });
    };

    const timer = setTimeout(handleResize, 100);
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      const fit = calculateFitZoom();
      setZoom(fit.min);
      setZoomScale({ x: fit.x, y: fit.y });
    });

    if (viewportRef.current) {
      resizeObserver.observe(viewportRef.current);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [calculateFitZoom, loading]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => {
        const fit = calculateFitZoom();
        setZoom(fit.min);
        setZoomScale({ x: fit.x, y: fit.y });
        setPan({ x: 0, y: 0 });
      }, 150);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [calculateFitZoom]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch((err) => console.error(err));
    } else {
      document.exitFullscreen?.().catch((err) => console.error(err));
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

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-16 rounded-2xl bg-container border border-neutral-200 dark:border-neutral-800 my-6 font-poppins">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-info-main rounded-full animate-spin mb-4" />
        <p className="text-neutral-600 dark:text-neutral-400 font-medium">
          {t.loadingDeck}
        </p>
      </div>
    );
  }

  const numO = selectedOrigins.length;
  const numD = selectedDestinations.length;
  const oType = numO <= 1 ? '1o' : '2o';
  let dType = '3d';
  if (numD > 6) dType = '9d';
  else if (numD > 5) dType = '6d';
  else if (numD > 3) dType = '5d';

  const autoBgId = `${dType}${oType}`;
  const selectedBg = backgroundOptions.find(bg => bg.id === autoBgId) || backgroundOptions[7];
  const coverLogos = getCoverLogosAndPositions(selectedBg.id, selectedOrigins, selectedDestinations);

  const activeOrigins = data.origins.filter(o => selectedOrigins.includes(o.id));
  const activeDestinations = data.destinations.filter(d => selectedDestinations.includes(d.id));
  const deployOrigin = data.origins.find(o => o.id === deployOriginId) || data.origins[0];
  const deployDestination = data.destinations.find(d => d.id === deployDestinationId) || data.destinations[0];

  const isDark = theme === 'dark';
  const textColorMain = isDark ? '#ffffff' : '#0c1d4a';
  const textColorSub = '#00a2ff';
  const networkLabelColor = isDark ? '#cbd5e1' : '#2e3a59';
  const arrowColor = isDark ? '#ffffff' : '#0c1d4a';
  const bgSlideUrl = theme === 'light' ? bgSlideLight : bgSlideDark;

  const glassStyle = isDark ? {
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    border: '1.5px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
  } : {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    border: '1.5px solid rgba(12, 29, 74, 0.15)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.04)'
  };

  const handleToggleOrigin = (id: string) => {
    setSelectedOrigins(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleToggleDestination = (id: string) => {
    setSelectedDestinations(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const compilePresentationPDF = async () => {
    setIsGenerating(true);
    try {
      const { toPng } = await import('html-to-image');

      const renderPng = async (ref: React.RefObject<HTMLDivElement | null>) => {
        if (!ref.current) throw new Error('Ref is null during rendering');
        return await toPng(ref.current, {
          pixelRatio: 2.2,
          style: {
            transform: 'scale(1)',
            left: '0',
            top: '0',
            position: 'relative',
            opacity: '1',
            zIndex: '9999'
          }
        });
      };

      const coverPngData = await renderPng(coverRef);
      const fullMatrixPngData = await renderPng(fullMatrixRef);
      const clientMatrixPngData = await renderPng(clientMatrixRef);
      const compatibilityPngData = await renderPng(compatibilityRef);
      const deploymentPngData = await renderPng(deploymentRef);

      const pdfTemplateName = isDark
        ? 'Crestone - Presentación comercialdark.pdf'
        : 'Crestone - Presentación comercial.pdf';
      const response = await fetch(`/pdf/${pdfTemplateName}`);
      if (!response.ok) throw new Error(`No se pudo cargar la plantilla ${pdfTemplateName}`);
      const existingPdfBytes = await response.arrayBuffer();

      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      if (pages.length === 0) throw new Error('Plantilla PDF vacía');
      const { width, height } = pages[0].getSize();

      const embedImage = async (dataUrl: string) => {
        const base64Str = dataUrl.split(',')[1];
        if (!base64Str) throw new Error('DataURL no contiene datos Base64 válidos');
        const binaryStr = window.atob(base64Str);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        return pdfDoc.embedPng(bytes);
      };

      const embeddedCover = await embedImage(coverPngData);
      const embeddedFullMatrix = await embedImage(fullMatrixPngData);
      const embeddedClientMatrix = await embedImage(clientMatrixPngData);
      const embeddedCompatibility = await embedImage(compatibilityPngData);
      const embeddedDeployment = await embedImage(deploymentPngData);

      const page1 = pdfDoc.insertPage(0, [width, height]);
      page1.drawImage(embeddedCover, { x: 0, y: 0, width, height });

      const page4 = pdfDoc.insertPage(3, [width, height]);
      page4.drawImage(embeddedFullMatrix, { x: 0, y: 0, width, height });

      const page5 = pdfDoc.insertPage(4, [width, height]);
      page5.drawImage(embeddedClientMatrix, { x: 0, y: 0, width, height });

      const page6 = pdfDoc.insertPage(5, [width, height]);
      page6.drawImage(embeddedCompatibility, { x: 0, y: 0, width, height });

      const page9 = pdfDoc.insertPage(8, [width, height]);
      page9.drawImage(embeddedDeployment, { x: 0, y: 0, width, height });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Presentacion_Crestone_${customerName || 'Cliente'}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error compiling deck PDF:', err);
      alert(lang === 'en'
        ? 'Failed to generate presentation. Check console.'
        : 'Error al compilar la presentación PDF. Revisa la consola.');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderIconPpt = (item: ConnectionItem, size = 42) => {
    const iconColor = isDark ? '#ffffff' : '#2d3748';
    if (!item.iconName) {
      return <CaralIcon name={"file" as any} size={size} color={iconColor} />;
    }
    const normalizedIconName = item.iconName.trim();
    if (item.useBrand) {
      return <Brand name={normalizedIconName as any} size={size} />;
    } else {
      return <CaralIcon name={normalizedIconName as any} size={size} color={iconColor} />;
    }
  };

  const renderPptColumnGrid = (listType: 'origins' | 'destinations') => {
    const list = listType === 'origins' ? data.origins : data.destinations;
    const isOrigins = listType === 'origins';
    const selectedIds = isOrigins ? selectedOrigins : selectedDestinations;

    const selectedItems = list.filter(item => selectedIds.includes(item.id));
    const unselectedItems = list.filter(item => !selectedIds.includes(item.id));

    const selectedCols = isOrigins ? 1 : 2;
    const unselectedCols = isOrigins ? 2 : 3;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%' }}>
        {/* 1. Selected Items (First positions: Icon + Bold Text + Highlight) */}
        {selectedItems.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${selectedCols}, 1fr)`,
            gap: '12px 16px',
            width: '100%',
          }}>
            {selectedItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '10px 16px',
                  borderRadius: '14px',
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.22)' : 'rgba(59, 130, 246, 0.12)',
                  border: '2px solid #3b82f6',
                  boxShadow: isDark ? '0 4px 14px rgba(59, 130, 246, 0.25)' : '0 2px 8px rgba(59, 130, 246, 0.12)',
                  height: '56px',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '10px',
                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.7)' : '#ffffff',
                  boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.06)',
                  flexShrink: 0
                }}>
                  {renderIconPpt(item, 28)}
                </div>
                <span style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: isDark ? '#ffffff' : '#0f172a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Subtle separator if both exist */}
        {selectedItems.length > 0 && unselectedItems.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '2px 0',
            opacity: 0.7
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)' }} />
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1.2px',
              color: isDark ? '#94a3b8' : '#64748b'
            }}>
              {lang === 'es' ? 'Otros Soportados' : 'Other Supported'}
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)' }} />
          </div>
        )}

        {/* 2. Unselected Items (Text-only with improved, clean gap) */}
        {unselectedItems.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${unselectedCols}, 1fr)`,
            gap: '8px 12px',
            width: '100%',
          }}>
            {unselectedItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  backgroundColor: isDark ? 'rgba(30, 41, 59, 0.35)' : 'rgba(255, 255, 255, 0.5)',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid rgba(0, 0, 0, 0.06)',
                  height: '38px',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: isDark ? '#64748b' : '#94a3b8',
                  flexShrink: 0
                }} />
                <span style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: isDark ? '#cbd5e1' : '#475569',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const slideTabs: { id: 'cover' | 'fullMatrix' | 'clientMatrix' | 'compatibility' | 'deployment'; label: string }[] = [
    { id: 'cover', label: t.tabCover },
    { id: 'fullMatrix', label: t.tabFullMatrix },
    { id: 'clientMatrix', label: t.tabClientMatrix },
    { id: 'compatibility', label: t.tabCompatibility },
    { id: 'deployment', label: t.tabDeployment },
  ];

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
      {/* 1. Top Bar: Left = Editable Slide Tabs, Right = Gear (Settings) + Fullscreen */}
      {!isEmbedded && (
        <div className="w-full flex items-center justify-between z-10 shrink-0 px-1">
          {/* Top Left: Slide Tabs Navigation */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-[70%]">
            {slideTabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'info' : 'light'}
                onClick={() => setActiveTab(tab.id)}
                className="text-xs shrink-0"
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Top Right: Settings Button + Fullscreen Button */}
          <div className="flex items-center gap-2">
            {/* Settings Button (Opens Drawer) */}
            <Button
              variant="light"
              onClick={() => setIsDrawerOpen(true)}
              title={t.settings}
              iconName="gear"
              isIconButton
            >
              {t.settings}
            </Button>

            {/* Fullscreen / Pagina Entera Button */}
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
        </div>
      )}

      {/* 2. Central 16:9 Viewport Canvas: Fitted Perfectly by Height */}
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
          ref={canvasRef}
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
            userSelect: 'none'
          }}
        >
          {/* 1. Slide Portada */}
          <div
            ref={coverRef}
            style={{
              ...slideWrapperStyle,
              position: activeTab === 'cover' ? 'relative' : 'absolute',
              left: 0,
              top: 0,
              opacity: activeTab === 'cover' ? 1 : 0,
              pointerEvents: activeTab === 'cover' ? 'auto' : 'none',
              zIndex: activeTab === 'cover' ? 10 : 1,
              backgroundImage: `url(${bgSlideUrl})`
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: 'radial-gradient(rgba(99,102,241,0.1) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
            <img
              src={`${bgPortadaPath}${selectedBg.file}`}
              alt="Diagram"
              style={{
                position: 'absolute',
                left: `${selectedBg.left}px`,
                top: `${selectedBg.top}px`,
                width: `${selectedBg.width}px`,
                height: `${selectedBg.height}px`,
                pointerEvents: 'none'
              }}
            />
            <div style={{
              position: 'absolute',
              left: '152px',
              top: '410px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              maxWidth: '800px',
              pointerEvents: 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                <CrestoneLogo color1={isDark ? '#66B6FF' : '#0191FF'} color2={isDark ? '#ffffff' : '#1b2c6d'} size={70} />
                <h1 style={{
                  margin: 0,
                  fontSize: '80px',
                  fontWeight: 800,
                  lineHeight: 1.07,
                  letterSpacing: '-1.5px',
                  background: 'linear-gradient(90deg, #0191FF, #66B6FF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  CRESTONE
                </h1>
              </div>
              <p style={{
                margin: 0,
                fontSize: '32px',
                fontWeight: 400,
                color: isDark ? '#e2e8f0' : '#1e293b',
                opacity: 0.9,
                textShadow: isDark ? '0 2px 6px rgba(0, 0, 0, 0.3)' : '0 1px 4px rgba(255, 255, 255, 0.60)'
              }}>
                {customerName ? `${lang === 'en' ? 'Proposal for' : 'Propuesta para'} ${customerName}` : (lang === 'en' ? 'Integration Matrix & Supported Targets' : 'Matriz de Integración y Destinos Soportados')}
              </p>
            </div>

            <div style={{
              position: 'absolute',
              bottom: '60px',
              left: '100px',
              right: '100px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              borderTop: isDark ? '1.5px solid rgba(255, 255, 255, 0.12)' : '1.5px solid rgba(15, 23, 42, 0.15)',
              paddingTop: '20px',
              pointerEvents: 'none'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: isDark ? '#94a3b8' : '#475569', letterSpacing: '1.5px' }}>
                  {t.moreInfo}
                </span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>
                  crestone.io
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: isDark ? '#94a3b8' : '#475569', letterSpacing: '1.5px' }}>
                  {t.envLabel}
                </span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#10b981' }}>
                  ● {environment.trim() || 'crestone.seidoranalytics.com/'}
                </span>
              </div>
            </div>

            {coverLogos.map((item) => (
              <div
                key={item.id}
                style={{
                  position: 'absolute',
                  left: `${item.left}px`,
                  top: `${item.top}px`,
                  width: '139px',
                  height: '98px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <img
                  src={`${bgPortadaPath}${item.coverLogoId}.png`}
                  alt="Logo"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              </div>
            ))}
          </div>

          {/* 2. Slide Matriz Completa */}
          {(() => {
            const origMid = Math.ceil(data.origins.length / 2);
            const origCol1 = data.origins.slice(0, origMid);
            const origCol2 = data.origins.slice(origMid);

            const destMid = Math.ceil(data.destinations.length / 2);
            const destCol1 = data.destinations.slice(0, destMid);
            const destCol2 = data.destinations.slice(destMid);

            const itemRowHeight = 52;
            const cardWidth = 260;
            const origCol1X = 60;
            const origCol2X = 350;
            const destCol1X = 1310;
            const destCol2X = 1600;

            const origCol1Top = Math.max(140, (1080 - origCol1.length * itemRowHeight) / 2 + 30);
            const origCol2Top = Math.max(140, (1080 - origCol2.length * itemRowHeight) / 2 + 30);
            const destCol1Top = Math.max(140, (1080 - destCol1.length * itemRowHeight) / 2 + 30);
            const destCol2Top = Math.max(140, (1080 - destCol2.length * itemRowHeight) / 2 + 30);

            const hubCenterY = 540;
            const hubInputX = 860;
            const hubOutputX = 1060;

            return (
              <div
                ref={fullMatrixRef}
                style={{
                  ...slideWrapperStyle,
                  position: activeTab === 'fullMatrix' ? 'relative' : 'absolute',
                  left: 0,
                  top: 0,
                  opacity: activeTab === 'fullMatrix' ? 1 : 0,
                  pointerEvents: activeTab === 'fullMatrix' ? 'auto' : 'none',
                  zIndex: activeTab === 'fullMatrix' ? 10 : 1,
                  backgroundImage: `url(${bgSlideUrl})`
                }}
              >
                {/* Slide Header */}
                <div style={{ position: 'absolute', top: '50px', left: '60px', zIndex: 3 }}>
                  <h1 style={{ margin: 0, fontSize: '42px', fontWeight: 800, color: textColorMain, letterSpacing: '-0.5px' }}>
                    {lang === 'en' ? 'Complete Integration Matrix' : 'Matriz de Integración Completa'}
                  </h1>
                </div>

                {/* SVG Connecting Paths */}
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
                    <linearGradient id="deckOrigGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#66B6FF" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#0191FF" stopOpacity={0.9} />
                    </linearGradient>
                    <linearGradient id="deckDestGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0191FF" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#66B6FF" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>

                  {/* 1. Origins Column 1 (Outer Left) -> Hub */}
                  {origCol1.map((_, i) => {
                    const cardY = origCol1Top + i * itemRowHeight + 23;
                    const startX = origCol1X + cardWidth;
                    const d = `M ${startX} ${cardY} C ${startX + 220} ${cardY}, ${hubInputX - 200} ${hubCenterY}, ${hubInputX} ${hubCenterY}`;
                    return (
                      <g key={`deck-orig-c1-${i}`}>
                        <path d={d} fill="none" stroke="url(#deckOrigGrad)" strokeWidth="2.2" />
                        <circle cx={startX} cy={cardY} r="4" fill="#0191FF" />
                      </g>
                    );
                  })}

                  {/* 2. Origins Column 2 (Inner Left) -> Hub */}
                  {origCol2.map((_, i) => {
                    const cardY = origCol2Top + i * itemRowHeight + 23;
                    const startX = origCol2X + cardWidth;
                    const d = `M ${startX} ${cardY} C ${startX + 120} ${cardY}, ${hubInputX - 120} ${hubCenterY}, ${hubInputX} ${hubCenterY}`;
                    return (
                      <g key={`deck-orig-c2-${i}`}>
                        <path d={d} fill="none" stroke="url(#deckOrigGrad)" strokeWidth="2.2" />
                        <circle cx={startX} cy={cardY} r="4" fill="#0191FF" />
                      </g>
                    );
                  })}

                  {/* 3. Hub -> Destinations Column 1 (Inner Right) */}
                  {destCol1.map((_, j) => {
                    const cardY = destCol1Top + j * itemRowHeight + 23;
                    const targetX = destCol1X;
                    const d = `M ${hubOutputX} ${hubCenterY} C ${hubOutputX + 120} ${hubCenterY}, ${targetX - 120} ${cardY}, ${targetX} ${cardY}`;
                    return (
                      <g key={`deck-dest-c1-${j}`}>
                        <path d={d} fill="none" stroke="url(#deckDestGrad)" strokeWidth="2.2" />
                        <circle cx={targetX} cy={cardY} r="4" fill="#0191FF" />
                      </g>
                    );
                  })}

                  {/* 4. Hub -> Destinations Column 2 (Outer Right) */}
                  {destCol2.map((_, j) => {
                    const cardY = destCol2Top + j * itemRowHeight + 23;
                    const targetX = destCol2X;
                    const d = `M ${hubOutputX} ${hubCenterY} C ${hubOutputX + 220} ${hubCenterY}, ${targetX - 200} ${cardY}, ${targetX} ${cardY}`;
                    return (
                      <g key={`deck-dest-c2-${j}`}>
                        <path d={d} fill="none" stroke="url(#deckDestGrad)" strokeWidth="2.2" />
                        <circle cx={targetX} cy={cardY} r="4" fill="#0191FF" />
                      </g>
                    );
                  })}

                  {/* Hub Junction Pins */}
                  <circle cx={hubInputX} cy={hubCenterY} r="5" fill="#0191FF" />
                  <circle cx={hubOutputX} cy={hubCenterY} r="5" fill="#0191FF" />
                </svg>

                {/* Column 1: Origins Sub-col 1 (Outer Left) */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${origCol1X}px`,
                    top: `${origCol1Top}px`,
                    width: `${cardWidth}px`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    zIndex: 2,
                  }}
                >
                  {origCol1.map((item) => (
                    <ConnectionCard
                      key={item.id}
                      title={item.title}
                      icon={item.iconName || 'file'}
                      brand={item.useBrand}
                      theme={theme}
                      width={`${cardWidth}px`}
                    />
                  ))}
                </div>

                {/* Column 2: Origins Sub-col 2 (Inner Left) */}
                {origCol2.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${origCol2X}px`,
                      top: `${origCol2Top}px`,
                      width: `${cardWidth}px`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      zIndex: 2,
                    }}
                  >
                    {origCol2.map((item) => (
                      <ConnectionCard
                        key={item.id}
                        title={item.title}
                        icon={item.iconName || 'file'}
                        brand={item.useBrand}
                        theme={theme}
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
                      border: isDark ? '3px dashed rgba(1, 145, 255, 0.4)' : '3px dashed #cbd5e1',
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
                        boxShadow: isDark ? '0 0 35px rgba(1, 145, 255, 0.5)' : '0 10px 25px rgba(1, 145, 255, 0.25)',
                        border: '2px solid rgba(1, 145, 255, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CrestoneLogo size={60} color1="#66B6FF" color2="#ffffff" />
                    </div>
                  </div>
                </div>

                {/* Column 3: Destinations Sub-col 1 (Inner Right) */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${destCol1X}px`,
                    top: `${destCol1Top}px`,
                    width: `${cardWidth}px`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    zIndex: 2,
                  }}
                >
                  {destCol1.map((item) => (
                    <ConnectionCard
                      key={item.id}
                      title={item.title}
                      icon={item.iconName || 'file'}
                      brand={item.useBrand}
                      theme={theme}
                      width={`${cardWidth}px`}
                    />
                  ))}
                </div>

                {/* Column 4: Destinations Sub-col 2 (Outer Right) */}
                {destCol2.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${destCol2X}px`,
                      top: `${destCol2Top}px`,
                      width: `${cardWidth}px`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      zIndex: 2,
                    }}
                  >
                    {destCol2.map((item) => (
                      <ConnectionCard
                        key={item.id}
                        title={item.title}
                        icon={item.iconName || 'file'}
                        brand={item.useBrand}
                        theme={theme}
                        width={`${cardWidth}px`}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* 3. Slide Matriz Cliente */}
          {(() => {
            const originsList = activeOrigins.slice(0, 4);
            const destinationsList = activeDestinations.slice(0, 4);

            const cardWidth = 440;
            const cardHeight = 110;
            const cardGap = 24;
            const stepY = cardHeight + cardGap; // 134px

            const origColX = 140;
            const destColX = 1920 - 140 - cardWidth; // 1340px
            const hubCenterX = 960;
            const hubCenterY = 540;
            const hubSize = 230;

            const hubLeft = hubCenterX - hubSize / 2; // 845px
            const hubTop = hubCenterY - hubSize / 2; // 425px
            const hubInputX = hubLeft; // 845px
            const hubOutputX = hubLeft + hubSize; // 1075px

            const totalOriginsHeight = originsList.length * cardHeight + (originsList.length - 1) * cardGap;
            const origTop = Math.max(160, hubCenterY - totalOriginsHeight / 2);

            const totalDestHeight = destinationsList.length * cardHeight + (destinationsList.length - 1) * cardGap;
            const destTop = Math.max(160, hubCenterY - totalDestHeight / 2);

            return (
              <div
                ref={clientMatrixRef}
                style={{
                  ...slideWrapperStyle,
                  position: activeTab === 'clientMatrix' ? 'relative' : 'absolute',
                  left: 0,
                  top: 0,
                  opacity: activeTab === 'clientMatrix' ? 1 : 0,
                  pointerEvents: activeTab === 'clientMatrix' ? 'auto' : 'none',
                  zIndex: activeTab === 'clientMatrix' ? 10 : 1,
                  backgroundImage: `url(${bgSlideUrl})`
                }}
              >
                {/* Header Title */}
                <div style={{ position: 'absolute', top: '60px', left: '100px', zIndex: 3 }}>
                  <h1 style={{ margin: 0, fontSize: '42px', fontWeight: 800, color: textColorMain, letterSpacing: '-0.5px' }}>
                    {customerName
                      ? `${lang === 'en' ? 'Integration Matrix for' : 'Matriz de Integración para'} ${customerName}`
                      : (lang === 'en' ? 'Selected Integration Matrix' : 'Matriz de Integración Seleccionada')}
                  </h1>
                </div>

                {/* SVG Connecting Curves */}
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
                    <linearGradient id="clientOrigGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#66B6FF" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#0191FF" stopOpacity={0.9} />
                    </linearGradient>
                    <linearGradient id="clientDestGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0191FF" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#66B6FF" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>

                  {/* Left Curves: Origins -> Hub */}
                  {originsList.map((_, i) => {
                    const cardY = origTop + i * stepY + cardHeight / 2;
                    const startX = origColX + cardWidth;
                    const d = `M ${startX} ${cardY} C ${startX + 140} ${cardY}, ${hubInputX - 140} ${hubCenterY}, ${hubInputX} ${hubCenterY}`;
                    return (
                      <g key={`c-o-${i}`}>
                        <path d={d} fill="none" stroke="url(#clientOrigGrad)" strokeWidth="3.5" />
                        <circle cx={startX} cy={cardY} r="6" fill="#0191FF" />
                      </g>
                    );
                  })}

                  {/* Right Curves: Hub -> Destinations */}
                  {destinationsList.map((_, j) => {
                    const cardY = destTop + j * stepY + cardHeight / 2;
                    const targetX = destColX;
                    const d = `M ${hubOutputX} ${hubCenterY} C ${hubOutputX + 140} ${hubCenterY}, ${targetX - 140} ${cardY}, ${targetX} ${cardY}`;
                    return (
                      <g key={`c-d-${j}`}>
                        <path d={d} fill="none" stroke="url(#clientDestGrad)" strokeWidth="3.5" />
                        <circle cx={targetX} cy={cardY} r="6" fill="#0191FF" />
                      </g>
                    );
                  })}

                  {/* Hub Junction Pins */}
                  <circle cx={hubInputX} cy={hubCenterY} r="7" fill="#0191FF" />
                  <circle cx={hubOutputX} cy={hubCenterY} r="7" fill="#0191FF" />
                </svg>

                {/* Left: Origins Column */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${origColX}px`,
                    top: `${origTop}px`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: `${cardGap}px`,
                    zIndex: 2,
                  }}
                >
                  {originsList.map(o => (
                    <ClientConnectionCard key={o.id} title={o.title} icon={o.iconName || 'file'} brand={o.useBrand} theme={theme} />
                  ))}
                </div>

                {/* Center: Crestone Core Hub */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${hubLeft}px`,
                    top: `${hubTop}px`,
                    width: `${hubSize}px`,
                    height: `${hubSize}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      width: `${hubSize}px`,
                      height: `${hubSize}px`,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #07153a 0%, #1e1b4b 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '3px solid rgba(99, 102, 241, 0.6)',
                      boxShadow: isDark
                        ? '0 0 50px rgba(1, 145, 255, 0.5), 0 20px 40px rgba(0, 0, 0, 0.6)'
                        : '0 15px 35px rgba(1, 145, 255, 0.3), 0 5px 15px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <CrestoneLogo size={90} color1="#66B6FF" color2="#ffffff" />
                  </div>
                </div>

                {/* Right: Destinations Column */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${destColX}px`,
                    top: `${destTop}px`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: `${cardGap}px`,
                    zIndex: 2,
                  }}
                >
                  {destinationsList.map(d => (
                    <ClientConnectionCard key={d.id} title={d.title} icon={d.iconName || 'file'} brand={d.useBrand} theme={theme} />
                  ))}
                </div>
              </div>
            );
          })()}

          {/* 4. Slide Compatibilidad */}
          <div
            ref={compatibilityRef}
            style={{
              ...slideWrapperStyle,
              position: activeTab === 'compatibility' ? 'relative' : 'absolute',
              left: 0,
              top: 0,
              opacity: activeTab === 'compatibility' ? 1 : 0,
              pointerEvents: activeTab === 'compatibility' ? 'auto' : 'none',
              zIndex: activeTab === 'compatibility' ? 10 : 1,
              backgroundImage: `url(${bgSlideUrl})`
            }}
          >
            <div style={{ position: 'absolute', top: '70px', left: '100px', zIndex: 3 }}>
              <h1 style={{ margin: 0, fontSize: '42px', fontWeight: 800, color: textColorMain, letterSpacing: '-0.5px' }}>
                {lang === 'en' ? 'Supported Compatibility & Integrations' : 'Ecosistema de Compatibilidad'}
              </h1>
            </div>
            <div style={{ position: 'absolute', top: '160px', left: '100px', right: '100px', display: 'flex', gap: '40px' }}>
              <div style={{ flex: 1, ...glassStyle, borderRadius: '24px', padding: '36px' }}>
                <h2 style={{ fontSize: '32px', fontWeight: 700, color: isDark ? '#ffffff' : '#2d3748', margin: '0 0 20px 0', borderBottom: '1px solid #cbd5e1', paddingBottom: '10px' }}>
                  {lang === 'en' ? 'Origins' : 'Orígenes'}
                </h2>
                {renderPptColumnGrid('origins')}
              </div>
              <div style={{ flex: 2, ...glassStyle, borderRadius: '24px', padding: '36px' }}>
                <h2 style={{ fontSize: '32px', fontWeight: 700, color: isDark ? '#ffffff' : '#2d3748', margin: '0 0 20px 0', borderBottom: '1px solid #cbd5e1', paddingBottom: '10px' }}>
                  {lang === 'en' ? 'Destinations' : 'Destinos'}
                </h2>
                {renderPptColumnGrid('destinations')}
              </div>
            </div>
          </div>

          {/* 5. Slide Despliegue */}
          <div
            ref={deploymentRef}
            style={{
              ...slideWrapperStyle,
              position: activeTab === 'deployment' ? 'relative' : 'absolute',
              left: 0,
              top: 0,
              opacity: activeTab === 'deployment' ? 1 : 0,
              pointerEvents: activeTab === 'deployment' ? 'auto' : 'none',
              zIndex: activeTab === 'deployment' ? 10 : 1,
              backgroundColor: isDark ? '#0f172a' : '#ffffff'
            }}
          >
            <div style={{ width: '1280px', height: '720px', position: 'absolute', top: 0, left: 0, transform: 'scale(1.5)', transformOrigin: 'top left', backgroundImage: `url(${isDark ? bgDespliegueDark : bgDespliegueLight})`, backgroundSize: '100% 100%' }}>
              {/* SVG Connecting Arrows Layer */}
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 2,
                  pointerEvents: 'none'
                }}
              >
                <defs>
                  <marker
                    id="arrowheadDeckDeployment"
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

                {/* Flow 1: Cloud Deployment Arrows */}
                <g>
                  <circle cx={120 + 260} cy={245} r={5} fill={arrowColor} />
                  <line x1={120 + 260} y1={245} x2={510 - 6} y2={245} stroke={arrowColor} strokeWidth={2.5} markerEnd="url(#arrowheadDeckDeployment)" />
                </g>
                <g>
                  <circle cx={510 + 260} cy={245} r={5} fill={arrowColor} />
                  <line x1={510 + 260} y1={245} x2={900 - 6} y2={245} stroke={arrowColor} strokeWidth={2.5} markerEnd="url(#arrowheadDeckDeployment)" />
                </g>

                {/* Flow 2: Self Hosted Deployment Arrows */}
                <g>
                  <circle cx={150 + 260} cy={510} r={5} fill={arrowColor} />
                  <line x1={150 + 260} y1={510} x2={480 - 6} y2={510} stroke={arrowColor} strokeWidth={2.5} markerEnd="url(#arrowheadDeckDeployment)" />
                </g>
                <g>
                  <circle cx={480 + 260} cy={510} r={5} fill={arrowColor} />
                  <line x1={480 + 260} y1={510} x2={900 - 6} y2={510} stroke={arrowColor} strokeWidth={2.5} markerEnd="url(#arrowheadDeckDeployment)" />
                </g>
              </svg>

              <div style={{ position: 'absolute', top: '60px', left: '80px', zIndex: 2 }}>
                <h1 style={{ margin: 0, fontSize: '40px', fontWeight: 800, color: textColorMain }}>
                  {lang === 'en' ? 'Deployment Options' : 'Opciones de Despliegue'}
                </h1>
              </div>
              {/* Flow 1 */}
              <div style={{ position: 'absolute', top: '135px', left: '80px', zIndex: 2 }}>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: textColorSub }}>
                  {lang === 'en' ? 'Cloud Deployment' : 'Despliegue Cloud'}
                </h2>
              </div>
              <div style={{ position: 'absolute', top: '185px', left: '120px', width: '260px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: networkLabelColor }}>Customer Network</div>
              <div style={{ position: 'absolute', top: '185px', left: '510px', width: '260px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: networkLabelColor }}>Crestone Network</div>
              <div style={{ position: 'absolute', top: '185px', left: '900px', width: '260px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: networkLabelColor }}>Destination Network</div>

              <div style={{ position: 'absolute', top: '220px', left: '120px', zIndex: 4 }}>
                <ConnectionCard title={deployOrigin.title} icon={deployOrigin.iconName || 'file'} brand={deployOrigin.useBrand} theme={theme} />
              </div>
              <div style={{ position: 'absolute', top: '175px', left: '460px', width: '360px', height: '140px', borderRadius: '12px', zIndex: 1, ...glassStyle }} />
              <div style={{ position: 'absolute', top: '220px', left: '510px', zIndex: 4 }}>
                <CrestoneCard theme={theme} />
              </div>
              <div style={{ position: 'absolute', top: '220px', left: '900px', zIndex: 4 }}>
                <ConnectionCard title={deployDestination.title} icon={deployDestination.iconName || 'file'} brand={deployDestination.useBrand} theme={theme} />
              </div>

              {/* Flow 2 */}
              <div style={{ position: 'absolute', top: '380px', left: '80px', zIndex: 2 }}>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: textColorSub }}>
                  {lang === 'en' ? 'Self Hosted Deployment' : 'Despliegue Self Hosted'}
                </h2>
              </div>
              <div style={{ position: 'absolute', top: '430px', left: '120px', width: '650px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: networkLabelColor }}>Customer Network</div>
              <div style={{ position: 'absolute', top: '430px', left: '900px', width: '260px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: networkLabelColor }}>Destination Network</div>

              <div style={{ position: 'absolute', top: '450px', left: '120px', width: '650px', height: '120px', borderRadius: '12px', zIndex: 1, ...glassStyle }} />
              <div style={{ position: 'absolute', top: '485px', left: '150px', zIndex: 4 }}>
                <ConnectionCard title={deployOrigin.title} icon={deployOrigin.iconName || 'file'} brand={deployOrigin.useBrand} theme={theme} />
              </div>
              <div style={{ position: 'absolute', top: '485px', left: '480px', zIndex: 4 }}>
                <CrestoneCard theme={theme} />
              </div>
              <div style={{ position: 'absolute', top: '485px', left: '900px', zIndex: 4 }}>
                <ConnectionCard title={deployDestination.title} icon={deployDestination.iconName || 'file'} brand={deployDestination.useBrand} theme={theme} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Bar: Left = Zoom Controls, Right = Generate / Download PDF */}
      {!isEmbedded && (
        <div className="w-full flex items-center justify-between z-10 shrink-0 px-1 py-1">
          {/* Left: Zoom Controls */}
          <div className="flex items-center gap-1.5 bg-container border border-neutral-200 dark:border-neutral-800 rounded-xl p-1 shadow-xs">
            <Button
              variant="light"
              onClick={handleZoomOut}
              title={t.zoomOut}
              iconName="zoomOut"
              isIconButton
            >
              {t.zoomOut}
            </Button>

            <span className="text-xs font-semibold px-2 min-w-[52px] text-center text-neutral-700 dark:text-neutral-300">
              {Math.round(zoom * 100)}%
            </span>

            <Button
              variant="light"
              onClick={handleZoomIn}
              title={t.zoomIn}
              iconName="zoomIn"
              isIconButton
            >
              {t.zoomIn}
            </Button>

            <div className="w-[1px] h-4 bg-neutral-200 dark:border-neutral-700 mx-0.5" />

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
          </div>

          {/* Right: Generate / Download PDF */}
          <Button
            variant="info"
            onClick={compilePresentationPDF}
            disabled={isGenerating}
            title={t.generateDeck}
            iconName="file"
          >
            {isGenerating ? t.generatingPdf : t.generateDeck}
          </Button>
        </div>
      )}

      {/* 4. Caralstable Drawer Component (All configuration in Gear) */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
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

          {/* Cliente / Propuesta Para */}
          <Input
            label={t.clientProposal}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder={t.clientPlaceholder}
          />

          {/* Entorno / URL */}
          <Input
            label={t.environment}
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
          />

          {/* Tema del Deck */}
          <Select
            label={t.deckTheme}
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
            options={[
              { value: 'light', label: t.light },
              { value: 'dark', label: t.dark },
            ]}
          />

          <div className="border-b border-neutral-200 dark:border-neutral-800 pt-1 pb-2" />

          {/* Orígenes Checkboxes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              {t.origins} ({selectedOrigins.length})
            </label>
            <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto pr-1 border border-neutral-200 dark:border-neutral-800 rounded-lg p-2 bg-neutral-50 dark:bg-neutral-900/40">
              {data.origins.map(o => (
                <label key={o.id} className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 p-1.5 rounded cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedOrigins.includes(o.id)}
                    onChange={() => handleToggleOrigin(o.id)}
                    className="rounded accent-info-main cursor-pointer"
                  />
                  <span>{o.title}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Destinos Checkboxes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              {t.destinations} ({selectedDestinations.length})
            </label>
            <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto pr-1 border border-neutral-200 dark:border-neutral-800 rounded-lg p-2 bg-neutral-50 dark:bg-neutral-900/40">
              {data.destinations.map(d => (
                <label key={d.id} className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 p-1.5 rounded cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedDestinations.includes(d.id)}
                    onChange={() => handleToggleDestination(d.id)}
                    className="rounded accent-info-main cursor-pointer"
                  />
                  <span>{d.title}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-b border-neutral-200 dark:border-neutral-800 pt-1 pb-2" />

          {/* Foco Slide Despliegue */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              {t.deploymentFocus}
            </label>
            <Select
              label={lang === 'es' ? 'Origen Enfoque' : 'Origin Focus'}
              value={deployOriginId}
              onChange={(e) => setDeployOriginId(e.target.value)}
              options={data.origins.map(o => ({
                value: o.id,
                label: o.title,
              }))}
            />
            <Select
              label={lang === 'es' ? 'Destino Enfoque' : 'Destination Focus'}
              value={deployDestinationId}
              onChange={(e) => setDeployDestinationId(e.target.value)}
              options={data.destinations.map(d => ({
                value: d.id,
                label: d.title,
              }))}
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}

