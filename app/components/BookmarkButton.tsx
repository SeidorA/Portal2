'use client';

import React, { useEffect, useState } from 'react';
import { CaralIcon } from 'iconcaral2';
import { useTranslation } from '@/app/context/LanguageContext';

export interface FavoriteItem {
  id?: string;
  url: string;
  title: string;
  category: 'Base de Conocimientos' | 'Documentos A4' | string;
  icon?: string;
  createdAt: number;
}

const STORAGE_KEY = 'portal_favorites';

export function getFavorites(): FavoriteItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isFavorite(url: string): boolean {
  const items = getFavorites();
  return items.some((i) => i.url === url);
}

export function toggleFavorite(item: Omit<FavoriteItem, 'createdAt'>): boolean {
  try {
    let items = getFavorites();
    const exists = items.some((i) => i.url === item.url);

    if (exists) {
      items = items.filter((i) => i.url !== item.url);
    } else {
      items.unshift({
        ...item,
        createdAt: Date.now(),
      });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('favorites_updated', { detail: items }));
    return !exists;
  } catch (err) {
    console.error('Error toggling favorite:', err);
    return false;
  }
}

interface BookmarkButtonProps {
  url: string;
  title: string;
  category?: 'Base de Conocimientos' | 'Documentos A4' | string;
  icon?: string;
  className?: string;
  size?: number;
  showText?: boolean;
}

export default function BookmarkButton({
  url,
  title,
  category = 'Base de Conocimientos',
  icon = 'bookmark',
  className = '',
  size = 18,
  showText = false,
}: BookmarkButtonProps) {
  const { t } = useTranslation();
  const [bookmarked, setBookmarked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setBookmarked(isFavorite(url));

    const handleUpdate = () => {
      setBookmarked(isFavorite(url));
    };

    window.addEventListener('favorites_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('favorites_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [url]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = toggleFavorite({ url, title, category, icon });
    setBookmarked(newState);
  };

  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        className={`p-2 rounded-lg text-neutral-400 opacity-50 cursor-pointer ${className}`}
      >
        <CaralIcon name="bookmark" size={size} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={
        bookmarked
          ? t('bookmarks.remove', 'Quitar de favoritos')
          : t('bookmarks.add', 'Guardar en favoritos')
      }
      className={`group flex items-center gap-1.5 p-2 rounded-lg transition-all duration-200 cursor-pointer ${bookmarked
        ? 'text-warning-main hover:text-warning-dark bg-warning-light'
        : 'bg-transparent text-neutral-800 hover:text-neutral-900 hover:bg-neutral-100'
        } ${className}`}
    >
      <div className={`transition-transform duration-200 ${bookmarked ? 'scale-110 text-danger-main' : 'group-hover:scale-105'}`}>
        <CaralIcon name="bookmark" size={size} />
      </div>
      {showText && (
        <span className="text-xs font-medium">
          {bookmarked
            ? t('bookmarks.saved', 'Guardado')
            : t('bookmarks.save', 'Guardar')}
        </span>
      )}
    </button>
  );
}
