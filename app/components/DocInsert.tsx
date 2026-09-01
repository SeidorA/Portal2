'use client';

import React, { useEffect, useState } from 'react';
import { Button } from 'caralstable';
import { CaralIcon } from 'iconcaral2';
import { createClient } from '@/utils/supabase/client';

export default function DocInsert({ id }: { id: string }) {
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchDoc() {
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
      <div className="w-full h-64 bg-neutral-50 dark:bg-neutral-900/50 animate-pulse rounded-2xl flex items-center justify-center border border-neutral-200 dark:border-neutral-800 my-6">
        <span className="text-neutral-400 text-sm flex items-center gap-2">
          <CaralIcon name="loading" className="animate-spin" /> Cargando documento...
        </span>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="w-full p-4 bg-red-50 text-red-500 rounded-xl border border-red-200 text-sm my-6">
        Documento no encontrado o sin acceso.
      </div>
    );
  }

  const coverImage = doc.content?.settings?.cover?.selectedCoverImage || doc.content?.metadata?.coverUrl || `https://placehold.co/600x400/e2e8f0/64748b?text=${encodeURIComponent(doc.title)}`;
  const description = doc.content?.metadata?.description || 'Descripción del documento no disponible. Esta sección podrá actualizarse desde los metadatos más adelante para brindar contexto a los lectores.';

  return (
    <div className="flex lg:flex-row md:flex-col sm:flex-col w-full bg-container border rounded-2xl overflow-hidden my-6">
      {/* Cover Image Side */}
      <div className="lg:w-[24%] md:100% sm:100% aspect-4/3 rounded-l overflow-hidden relative bg-neutral-200 dark:bg-neutral-800 flex-shrink-0 group">
        <img
          src={coverImage}
          alt={doc.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {(doc.content?.settings?.cover?.selectedCoverImage || doc.content?.metadata?.coverUrl) && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 flex items-end p-4 transition-opacity">
            <span className="text-white font-bold text-lg leading-tight line-clamp-2 drop-shadow-md">
              {doc.title}
            </span>
          </div>
        )}
      </div>

      {/* Content Side */}
      <div className="p-6 flex flex-col flex-1 ">
        <div className="mb-2">
          {/* Restriction Badge */}
          {doc.content?.metadata?.restriction === 'internal' && (
            <span className="inline-block px-2.5 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-full text-[10px] font-semibold mb-3 border border-red-100 dark:border-red-900/30">
              Uso interno
            </span>
          )}
          {doc.content?.metadata?.restriction === 'restricted' && (
            <span className="inline-block px-2.5 py-0.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-full text-[10px] font-semibold mb-3 border border-yellow-100 dark:border-yellow-900/30">
              Restringido
            </span>
          )}
          {(!doc.content?.metadata?.restriction || doc.content?.metadata?.restriction === 'public') && (
            <span className="inline-block px-2.5 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-[10px] font-semibold mb-3 border border-green-100 dark:border-green-900/30">
              Público
            </span>
          )}

          <h3 className="text-xl font-bold font-poppins text-neutral-900 dark:text-white line-clamp-2">
            {doc.title}
          </h3>
        </div>

        <p className="text-sm text-neutral-800 dark:text-neutral-400 mb-6 flex-1 line-clamp-3">
          {description}
        </p>

        <div className="flex items-center gap-2 mt-auto">
          <Button variant="info"
            onClick={() => window.open(`/d/${doc.id}`, '_blank')}
            className="px-5 text-sm"
            iconName='book'
          >
            Ver ahora
          </Button>
          {/*
          <Button
            variant="ghost"
            onClick={() => window.open(`/d/${doc.id}`, '_blank')}
            iconName='arrowDownToLine'
            hasBorder
          >
            Descargar
          </Button>
          */}
        </div>
      </div>
    </div>
  );
}
