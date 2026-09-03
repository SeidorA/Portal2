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
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Falta el parámetro id' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: doc, error } = await supabase
    .from('documentation')
    .select('id, title, description, content, slug, type')
    .eq('id', id)
    .single();

  if (error || !doc) {
    return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ document: doc });
}
