'use client';

import React, { useEffect, useState } from 'react';
import { CaralIcon } from 'iconcaral2';
import { useTranslation } from '@/app/context/LanguageContext';
import { RecentlyViewedItem } from '@/app/components/PageTracker';
import DocLandscapeCard from '@/app/components/DocLandscapeCard';

const STORAGE_KEY = 'portal_recently_viewed';

export default function RecentlyViewed() {
  const { t } = useTranslation();
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
  const [mounted, setMounted] = useState(false);

  const loadItems = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: RecentlyViewedItem[] = JSON.parse(raw);
        // Filtrar páginas de documentación y documentos A4
        const valid = parsed.filter((i) => i.url.startsWith('/docs') || i.url.startsWith('/documentacion') || i.url.startsWith('/d/') || i.url.startsWith('/documentos'));
        if (valid.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
        }
        setItems(valid.slice(0, 4));
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadItems();

    const handleUpdate = () => {
      loadItems();
    };

    window.addEventListener('recently_viewed_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('recently_viewed_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  if (!mounted || items.length === 0) {
    return null;
  }

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      localStorage.removeItem(STORAGE_KEY);
      setItems([]);
      window.dispatchEvent(new CustomEvent('recently_viewed_updated', { detail: [] }));
    } catch (err) {
      console.error('Error clearing recently viewed:', err);
    }
  };

  return (
    <div className="w-full flex flex-col pt-2 pb-6">
      <div className="w-full flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <CaralIcon name="clock" size={18} />
          </div>
          <h3 className="font-poppins font-bold text-lg text-neutral-900 dark:text-white">
            {t('home.recentlyViewed', 'Visto recientemente')}
          </h3>
          <span className="text-xs text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full font-medium">
            {items.length} {items.length === 1 ? 'página' : 'páginas'}
          </span>
        </div>

        <button
          onClick={handleClear}
          className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          title={t('home.clearRecent', 'Limpiar historial')}
        >
          {t('home.clear', 'Limpiar')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-2">
        {items.map((item, idx) => (
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
