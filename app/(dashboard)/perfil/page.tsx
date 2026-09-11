import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import UnifiedProfileClient from './UnifiedProfileClient';

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Obtenemos el rol para saber qué pantallas puede elegir como default
  let roleName = null;
  let isAdmin = false;
  let allowedScreens: { id: string; title: string }[] = [
    { id: 'dashboard', title: 'Inicio (Por defecto)' },
  ];

  const { data: userRoleData } = await supabase
    .from('user_roles')
    .select('role_id, roles(name)')
    .eq('user_id', user.id)
    .single();

  if (userRoleData && userRoleData.roles) {
    roleName = (userRoleData.roles as any)?.name || (Array.isArray(userRoleData.roles) ? (userRoleData.roles[0] as any)?.name : null);
    if (roleName && (roleName.toLowerCase() === 'admin' || roleName.toLowerCase() === 'administrador')) {
      isAdmin = true;
    }
  }

  const allScreens = [
    { id: 'oportunidades', title: 'Oportunidades' },
    { id: 'usuarios', title: 'Usuarios' },
    { id: 'roles', title: 'Roles' },
    { id: 'contenido', title: 'Contenido' },
    { id: 'productos', title: 'Productos' },
    { id: 'documentos', title: 'Documentos' },
    { id: 'perfil', title: 'Perfil' },
    { id: 'tickets', title: 'Tickets' },
    { id: 'docs', title: 'Documentación' },
    { id: 'sugerencias', title: 'Sugerencias' },
    { id: 'mi-portal', title: 'Mi Portal' },
  ];

  if (isAdmin) {
    allowedScreens = [...allowedScreens, ...allScreens];
  } else if (roleName) {
    const { data: policies } = await supabase
      .from('role_policies')
      .select('resource_id, access_level')
      .eq('role_name', roleName)
      .eq('resource_type', 'screen');

    if (policies) {
      const allowedIds = policies
        .filter((p) => p.access_level !== 'Sin acceso')
        .map((p) => p.resource_id);

      const filteredScreens = allScreens.filter((s) => allowedIds.includes(s.id));
      allowedScreens = [...allowedScreens, ...filteredScreens];
    }
  }

  return <UnifiedProfileClient user={user} isAdmin={isAdmin} allowedScreens={allowedScreens} />;
}
