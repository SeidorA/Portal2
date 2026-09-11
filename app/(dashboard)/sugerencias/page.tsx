'use client';

import React from 'react';
import Link from 'next/link';
import { CaralIcon } from 'iconcaral2';
import { Button } from 'caralstable';
import { useTranslation } from '@/app/context/LanguageContext';

export default function SugerenciasPage() {
  const { t } = useTranslation();

  return (
    <div className="w-full min-h-[80vh] flex items-center justify-center p-4">
      <div className="relative max-w-xl w-full text-center flex flex-col items-center">
        {/* Glow effect */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/15 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Card Container */}
        <div className="relative z-10 w-full p-8 sm:p-10 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/70 backdrop-blur-xl shadow-xl flex flex-col items-center gap-6">
          {/* Icon Badge */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 dark:from-blue-500/20 dark:to-indigo-500/20 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
              <CaralIcon name="envelopeOpen" size={36} />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
            </span>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60 font-poppins">
            <CaralIcon name="wrench" size={13} />
            <span>{t('suggestions.inConstruction', 'En construcción')}</span>
          </div>

          {/* Texts */}
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-neutral-900 dark:text-white">
              {t('suggestions.title', 'Buzón de Sugerencias')}
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 font-poppins leading-relaxed max-w-md mx-auto">
              {t(
                'suggestions.description',
                'Estamos construyendo este espacio para que puedas compartir tus ideas, mejoras y sugerencias directamente con nuestro equipo.'
              )}
            </p>
          </div>

          {/* Future features list */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
            <div className="p-3.5 rounded-xl border border-neutral-200/60 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 flex items-start gap-2.5">
              <div className="text-blue-500 mt-0.5 shrink-0">
                <CaralIcon name="check" size={16} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 font-poppins">
                  {t('suggestions.feature1Title', 'Envío de feedback')}
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {t('suggestions.feature1Desc', 'Comenta sugerencias y reporta necesidades')}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-neutral-200/60 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 flex items-start gap-2.5">
              <div className="text-indigo-500 mt-0.5 shrink-0">
                <CaralIcon name="check" size={16} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 font-poppins">
                  {t('suggestions.feature2Title', 'Seguimiento de ideas')}
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {t('suggestions.feature2Desc', 'Visualiza el estado de tus propuestas')}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Link href="/dashboard">
              <Button variant="info" className="cursor-pointer font-medium px-5">
                <CaralIcon name="house" size={16} />
                <span className="ml-2">{t('suggestions.backHome', 'Volver al Inicio')}</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
