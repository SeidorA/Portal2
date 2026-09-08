import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import RoleMatrixClient from './RoleMatrixClient';

export default async function RolesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch all roles
  const { data: roles } = await supabase.from('roles').select('*').order('name', { ascending: true });

  // Fetch all products
  const { data: products } = await supabase.from('products').select('*').order('order_index', { ascending: true });

  // Fetch all modules
  const { data: modules } = await supabase.from('modules').select('*').order('order_index', { ascending: true });

  // Fetch all documents
  const { data: docs } = await supabase.from('documentation').select('*').order('order_index', { ascending: true });

  // Fetch all policies
  const { data: policies } = await supabase.from('role_policies').select('*');

  return (
    <div className="mx-auto w-full p-8 pt-12 animate-fade-in pb-20">
      <RoleMatrixClient
        initialRoles={roles || []}
        initialProducts={products || []}
        initialModules={modules || []}
        initialDocs={docs || []}
        initialPolicies={policies || []}
      />
    </div>
  );
}
