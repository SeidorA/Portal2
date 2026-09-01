import React, { useState, useEffect } from 'react';
import { Button, Tabs, Toggle } from 'caralstable';
import { CaralIcon, Brand } from 'iconcaral2';
import iconCategoriesData from '@/app/data/iconCategories.json';

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (iconName: string, isBrand: boolean) => void;
  initialIconName?: string;
  initialIsBrand?: boolean;
}

interface Category {
  category: string;
  hasBrand?: boolean;
  icons: string[];
}

export default function IconPickerModal({
  isOpen,
  onClose,
  onSelect,
  initialIconName = '',
  initialIsBrand = false,
}: IconPickerModalProps) {
  const categories: Category[] = iconCategoriesData;
  const [isBrand, setIsBrand] = useState(initialIsBrand);
  const visibleCategories = categories.filter(c => !isBrand || c.hasBrand);
  const [activeCategory, setActiveCategory] = useState<string>(visibleCategories[0]?.category || 'General');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(initialIconName);

  useEffect(() => {
    if (isOpen) {
      setSelectedIcon(initialIconName);
      setIsBrand(initialIsBrand);
      setSearchQuery('');
      // The activeCategory will be updated by the next effect if needed
    }
  }, [isOpen, initialIconName, initialIsBrand]);

  useEffect(() => {
    if (!visibleCategories.find(c => c.category === activeCategory)) {
      setActiveCategory(visibleCategories[0]?.category || '');
    }
  }, [isBrand, visibleCategories, activeCategory]);

  const displayedIcons = React.useMemo(() => {
    let icons: string[] = [];
    if (searchQuery.trim()) {
      // Si hay búsqueda, buscamos en todas las categorías visibles
      const allIcons = Array.from(new Set(visibleCategories.flatMap(c => c.icons)));
      icons = allIcons.filter(icon => icon.toLowerCase().includes(searchQuery.toLowerCase()));
    } else {
      // Filtramos por categoría activa
      const cat = visibleCategories.find(c => c.category === activeCategory);
      icons = cat ? cat.icons : [];
    }
    return icons;
  }, [searchQuery, activeCategory, visibleCategories]);

  const handleConfirm = () => {
    onSelect(selectedIcon, isBrand);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header Custom del Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Seleccionar Ícono</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-white rounded-lg transition-colors"
          >
            <CaralIcon name="x" size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col h-[600px]">
          {/* Header / Filtros */}
          <div className="flex flex-col gap-4 mb-4 shrink-0">
            {/* Categorías (Tabs) */}
            <div className="w-full overflow-x-auto scrollbar-thin pb-2">
              <Tabs
                tabs={visibleCategories.map(cat => ({ label: cat.category }))}
                activeIndex={visibleCategories.findIndex(c => c.category === activeCategory) >= 0 ? visibleCategories.findIndex(c => c.category === activeCategory) : 0}
                onChange={(index) => {
                  setActiveCategory(visibleCategories[index].category);
                  setSearchQuery('');
                }}
              />
            </div>

            {/* Búsqueda */}
            <div className="relative">
              <span className="absolute left-3 top-3 -translate-y-1/2 text-neutral-600">
                <CaralIcon name="search" size={16} />
              </span>
              <input
                type="text"
                placeholder="Buscar ícono..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Grid de Íconos */}
          <div className="flex-1 overflow-y-auto border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 bg-neutral-50/50 dark:bg-neutral-900/50">
            {displayedIcons.length === 0 ? (
              <div className="h-full flex items-center justify-center text-neutral-500 text-sm">
                No se encontraron íconos.
              </div>
            ) : (
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-3">
                {displayedIcons.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setSelectedIcon(icon)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg gap-2 transition-all ${selectedIcon === icon
                      ? 'bg-blue-100 dark:bg-blue-900/40 ring-2 ring-blue-500 text-blue-600 dark:text-blue-400'
                      : 'bg-white dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800'
                      }`}
                    title={icon}
                  >
                    {isBrand ? (
                      <Brand name={icon as any} size={24} />
                    ) : (
                      <CaralIcon name={icon as any} size={24} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer (Toggle & Botones) */}
          <div className="flex items-center justify-between mt-6 shrink-0 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <Toggle
              checked={isBrand}
              onChange={setIsBrand}
              label={isBrand ? 'Modo Color (Brand)' : 'Modo Monocromático'}
            />

            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button type="button" variant="info" onClick={handleConfirm} disabled={!selectedIcon}>
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
