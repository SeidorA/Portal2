'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button, TextInput } from 'caralstable';
import { CaralIcon } from 'iconcaral2';
import { useTranslation } from '@/app/context/LanguageContext';
import Modal from '@/app/components/Modal';

interface ProfileLeftSidebarProps {
  user: any;
  isAdmin?: boolean;
}

export default function ProfileLeftSidebar({ user, isAdmin = false }: ProfileLeftSidebarProps) {
  const { t } = useTranslation();
  const supabase = createClient();
  const meta = user.user_metadata || {};

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: meta.full_name || meta.name || meta.display_name || user.email?.split('@')[0] || 'Nombre del perfil',
    role_title: meta.role_title || 'Diseñador UX/UI | Software Engineer',
    phone: meta.phone || meta.phone_number || '+55 9 11234004595',
    company: meta.company || 'SEIDOR analytics',
  });

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || 'JD';
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name,
          role_title: formData.role_title,
          phone: formData.phone,
          company: formData.company,
        },
      });

      if (error) throw error;
      setIsEditModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      alert('Error al actualizar perfil: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Formato de fecha de ingreso
  const joinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    })
    : '09/09/26';

  return (
    <div className="flex flex-col gap-5 w-[30%] shrink-0">
      {/* 1. Main Profile Card */}
      <div className="bg-container rounded-3xl border border-neutral-200/90 dark:border-neutral-800 shadow-2xs overflow-hidden flex flex-col items-center text-center pb-6">
        {/* Top Colored Banner */}
        <div className="h-24 w-full bg-[#10B981] relative" />

        {/* Circular Avatar with Edit Badge */}
        <div className="relative -mt-12 mb-3">
          <div className="w-24 h-24 rounded-full bg-[#00B0FF] flex items-center justify-center text-white text-3xl font-extrabold font-poppins border-4 border-container">
            {getInitials(formData.full_name)}
          </div>
          <button
            onClick={() => setIsEditModalOpen(true)}
            title="Editar información"
            className="absolute top-0 right-0 w-7 h-7 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:scale-110 transition-transform cursor-pointer"
          >
            <CaralIcon name="edit" size={13} />
          </button>
        </div>

        {/* Name and Professional Title */}
        <div className="px-4 mb-3">
          <h2 className="text-xl font-bold font-poppins text-neutral-900 dark:text-white">
            {formData.full_name}
          </h2>
          <p className="text-xs text-neutral-800  mt-0.5 font-medium">
            {formData.role_title}
          </p>
        </div>

        {/* Badges Row */}
        <div className="flex items-center gap-2 mb-5">
          <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
            {isAdmin ? t('profile.adminBadge', 'Admin') : t('profile.userBadge', 'Usuario')}
          </span>
          <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
            {formData.company}
          </span>
        </div>

        {/* Action Button */}
        <div className="w-full px-6">
          <Button
            onClick={() => setIsEditModalOpen(true)}
            variant='ghost'
            size='md'
            iconName='user'
            hasBorder
            className='w-full bg-transparent text-neutral-900 border-neutral-600'
          >
            <span>{t('profile.editProfile', 'Editar perfil')}</span>
          </Button>
        </div>
      </div>

      {/* 2. Information Card */}
      <div className="bg-container rounded-3xl border border-neutral-200/90 dark:border-neutral-800 shadow-2xs p-6 space-y-4">
        <h3 className="text-base font-bold font-poppins text-neutral-900 dark:text-white">
          {t('profile.information', 'Information')}
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-neutral-800 font-medium">{t('profile.email', 'Email')}</span>
            <span className="text-neutral-900 dark:text-neutral-100 font-semibold truncate max-w-[160px]" title={user.email}>
              {user.email}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-neutral-800 font-medium">{t('profile.phone', 'Phone')}</span>
            <span className="text-neutral-900 dark:text-neutral-100 font-semibold">
              {formData.phone}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-neutral-800 font-medium">{t('profile.joined', 'Joined')}</span>
            <span className="text-neutral-900 dark:text-neutral-100 font-semibold">
              {joinDate}
            </span>
          </div>
        </div>
      </div>

      {/* 3. MCP Status Card */}
      <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 rounded-2xl p-3.5 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 shadow-2xs">
        <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400">
          <CaralIcon name="gear" size={18} />
        </div>
        <span className="text-sm font-bold font-poppins text-emerald-800 dark:text-emerald-300">
          {t('profile.mcpEnabled', 'MCP enable')}
        </span>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={t('profile.editProfileModalTitle', 'Editar Información del Perfil')}
        >
          <form onSubmit={handleUpdate} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                {t('profile.fullName', 'Nombre Completo')}
              </label>
              <TextInput
                value={formData.full_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                {t('profile.roleTitle', 'Cargo / Especialidad')}
              </label>
              <TextInput
                value={formData.role_title}
                onChange={(e) => setFormData((prev) => ({ ...prev, role_title: e.target.value }))}
                placeholder={t('profile.roleTitlePlaceholder', 'Ej: Diseñador UX/UI | Software Engineer')}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                {t('profile.contactPhone', 'Teléfono de contacto')}
              </label>
              <TextInput
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                {t('profile.company', 'Empresa')}
              </label>
              <TextInput
                value={formData.company}
                onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
                className="w-full"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
                {t('common.cancel', 'Cancelar')}
              </Button>
              <Button variant="info" type="submit" isLoading={loading}>
                {t('profile.saveChanges', 'Guardar Cambios')}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
