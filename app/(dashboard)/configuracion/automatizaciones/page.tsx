"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Drawer, TextInput } from 'caralstable';
import { CaralIcon } from 'iconcaral2';
import { createClient } from '@/utils/supabase/client';

export default function AutomatizacionesPage() {
  const router = useRouter();
  const [rules, setRules] = useState<any[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    from_status: 'nuevas',
    to_status: 'contacto',
    required_roles: '', // comma separated for now
    auto_comment: ''
  });

  const supabase = createClient();

  const loadRules = async () => {
    const { data, error } = await supabase
      .from('opportunity_rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRules(data);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);

    // Parse roles
    const rolesArray = formData.required_roles
      .split(',')
      .map(r => r.trim())
      .filter(r => r.length > 0);

    const { error } = await supabase
      .from('opportunity_rules')
      .insert({
        name: formData.name,
        from_status: formData.from_status,
        to_status: formData.to_status,
        required_roles: rolesArray,
        auto_comment: formData.auto_comment || null
      });

    setIsLoading(false);
    if (!error) {
      setIsDrawerOpen(false);
      loadRules();
      setFormData({ name: '', from_status: 'nuevas', to_status: 'contacto', required_roles: '', auto_comment: '' });
    } else {
      alert("Error al guardar la automatización");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta automatización?")) return;
    await supabase.from('opportunity_rules').delete().eq('id', id);
    loadRules();
  };

  return (
    <div className="w-full h-full p-4 md:p-8 animate-fade-in flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <Button
            variant='ghost'
            size='md'
            iconName='arrowLeft'
            onClick={() => router.push('/oportunidades')}
          >
            Volver
          </Button>
          <h2 className="text-[28px] font-semibold text-neutral-900 flex items-center gap-2">
            <CaralIcon name="cloudSync" size={28} />
            Automatizaciones CRM
          </h2>
          <p className="text-neutral-800 text-sm">
            Configura reglas de permisos y acciones automáticas para el gestor de oportunidades.
          </p>
        </div>
        <Button
          variant='info'
          size='md'
          iconName='plus'
          onClick={() => setIsDrawerOpen(true)}
        >
          Crear Regla
        </Button>
      </div>

      <div className="flex-1 overflow-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 uppercase tracking-wider">
              <th className="p-4 font-semibold">Nombre</th>
              <th className="p-4 font-semibold">Transición</th>
              <th className="p-4 font-semibold">Roles Requeridos</th>
              <th className="p-4 font-semibold">Comentario Automático</th>
              <th className="p-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {rules.map((rule) => (
              <tr key={rule.id} className="border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                <td className="p-4 font-medium text-neutral-900">{rule.name}</td>
                <td className="p-4 text-neutral-600">
                  De <span className="font-semibold">{rule.from_status}</span> a <span className="font-semibold">{rule.to_status}</span>
                </td>
                <td className="p-4">
                  {rule.required_roles && rule.required_roles.length > 0 ? (
                    <div className="flex gap-1">
                      {rule.required_roles.map((r: string) => (
                        <span key={r} className="bg-neutral-200 dark:bg-neutral-700 px-2 py-0.5 rounded text-xs">{r}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-neutral-400 italic">Cualquiera</span>
                  )}
                </td>
                <td className="p-4 text-neutral-600 max-w-[200px] truncate">
                  {rule.auto_comment || '-'}
                </td>
                <td className="p-4 text-right">
                  <Button
                    variant="danger"
                    size="sm"
                    isIconButton
                    iconName="trash"
                    onClick={() => handleDelete(rule.id)}
                  />
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-neutral-500">
                  No hay automatizaciones configuradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Nueva Automatización"
        size="md"
      >
        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-neutral-800">Nombre de la Regla</label>
            <TextInput
              placeholder="Ej: Aprobación de Sales Manager"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-neutral-800">Estado Origen</label>
              <select
                className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm"
                value={formData.from_status}
                onChange={(e) => setFormData({ ...formData, from_status: e.target.value })}
              >
                <option value="nuevas">Nuevas</option>
                <option value="contacto">En Contacto</option>
                <option value="propuesta">Propuesta</option>
                <option value="ganada">Ganada</option>
                <option value="perdida">Perdida</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-neutral-800">Estado Destino</label>
              <select
                className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm"
                value={formData.to_status}
                onChange={(e) => setFormData({ ...formData, to_status: e.target.value })}
              >
                <option value="nuevas">Nuevas</option>
                <option value="contacto">En Contacto</option>
                <option value="propuesta">Propuesta</option>
                <option value="ganada">Ganada</option>
                <option value="perdida">Perdida</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-neutral-800">Roles Permitidos (separados por coma)</label>
            <TextInput
              placeholder="Ej: sales_manager, admin"
              value={formData.required_roles}
              onChange={(e) => setFormData({ ...formData, required_roles: e.target.value })}
            />
            <span className="text-xs text-neutral-500">Si lo dejas en blanco, cualquier usuario podrá realizar el cambio.</span>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-neutral-800">Comentario Automático (Opcional)</label>
            <TextInput
              placeholder="Ej: Por favor revisa estos links: https://..."
              multiline
              rows={4}
              value={formData.auto_comment}
              onChange={(e) => setFormData({ ...formData, auto_comment: e.target.value })}
            />
          </div>

          <div className="pt-4 border-t border-neutral-200 mt-4 flex justify-end gap-3">
            <Button variant="light" hasBorder onClick={() => setIsDrawerOpen(false)}>
              Cancelar
            </Button>
            <Button variant="info" onClick={handleSave} disabled={isLoading || !formData.name}>
              {isLoading ? 'Guardando...' : 'Crear Regla'}
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
