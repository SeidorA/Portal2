import { createAdminClient } from '@/utils/supabase/admin';
import { NextRequest } from 'next/server';

// Usamos el cliente admin de supabase para buscar la llave sin RLS 
// o bien podemos usar el cliente normal de server si tenemos permisos
// Como el token se envía en el header, no podemos usar la cookie de sesión del cliente
// Necesitaremos buscar la llave maestra de servicio o simplemente inicializar supabase 
// con las variables de entorno.
export async function authenticateMcpRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized: No token provided', status: 401 };
  }

  const token = authHeader.split(' ')[1];

  // Necesitamos usar la llave de servicio para saltarnos el RLS, ya que la petición no tiene cookies de sesión.
  const supabase = createAdminClient();

  // Buscar la API key en la base de datos
  const { data: apiKey, error } = await supabase
    .from('api_keys')
    .select('user_id')
    .eq('token', token)
    .single();

  if (error || !apiKey) {
    return { error: 'Unauthorized: Invalid token', status: 401 };
  }

  // Verificamos si el usuario es Admin
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role_id, roles(name)')
    .eq('profile_id', apiKey.user_id);

  const isAdmin = userRoles?.some(ur => (ur.roles as any)?.name === 'admin') || false;

  return {
    user_id: apiKey.user_id,
    isAdmin,
  };
}
