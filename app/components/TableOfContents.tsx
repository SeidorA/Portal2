"use client";

import React, { useState } from 'react';
import { Button } from 'caralstable';

interface TocItem {
  level: number;
  title: string;
  id: string;
}

export default function TableOfContents({ toc }: { toc: TocItem[] }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside
      className={`hidden lg:flex shrink-0 sticky top-[50px] transition-all duration-300 ease-in-out overflow-hidden flex-col ${isOpen ? 'w-[300px]' : 'w-[40px] items-end'
        }`}
    >
      <div className={`flex gap-2 items-center mb-4 ${!isOpen ? 'justify-end' : ''}`}>
        {isOpen && (
          <span className="font-semibold text-sm uppercase tracking-wider text-neutral-900 dark:text-white whitespace-nowrap">
            En esta página
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
          {toc.length === 0 ? (
            <p className="text-xs text-neutral-500">No hay subtítulos.</p>
          ) : (
            <ul className="flex flex-col gap-2 border-l border-neutral-200 dark:border-neutral-800 text-[12px]">
              {toc.map((item, idx) => (
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
