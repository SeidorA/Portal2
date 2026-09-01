'use client';

import React from 'react';
import { Brand } from 'iconcaral2';

export default function DocumentCover({
  title,
  products,
  coverSettings,
  documentMetadata,
  onToggleLogo,
  onCoverImageSelect,
  isEditor = false
}: {
  title: string;
  products: any[];
  coverSettings: any;
  documentMetadata?: any;
  onToggleLogo?: (productId: string) => void;
  onCoverImageSelect?: (imageUrl: string) => void;
  isEditor?: boolean;
}) {
  if (!coverSettings?.hasCover) return null;

  // Filtrar productos relacionados que estén seleccionados y no estén ocultos
  const visibleProducts = products.filter(p => !coverSettings.hiddenLogos?.includes(p.id));

  // Recopilar TODAS las imágenes de portadas (cover_images) de los productos
  const availableImages: string[] = [];
  products.forEach(p => {
    if (p.assets?.cover_images && Array.isArray(p.assets.cover_images)) {
      p.assets.cover_images.forEach((imgUrl: string) => {
        if (!availableImages.includes(imgUrl)) {
          availableImages.push(imgUrl);
        }
      });
    }
  });

  const coverImage = coverSettings.selectedCoverImage || availableImages[0] || null;

  const firstProduct = products[0];
  const firstProductLogo = firstProduct?.light_image || firstProduct?.dark_image || firstProduct?.assets?.logo_light || firstProduct?.assets?.logo_dark;

  let renderTitle = null;
  if (coverSettings.titleMode === 'custom') {
    renderTitle = <h1 className="text-5xl font-extrabold font-poppins text-neutral-900 dark:text-white tracking-tight leading-tight max-w-3xl drop-shadow-sm">{coverSettings.customTitle || title || 'Sin Título'}</h1>;
  } else if (coverSettings.titleMode === 'name') {
    renderTitle = <h1 className="text-5xl font-extrabold font-poppins text-neutral-900 dark:text-white tracking-tight leading-tight max-w-3xl drop-shadow-sm">{firstProduct ? firstProduct.title : title || 'Sin Título'}</h1>;
  } else {
    renderTitle = (
      <div className="flex items-center justify-center gap-6">
        {firstProduct?.icon_name && (
          <Brand name={firstProduct.icon_name as any} size={96} />
        )}
        <h1 className="text-[57px]! font-extrabold font-poppins text-[#07153A] leading-tight drop-shadow-sm">{firstProduct ? firstProduct.title : title || 'Sin Título'}</h1>
      </div>
    );
  }

  return (
    <div className={`flex flex-col relative w-full h-full min-h-[1123px] bg-white dark:bg-neutral-950 overflow-hidden`}>
      {documentMetadata?.restriction === 'internal' && (
        <div className="absolute top-40 right-10 z-[100] pointer-events-none -rotate-[15deg] opacity-[0.4]">
          <div className="border-[8px] border-red-500 rounded-3xl px-8 py-3 bg-white/20 backdrop-blur-sm">
            <span className="font-black text-4xl text-red-500 tracking-widest whitespace-nowrap">
              SOLO USO INTERNO
            </span>
          </div>
        </div>
      )}

      {coverImage && (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${coverImage})` }}
        />
      )}

      {/* Main Content Area */}
      <div className="z-10 flex flex-col items-center p-12 text-center w-full" style={{ marginTop: `${coverSettings.marginTop ?? 120}px` }}>
        {renderTitle}

        {coverSettings.subtitleText && (
          <h2
            className="text-2xl font-medium font-poppins drop-shadow-sm"
            style={{ color: coverSettings.subtitleColor || '#00B0FF', marginTop: `${coverSettings.marginBetween ?? 10}px` }}
          >
            {coverSettings.subtitleText}
          </h2>
        )}
      </div>

      {/* Logos Container */}
      {(visibleProducts.length > 0 || !coverSettings.hiddenLogos?.includes('seidor')) && (
        <div className="z-10 flex flex-wrap items-center justify-center gap-12 mt-auto mb-24 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md px-12 py-8 rounded-2xl border border-white/20 dark:border-neutral-700/50 mx-auto">

          {/* Logo Seidor */}
          {!coverSettings.hiddenLogos?.includes('seidor') && (
            <img src="/img/logos/logo.png" alt="Seidor" className="h-12 w-auto object-contain drop-shadow-md" />
          )}

          {visibleProducts.map(p => {
            if (p.icon_name) {
              return (
                <div key={p.id} className="text-blue-500 flex items-center gap-4 drop-shadow-md">
                  <Brand name={p.icon_name as any} size={24} />
                  <h1 className="text-[18px]! font-extrabold text-[#07153A] leading-tight drop-shadow-sm">{firstProduct ? firstProduct.title : title || 'Sin Título'}</h1>

                </div>
              );
            }

            const logo = p.light_image || p.dark_image || p.assets?.logo_light || p.assets?.logo_dark;
            if (logo) {
              return (
                <img
                  key={p.id}
                  src={logo}
                  alt={p.title}
                  className="h-12 w-auto object-contain drop-shadow-md"
                />
              );
            }
            return (
              <div key={p.id} className="text-xl font-bold text-neutral-800 dark:text-neutral-200 font-poppins drop-shadow-md">
                {p.title}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
