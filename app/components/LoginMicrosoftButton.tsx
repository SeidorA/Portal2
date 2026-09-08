'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useTranslation } from '@/app/context/LanguageContext';

export default function LoginMicrosoftButton() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback`;

      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'openid profile email',
          redirectTo,
        },
      });

      if (authError) throw authError;

      // Si Supabase devuelve la URL directamente, redirigimos
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Error al iniciar sesión con Microsoft:', err);
      setError(err.message || t('login.errorMicrosoft', 'Error al iniciar sesión con Microsoft'));
      setLoading(false);
    } finally {
      // Si no hubo redirección inmediata, liberamos el botón
      setTimeout(() => setLoading(false), 3000);
    }
  };

  return (
    <div className="w-full my-2">
      <button
        type="button"
        onClick={handleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-[#0072CA]! hover:bg-[#005ea6]! text-white! rounded-xl font-poppins font-medium text-sm transition-all duration-200 shadow-sm hover:shadow disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        style={{ backgroundColor: '#0072CA' }}
      >
        {loading ? (
          <span>{t('login.connectingMicrosoft', 'Conectando con Microsoft...')}</span>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <path d="M0 0H10V10H0V0Z" fill="#F25022" />
              <path d="M11 0H21V10H11V0Z" fill="#7FBA00" />
              <path d="M0 11H10V21H0V11Z" fill="#00A4EF" />
              <path d="M11 11H21V21H11V11Z" fill="#FFB900" />
            </svg>
            <span>{t('login.loginWithMicrosoft', 'Iniciar sesión con Microsoft')}</span>
          </>
        )}
      </button>
      {error && (
        <div className="p-3 mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-xl text-center font-medium">
          {error}
        </div>
      )}
    </div>
  );
}

