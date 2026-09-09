import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from 'caralstable';
import { CaralIcon, Brand } from 'iconcaral2';
import iconCategoriesData from '@/app/data/iconCategories.json';
import { useTranslation } from '@/app/context/LanguageContext';

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
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const categories: Category[] = iconCategoriesData;
  const [isBrand, setIsBrand] = useState(initialIsBrand);
  const visibleCategories = categories.filter(c => !isBrand || c.hasBrand);
  const [activeCategory, setActiveCategory] = useState<string>(visibleCategories[0]?.category || 'General');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(initialIconName);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedIcon(initialIconName);
      setIsBrand(initialIsBrand);
      setSearchQuery('');
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
      const allIcons = Array.from(new Set(visibleCategories.flatMap(c => c.icons)));
      icons = allIcons.filter(icon => icon.toLowerCase().includes(searchQuery.toLowerCase()));
    } else {
      const cat = visibleCategories.find(c => c.category === activeCategory);
      icons = cat ? cat.icons : [];
    }
    return icons;
  }, [searchQuery, activeCategory, visibleCategories]);

  const handleConfirm = () => {
    onSelect(selectedIcon, isBrand);
    onClose();
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Custom del Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
            {t('iconPicker.title', 'Seleccionar Ícono')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <CaralIcon name="x" size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col h-[600px]">
          {/* Header / Filtros */}
          <div className="flex flex-col gap-4 mb-4 shrink-0">
            {/* Categorías (Tabs seguras con type="button") */}
            <div className="w-full overflow-x-auto scrollbar-thin pb-2">
              <div className="bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-lg inline-flex gap-1">
                {visibleCategories.map((cat) => {
                  const isActive = cat.category === activeCategory;
                  return (
                    <button
                      key={cat.category}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveCategory(cat.category);
                        setSearchQuery('');
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium font-poppins transition-all duration-200 cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm font-semibold'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60'
                      }`}
                    >
                      {cat.category}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Búsqueda */}
            <div className="relative">
              <span className="absolute left-3 top-3 -translate-y-1/2 text-neutral-600">
                <CaralIcon name="search" size={16} />
              </span>
              <input
                type="text"
                placeholder={t('iconPicker.searchPlaceholder', 'Buscar ícono...')}
                value={searchQuery}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Grid de Íconos */}
          <div className="flex-1 overflow-y-auto border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 bg-neutral-50/50 dark:bg-neutral-900/50">
            {displayedIcons.length === 0 ? (
              <div className="h-full flex items-center justify-center text-neutral-500 text-sm">
                {t('iconPicker.noIconsFound', 'No se encontraron íconos.')}
              </div>
            ) : (
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-3">
                {displayedIcons.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedIcon(prev => (prev === icon ? '' : icon));
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg gap-2 transition-all cursor-pointer ${
                      selectedIcon === icon
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
            {/* Toggle con button explícito type="button" para evitar submits accidentales */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsBrand(!isBrand);
              }}
              className="inline-flex items-center gap-3 cursor-pointer select-none group"
            >
              <div className={`relative inline-block w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${isBrand ? 'bg-seidor-main' : 'bg-neutral-300 dark:bg-neutral-700'}`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ease-in-out transform ${isBrand ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
              <span className="font-poppins text-xs font-medium text-neutral-700 dark:text-neutral-300">
                {isBrand ? t('iconPicker.colorMode', 'Modo Color (Brand)') : t('iconPicker.monoMode', 'Modo Monocromático')}
              </span>
            </button>

            <div className="flex items-center gap-2">
              {Boolean(selectedIcon || initialIconName) && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSelectedIcon('');
                    onSelect('', false);
                    onClose();
                  }}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs"
                >
                  {t('iconPicker.remove', 'Quitar ícono')}
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={onClose}>
                {t('iconPicker.cancel', 'Cancelar')}
              </Button>
              <Button type="button" variant="info" onClick={handleConfirm} disabled={!selectedIcon}>
                {t('iconPicker.confirm', 'Confirmar')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
