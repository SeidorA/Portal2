import { NextRequest, NextResponse } from 'next/server';
import { authenticateMcpRequest } from '@/app/api/mcp/auth';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET(request: NextRequest) {
  // 1. Authenticate Request
  const auth = await authenticateMcpRequest(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Falta el parámetro de búsqueda (q)' }, { status: 400 });
  }

  // Use service role to fetch data since user session doesn't exist
  const supabase = createAdminClient();

  // Search in title, description and content
  const { data: docs, error } = await supabase
    .from('documentation')
    .select('id, title, description, slug, type')
    .or(`title.ilike.%${query}%,description.ilike.%${query}%,content.ilike.%${query}%`)
    .limit(10);

  if (error) {
    return NextResponse.json({ error: 'Error interno del servidor buscando documentación' }, { status: 500 });
  }

  return NextResponse.json({ results: docs });
}
