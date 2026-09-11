'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from 'caralstable';
import { CaralIcon } from 'iconcaral2';
import { useTranslation } from '@/app/context/LanguageContext';
import { Locale } from '@/app/locales';

interface CustomSelectOption {
  value: string;
  label: string;
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  className = '',
}: {
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl border border-[#8A99AD] dark:border-neutral-600 bg-container text-left font-poppins text-neutral-900 dark:text-neutral-100 shadow-2xs hover:border-[#64748B] focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all cursor-pointer"
        style={{ minHeight: '52px' }}
      >
        <span className="text-base sm:text-[17px] font-normal truncate">
          {selectedOption ? selectedOption.label : placeholder || 'Seleccionar...'}
        </span>
        <div
          className={`text-neutral-700 dark:text-neutral-300 transition-transform duration-200 shrink-0 ml-3 ${isOpen ? 'rotate-180' : ''
            }`}
        >
          <CaralIcon name="chevronDown" size={18} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-container shadow-xl py-1.5 overflow-hidden animate-fade-in max-h-60 overflow-y-auto">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-5 py-3 text-left font-poppins text-sm sm:text-base transition-colors cursor-pointer ${isSelected
                  ? 'bg-blue-50/30 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-neutral-800 dark:text-neutral-200 hover:bg-neutral-300'
                  }`}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ProfilePreferencesTab({
  user,
  allowedScreens = [],
}: {
  user: any;
  allowedScreens?: { id: string; title: string }[];
}) {
  const { language, setLanguage, t } = useTranslation();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const meta = user?.user_metadata || {};

  const [formData, setFormData] = useState({
    default_screen: meta.default_screen || 'dashboard',
    language: (language || meta.language || 'es') as Locale,
    theme: meta.theme || (typeof window !== 'undefined' ? (localStorage.getItem('theme') || 'system') : 'system'),
    roadmap_view:
      meta.roadmap_view ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('roadmap_preferred_view') || 'cards'
        : 'cards'),
  });

  useEffect(() => {
    if (language && formData.language !== language) {
      setFormData((prev) => ({ ...prev, language }));
    }
  }, [language]);

  const savePreferences = async (updatedData: Partial<typeof formData>) => {
    setLoading(true);
    setSuccessMsg('');
    try {
      const merged = { ...formData, ...updatedData };
      setFormData(merged);

      if (updatedData.roadmap_view && typeof window !== 'undefined') {
        localStorage.setItem('roadmap_preferred_view', updatedData.roadmap_view);
      }

      const { error } = await supabase.auth.updateUser({
        data: {
          default_screen: merged.default_screen,
          language: merged.language,
          theme: merged.theme,
          roadmap_view: merged.roadmap_view,
        },
      });

      if (error) throw error;
      setSuccessMsg(t('profile.preferencesSaved', 'Preferencias guardadas'));
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (err: any) {
      console.error('Error saving preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang as Locale);
    savePreferences({ language: newLang as Locale });
  };

  const handleThemeChange = (newTheme: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
      const isDark = newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    savePreferences({ theme: newTheme });
  };

  const handleScreenChange = (screenId: string) => {
    savePreferences({ default_screen: screenId });
  };

  const handleRoadmapChange = (viewId: string) => {
    savePreferences({ roadmap_view: viewId });
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      setPasswordMsg({ text: t('profile.enterNewPasswordError', 'Por favor ingresa la nueva contraseña.'), type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ text: t('profile.passwordLengthError', 'La contraseña debe tener al menos 6 caracteres.'), type: 'error' });
      return;
    }

    setUpdatingPassword(true);
    setPasswordMsg(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword.trim(),
      });

      if (error) throw error;

      setPasswordMsg({ text: t('profile.passwordUpdatedSuccess', '¡Contraseña actualizada correctamente!'), type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPasswordMsg(null), 3500);
    } catch (err: any) {
      setPasswordMsg({ text: err.message || 'Error al actualizar la contraseña', type: 'error' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const getScreenTitle = (screen: { id: string; title: string }) => {
    switch (screen.id) {
      case 'perfil':
        return t('sidebar.profile', 'Perfil');
      case 'dashboard':
        return `${t('sidebar.home', 'Inicio')} / Dashboard`;
      case 'oportunidades':
        return t('sidebar.opportunities', 'Oportunidades');
      case 'usuarios':
        return t('sidebar.users', 'Usuarios');
      case 'roles':
        return t('sidebar.roles', 'Roles');
      case 'contenido':
        return t('sidebar.content', 'Contenido');
      case 'productos':
        return t('sidebar.products', 'Productos');
      case 'configuracion':
        return t('sidebar.settings', 'Configuración');
      case 'tickets':
        return t('sidebar.tickets', 'Tickets');
      case 'developer-settings':
        return t('sidebar.developerSettings', 'Developer Settings');
      case 'docs':
        return t('profile.tabDocuments', 'Base de Conocimientos');
      case 'documentos':
        return t('sidebar.documents', 'Documentos A4');
      default:
        return screen.title;
    }
  };

  // Fallback screens if allowedScreens is empty
  const defaultScreenOptions = [
    { id: 'dashboard', title: 'Inicio / Dashboard' },
    { id: 'perfil', title: 'Perfil' },
    { id: 'docs', title: 'Base de Conocimientos' },
    { id: 'documentos', title: 'Documentos A4' },
    { id: 'oportunidades', title: 'Oportunidades' },
    { id: 'productos', title: 'Productos' },
  ];

  const screensToDisplay = allowedScreens.length > 0 ? allowedScreens : defaultScreenOptions;

  const languageOptions: CustomSelectOption[] = [
    { value: 'es', label: t('common.spanish', 'Español') },
    { value: 'en', label: t('common.english', 'English') },
  ];

  const themeOptions: CustomSelectOption[] = [
    { value: 'light', label: t('profile.themeLight', 'Claro') },
    { value: 'dark', label: t('profile.themeDark', 'Oscuro') },
    { value: 'system', label: t('profile.themeSystem', 'Sistema') },
  ];

  const screenOptions: CustomSelectOption[] = screensToDisplay.map((screen) => ({
    value: screen.id,
    label: getScreenTitle(screen),
  }));

  const roadmapOptions: CustomSelectOption[] = [
    { value: 'cards', label: t('profile.viewCards', 'Tarjetas') },
    { value: 'timeline', label: t('profile.viewTimeline', 'Línea de tiempo (Timeline)') },
    { value: 'kanban', label: t('profile.viewKanban', 'Tablero Kanban') },
    { value: 'list', label: t('profile.viewList', 'Lista detallada') },
  ];

  return (
    <div className="flex flex-col gap-8 w-full text-neutral-900 dark:text-white">
      {/* 1. Top Row: Idioma & Preferencia de Tema */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block font-poppins text-lg font-normal text-neutral-900 dark:text-white mb-2">
            {t('profile.languageLabel', 'Idioma')}
          </label>
          <CustomSelect
            value={formData.language}
            onChange={handleLanguageChange}
            options={languageOptions}
          />
        </div>

        <div>
          <label className="block font-poppins text-lg font-normal text-neutral-900 dark:text-neutral-100 mb-2">
            {t('profile.themeLabel', 'Preferencia de tema')}
          </label>
          <CustomSelect
            value={formData.theme}
            onChange={handleThemeChange}
            options={themeOptions}
          />
        </div>
      </div>

      {/* 2. Pantalla de inicio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-2">
        <div>
          <h3 className="font-poppins font-bold text-xl text-neutral-900 dark:text-white">
            {t('profile.homeScreenTitle', 'Pantalla de inicio')}
          </h3>
          <p className="text-sm text-neutral-800 dark:text-neutral-400 mt-1 max-w-sm leading-relaxed">
            {t('profile.homeScreenSubtitle', 'Seleccione la pantalla que este grupo verá como predeterminada al momento de ingresar a Daina.')}
          </p>
        </div>

        <div>
          <label className="block font-poppins text-lg font-normal text-neutral-900 dark:text-neutral-100 mb-2">
            {t('profile.screenLabel', 'Pantalla')}
          </label>
          <CustomSelect
            value={formData.default_screen}
            onChange={handleScreenChange}
            options={screenOptions}
          />
        </div>
      </div>

      {/* 3. Vista de Roadmap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-2">
        <div>
          <h3 className="font-poppins font-bold text-xl text-neutral-900 dark:text-white">
            {t('profile.roadmapViewTitle', 'Vista de Roadmap')}
          </h3>
          <p className="text-sm text-neutral-800 dark:text-neutral-400 mt-1 max-w-sm leading-relaxed">
            {t('profile.roadmapViewSubtitle', 'Seleccione la vista que usted prefiera para visualizar los roadmaps. siempre puede cambiar las preferencias.')}
          </p>
        </div>

        <div>
          <label className="block font-poppins text-lg font-normal text-neutral-900 dark:text-neutral-100 mb-2">
            {t('profile.viewLabel', 'Vista')}
          </label>
          <CustomSelect
            value={formData.roadmap_view}
            onChange={handleRoadmapChange}
            options={roadmapOptions}
          />
        </div>
      </div>

      {/* 4. Sección Seguridad */}
      <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 flex flex-col gap-4">
        <div>
          <h3 className="font-poppins font-bold text-2xl text-neutral-900 dark:text-white">
            {t('profile.securityTitle', 'Seguridad')}
          </h3>
          <p className="text-sm text-neutral-800 dark:text-neutral-400 mt-1">
            {t('profile.securitySubtitle', 'Gestione sus claves y llaves de acceso.')}
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="flex flex-col sm:flex-row items-end gap-3 w-full">
          {/* Contraseña actual */}
          <div className="flex-1 w-full">
            <label className="block font-poppins text-sm font-normal text-neutral-800 dark:text-neutral-200 mb-1.5">
              {t('profile.currentPasswordLabel', 'Contraseña actual')}
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder={t('profile.currentPasswordPlaceholder', 'Contraseña actual')}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-5 py-3.5 rounded-xl border border-[#8A99AD] dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-poppins text-sm sm:text-base placeholder:text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all pr-12 shadow-2xs"
                style={{ minHeight: '52px' }}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer p-1"
                title={showCurrentPassword ? t('profile.hidePassword', 'Ocultar') : t('profile.showPassword', 'Mostrar')}
              >
                <CaralIcon name={showCurrentPassword ? 'eyeSlash' : 'eye'} size={18} />
              </button>
            </div>
          </div>

          {/* Nueva contraseña */}
          <div className="flex-1 w-full">
            <label className="block font-poppins text-sm font-normal text-neutral-800 dark:text-neutral-200 mb-1.5">
              {t('profile.newPasswordLabel', 'Nueva contraseña')}
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder={t('profile.newPasswordPlaceholder', 'Nueva contraseña')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-5 py-3.5 rounded-xl border border-[#8A99AD] dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-poppins text-sm sm:text-base placeholder:text-neutral-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all pr-12 shadow-2xs"
                style={{ minHeight: '52px' }}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer p-1"
                title={showNewPassword ? t('profile.hidePassword', 'Ocultar') : t('profile.showPassword', 'Mostrar')}
              >
                <CaralIcon name={showNewPassword ? 'eyeSlash' : 'eye'} size={18} />
              </button>
            </div>
          </div>

          {/* Botón Actualizar */}
          <Button
            variant="danger"
            hasBorder
            style={{
              minHeight: '52px',
            }}
          >
            {updatingPassword ? t('profile.updatingPasswordButton', 'Actualizando...') : t('profile.updatePasswordButton', 'Actualizar')}
          </Button>

        </form>

        {passwordMsg && (
          <p
            className={`text-xs mt-1 animate-fade-in ${passwordMsg.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}
          >
            {passwordMsg.text}
          </p>
        )}
      </div>
    </div>
  );
}
