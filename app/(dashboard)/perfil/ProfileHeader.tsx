'use client';

import React from 'react';
import { useTranslation } from '@/app/context/LanguageContext';

export default function ProfileHeader() {
  const { t } = useTranslation();

  return (
    <div className="mb-12">
      <h1 className="text-4xl font-poppins font-extrabold text-neutral-900 dark:text-white mb-3 tracking-tight">
        {t('profile.title', 'Mi Perfil')}
      </h1>
      <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl leading-relaxed">
        {t('profile.subtitle', 'Actualiza tu información personal. Estos datos nos ayudan a identificar a qué empresa perteneces y cómo contactarte.')}
      </p>
    </div>
  );
}
