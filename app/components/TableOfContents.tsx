"use client";

import React, { useState, useMemo } from 'react';
import { Button } from 'caralstable';
import { useTranslation } from '@/app/context/LanguageContext';
import { extractLanguageContent } from '@/utils/multilingual-content';

interface TocItem {
  level: number;
  title: string;
  id: string;
}

export default function TableOfContents({ toc, rawContent }: { toc?: TocItem[], rawContent?: string }) {
  const { t, language } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);

  const activeToc = useMemo(() => {
    if (rawContent) {
      const activeText = extractLanguageContent(rawContent, language as 'es' | 'en');
      const items: TocItem[] = [];
      const headingRegex = /(?:^|\n)(#{2,3})\s+([^\n]+)/g;
      let match;
      while ((match = headingRegex.exec(activeText)) !== null) {
        const level = match[1].length;
        let title = match[2].trim();
        if (title.endsWith('\r')) title = title.slice(0, -1);

        const cleanTitle = title
          .replace(/[*_`]/g, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/!(?:icon|brand)-[\w-]+!/g, '')
          .trim();
        const id = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        items.push({ level, title: cleanTitle, id });
      }
      return items;
    }
    return toc || [];
  }, [rawContent, toc, language]);

  return (
    <aside
      className={`hidden lg:flex shrink-0 sticky top-[50px] transition-all duration-300 ease-in-out overflow-hidden flex-col ${isOpen ? 'w-[300px]' : 'w-[40px] items-end'
        }`}
    >
      <div className={`flex gap-2 items-center mb-4 ${!isOpen ? 'justify-end' : ''}`}>
        {isOpen && (
          <span className="font-semibold text-sm uppercase tracking-wider text-neutral-900 dark:text-white whitespace-nowrap">
            {t('docs.onThisPage', 'En esta página')}
          </span>
        )}
        <Button
          isIconButton
          iconName={isOpen ? 'chevronRigth' : 'chevronLeft'}
          variant={isOpen ? 'ghost' : 'info'}
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>

      {isOpen && (
        <div className="animate-fade-in">
          {activeToc.length === 0 ? (
            <p className="text-xs text-neutral-500">{t('docs.noSubtitles', 'No hay subtítulos.')}</p>
          ) : (
            <ul className="flex flex-col gap-2 border-l border-neutral-200 dark:border-neutral-800 text-[12px]">
              {activeToc.map((item, idx) => (
                <li
                  key={idx}
                  className={`${item.level === 3 ? 'pl-6' : 'pl-4'}`}
                >
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const element = document.getElementById(item.id);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className="text-neutral-800 hover:text-info-main! transition-all duration-200 ease-out hover:opacity-80 block py-0.5"
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </aside>
  );
}
