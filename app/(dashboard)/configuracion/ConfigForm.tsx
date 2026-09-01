"use client";

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from 'caralstable';

export default function ConfigForm({ user, allowedScreens }: { user: any, allowedScreens: { id: string, title: string }[] }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const meta = user.user_metadata || {};
  
  const [formData, setFormData] = useState({
    default_screen: meta.default_screen || 'dashboard',
    language: meta.language || 'es',
    theme: meta.theme || 'system',
    full_name: meta.full_name || meta.name || meta.display_name || '',
    phone: meta.phone || meta.phone_number || '',
    company: meta.company || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');

    try {
      // Update the user's raw_user_meta_data in Supabase Auth
      const { error } = await supabase.auth.updateUser({
        data: {
          default_screen: formData.default_screen,
          language: formData.language,
          theme: formData.theme,
          full_name: formData.full_name,
          phone: formData.phone,
          company: formData.company
        }
      });

      if (error) throw error;
      setSuccessMsg('¡Configuración actualizada con éxito!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error: any) {
      alert("Error al actualizar la configuración: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-container rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden p-6 max-w-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        
        {/* SECCION A: Preferencias del Sistema */}
        <div>
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mb-4 border-b border-neutral-200 dark:border-neutral-700 pb-2">
            Preferencias del Sistema
          </h2>
          <div className="flex flex-col gap-6">
            <div>
              <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Pantalla Principal (Redirección Inicial)</label>
              <select
                name="default_screen"
                value={formData.default_screen}
                onChange={handleChange}
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit focus:ring-2 focus:ring-info-main/50 outline-none transition-all"
              >
                {allowedScreens.map(screen => (
                  <option key={screen.id} value={screen.id}>
                    {screen.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-neutral-500 mt-1">Esta será la pantalla a la que ingresarás por defecto al entrar al sistema.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Idioma</label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit focus:ring-2 focus:ring-info-main/50 outline-none transition-all"
                >
                  <option value="es">Español</option>
                  <option value="en" disabled>English (Próximamente)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Tema</label>
                <select
                  name="theme"
                  value={formData.theme}
                  onChange={handleChange}
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit focus:ring-2 focus:ring-info-main/50 outline-none transition-all"
                >
                  <option value="system">Sistema</option>
                  <option value="light">Claro</option>
                  <option value="dark">Oscuro</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SECCION B: Perfil */}
        <div>
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mb-4 border-b border-neutral-200 dark:border-neutral-700 pb-2">
            Perfil de Usuario
          </h2>
          <div className="flex flex-col gap-6">
            <div>
              <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Correo Electrónico</label>
              <input
                type="email"
                readOnly
                disabled
                value={user.email}
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed"
              />
              <p className="text-xs text-neutral-500 mt-1">El correo está vinculado a tu cuenta y no puede modificarse desde aquí.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Nombre Completo</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit focus:ring-2 focus:ring-info-main/50 outline-none transition-all"
                placeholder="Ej: Juan Pérez"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Teléfono</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit focus:ring-2 focus:ring-info-main/50 outline-none transition-all"
                placeholder="+1 234 567 8900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Empresa / Organización</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit focus:ring-2 focus:ring-info-main/50 outline-none transition-all"
                placeholder="Seidor"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="text-sm text-green-600 dark:text-green-400 font-medium">
            {successMsg && <span className="animate-fade-in">{successMsg}</span>}
          </div>
          <Button variant="info" type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </div>
      </form>
    </div>
  );
}
