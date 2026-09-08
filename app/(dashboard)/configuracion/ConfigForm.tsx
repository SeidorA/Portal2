"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from 'caralstable';
import { useTranslation } from '@/app/context/LanguageContext';

import { Locale } from '@/app/locales';

export default function ConfigForm({ user, allowedScreens }: { user: any, allowedScreens: { id: string, title: string }[] }) {
  const { language, setLanguage, t } = useTranslation();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const meta = user.user_metadata || {};
  
  const [formData, setFormData] = useState({
    default_screen: meta.default_screen || 'dashboard',
    language: (language || meta.language || 'es') as Locale,
    theme: meta.theme || 'system',
    roadmap_view: meta.roadmap_view || (typeof window !== 'undefined' ? localStorage.getItem('roadmap_preferred_view') || 'timeline' : 'timeline'),
    full_name: meta.full_name || meta.name || meta.display_name || '',
    phone: meta.phone || meta.phone_number || '',
    company: meta.company || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Keep formData.language in sync if language context changes externally
  useEffect(() => {
    if (language && formData.language !== language) {
      setFormData(prev => ({ ...prev, language }));
    }
  }, [language]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as Locale;
    setFormData(prev => ({ ...prev, language: newLang }));
    setLanguage(newLang);
  };

  const getScreenTitle = (screen: { id: string, title: string }) => {
    switch (screen.id) {
      case 'dashboard': return t('settings.screenDashboard', screen.title);
      case 'oportunidades': return t('settings.screenOportunidades', screen.title);
      case 'usuarios': return t('settings.screenUsuarios', screen.title);
      case 'roles': return t('settings.screenRoles', screen.title);
      case 'contenido': return t('settings.screenContenido', screen.title);
      case 'productos': return t('settings.screenProductos', screen.title);
      case 'configuracion': return t('settings.screenConfiguracion', screen.title);
      case 'tickets': return t('settings.screenTickets', screen.title);
      case 'developer-settings': return t('settings.screenDeveloperSettings', screen.title);
      case 'docs': return t('settings.screenDocs', screen.title);
      case 'sugerencias': return t('settings.screenSugerencias', screen.title);
      case 'mi-portal': return t('settings.screenMiPortal', screen.title);
      default: return screen.title;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('roadmap_preferred_view', formData.roadmap_view);
      }

      // Update the user's raw_user_meta_data in Supabase Auth
      const { error } = await supabase.auth.updateUser({
        data: {
          default_screen: formData.default_screen,
          language: formData.language,
          theme: formData.theme,
          roadmap_view: formData.roadmap_view,
          full_name: formData.full_name,
          phone: formData.phone,
          company: formData.company
        }
      });

      if (error) throw error;
      setSuccessMsg(t('settings.successUpdate', '¡Configuración actualizada con éxito!'));
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error: any) {
      alert(t('settings.errorUpdate', 'Error al actualizar la configuración: ') + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-poppins font-extrabold text-neutral-900 dark:text-white tracking-tight">
          {t('settings.title', 'Configuración')}
        </h1>
        <p className="text-lg text-neutral-700 dark:text-neutral-100 leading-relaxed mb-2">
          {t('settings.subtitle', 'Administra tus preferencias de visualización y detalles de tu cuenta.')}
        </p>
      </div>

      <div className="bg-container rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          
          {/* SECCION A: Preferencias del Sistema */}
          <div>
            <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mb-4 border-b border-neutral-200 dark:border-neutral-700 pb-2">
              {t('settings.systemPreferences', 'Preferencias del Sistema')}
            </h2>
            <div className="flex flex-col gap-6">
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                  {t('settings.defaultScreen', 'Pantalla Principal (Redirección Inicial)')}
                </label>
                <select
                  name="default_screen"
                  value={formData.default_screen}
                  onChange={handleChange}
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit focus:ring-2 focus:ring-info-main/50 outline-none transition-all"
                >
                  {allowedScreens.map(screen => (
                    <option key={screen.id} value={screen.id}>
                      {getScreenTitle(screen)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-neutral-500 mt-1">
                  {t('settings.defaultScreenHelp', 'Esta será la pantalla a la que ingresarás por defecto al entrar al sistema.')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                    {t('settings.language', 'Idioma')}
                  </label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleLanguageChange}
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit focus:ring-2 focus:ring-info-main/50 outline-none transition-all"
                  >
                    <option value="es">{t('settings.langEs', 'Español')}</option>
                    <option value="en">{t('settings.langEn', 'English')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                    {t('settings.theme', 'Tema')}
                  </label>
                  <select
                    name="theme"
                    value={formData.theme}
                    onChange={handleChange}
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit focus:ring-2 focus:ring-info-main/50 outline-none transition-all"
                  >
                    <option value="system">{t('settings.themeSystem', 'Sistema')}</option>
                    <option value="light">{t('settings.themeLight', 'Claro')}</option>
                    <option value="dark">{t('settings.themeDark', 'Oscuro')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                  {t('settings.roadmapView', 'Vista de Roadmap Preferida')}
                </label>
                <select
                  name="roadmap_view"
                  value={formData.roadmap_view}
                  onChange={handleChange}
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit focus:ring-2 focus:ring-info-main/50 outline-none transition-all"
                >
                  <option value="timeline">{t('settings.roadmapTimeline', 'Línea de Tiempo (Predeterminada)')}</option>
                  <option value="cards">{t('settings.roadmapCards', 'Vista por Trimestre (Tarjetas)')}</option>
                </select>
                <p className="text-xs text-neutral-500 mt-1">
                  {t('settings.roadmapViewHelp', 'Cómo prefieres visualizar inicialmente los roadmaps en la documentación.')}
                </p>
              </div>
            </div>
          </div>

          {/* SECCION B: Perfil */}
          <div>
            <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mb-4 border-b border-neutral-200 dark:border-neutral-700 pb-2">
              {t('settings.userProfile', 'Perfil de Usuario')}
            </h2>
            <div className="flex flex-col gap-6">
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                  {t('settings.email', 'Correo Electrónico')}
                </label>
                <input
                  type="email"
                  readOnly
                  disabled
                  value={user.email}
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  {t('settings.emailHelp', 'El correo está vinculado a tu cuenta y no puede modificarse desde aquí.')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                  {t('settings.fullName', 'Nombre Completo')}
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit focus:ring-2 focus:ring-info-main/50 outline-none transition-all"
                  placeholder={t('settings.fullNamePlaceholder', 'Ej: Juan Pérez')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                  {t('settings.phone', 'Teléfono')}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit focus:ring-2 focus:ring-info-main/50 outline-none transition-all"
                  placeholder={t('settings.phonePlaceholder', '+1 234 567 8900')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                  {t('settings.company', 'Empresa / Organización')}
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit focus:ring-2 focus:ring-info-main/50 outline-none transition-all"
                  placeholder={t('settings.companyPlaceholder', 'Seidor')}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div className="text-sm text-green-600 dark:text-green-400 font-medium">
              {successMsg && <span className="animate-fade-in">{successMsg}</span>}
            </div>
            <Button variant="info" type="submit" disabled={loading}>
              {loading ? t('settings.saving', 'Guardando...') : t('settings.saveSettings', 'Guardar Configuración')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
