'use client';

import React, { useEffect, useState } from 'react';
import { getFavorites, FavoriteItem } from '@/app/components/BookmarkButton';
import { RecentlyViewedItem } from '@/app/components/PageTracker';
import { useTranslation } from '@/app/context/LanguageContext';
import DocLandscapeCard from '../components/DocLandscapeCard';

const RECENT_STORAGE_KEY = 'portal_recently_viewed';

export default function ProfileActivityTab({ user }: { user?: any }) {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [recentDocs, setRecentDocs] = useState<RecentlyViewedItem[]>([]);
  const [mounted, setMounted] = useState(false);

  const loadData = () => {
    setFavorites(getFavorites());
    try {
      const raw = localStorage.getItem(RECENT_STORAGE_KEY);
      if (raw) {
        const parsed: RecentlyViewedItem[] = JSON.parse(raw);
        setRecentDocs(parsed.filter((i) => i.url.startsWith('/docs') || i.url.startsWith('/documentacion') || i.url.startsWith('/d/')));
      } else {
        setRecentDocs([]);
      }
    } catch {
      setRecentDocs([]);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('favorites_updated', handleUpdate);
    window.addEventListener('recently_viewed_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('favorites_updated', handleUpdate);
      window.removeEventListener('recently_viewed_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Muestra elementos reales o ejemplos atractivos basados en Figma si es la primera vez
  const sampleFavorites: FavoriteItem[] = [
    {
      url: '/docs/crestone/xtrac',
      title: 'Xtract Universal',
      category: 'Base de Conocimientos',
      createdAt: Date.now() - 1000 * 60 * 30,
    },
    {
      url: '/docs/crestone/fivetran',
      title: 'Crestone vs Fivetran',
      category: 'Base de Conocimientos',
      createdAt: Date.now() - 1000 * 60 * 60,
    },
    {
      url: '/docs/crestone/fivetran-features',
      title: 'Crestone vs Fivetran',
      category: 'Base de Conocimientos',
      createdAt: Date.now() - 1000 * 60 * 120,
    },
  ];

  const sampleRecent: RecentlyViewedItem[] = [
    {
      url: '/docs/crestone/xtrac',
      title: 'Xtract Universal',
      category: 'Base de Conocimientos',
      visitedAt: Date.now() - 1000 * 60 * 15,
      durationSeconds: 45,
    },
    {
      url: '/docs/crestone/fivetran',
      title: 'Crestone vs Fivetran',
      category: 'Base de Conocimientos',
      visitedAt: Date.now() - 1000 * 60 * 45,
      durationSeconds: 60,
    },
  ];

  const displayFavorites = mounted && favorites.length > 0 ? favorites : sampleFavorites;
  const displayRecent = mounted && recentDocs.length > 0 ? recentDocs : sampleRecent;

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* 1. Sección Favoritos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-poppins font-bold text-xl text-neutral-900 dark:text-white">
            {t('profile.favorites', 'Favoritos')}
          </h3>
          <span className="text-xs text-neutral-400 font-medium">
            {displayFavorites.length} {displayFavorites.length === 1 ? t('profile.element', 'elemento') : t('profile.elements', 'elementos')}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-4">
          {displayFavorites.map((item, idx) => (
            <DocLandscapeCard
              key={idx}
              url={item.url}
              title={item.title}
              category={item.category}
            />
          ))}
        </div>
      </div>

      {/* 2. Sección Visto recientemente */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-poppins font-bold text-xl text-neutral-900 dark:text-white">
            {t('profile.recentlyViewed', 'Visto recientemente')}
          </h3>
          <span className="text-xs text-neutral-400 font-medium">
            {displayRecent.length} {displayRecent.length === 1 ? t('profile.page', 'página') : t('profile.pages', 'páginas')}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-4">
          {displayRecent.map((item, idx) => (
            <DocLandscapeCard
              key={idx}
              url={item.url}
              title={item.title}
              category={item.category}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
