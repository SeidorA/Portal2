'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function getSearchLogsWithNames() {
  const supabase = await createClient();
  const { data: logs, error } = await supabase
    .from('search_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error || !logs) {
    return { logs: [], error: error?.message };
  }

  // Fetch user metadata from Auth Admin to get real names
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
          const meta = u.user_metadata || {};
          const displayName = meta.full_name || meta.name || meta.display_name || u.email;
          authUsersMap[u.id] = { name: displayName };
        });
      }
    }
  } catch (err) {
    console.error("Error fetching auth users:", err);
  }

  const enhancedLogs = logs.map(log => {
    return {
      ...log,
      user_name: log.user_id ? (authUsersMap[log.user_id]?.name || 'Usuario Registrado') : null
    };
  });

  return { logs: enhancedLogs };
}
