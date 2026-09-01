'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, width?: string) => void;
  showWidthSelector?: boolean;
}

export const MediaLibraryModal: React.FC<MediaLibraryModalProps> = ({ isOpen, onClose, onSelect, showWidthSelector }) => {
  const [images, setImages] = useState<{ name: string; url: string }[]>([]);
  const [selectedWidth, setSelectedWidth] = useState('1/3');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      loadImages();
    }
  }, [isOpen]);

  const loadImages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('portal-assets')
        .list('assets/docs', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) {
        console.error('Error cargando imágenes:', error);
        return;
      }

      const imageUrls = data
        .filter(file => file.name !== '.emptyFolderPlaceholder')
        .map(file => {
          const { data: { publicUrl } } = supabase.storage
            .from('portal-assets')
            .getPublicUrl(`assets/docs/${file.name}`);
          return {
            name: file.name,
            url: publicUrl,
          };
        });

      setImages(imageUrls);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden border border-neutral-200 dark:border-neutral-700">
        <div className="flex justify-between items-center p-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold dark:text-white">Galería de Medios</h2>
            {showWidthSelector && (
              <select
                className="border border-neutral-300 dark:border-neutral-700 rounded-md px-2 py-1 bg-white dark:bg-neutral-800 text-sm text-neutral-800 dark:text-neutral-200"
                value={selectedWidth}
                onChange={(e) => setSelectedWidth(e.target.value)}
              >
                <option value="1/4">Imagen 25% - Texto 75%</option>
                <option value="1/3">Imagen 33% - Texto 66%</option>
                <option value="1/2">Imagen 50% - Texto 50%</option>
                <option value="2/3">Imagen 66% - Texto 33%</option>
                <option value="3/4">Imagen 75% - Texto 25%</option>
              </select>
            )}
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <span className="text-neutral-500">Cargando...</span>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center text-neutral-500 py-12">
              No hay imágenes subidas en assets/docs aún.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((img, i) => (
                <div 
                  key={i}
                  onClick={() => {
                    onSelect(img.url, selectedWidth);
                    onClose();
                  }}
                  className="group relative aspect-square border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden cursor-pointer hover:border-orange-500 transition-colors"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={img.url} 
                    alt={img.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
