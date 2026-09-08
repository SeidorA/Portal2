"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from 'caralstable';
import { useTranslation } from '@/app/context/LanguageContext';

export function NovedadDetailBack() {
  const { t } = useTranslation();
  return (
    <Link href="/novedades">
      <Button variant="ghost" iconName="arrowLeft" className="w-fit">
        {t('news.backToNews', 'Volver a Novedades')}
      </Button>
    </Link>
  );
}

export function NovedadDate({
  date,
  className,
  style,
}: {
  date: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { language } = useTranslation();
  return (
    <time style={style} className={className}>
      {new Date(date).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}
    </time>
  );
}
