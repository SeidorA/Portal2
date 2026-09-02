import { NextRequest, NextResponse } from 'next/server';
import { authenticateMcpRequest } from '@/app/api/mcp/auth';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  // 1. Authenticate Request
  const auth = await authenticateMcpRequest(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // 2. Check Role
  if (!auth.isAdmin) {
    return NextResponse.json({ error: 'Acceso denegado: Se requiere rol de Admin para editar documentación vía MCP' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Cuerpo de la petición inválido' }, { status: 400 });
  }

  const { id, content } = body;

  if (!id || !content) {
    return NextResponse.json({ error: 'Faltan parámetros requeridos (id, content)' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Update document
  const { error } = await supabase
    .from('documentation')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Error actualizando el documento en la base de datos' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Documento actualizado exitosamente' });
}
