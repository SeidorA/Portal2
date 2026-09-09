import { createAdminClient } from '@/utils/supabase/admin';
import { NextRequest } from 'next/server';

export async function authenticateMcpToken(token: string) {
  if (!token || !token.trim()) {
    return { error: 'Unauthorized: No token provided', status: 401 };
  }

  const supabase = createAdminClient();

  const { data: apiKey, error } = await supabase
    .from('api_keys')
    .select('user_id')
    .eq('token', token.trim())
    .single();

  if (error || !apiKey) {
    console.error('[MCP Auth] Error validating token:', error || 'Token not found');
    return { error: 'Unauthorized: Invalid token', status: 401 };
  }

  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('role_id, roles(name)')
    .or(`profile_id.eq.${apiKey.user_id},user_id.eq.${apiKey.user_id}`);

  if (rolesError) {
    console.error('[MCP Auth] Error fetching roles:', rolesError);
  }

  const isAdmin = userRoles?.some((ur: any) => ur.roles?.name?.toLowerCase() === 'admin') || false;

  return {
    user_id: apiKey.user_id,
    isAdmin,
  };
}

export async function authenticateMcpRequest(request: NextRequest) {
  let token = '';

  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else {
    // Buscar en query params
    const { searchParams } = new URL(request.url);
    token = searchParams.get('token') || searchParams.get('apiKey') || searchParams.get('api') || '';
  }

  if (!token) {
    return { error: 'Unauthorized: No token provided', status: 401 };
  }

  return authenticateMcpToken(token);
}
