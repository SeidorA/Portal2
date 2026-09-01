'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from 'caralstable';
import { CaralIcon } from 'iconcaral2';
import Modal from '@/app/components/Modal';
import { createNewUser } from './actions';

export default function UserManagementClient({ initialProfiles, availableRoles }: { initialProfiles: any[], availableRoles: any[] }) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const handleRoleChange = async (userId: string, newRoleId: number | null) => {
    setLoading(true);
    try {
      // 1. Remove all existing roles for this user
      const { error: delError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (delError) throw delError;

      let newRoleObj: any = null;

      // 2. Insert new role if one was selected (not "Sin Rol")
      if (newRoleId !== null) {
        const { error: insError } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role_id: newRoleId });

        if (insError) throw insError;

        const roleName = availableRoles.find(r => r.id === newRoleId)?.name;
        newRoleObj = { id: newRoleId, name: roleName };
      }

      // 3. Update local state
      setProfiles(prev => prev.map(p => {
        if (p.id === userId) {
          return { ...p, roles: newRoleObj ? [newRoleObj] : [] };
        }
        return p;
      }));

    } catch (e: any) {
      alert("Error actualizando rol: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await createNewUser(formData);
      if (res.error) {
        alert(res.error);
      } else {
        alert("Usuario creado correctamente. Ya puede iniciar sesión.");
        setIsModalOpen(false);
        router.refresh(); // Refrescar la página para ver el nuevo usuario
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const filteredProfiles = profiles.filter(p => {
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = p.display_name?.toLowerCase().includes(searchLower);
    const emailMatch = p.email?.toLowerCase().includes(searchLower);
    return nameMatch || emailMatch;
  });

  let sortedProfiles = [...filteredProfiles];
  if (sortConfig !== null) {
    sortedProfiles.sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';

      if (sortConfig.key === 'name') {
        aVal = (a.display_name || a.email || '').toLowerCase();
        bVal = (b.display_name || b.email || '').toLowerCase();
      } else if (sortConfig.key === 'role') {
        aVal = a.roles && a.roles.length > 0 ? a.roles[0].name : '';
        bVal = b.roles && b.roles.length > 0 ? b.roles[0].name : '';
      } else if (sortConfig.key === 'activity') {
        aVal = a.last_activity_at ? new Date(a.last_activity_at).getTime() : 0;
        bVal = b.last_activity_at ? new Date(b.last_activity_at).getTime() : 0;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) return <span className="ml-1 text-neutral-300">↕</span>;
    return <span className="ml-1 text-info-main">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <CaralIcon name="search" size={16} className="text-neutral-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-container border border-neutral-200 dark:border-neutral-700 rounded-md text-sm outline-none focus:ring-2 focus:ring-info-main/50 transition-all"
          />
        </div>
        <Button variant="info" onClick={() => setIsModalOpen(true)}>
          <CaralIcon name="addCircle" size={18} className="mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      <div className="bg-container rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200">
              <tr>
                <th 
                  className="px-6 py-4 font-medium cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors select-none"
                  onClick={() => handleSort('name')}
                >
                  Usuario / Email <SortIcon columnKey="name" />
                </th>
                <th 
                  className="px-6 py-4 font-medium cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors select-none"
                  onClick={() => handleSort('role')}
                >
                  Roles Asignados <SortIcon columnKey="role" />
                </th>
                <th 
                  className="px-6 py-4 font-medium text-right cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors select-none"
                  onClick={() => handleSort('activity')}
                >
                  <SortIcon columnKey="activity" /> Última Actividad
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {sortedProfiles.map(profile => (
                <tr key={profile.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="px-6 py-4">

                    <div className="font-medium text-neutral-900 dark:text-neutral-100 ">{profile.display_name || <span className="italic text-neutral-500">Sin nombre</span>}</div>
                    <div className="text-xs text-neutral-700 dark:text-neutral-300 mt-0">{profile.email || 'Sin Email'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      disabled={loading}
                      value={profile.roles && profile.roles.length > 0 ? profile.roles[0].id : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleRoleChange(profile.id, val ? Number(val) : null);
                      }}
                      className={`
                      px-3 py-2 text-sm font-medium rounded-md border transition-all cursor-pointer
                      ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                      ${profile.roles && profile.roles.length > 0 ? 'text-neutral-900 border-nutral-200' : 'bg-neutral-50 border-neutral-300 text-neutral-600'}
                    `}
                    >
                      <option value="">-- Sin Rol --</option>
                      {availableRoles.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                    {profile.last_activity_at ? new Date(profile.last_activity_at).toLocaleDateString() : 'Nunca'}
                  </td>
                </tr>
              ))}

              {filteredProfiles.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-neutral-500">
                    <div className="flex flex-col items-center gap-3">
                      <CaralIcon name="users" size={32} />
                      <p>No se encontraron perfiles de usuario.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Crear Nuevo Usuario" width="sm">
          <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
            <p className="text-sm text-neutral-500 mb-2">
              Puedes crear un usuario con correo y contraseña. El usuario podrá iniciar sesión inmediatamente.
            </p>
            <div>
              <label className="block text-sm font-medium mb-1">Correo Electrónico (Email)</label>
              <input
                required
                type="email"
                name="email"
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit"
                placeholder="ejemplo@empresa.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contraseña Provisoria</label>
              <input
                required
                type="password"
                name="password"
                minLength={6}
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)} disabled={isCreating}>Cancelar</Button>
              <Button variant="info" type="submit" disabled={isCreating}>
                {isCreating ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
