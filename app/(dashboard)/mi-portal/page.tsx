'use client';

import React from 'react';
import Link from 'next/link';
import { Brand, CaralIcon } from 'iconcaral2';
import { Button } from 'caralstable';
import { useTranslation } from '@/app/context/LanguageContext';

export default function MiPortalPage() {
  const { t } = useTranslation();

  const suggestedQuestions = [
    t('myPortal.prompt1', '¿Dónde encuentro la documentación oficial de Crestone?'),
    t('myPortal.prompt2', '¿Cómo genero un Personal Access Token para la API?'),
    t('myPortal.prompt3', '¿Cómo puedo solicitar un cambio de rol o permisos?'),
    t('myPortal.prompt4', '¿Cómo crear y exportar un documento A4?'),
  ];

  return (
    <div className="w-full min-h-[82vh] flex items-center justify-center p-4">
      <div className="relative max-w-2xl w-full flex flex-col items-center">
        {/* Glow ambient effects */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-80 bg-purple-500/20 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-10 w-48 h-48 bg-blue-500/15 dark:bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

        {/* Card Container */}
        <div className="relative z-10 w-full p-8 sm:p-10 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white/85 dark:bg-neutral-900/75 backdrop-blur-xl shadow-xl flex flex-col items-center gap-6 text-center">

          {/* Daiana Brand Avatar */}
          <div className="relative flex items-center justify-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-purple-600/20 via-indigo-600/20 to-blue-600/20 dark:from-purple-500/25 dark:via-indigo-500/25 dark:to-blue-500/25 border border-purple-500/40 flex items-center justify-center shadow-lg shadow-purple-500/10 rotate-1">
              <Brand name="Daiana" size={48} />
            </div>
            {/* Live AI Pulse Indicator */}
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-purple-600"></span>
            </span>
          </div>

          {/* Under Construction & AI Badge */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/60 font-poppins">
              <CaralIcon name="wrench" size={13} />
              <span>{t('myPortal.inConstruction', 'En construcción')}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60 font-poppins">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span>{t('myPortal.aiAssistant', 'Asistente IA Daiana')}</span>
            </div>
          </div>

          {/* Title & Description */}
          <div className="flex flex-col gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-neutral-900 dark:text-white">
              {t('myPortal.title', 'Mi Portal con Daiana')}
            </h1>
            <p className="text-sm sm:text-base text-neutral-8 font-poppins leading-relaxed max-w-lg mx-auto">
              {t(
                'myPortal.description',
                'Muy pronto tendrás a tu disposición un chat inteligente impulsado por Daiana, entrenado exclusivamente para resolver consultas, buscar información y guiarte paso a paso en el portal.'
              )}
            </p>
          </div>

          {/* Chat Preview / Sample prompts */}
          <div className="w-full flex flex-col gap-3 pt-2 text-left">
            <span className="text-xs font-semibold text-neutral-800  font-poppins px-1">
              {t('myPortal.sampleQuestionsTitle', 'Preguntas que podrás hacerle:')}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {suggestedQuestions.map((prompt, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/30 flex items-center gap-2.5 text-xs text-neutral-700 dark:text-neutral-300 font-poppins"
                >
                  <div className="text-purple-500 shrink-0">
                    <CaralIcon name="message" size={14} />
                  </div>
                  <span className="truncate">{prompt}</span>
                </div>
              ))}
            </div>

            {/* Mock Chat Input preview */}
            <div className="mt-2 w-full p-2.5 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-100/50 dark:bg-neutral-800/20 flex items-center justify-between gap-3 text-neutral-800 font-poppins">
              <div className="flex items-center gap-2 px-2">
                <CaralIcon name="edit" size={14} />
                <span>{t('myPortal.inputPlaceholder', 'Escribe tu consulta para Daiana... (Próximamente)')}</span>
              </div>
              <div className="p-1.5 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400">
                <CaralIcon name="plane" size={14} />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/dashboard">
              <Button variant="info" className="cursor-pointer font-medium px-5">
                <CaralIcon name="house" size={16} />
                <span className="ml-2">{t('myPortal.backHome', 'Volver al Inicio')}</span>
              </Button>
            </Link>
            <Link href="/documentacion/intro">
              <Button variant="ghost" className="cursor-pointer font-medium px-4">
                <CaralIcon name="book" size={16} />
                <span className="ml-2">{t('myPortal.goToDocs', 'Explorar Documentación')}</span>
              </Button>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
