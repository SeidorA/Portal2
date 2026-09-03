'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function LoginMicrosoftButton() {
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
      setError(err.message || 'Error al iniciar sesión con Microsoft');
      setLoading(false);
    } finally {
      // Si no hubo redirección inmediata, liberamos el botón
      setTimeout(() => setLoading(false), 3000);
    }
  };

  return (
    <div className="w-full my-3">
      <button
        type="button"
        onClick={handleLogin}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '12px 24px',
          backgroundColor: '#0078d4',
          color: '#ffffff',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '15px',
          fontWeight: '600',
          width: '100%',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
          transition: 'background-color 0.2s, opacity 0.2s',
          opacity: loading ? 0.7 : 1,
        }}
        onMouseOver={(e) => {
          if (!loading) e.currentTarget.style.backgroundColor = '#005a9e';
        }}
        onMouseOut={(e) => {
          if (!loading) e.currentTarget.style.backgroundColor = '#0078d4';
        }}
      >
        {loading ? (
          <span>Conectando con Microsoft...</span>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0H10V10H0V0Z" fill="#F25022" />
              <path d="M11 0H21V10H11V0Z" fill="#7FBA00" />
              <path d="M0 11H10V21H0V11Z" fill="#00A4EF" />
              <path d="M11 11H21V21H11V11Z" fill="#FFB900" />
            </svg>
            <span>Iniciar sesión con Microsoft</span>
          </>
        )}
      </button>
      {error && (
        <div className="p-3 mt-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md text-center font-medium">
          {error}
        </div>
      )}
    </div>
  );
}
