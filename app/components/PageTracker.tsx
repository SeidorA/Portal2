'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export interface RecentlyViewedItem {
  url: string;
  title: string;
  category: string;
  icon?: string;
  visitedAt: number;
  durationSeconds: number;
}

const STORAGE_KEY = 'portal_recently_viewed';
const THRESHOLD_SECONDS = 20;

// Rutas del sistema o inicio que no deben registrarse como contenido visto recientemente
const IGNORED_PREFIXES = [
  '/dashboard',
  '/login',
  '/auth',
  '/api',
  '/print',
  '/_next',
  '/favicon.ico',
];

const ROUTE_CATEGORY_MAP: Record<string, { title: string; category: string; icon: string }> = {
  '/oportunidades': { title: 'Oportunidades', category: 'Gestión', icon: 'list' },
  '/usuarios': { title: 'Usuarios', category: 'Gestión', icon: 'users' },
  '/roles': { title: 'Roles y Permisos', category: 'Gestión', icon: 'gear' },
  '/contenido': { title: 'Gestor de Contenido', category: 'Gestión', icon: 'edit' },
  '/productos': { title: 'Productos', category: 'Gestión', icon: 'plus' },
  '/documentos': { title: 'Documentos A4 y Presentaciones', category: 'Documentos', icon: 'file' },
  '/perfil': { title: 'Perfil de Usuario', category: 'Preferencias', icon: 'user' },
  '/configuracion': { title: 'Configuración', category: 'Preferencias', icon: 'wrench' },
  '/developer-settings': { title: 'Developer Settings', category: 'Preferencias', icon: 'code' },
  '/sugerencias': { title: 'Sugerencias', category: 'Ayuda', icon: 'envelopeOpen' },
  '/mi-portal': { title: 'Mi portal', category: 'Ayuda', icon: 'Daiana' },
};

function getPageMetadata(pathname: string): { title: string; category: string; icon: string } {
  // Base de Conocimientos / Documentación (/docs o /documentacion)
  const heading = document.querySelector('h1, article h1, main h1')?.textContent?.trim();
  
  let fallbackTitle = 'Artículo de Documentación';
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length > 0) {
    const lastPart = parts[parts.length - 1];
    fallbackTitle = lastPart
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  const title = heading && heading.length > 2 && !heading.includes('Create Next App') 
    ? heading 
    : fallbackTitle;

  return {
    title,
    category: 'Base de Conocimientos',
    icon: 'book',
  };
}

function saveRecentlyViewed(item: RecentlyViewedItem) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let items: RecentlyViewedItem[] = raw ? JSON.parse(raw) : [];

    // Limpiar elementos que no pertenezcan a /docs o /documentacion
    items = items.filter((i) => i.url.startsWith('/docs') || i.url.startsWith('/documentacion'));

    // Remover ocurrencias previas de la misma URL para evitar duplicados
    items = items.filter((i) => i.url !== item.url);

    // Insertar la nueva visita al inicio
    items.unshift(item);

    // Guardar máximo 15 elementos en memoria local
    if (items.length > 15) {
      items = items.slice(0, 15);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('recently_viewed_updated', { detail: items }));
  } catch (err) {
    console.error('[PageTracker] Error guardando recientemente visto:', err);
  }
}

export default function PageTracker() {
  const pathname = usePathname();
  const currentPathRef = useRef<string>(pathname);
  const activeSecondsRef = useRef<number>(0);
  const hasSavedRef = useRef<boolean>(false);
  const isVisibleRef = useRef<boolean>(true);

  useEffect(() => {
    currentPathRef.current = pathname;
    activeSecondsRef.current = 0;
    hasSavedRef.current = false;

    // Solo rastrear rutas de documentación (/docs o /documentacion)
    const isDocPage = pathname && (pathname.startsWith('/docs') || pathname.startsWith('/documentacion'));
    if (!isDocPage) return;

    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Intervalo de 1 segundo para medir tiempo activo
    const interval = setInterval(() => {
      if (!isVisibleRef.current) return;

      activeSecondsRef.current += 1;

      // Al alcanzar el umbral de 20 segundos por primera vez en esta navegación
      if (activeSecondsRef.current >= THRESHOLD_SECONDS && !hasSavedRef.current) {
        hasSavedRef.current = true;
        const meta = getPageMetadata(pathname);
        saveRecentlyViewed({
          url: pathname,
          title: meta.title,
          category: meta.category,
          icon: meta.icon,
          visitedAt: Date.now(),
          durationSeconds: activeSecondsRef.current,
        });
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Si el usuario superó los 20 segundos antes de cambiar de página, actualizar la duración final
      if (hasSavedRef.current && activeSecondsRef.current >= THRESHOLD_SECONDS) {
        const meta = getPageMetadata(pathname);
        saveRecentlyViewed({
          url: pathname,
          title: meta.title,
          category: meta.category,
          icon: meta.icon,
          visitedAt: Date.now(),
          durationSeconds: activeSecondsRef.current,
        });
      }
    };
  }, [pathname]);

  return null;
}
