import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import UserManagementClient from './UserManagementClient';

export default async function UsuariosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get all profiles with their roles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      last_activity_at,
      user_roles (
        role_id,
        roles ( name )
      )
    `)
    .order('email', { ascending: true });

  // Get all available roles to display in the UI
  const { data: roles, error: rolesError } = await supabase
    .from('roles')
    .select('*')
    .order('name', { ascending: true });

  if (profilesError || rolesError) {
    console.error("Error fetching data:", profilesError || rolesError);
  }

  // Fetch user metadata from Auth Admin to get display names
  let authUsersMap: Record<string, any> = {};
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (supabaseServiceKey) {
      const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      if (!authError && authData.users) {
        authData.users.forEach(u => {
          authUsersMap[u.id] = u.user_metadata || {};
        });
      }
    }
  } catch (err) {
    console.error("Error fetching auth users:", err);
  }

  // Flatten the data structure for the client component
  const formattedProfiles = (profiles || []).map(p => {
    const meta = authUsersMap[p.id] || {};
    const displayName = meta.full_name || meta.name || meta.display_name || '';

    return {
      id: p.id,
      email: p.email,
      display_name: displayName,
      last_activity_at: p.last_activity_at,
      roles: p.user_roles?.map((ur: any) => ({
        id: ur.role_id,
        name: ur.roles?.name
      })) || []
    };
  });

  return (
    <div className="max-w-7xl mx-auto w-full p-8 pt-12 animate-fade-in pb-20">
      <div className="mb-12">
        <h1 className="text-4xl font-poppins font-extrabold text-neutral-900 tracking-tight">
          Gestión de Usuarios
        </h1>
        <p className="text-lg text-neutral-800 leading-relaxed">
          Asigna roles y administra los accesos a los distintos productos y módulos del portal.
        </p>
      </div>

      <UserManagementClient
        initialProfiles={formattedProfiles}
        availableRoles={roles || []}
      />
    </div>
  );
}
