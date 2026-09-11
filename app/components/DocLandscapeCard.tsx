'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CaralIcon, Brand } from 'iconcaral2';
import BookmarkButton from '@/app/components/BookmarkButton';
import { createClient } from '@/utils/supabase/client';

export interface DocLandscapeCardProps {
  url: string;
  title: string;
  category?: string;
  productName?: string;
  productIcon?: string;
  coverImage?: string;
}

export default function DocLandscapeCard({
  url,
  title,
  category = 'Base de Conocimientos',
  productName = 'Crestone',
  productIcon,
  coverImage,
}: DocLandscapeCardProps) {
  const [copied, setCopied] = useState(false);
  const [dynamicCover, setDynamicCover] = useState<string | null>(coverImage || null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (coverImage) {
      setDynamicCover(coverImage);
      return;
    }
    if (url.startsWith('/d/')) {
      const docId = url.split('/d/')[1]?.split('?')[0]?.split('#')[0];
      if (docId) {
        const fetchCover = async () => {
          try {
            const supabase = createClient();
            const { data } = await supabase
              .from('portal_documents')
              .select('content')
              .eq('id', docId)
              .single();
            if (data?.content) {
              const cover =
                data.content?.settings?.cover?.selectedCoverImage ||
                data.content?.metadata?.coverUrl ||
                data.content?.settings?.cover?.coverImage;
              if (cover) {
                setDynamicCover(cover);
              }
            }
          } catch {
            // ignore
          }
        };
        fetchCover();
      }
    }
  }, [url, coverImage]);

  // Infiere el nombre del producto y slug si no vienen dados
  let displayProduct = productName;
  let cleanUrl = url.replace(/^\//, '');
  let resolvedIcon = productIcon;

  if (url.includes('/docs/')) {
    const parts = url.split('/docs/')[1]?.split('/');
    if (parts && parts[0]) {
      const slug = parts[0];
      displayProduct = slug.charAt(0).toUpperCase() + slug.slice(1);
      if (!resolvedIcon) {
        resolvedIcon = slug.toLowerCase() === 'crestone' ? 'Crestone' : slug.charAt(0).toUpperCase() + slug.slice(1);
      }
    }
  } else if (url.includes('/documentacion/')) {
    displayProduct = 'Portal';
    if (!resolvedIcon) {
      resolvedIcon = 'Portal';
    }
  } else if (url.includes('/documentos') || url.includes('/d/')) {
    displayProduct = 'Documento A4';
    if (!resolvedIcon) {
      resolvedIcon = 'file';
    }
  }

  if (!resolvedIcon && displayProduct && displayProduct !== 'Documento A4') {
    resolvedIcon = displayProduct.replace(/\s+/g, '');
  }

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group flex flex-col rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-sm overflow-hidden shadow-xs hover:shadow-lg hover:border-blue-400/50 dark:hover:border-blue-500/50 transition-all duration-200 hover:-translate-y-0.5">
      {/* Top Graphic Banner */}
      <Link href={url} className="block relative h-36 w-full bg-slate-900 overflow-hidden cursor-pointer">
        {dynamicCover && !imgError ? (
          <img
            src={dynamicCover}
            alt={title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-300 relative flex items-center justify-center"
            style={{
              backgroundImage: "radial-gradient(ellipse at top, #263C7A 0%, #07153A 100%), url('/img/blur2.png')",
              backgroundBlendMode: 'overlay',
            }}
          >
            {/* Isometric abstract illustration overlay */}
            <div className="absolute inset-0 bg-linear-to-r from-blue-600/20 via-indigo-600/20 to-teal-500/20" />
            <div className="relative z-1 flex items-center gap-3 opacity-90">
              <div className="w-14 h-14 rounded-2xl bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl rotate-3">
                {resolvedIcon === 'file' ? (
                  <CaralIcon name="file" size={26} />
                ) : resolvedIcon ? (
                  <Brand name={resolvedIcon as any} size={28} />
                ) : (
                  <CaralIcon name="cube" size={26} />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Product Logo Badge on Top-Left */}
        <div className="absolute top-3 left-3 z-10">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md rounded-lg shadow-sm border border-neutral-200/50 dark:border-neutral-700/50">
            {resolvedIcon === 'file' ? (
              <span className="text-blue-500 flex items-center">
                <CaralIcon name="file" size={13} />
              </span>
            ) : resolvedIcon ? (
              <Brand name={resolvedIcon as any} size={15} />
            ) : null}
            <span className="text-xs font-semibold text-neutral-900 dark:text-white font-poppins">
              {displayProduct}
            </span>
          </div>
        </div>
      </Link>

      {/* Footer Info & Actions */}
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <Link href={url}>
            <h4 className="font-poppins font-bold text-sm text-neutral-900 dark:text-white truncate hover:text-blue-600 transition-colors">
              {title}
            </h4>
          </Link>
          <Link href={url} className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 font-mono truncate block mt-0.5 hover:underline">
            {cleanUrl}
          </Link>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            title={copied ? '¡Enlace copiado!' : 'Copiar enlace'}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <CaralIcon name={copied ? 'check' : 'link'} size={15} />
          </button>

          <BookmarkButton
            url={url}
            title={title}
            category={category}
            size={15}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
