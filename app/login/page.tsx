'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { login } from './actions';
import { Button } from 'caralstable';
import { CaralIcon } from 'iconcaral2';
import LoginMicrosoftButton from '@/app/components/LoginMicrosoftButton';
import { useSearchParams } from 'next/navigation';

function LoginContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      const isDark =
        document.documentElement.classList.contains('dark') ||
        localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDarkMode(isDark);
    };

    checkTheme();

    // Observer para escuchar cuando cambia la clase .dark en <html>
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Escuchar cambios de preferencia del sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkTheme);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', checkTheme);
    };
  }, []);

  return (
    <div className="w-full min-h-screen h-full flex flex-col lg:!flex-row bg-container overflow-y-auto lg:overflow-hidden">
      {/* Columna Derecha: Ilustración Visual (Desktop) */}
      <div className="hidden lg:!flex lg:w-1/2 relative bg-[url('/img/login/login.png')] dark:bg-[url('/img/login/loginDark.png')] bg-no-repeat bg-cover bg-center"></div>

      {/* Columna Izquierda: Formulario de Login */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-16 max-w-2xl mx-auto w-full">
        {/* Top: Logo */}
        <div>
          <Link href="/" className="inline-flex items-center gap-2 group mb-8 sm:mb-12">
            <img
              src={isDarkMode ? "/portalDark.png" : "/portalLigth.png"}
              alt="Portal Seidor"
              className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105 duration-200"
            />
          </Link>
        </div>

        {/* Center: Formulario */}
        <div className="w-full max-w-md mx-auto my-auto py-6">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-poppins font-bold text-neutral-900 dark:text-white tracking-tight">
              Iniciar Sesión
            </h1>
            <p className="text-sm text-neutral-800 mt-2 font-poppins leading-relaxed">
              Bienvenido al ecosistema de SEIDOR Analytics. Accede con tus credenciales para continuar.
            </p>
          </div>

          <form action={login} className="flex flex-col w-full">
            {/* Botón Microsoft */}
            <LoginMicrosoftButton />

            {/* Separador */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-container px-3 text-neutral-800 font-medium font-poppins">
                  o con credenciales locales
                </span>
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5 mb-4">
              <label
                className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-poppins"
                htmlFor="email"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="nombre@seidor.com"
                className="w-full rounded-xl px-4 py-3  border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder:text-neutral-400 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-info-main focus:border-transparent transition-all"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5 mb-6">
              <label
                className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-poppins"
                htmlFor="password"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••••••"
                className="w-full rounded-xl px-4 py-3  border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder:text-neutral-400 font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-info-main focus:border-transparent transition-all"
              />
            </div>

            {/* Botón de Enviar */}
            <Button
              variant="info"
              className="w-full justify-center h-12 rounded-xl text-sm font-semibold shadow-sm mt-1"
            >
              Entrar con Email
            </Button>

            {/* Mensajes de error o aviso */}
            {message && (
              <div className="mt-4 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-xl text-center font-medium font-poppins flex items-center justify-center gap-2">
                <CaralIcon name="info" size={16} />
                <span>{message}</span>
              </div>
            )}
          </form>
        </div>

        {/* Bottom: Footer */}
        <div className="pt-6 border-t border-neutral-100 dark:border-neutral-100/80 flex items-center justify-between text-xs text-neutral-800 font-poppins mt-auto">
          <Link
            href="/"
            className="hover:text-info-main transition-colors flex items-center gap-1.5 py-1"
          >
            <CaralIcon name="chevronLeft" size={14} />
            <span>Volver al inicio</span>
          </Link>
          <span>© {new Date().getFullYear()} SEIDOR Analytics</span>
        </div>
      </div>


    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
