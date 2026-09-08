'use client';

import React from 'react';
import { useTranslation } from '@/app/context/LanguageContext';

export default function DashboardGreeting({ userName }: { userName?: string }) {
  const { t } = useTranslation();
  const displayName = userName || t('dashboard.defaultUser', 'Usuario');

  return (
    <div className="mb-8">
      <h1 className="text-[32px] text-neutral-900 dark:text-white font-poppins font-bold">
        {t('dashboard.hello', 'Hola')}, {displayName} 👋
      </h1>
      <p className="text-p text-neutral-600 dark:text-neutral-400 font-poppins mt-2">
        {t('dashboard.welcomeMessage', 'Bienvenido a tu panel principal. Desde aquí puedes acceder rápidamente a todas las soluciones y herramientas que tenemos para ti.')}
      </p>
    </div>
  );
}
