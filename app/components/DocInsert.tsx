'use client';

import React, { useEffect, useState } from 'react';
import { Button } from 'caralstable';
import { CaralIcon, Brand } from 'iconcaral2';
import { createClient } from '@/utils/supabase/client';

export interface DocInsertProps {
  id?: string;
  title?: string;
  description?: string;
  coverImage?: string;
  format?: string;
  language?: string;
  downloadUrl?: string;
  onDownload?: string;
  brand?: string;
  titleimg?: string;
  restriction?: string;
}

export default function DocInsert({
  id,
  title: initialTitle,
  description: initialDescription,
  coverImage: initialCoverImage,
  format,
  language,
  downloadUrl: rawDownloadUrl,
  onDownload,
  brand,
  titleimg,
  restriction = 'public'
}: DocInsertProps) {
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const supabase = createClient();

  const downloadUrl = rawDownloadUrl || onDownload;

  useEffect(() => {
    async function fetchDoc() {
      if (!id) return;
      const { data, error } = await supabase
        .from('portal_documents')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        setDoc(data);
      }
      setLoading(false);
    }

    if (id) fetchDoc();
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="w-full h-44 bg-neutral-50 dark:bg-neutral-900/50 animate-pulse rounded-2xl flex items-center justify-center border border-neutral-200 dark:border-neutral-800 my-6">
        <span className="text-neutral-400 text-sm flex items-center gap-2">
          <CaralIcon name="loading" className="animate-spin" /> Cargando documento...
        </span>
      </div>
    );
  }

  // Si se pasaron props directas (ej: Material comercial de Docusaurus o descarga directa)
  const isDirect = !id && Boolean(initialTitle || downloadUrl);

  if (!isDirect && !doc) {
    return (
      <div className="w-full p-4 bg-red-50 text-red-500 rounded-xl border border-red-200 text-sm my-6">
        Documento no encontrado o sin acceso.
      </div>
    );
  }

  const title = isDirect ? (initialTitle || 'Documento Comercial') : doc.title;
  const description = isDirect
    ? (initialDescription || 'Documento comercial y técnico disponible para consulta y descarga.')
    : (doc.content?.metadata?.description || 'Descripción del documento no disponible.');

  const coverImage = isDirect
    ? initialCoverImage
    : (doc.content?.settings?.cover?.selectedCoverImage || doc.content?.metadata?.coverUrl);

  const docRestriction = isDirect
    ? restriction
    : (doc.content?.metadata?.restriction || 'public');

  return (
    <div className="flex lg:flex-row sm:flex-col w-full bg-container border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden my-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Cover Image / Brand Side */}
      <div className="lg:w-70 sm:w-full  aspect-1/1 sm:aspect-3/1 relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 flex-shrink-0 flex items-center justify-center p-6 text-white overflow-hidden group">
        {coverImage ? (
          <>
            <img
              src={coverImage}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-4">
              <span className="text-white font-bold text-sm leading-tight line-clamp-2 drop-shadow-md">
                {title}
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center z-10 gap-2">
            {brand ? (
              <Brand name={brand as any} size={48} />
            ) : (
              <CaralIcon name="file" size={44} />
            )}
            <span className="text-xs uppercase tracking-widest font-semibold text-blue-200">
              {titleimg || format || 'MATERIAL'}
            </span>
          </div>
        )}
      </div>

      {/* Content Side */}
      <div className="p-6 flex flex-col flex-1 w-full min-h-[160px]">
        <div className="mb-2">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {format && (
              <span className="inline-block px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-md text-[11px] font-bold border border-blue-100 dark:border-blue-800">
                {format.toUpperCase()}
              </span>
            )}
            {language && (
              <span className="inline-block px-2.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-md text-[11px] font-medium">
                {language}
              </span>
            )}
            {docRestriction === 'internal' && (
              <span className="inline-block px-2.5 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-md text-[11px] font-semibold border border-red-100 dark:border-red-900/30">
                Uso interno
              </span>
            )}
            {docRestriction === 'restricted' && (
              <span className="inline-block px-2.5 py-0.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-md text-[11px] font-semibold border border-yellow-100 dark:border-yellow-900/30">
                Restringido
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold font-poppins text-neutral-900 dark:text-white line-clamp-2 mb-1">
            {title}
          </h3>
        </div>

        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 flex-1 line-clamp-3 leading-relaxed">
          {description}
        </p>

        <div className="flex items-center gap-3 mt-auto pt-2">
          {downloadUrl ? (
            <Button
              variant="info"
              onClick={() => window.open(downloadUrl, '_blank')}
              className="px-5 text-sm flex items-center gap-2"
              iconName="arrowDownToLine"
            >
              Descargar {format || 'documento'}
            </Button>
          ) : (
            <Button
              variant="info"
              onClick={() => window.open(`/d/${doc.id}`, '_blank')}
              className="px-5 text-sm flex items-center gap-2"
              iconName="book"
            >
              Ver ahora
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
