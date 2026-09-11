'use client';

import React, { useEffect, useState } from 'react';
import { CaralIcon } from 'iconcaral2';
import { useTranslation } from '@/app/context/LanguageContext';
import { FavoriteItem, getFavorites } from '@/app/components/BookmarkButton';
import DocLandscapeCard from '@/app/components/DocLandscapeCard';

export default function FavoritesList() {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'docs' | 'documents'>('all');

  const loadFavorites = () => {
    setFavorites(getFavorites());
  };

  useEffect(() => {
    setMounted(true);
    loadFavorites();

    const handleUpdate = () => {
      loadFavorites();
    };

    window.addEventListener('favorites_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('favorites_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  if (!mounted || favorites.length === 0) {
    return null;
  }

  const filtered = favorites.filter((item) => {
    if (activeFilter === 'docs') return item.url.startsWith('/docs') || item.url.startsWith('/documentacion');
    if (activeFilter === 'documents') return item.url.startsWith('/documentos') || item.url.startsWith('/d/');
    return true;
  });

  return (
    <div className="w-full flex flex-col pt-2 pb-6">
      <div className="w-full flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <CaralIcon name="bookmark" size={18} />
          </div>
          <h3 className="font-poppins font-bold text-lg text-neutral-900 dark:text-white">
            {t('home.favorites', 'Favoritos')}
          </h3>
          <span className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full font-medium border border-amber-200/60 dark:border-amber-900/60">
            {favorites.length} {favorites.length === 1 ? 'guardado' : 'guardados'}
          </span>
        </div>

        {favorites.length > 3 && (
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-medium shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Todos ({favorites.length})
            </button>
            <button
              onClick={() => setActiveFilter('docs')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                activeFilter === 'docs'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-medium shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Base de Conocimientos
            </button>
            <button
              onClick={() => setActiveFilter('documents')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                activeFilter === 'documents'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-medium shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Documentos
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-2">
        {filtered.map((item, idx) => (
          <DocLandscapeCard
            key={`${item.url}-${idx}`}
            url={item.url}
            title={item.title}
            category={item.category}
          />
        ))}
      </div>
    </div>
  );
}
