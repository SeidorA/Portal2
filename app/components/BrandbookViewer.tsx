"use client";

import React, { useState } from 'react';
import { Brand, CaralIcon } from 'iconcaral2';
import { Button } from 'caralstable';
import { useTranslation } from '@/app/context/LanguageContext';
import ConnectionsDiagramTool from './crestone/ConnectionsDiagramTool';
import DeploymentOptionsTool from './crestone/DeploymentOptionsTool';
import CoverGeneratorTool from './crestone/CoverGeneratorTool';
import DeckGeneratorTool from './crestone/DeckGeneratorTool';

export type BrandbookPageType =
  | 'logo'
  | 'isologo'
  | 'isologo-negativo'
  | 'zona-de-seguridad'
  | 'color'
  | 'tipografia'
  | 'descargas'
  | 'connections-diagram'
  | 'deployment-options'
  | 'generate-cover'
  | 'generate-deck';

interface BrandbookViewerProps {
  pageType: BrandbookPageType;
  product: {
    id: string;
    title: string;
    slug?: string;
    icon_name?: string;
    light_image?: string;
    dark_image?: string;
    assets?: any;
    features?: any;
  };
}

export default function BrandbookViewer({ pageType, product }: BrandbookViewerProps) {
  const { t } = useTranslation();

  if (pageType === 'connections-diagram') {
    return <ConnectionsDiagramTool />;
  }
  if (pageType === 'deployment-options') {
    return <DeploymentOptionsTool />;
  }
  if (pageType === 'generate-cover') {
    return <CoverGeneratorTool />;
  }
  if (pageType === 'generate-deck') {
    return <DeckGeneratorTool />;
  }
  const assets = product.assets || {};
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [downloadFilter, setDownloadFilter] = useState<'all' | 'png' | 'jpg' | 'svg'>('all');
  const [downloadSearch, setDownloadSearch] = useState('');
  const [activeLogoBg, setActiveLogoBg] = useState<'solid' | 'grid'>('solid');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHex(text);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  // Color slots data preparation
  const colorPalette = [
    {
      key: 'primary',
      name: assets.color_tokens?.primary || 'Seidor Main',
      role: 'Primary / Color Principal',
      hex: assets.colors?.primary || '#07153A',
      desc: 'Utilizado en encabezados clave, botones principales y acentos estructurales.'
    },
    {
      key: 'secondary',
      name: assets.color_tokens?.secondary || 'Seidor Hard',
      role: 'Secondary / Color Secundario',
      hex: assets.colors?.secondary || '#1F3A70',
      desc: 'Para jerarquías secundarias, bordes interactivos y estados hover.'
    },
    {
      key: 'accent',
      name: assets.color_tokens?.accent || 'Info main',
      role: 'Accent / Color de Acento',
      hex: assets.colors?.accent || '#0085FF',
      desc: 'Llamados a la acción (CTA), estados activos e indicadores dinámicos.'
    },
    {
      key: 'text_main',
      name: assets.color_tokens?.text_main || 'Neutral 900',
      role: 'Text Main / Tipografía',
      hex: assets.colors?.text_main || '#18181B',
      desc: 'Lectura principal de contenido y altos contrastes.'
    },
    {
      key: 'bg_light',
      name: assets.color_tokens?.bg_light || 'Neutral 100',
      role: 'Light Background / Fondo Claro',
      hex: assets.colors?.bg_light || '#F4F4F5',
      desc: 'Superficie base para contenedores claros y fondos de pantalla.'
    },
    {
      key: 'bg_dark',
      name: 'Dark Background',
      role: 'Dark Background / Fondo Oscuro',
      hex: assets.colors?.bg_dark || '#0F172A',
      desc: 'Superficie de modo oscuro y tarjetas de alto contraste.'
    },
  ];

  // Helper for logo URLs
  const logoLightUrl = assets.logo_light || assets.custom_logo || '';
  const logoDarkUrl = assets.logo_dark || assets.custom_logo_dark || assets.logo_light || assets.custom_logo || '';

  // Helper for downloadable assets
  const downloadableAssets: any[] = assets.downloadable_assets || [];
  const filteredDownloads = downloadableAssets.filter(item => {
    const format = (item.format || '').toLowerCase();
    const name = (item.name || '').toLowerCase();
    const matchesFilter =
      downloadFilter === 'all' ||
      (downloadFilter === 'png' && (format.includes('png') || name.endsWith('.png'))) ||
      (downloadFilter === 'jpg' && (format.includes('jpg') || format.includes('jpeg') || name.endsWith('.jpg') || name.endsWith('.jpeg'))) ||
      (downloadFilter === 'svg' && (format.includes('svg') || name.endsWith('.svg')));

    const matchesSearch = !downloadSearch || name.includes(downloadSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-10 w-full animate-in fade-in duration-300">

      {/* 1. PAGE: LOGO */}
      {pageType === 'logo' && (
        <div className="flex flex-col gap-8">
          {/* Narrative Guidelines Card */}
          {assets.brand_info && (
            <div className="p-6 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
                <CaralIcon name="file" size={14} />
                Lineamientos de Marca
              </h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                {assets.brand_info}
              </p>
            </div>
          )}

          {/* Logo Showcase Grid */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 id="versiones-de-logotipo" className="text-xl font-bold font-poppins text-neutral-900 dark:text-white">
                Versiones del Logotipo Completo
              </h2>
              <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
                <button
                  onClick={() => setActiveLogoBg('solid')}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${activeLogoBg === 'solid'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                    }`}
                >
                  Fondo liso
                </button>
                <button
                  onClick={() => setActiveLogoBg('grid')}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${activeLogoBg === 'grid'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                    }`}
                >
                  Cuadrícula
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo Light */}
              <div className="flex flex-col rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900 shadow-2xs">
                <div
                  className={`h-64 flex items-center justify-center p-8 transition-colors ${activeLogoBg === 'grid'
                    ? 'bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] bg-neutral-50 dark:bg-neutral-900'
                    : 'bg-neutral-50 dark:bg-neutral-900'
                    }`}
                >
                  {logoLightUrl ? (
                    <img
                      src={logoLightUrl}
                      alt={`${product.title} Logo Claro`}
                      className="max-h-36 max-w-[85%] object-contain filter drop-shadow-2xs"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-neutral-800">
                      <CaralIcon name="image" size={36} />
                      <span className="text-xs">Sin logotipo claro cargado</span>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Versión Claro (Light)</h4>
                    <span className="text-xs text-neutral-800">Para fondos claros y superficies blancas</span>
                  </div>
                  {logoLightUrl && (
                    <a
                      href={logoLightUrl}
                      download={`${product.slug || 'product'}-logo-light`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors"
                    >
                      <CaralIcon name="arrowDownToLine" size={13} />
                      Descargar
                    </a>
                  )}
                </div>
              </div>

              {/* Logo Dark */}
              <div
                className="flex flex-col rounded-2xl border border-neutral-800 overflow-hidden shadow-2xs"
                style={{ backgroundColor: assets.colors?.primary || '#07153A' }}
              >
                <div
                  className="h-64 flex items-center justify-center p-8 transition-colors"
                  style={{
                    backgroundColor: activeLogoBg === 'grid' ? undefined : (assets.colors?.primary || '#07153A'),
                    backgroundImage: activeLogoBg === 'grid' ? 'radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px)' : undefined,
                    backgroundSize: activeLogoBg === 'grid' ? '16px 16px' : undefined,
                  }}
                >
                  {logoDarkUrl ? (
                    <img
                      src={logoDarkUrl}
                      alt={`${product.title} Logo Oscuro`}
                      className="max-h-36 max-w-[85%] object-contain filter drop-shadow-2xs"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-white/70">
                      <CaralIcon name="image" size={36} />
                      <span className="text-xs">Sin logotipo oscuro cargado</span>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-black/25 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Versión Oscuro (Dark)</h4>
                    <span className="text-xs text-white/75">Fondo con el color principal ({assets.color_tokens?.primary || 'Primary'})</span>
                  </div>
                  {logoDarkUrl && (
                    <a
                      href={logoDarkUrl}
                      download={`${product.slug || 'product'}-logo-dark`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/15 hover:bg-white/25 text-white transition-colors"
                    >
                      <CaralIcon name="arrowDownToLine" size={13} />
                      Descargar
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Guidelines Section */}
          <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-container flex flex-col gap-3">
            <h3 id="especificaciones-de-uso" className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <CaralIcon name="check" size={16} className="text-emerald-500" />
              Especificaciones de Uso del Logotipo
            </h3>
            <ul className="text-xs text-neutral-600 dark:text-neutral-800 space-y-2 list-disc pl-5">
              <li>El logotipo no debe ser alterado en sus proporciones (alto/ancho) ni rotado.</li>
              <li>Mantener siempre un contraste adecuado con el color de fondo.</li>
              <li>No aplicar sombras paralelas exageradas, filtros distorsionantes ni efectos 3D.</li>
              <li>Respetar la zona de seguridad mínima alrededor del isotipo y del texto.</li>
            </ul>
          </div>
        </div>
      )}

      {/* 2. PAGE: ISOLOGO / ISOTIPO */}
      {pageType === 'isologo' && (
        <div className="flex flex-col gap-8">
          {assets.isotype_info && (
            <div className="p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-2">
                <CaralIcon name="image" size={14} />
                Construcción y Reglas del Isotipo
              </h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                {assets.isotype_info}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <h2 id="variantes-del-isologo" className="text-xl font-bold font-poppins text-neutral-900 dark:text-white">
              Variantes del Isotipo / Símbolo
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* Isologo Principal / Claro */}
              <div className="flex flex-col rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-container overflow-hidden p-6 items-center justify-center text-center shadow-2xs">
                <div className="w-28 h-28 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shadow-xs mb-4">
                  {assets.logo_type === 'brand' && (assets.brand_icon || product.icon_name) ? (
                    assets.brand_is_color ?? true ? (
                      <Brand name={(assets.brand_icon || product.icon_name) as any} size={54} />
                    ) : (
                      <CaralIcon name={(assets.brand_icon || product.icon_name) as any} size={54} className="text-neutral-900 dark:text-white" />
                    )
                  ) : logoLightUrl ? (
                    <img src={logoLightUrl} alt="Isotipo" className="w-16 h-16 object-contain" />
                  ) : (
                    <CaralIcon name="image" size={40} className="text-neutral-800" />
                  )}
                </div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Isotipo Principal</h4>
                <p className="text-xs text-neutral-800 mt-1">Símbolo base en color para avatares y favicons</p>
              </div>

              {/* Isologo en Modo Oscuro */}
              <div className="flex flex-col rounded-2xl border border-neutral-800 bg-neutral-950 overflow-hidden p-6 items-center justify-center text-center shadow-2xs">
                <div className="w-28 h-28 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-xs mb-4">
                  {assets.icon_dark ? (
                    <img src={assets.icon_dark} alt="Isotipo Oscuro" className="w-16 h-16 object-contain" />
                  ) : assets.logo_type === 'brand' && (assets.brand_icon || product.icon_name) ? (
                    <Brand name={(assets.brand_icon || product.icon_name) as any} size={54} />
                  ) : (
                    <CaralIcon name="image" size={40} className="text-neutral-800" />
                  )}
                </div>
                <h4 className="text-sm font-bold text-white">Isotipo (Modo Oscuro)</h4>
                <p className="text-xs text-neutral-800 mt-1">Adaptado para interfaces oscuras y fondos densos</p>
              </div>

              {/* Avatar / App Icon Preview */}
              <div className="flex flex-col rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-container overflow-hidden p-6 items-center justify-center text-center shadow-2xs">
                <div
                  className="w-28 h-28 rounded-3xl flex items-center justify-center shadow-md mb-4"
                  style={{ backgroundColor: assets.colors?.primary || '#07153A' }}
                >
                  <span className="text-white">
                    {assets.logo_type === 'brand' && (assets.brand_icon || product.icon_name) ? (
                      <Brand name={(assets.brand_icon || product.icon_name) as any} size={50} />
                    ) : (
                      <CaralIcon name="image" size={40} className="text-white" />
                    )}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">App Icon / Launcher</h4>
                <p className="text-xs text-neutral-800 mt-1">Aplicación del símbolo sobre el color primario</p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 3. PAGE: ISOLOGO NEGATIVO / POSITIVO (B&W) */}
      {pageType === 'isologo-negativo' && (
        <div className="flex flex-col gap-8">
          {assets.positive_negative_info && (
            <div className="p-6 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
                <CaralIcon name="eye" size={14} />
                Pautas de Contraste y Monocromo
              </h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                {assets.positive_negative_info}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <h2 id="versiones-monocromaticas" className="text-xl font-bold font-poppins text-neutral-900 dark:text-white">
              Versiones Blanco y Negro (Positivo y Negativo)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Positivo B&W */}
              <div className="flex flex-col rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white overflow-hidden shadow-2xs">
                <div className="h-60 flex items-center justify-center p-8 bg-white">
                  {assets.logo_positive_bw ? (
                    <img
                      src={assets.logo_positive_bw}
                      alt="Positivo Monocromático"
                      className="max-h-32 max-w-[80%] object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-neutral-800">
                      <CaralIcon name="eye" size={36} />
                      <span className="text-xs">Sin versión positiva cargada</span>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900">Versión Positiva (100% Negro)</h4>
                    <span className="text-xs text-neutral-600">Para impresión en tinta negra, sellos y documentos oficiales</span>
                  </div>
                  {assets.logo_positive_bw && (
                    <a
                      href={assets.logo_positive_bw}
                      download={`${product.slug || 'product'}-logo-positive-bw`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-200 hover:bg-neutral-300 text-neutral-900 transition-colors"
                    >
                      <CaralIcon name="arrowDownToLine" size={13} />
                      Descargar
                    </a>
                  )}
                </div>
              </div>

              {/* Negativo B&W */}
              <div className="flex flex-col rounded-2xl border border-neutral-900 bg-neutral-950 overflow-hidden shadow-2xs">
                <div className="h-60 flex items-center justify-center p-8 bg-neutral-950">
                  {assets.logo_negative_bw ? (
                    <img
                      src={assets.logo_negative_bw}
                      alt="Negativo Monocromático"
                      className="max-h-32 max-w-[80%] object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-neutral-600">
                      <CaralIcon name="eye" size={36} />
                      <span className="text-xs">Sin versión negativa cargada</span>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Versión Negativa (100% Blanco)</h4>
                    <span className="text-xs text-neutral-800">Para fondos negros puros, serigrafía y grabados</span>
                  </div>
                  {assets.logo_negative_bw && (
                    <a
                      href={assets.logo_negative_bw}
                      download={`${product.slug || 'product'}-logo-negative-bw`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
                    >
                      <CaralIcon name="arrowDownToLine" size={13} />
                      Descargar
                    </a>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 4. PAGE: ZONA DE SEGURIDAD */}
      {pageType === 'zona-de-seguridad' && (
        <div className="flex flex-col gap-8">
          {assets.safety_zone_info && (
            <div className="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
                <CaralIcon name="grid" size={14} />
                Reglas de Margen de Respeto
              </h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                {assets.safety_zone_info}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <h2 id="diagrama-de-seguridad" className="text-xl font-bold font-poppins text-neutral-900 dark:text-white">
              Diagrama de Zona de Seguridad y Proporciones
            </h2>

            <div className="p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col items-center justify-center min-h-[350px] shadow-2xs">
              {assets.safety_zone_image ? (
                <div className="relative max-w-2xl w-full flex items-center justify-center">
                  <img
                    src={assets.safety_zone_image}
                    alt="Diagrama de Zona de Seguridad"
                    className="max-h-[420px] w-auto object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-neutral-800 py-12">
                  <CaralIcon name="grid" size={48} className="text-neutral-300 dark:text-neutral-700" />
                  <p className="text-sm text-neutral-800">No se ha cargado un diagrama de zona de seguridad aún.</p>
                </div>
              )}
            </div>

            {assets.safety_zone_image && (
              <div className="flex justify-end">
                <a
                  href={assets.safety_zone_image}
                  download="zona-de-seguridad-diagrama"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors"
                >
                  <CaralIcon name="arrowDownToLine" size={14} />
                  Descargar Diagrama en Alta Resolución
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. PAGE: COLOR */}
      {pageType === 'color' && (
        <div className="flex flex-col gap-8">
          {assets.color_palette_info && (
            <div className="p-6 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-2">
                <CaralIcon name="settings" size={14} />
                Lineamientos de Color
              </h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                {assets.color_palette_info}
              </p>
            </div>
          )}

          {/* Color Swatches Grid */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 id="paleta-de-colores" className="text-xl font-bold font-poppins text-neutral-900 dark:text-white">
                Paleta Cromática Oficial
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                {assets.theme_base === 'custom' ? 'Custom Theme' : 'Caral Design System'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {colorPalette.map((col) => {
                const isCopied = copiedHex === col.hex;
                return (
                  <div
                    key={col.key}
                    className="flex flex-col rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-container overflow-hidden shadow-2xs hover:shadow-md transition-all group"
                  >
                    {/* Visual Color Block */}
                    <div
                      className="h-32 w-full relative flex items-end p-3 transition-transform group-hover:scale-[1.02]"
                      style={{ backgroundColor: col.hex }}
                    >
                      <button
                        onClick={() => copyToClipboard(col.hex)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm cursor-pointer flex items-center gap-1"
                      >
                        {isCopied ? '¡Copiado!' : 'Copiar HEX'}
                      </button>
                    </div>

                    {/* Color Metadata */}
                    <div className="p-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-neutral-900 dark:text-white">{col.name}</span>
                        <span
                          onClick={() => copyToClipboard(col.hex)}
                          className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 transition-colors"
                          title="Clic para copiar"
                        >
                          {col.hex}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">{col.role}</span>
                      <p className="text-xs text-neutral-800 dark:text-neutral-800 leading-normal">{col.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 6. PAGE: TIPOGRAFÍA */}
      {pageType === 'tipografia' && (
        <div className="flex flex-col gap-8">
          {assets.typography_info && (
            <div className="p-6 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-2">
                <CaralIcon name="file" size={14} />
                Directrices Tipográficas
              </h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                {assets.typography_info}
              </p>
            </div>
          )}

          {/* Font Specimen Preview */}
          <div className="flex flex-col gap-4">
            <h2 id="especimen-tipografico" className="text-xl font-bold font-poppins text-neutral-900 dark:text-white">
              Espécimen Tipográfico
            </h2>

            <div className="p-8 sm:p-10 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-container flex flex-col gap-10 shadow-2xs">
              {/* Typeface Header */}
              <div className="flex flex-col gap-1">
                <h3 className="text-4xl sm:text-5xl font-poppins font-bold text-neutral-900 dark:text-white tracking-tight">
                  Poppins Font
                </h3>
                <span className="text-sm font-medium text-neutral-800">
                  Open Font License • Google Fonts
                </span>
              </div>

              {/* Bold Specimen */}
              <div className="flex flex-col gap-3">
                <h4 className="text-3xl sm:text-4xl font-poppins font-bold text-neutral-900 dark:text-white">
                  Bold
                </h4>
                <div className="flex flex-col gap-1 font-poppins font-bold text-base sm:text-lg text-neutral-800 tracking-wide select-all">
                  <p className="tracking-wider">ABCDEFGHIJKLMNÑOPQRSTUVWXYZ</p>
                  <p className="tracking-wider">abcdefghijklmnñopqrstuvwxyz</p>
                  <p className="tracking-wider font-mono text-sm sm:text-base opacity-90">0123456789&/@#.:,;-_=%+$€!?</p>
                </div>
              </div>

              {/* Medium Specimen */}
              <div className="flex flex-col gap-3">
                <h4 className="text-3xl sm:text-4xl font-poppins font-medium text-neutral-900 dark:text-white">
                  Medium
                </h4>
                <div className="flex flex-col gap-1 font-poppins font-medium text-base sm:text-lg text-neutral-800 tracking-wide select-all">
                  <p className="tracking-wider">ABCDEFGHIJKLMNÑOPQRSTUVWXYZ</p>
                  <p className="tracking-wider">abcdefghijklmnñopqrstuvwxyz</p>
                  <p className="tracking-wider font-mono text-sm sm:text-base opacity-90">0123456789&/@#.:,;-_=%+$€!?</p>
                </div>
              </div>

              {/* Regular Specimen */}
              <div className="flex flex-col gap-3">
                <h4 className="text-3xl sm:text-4xl font-poppins font-normal text-neutral-900 dark:text-white">
                  Regular
                </h4>
                <div className="flex flex-col gap-1 font-poppins font-normal text-base sm:text-lg text-neutral-800 tracking-wide select-all">
                  <p className="tracking-wider">ABCDEFGHIJKLMNÑOPQRSTUVWXYZ</p>
                  <p className="tracking-wider">abcdefghijklmnñopqrstuvwxyz</p>
                  <p className="tracking-wider font-mono text-sm sm:text-base opacity-90">0123456789&/@#.:,;-_=%+$€!?</p>
                </div>
              </div>
            </div>
          </div>

          {/* Typography Scales Showcase */}
          <div className="flex flex-col gap-6">
            <h2 id="jerarquia-tipografica" className="text-xl font-bold font-poppins text-neutral-900 dark:text-white">
              Jerarquía y Escala Tipográfica
            </h2>

            <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-container flex flex-col gap-8 shadow-2xs">

              {/* Display / H1 */}
              <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 pb-6 border-b border-neutral-100 dark:border-neutral-800">
                <div className="md:w-1/4">
                  <span className="text-xs font-mono font-bold text-neutral-800">Heading 1 / Display</span>
                  <p className="text-[11px] text-neutral-800">Poppins Bold • 36px / 2.25rem</p>
                </div>
                <div className="md:w-3/4">
                  <h1 className="text-3xl sm:text-4xl font-poppins font-bold text-neutral-900 dark:text-white">
                    {product.title} - Plataforma Digital
                  </h1>
                </div>
              </div>

              {/* H2 */}
              <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 pb-6 border-b border-neutral-100 dark:border-neutral-800">
                <div className="md:w-1/4">
                  <span className="text-xs font-mono font-bold text-neutral-800">Heading 2 / Sección</span>
                  <p className="text-[11px] text-neutral-800">Poppins SemiBold • 24px / 1.5rem</p>
                </div>
                <div className="md:w-3/4">
                  <h2 className="text-2xl font-poppins font-semibold text-neutral-900 dark:text-white">
                    Experiencia visual de alto impacto
                  </h2>
                </div>
              </div>

              {/* H3 */}
              <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 pb-6 border-b border-neutral-100 dark:border-neutral-800">
                <div className="md:w-1/4">
                  <span className="text-xs font-mono font-bold text-neutral-800">Heading 3 / Subtítulo</span>
                  <p className="text-[11px] text-neutral-800">Poppins Medium • 18px / 1.125rem</p>
                </div>
                <div className="md:w-3/4">
                  <h3 className="text-lg font-poppins font-medium text-neutral-900 dark:text-white">
                    Consistencia y escalabilidad en cada componente
                  </h3>
                </div>
              </div>

              {/* Body */}
              <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 pb-6 border-b border-neutral-100 dark:border-neutral-800">
                <div className="md:w-1/4">
                  <span className="text-xs font-mono font-bold text-neutral-800">Body / Párrafo</span>
                  <p className="text-[11px] text-neutral-800">Inter Regular • 14px / 0.875rem</p>
                </div>
                <div className="md:w-3/4">
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans">
                    Nuestra tipografía garantiza máxima legibilidad tanto en pantallas de alta densidad como en documentos impresos. Los pesos regulares y medianos se utilizan para cuerpos de texto fluidos y narrativas extensas.
                  </p>
                </div>
              </div>

              {/* Mono */}
              <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2">
                <div className="md:w-1/4">
                  <span className="text-xs font-mono font-bold text-neutral-800">Code / Monospace</span>
                  <p className="text-[11px] text-neutral-800">JetBrains Mono / Fira Code • 13px</p>
                </div>
                <div className="md:w-3/4">
                  <code className="text-xs font-mono px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-blue-600 dark:text-blue-400 inline-block">
                    font-family: var(--font-poppins), 'Inter', monospace;
                  </code>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 7. PAGE: ZONA DE DESCARGAS (RACK DE RECURSOS) */}
      {pageType === 'descargas' && (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 id="rack-de-descargas" className="text-xl font-bold font-poppins text-neutral-900 dark:text-white">
                Rack de Archivos y Recursos Descargables
              </h2>
              <p className="text-xs text-neutral-800 mt-0.5">
                Archivos oficiales en alta resolución listos para uso editorial y digital ({filteredDownloads.length} disponibles)
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setDownloadFilter('all')}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${downloadFilter === 'all'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-800 hover:text-neutral-800 dark:hover:text-white'
                  }`}
              >
                Todos
              </button>
              <button
                onClick={() => setDownloadFilter('png')}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${downloadFilter === 'png'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-neutral-800 hover:text-neutral-800 dark:hover:text-white'
                  }`}
              >
                PNG
              </button>
              <button
                onClick={() => setDownloadFilter('jpg')}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${downloadFilter === 'jpg'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-neutral-800 hover:text-neutral-800 dark:hover:text-white'
                  }`}
              >
                JPG
              </button>
              <button
                onClick={() => setDownloadFilter('svg')}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${downloadFilter === 'svg'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-neutral-800 hover:text-neutral-800 dark:hover:text-white'
                  }`}
              >
                SVG
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              value={downloadSearch}
              onChange={(e) => setDownloadSearch(e.target.value)}
              placeholder="Buscar por nombre de archivo..."
              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-container px-4 py-2.5 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Downloads Grid */}
          {filteredDownloads.length === 0 ? (
            <div className="p-12 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 text-center flex flex-col items-center justify-center gap-2 bg-neutral-50/50 dark:bg-neutral-900/30">
              <CaralIcon name="file" size={32} className="text-neutral-800" />
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-800">
                {downloadableAssets.length === 0
                  ? 'No hay archivos en el rack de descargas para este producto.'
                  : 'No se encontraron archivos con los filtros seleccionados.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDownloads.map((asset, idx) => {
                const isSvg = asset.format?.toUpperCase() === 'SVG' || asset.name.toLowerCase().endsWith('.svg');
                const isJpg = asset.format?.toUpperCase() === 'JPG' || asset.name.toLowerCase().endsWith('.jpg') || asset.name.toLowerCase().endsWith('.jpeg');
                const badgeColor = isSvg
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                  : isJpg
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                    : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400';

                return (
                  <div
                    key={asset.id || idx}
                    className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-container hover:border-blue-500/50 transition-all flex items-center justify-between gap-4 shadow-2xs group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-14 h-14 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700/80 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs p-1">
                        <img
                          src={asset.url}
                          alt={asset.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-neutral-900 dark:text-white truncate" title={asset.name}>
                          {asset.name}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${badgeColor}`}>
                            {asset.format || 'IMG'}
                          </span>
                          {asset.size && (
                            <span className="text-[10px] text-neutral-800 font-mono">
                              {asset.size}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <a
                      href={asset.url}
                      download={asset.name}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl bg-neutral-100 hover:bg-blue-50 dark:bg-neutral-800 dark:hover:bg-blue-950/40 text-neutral-600 hover:text-blue-600 dark:text-neutral-300 dark:hover:text-blue-400 transition-colors shrink-0 shadow-2xs"
                      title="Descargar archivo"
                    >
                      <CaralIcon name="arrowDownToLine" size={16} />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
