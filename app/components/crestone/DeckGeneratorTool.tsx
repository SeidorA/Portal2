"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Brand, CaralIcon } from 'iconcaral2';
import { Button } from 'caralstable';
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

export default function DeckGeneratorTool() {
  const [activeTab, setActiveTab] = useState<'cover' | 'fullMatrix' | 'clientMatrix' | 'compatibility' | 'deployment'>('cover');
  const [customerName, setCustomerName] = useState('');
  const [environment, setEnvironment] = useState('crestone.seidoranalytics.com/');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState<'es' | 'en'>('es');

  const [selectedOrigins, setSelectedOrigins] = useState<string[]>(['sap', 'sapo']);
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(['snowflake', 'fabric', 'azure', 'aws', 'bigquery', 'databricks']);
  const [deployOriginId, setDeployOriginId] = useState<string>('sap');
  const [deployDestinationId, setDeployDestinationId] = useState<string>('snowflake');

  const [data, setData] = useState<ConnectionsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Scaler
  const [scale, setScale] = useState(0.4);
  const containerRef = useRef<HTMLDivElement>(null);

  // Slide element references for capturing
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

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        setScale(Math.min(width / 1920, 0.95));
      }
    };
    handleResize();
    const timer = setTimeout(handleResize, 150);
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-16 rounded-2xl bg-container border border-neutral-200 dark:border-neutral-800 my-6">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-info-main rounded-full animate-spin mb-4" />
        <p className="text-neutral-600 dark:text-neutral-400 font-medium">
          {lang === 'en' ? 'Loading deck generator...' : 'Cargando generador de presentaciones...'}
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
    const numCols = isOrigins ? 1 : 2;

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${numCols}, 1fr)`,
        gap: '20px 24px',
        width: '100%',
        alignContent: 'start',
      }}>
        {list.map((item) => {
          const isSelected = isOrigins ? selectedOrigins.includes(item.id) : selectedDestinations.includes(item.id);
          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '10px 14px',
                borderRadius: '16px',
                backgroundColor: isSelected
                  ? (isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.12)')
                  : (isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(255, 255, 255, 0.65)'),
                border: isSelected
                  ? '2px solid #3b82f6'
                  : (isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)'),
                opacity: isSelected ? 1 : 0.6,
                transform: isSelected ? 'scale(1.02)' : 'none',
              }}
            >
              <div style={{
                width: '54px',
                height: '54px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px',
                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 10px rgba(0,0,0,0.05)'
              }}>
                {renderIconPpt(item, 38)}
              </div>
              <span style={{
                fontSize: '22px',
                fontWeight: isSelected ? 700 : 500,
                color: isDark ? '#ffffff' : '#1e293b',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {item.title}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Intro Header */}
      <div className="bg-container border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold font-poppins text-neutral-900 dark:text-white mb-2">
              {lang === 'en' ? 'Presentation Deck Generator' : 'Generador de Presentaciones (Deck)'}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-3xl leading-relaxed">
              {lang === 'en'
                ? 'Compile a client presentation PDF with customized cover, architecture diagrams, connections and deployment options integrated directly into the official Crestone deck template.'
                : 'Compila un PDF de presentación para clientes con todos los diagramas integrados, portada personalizada y opciones de despliegue dentro del deck oficial de Crestone.'}
            </p>
          </div>
          <Button
            variant="info"
            onClick={compilePresentationPDF}
            disabled={isGenerating}
            className="shrink-0 flex items-center gap-2"
          >
            <CaralIcon name="file" size={18} />
            {isGenerating ? (lang === 'en' ? 'Compiling PDF...' : 'Compilando PDF...') : (lang === 'en' ? 'Generate Deck (PDF)' : 'Generar Presentación (PDF)')}
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Controls Sidebar */}
        <div className="xl:col-span-4 bg-container border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs flex flex-col gap-5 max-h-[85vh] overflow-y-auto">
          {/* Customer Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              {lang === 'en' ? 'Client / Proposal For' : 'Cliente / Propuesta Para'}
            </label>
            <input
              type="text"
              placeholder={lang === 'en' ? 'e.g. Acme Corp' : 'ej. CMPC / Banco'}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
            />
          </div>

          {/* Environment */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              {lang === 'en' ? 'Environment / URL' : 'Entorno / URL'}
            </label>
            <input
              type="text"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
            />
          </div>

          {/* Theme */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              {lang === 'en' ? 'Deck Theme' : 'Tema de Presentación'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  theme === 'light'
                    ? 'bg-info-main/10 border-info-main text-info-main'
                    : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                ☀️ Claro (Light)
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  theme === 'dark'
                    ? 'bg-info-main/10 border-info-main text-info-main'
                    : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                🌙 Oscuro (Dark)
              </button>
            </div>
          </div>

          {/* Origins Checkboxes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              {lang === 'en' ? 'Origins' : 'Orígenes'} ({selectedOrigins.length})
            </label>
            <div className="grid grid-cols-1 gap-1 max-h-36 overflow-y-auto pr-1">
              {data.origins.map(o => (
                <label key={o.id} className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 p-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedOrigins.includes(o.id)}
                    onChange={() => handleToggleOrigin(o.id)}
                    className="rounded accent-info-main"
                  />
                  <span>{o.title}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Destinations Checkboxes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              {lang === 'en' ? 'Destinations' : 'Destinos'} ({selectedDestinations.length})
            </label>
            <div className="grid grid-cols-1 gap-1 max-h-44 overflow-y-auto pr-1">
              {data.destinations.map(d => (
                <label key={d.id} className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 p-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDestinations.includes(d.id)}
                    onChange={() => handleToggleDestination(d.id)}
                    className="rounded accent-info-main"
                  />
                  <span>{d.title}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Single Deployment Selectors */}
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              {lang === 'en' ? 'Deployment Slide Focus' : 'Foco Slide Despliegue'}
            </label>
            <div className="space-y-2">
              <select
                value={deployOriginId}
                onChange={(e) => setDeployOriginId(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
              >
                {data.origins.map(o => (
                  <option key={o.id} value={o.id}>{o.title}</option>
                ))}
              </select>
              <select
                value={deployDestinationId}
                onChange={(e) => setDeployDestinationId(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
              >
                {data.destinations.map(d => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Preview Slides */}
        <div className="xl:col-span-8 flex flex-col gap-4">
          {/* Slide Navigation Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { id: 'cover', label: '1. Portada' },
              { id: 'fullMatrix', label: '2. Matriz Completa' },
              { id: 'clientMatrix', label: '3. Matriz Cliente' },
              { id: 'compatibility', label: '4. Compatibilidad' },
              { id: 'deployment', label: '5. Despliegue' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  activeTab === tab.id
                    ? 'bg-info-main border-info-main text-white shadow-xs'
                    : 'bg-container border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-info-main/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Slide Canvas Wrapper */}
          <div
            ref={containerRef}
            className="w-full overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-900 relative shadow-inner"
            style={{ height: `${1080 * scale}px` }}
          >
            <div
              className="absolute left-1/2 top-0 origin-top"
              style={{
                width: '1920px',
                height: '1080px',
                transform: `translateX(-50%) scale(${scale})`,
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
                      {lang === 'es' ? 'Más Información' : 'More Information'}
                    </span>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>
                      crestone.io
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: isDark ? '#94a3b8' : '#475569', letterSpacing: '1.5px' }}>
                      {lang === 'es' ? 'Entorno' : 'Environment'}
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
                <div style={{ position: 'absolute', top: '70px', left: '100px', zIndex: 3 }}>
                  <h1 style={{ margin: 0, fontSize: '42px', fontWeight: 800, color: textColorMain, letterSpacing: '-0.5px' }}>
                    {lang === 'en' ? 'Complete Integration Matrix' : 'Matriz de Integración Completa'}
                  </h1>
                </div>
                <div style={{ position: 'absolute', left: '360px', top: '50px', transform: 'scale(0.8)', transformOrigin: 'top left' }}>
                  {/* Reuse matrix render */}
                  <div style={{ width: '1200px', height: '1150px', position: 'relative' }}>
                    {/* SVG lines */}
                    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                      {data.origins.map((_, i) => {
                        const cardY = 85 + (980 - (data.origins.length * 50 + (data.origins.length - 1) * 12)) / 2 + i * 62 + 25;
                        const d = `M 320 ${cardY} C 410 ${cardY}, 440 575, 525 575`;
                        return (
                          <g key={`f-o-${i}`}>
                            <path d={d} fill="none" stroke={isDark ? '#3b82f6' : '#cbd5e1'} strokeWidth="2.5" />
                            <circle cx="320" cy={cardY} r="5" fill={isDark ? '#3b82f6' : '#cbd5e1'} />
                          </g>
                        );
                      })}
                      {data.destinations.map((_, j) => {
                        const cardY = 85 + (980 - (data.destinations.length * 50 + (data.destinations.length - 1) * 12)) / 2 + j * 62 + 25;
                        const d = `M 675 575 C 760 575, 790 ${cardY}, 880 ${cardY}`;
                        return (
                          <g key={`f-d-${j}`}>
                            <path d={d} fill="none" stroke={isDark ? '#3b82f6' : '#cbd5e1'} strokeWidth="2.5" />
                            <circle cx="880" cy={cardY} r="5" fill={isDark ? '#3b82f6' : '#cbd5e1'} />
                          </g>
                        );
                      })}
                    </svg>
                    <div style={{ position: 'absolute', left: '60px', top: `${85 + (980 - (data.origins.length * 50 + (data.origins.length - 1) * 12)) / 2}px`, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {data.origins.map(o => (
                        <ConnectionCard key={o.id} title={o.title} icon={o.iconName || 'file'} brand={o.useBrand} theme={theme} />
                      ))}
                    </div>
                    <div style={{ position: 'absolute', left: '420px', top: '440px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '140px', height: '140px', borderRadius: '50%', background: 'linear-gradient(135deg, #07153a 0%, #1e1b4b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(99, 102, 241, 0.6)' }}>
                        <CrestoneLogo size={54} color1="#66B6FF" color2="#ffffff" />
                      </div>
                    </div>
                    <div style={{ position: 'absolute', left: '880px', top: `${85 + (980 - (data.destinations.length * 50 + (data.destinations.length - 1) * 12)) / 2}px`, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {data.destinations.map(d => (
                        <ConnectionCard key={d.id} title={d.title} icon={d.iconName || 'file'} brand={d.useBrand} theme={theme} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Slide Matriz Cliente */}
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
                <div style={{ position: 'absolute', top: '70px', left: '100px', zIndex: 3 }}>
                  <h1 style={{ margin: 0, fontSize: '42px', fontWeight: 800, color: textColorMain, letterSpacing: '-0.5px' }}>
                    {customerName ? `${lang === 'en' ? 'Integration Matrix for' : 'Matriz de Integración para'} ${customerName}` : (lang === 'en' ? 'Selected Integration Matrix' : 'Matriz de Integración Seleccionada')}
                  </h1>
                </div>
                <div style={{ position: 'absolute', left: '160px', top: '160px' }}>
                  <div style={{ width: '1600px', height: '800px', position: 'relative' }}>
                    {/* SVG client curves */}
                    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                      {activeOrigins.map((_, i) => {
                        const cardY = 80 + i * 160 + 55;
                        const d = `M 440 ${cardY} C 530 ${cardY}, 560 400, 650 400`;
                        return (
                          <g key={`c-o-${i}`}>
                            <path d={d} fill="none" stroke={isDark ? '#3b82f6' : '#cbd5e1'} strokeWidth="3.5" />
                            <circle cx="440" cy={cardY} r="6" fill={isDark ? '#3b82f6' : '#cbd5e1'} />
                          </g>
                        );
                      })}
                      {activeDestinations.slice(0, 4).map((_, j) => {
                        const cardY = 80 + j * 160 + 55;
                        const d = `M 950 400 C 1040 400, 1070 ${cardY}, 1160 ${cardY}`;
                        return (
                          <g key={`c-d-${j}`}>
                            <path d={d} fill="none" stroke={isDark ? '#3b82f6' : '#cbd5e1'} strokeWidth="3.5" />
                            <circle cx="1160" cy={cardY} r="6" fill={isDark ? '#3b82f6' : '#cbd5e1'} />
                          </g>
                        );
                      })}
                    </svg>
                    <div style={{ position: 'absolute', left: '0px', top: '80px', display: 'flex', flexDirection: 'column', gap: '50px' }}>
                      {activeOrigins.map(o => (
                        <ClientConnectionCard key={o.id} title={o.title} icon={o.iconName || 'file'} brand={o.useBrand} theme={theme} />
                      ))}
                    </div>
                    <div style={{ position: 'absolute', left: '580px', top: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '230px', height: '230px', borderRadius: '50%', background: 'linear-gradient(135deg, #07153a 0%, #1e1b4b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(99, 102, 241, 0.6)' }}>
                        <CrestoneLogo size={90} color1="#66B6FF" color2="#ffffff" />
                      </div>
                    </div>
                    <div style={{ position: 'absolute', left: '1160px', top: '80px', display: 'flex', flexDirection: 'column', gap: '50px' }}>
                      {activeDestinations.slice(0, 4).map(d => (
                        <ClientConnectionCard key={d.id} title={d.title} icon={d.iconName || 'file'} brand={d.useBrand} theme={theme} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

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
        </div>
      </div>
    </div>
  );
}
