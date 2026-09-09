import { NextRequest, NextResponse } from 'next/server';
import { authenticateMcpRequest } from '@/app/api/mcp/auth';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(request: NextRequest) {
  // 1. Authenticate Request
  const auth = await authenticateMcpRequest(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Cuerpo de la petición inválido (JSON esperado)' }, { status: 400 });
  }

  const { id, new_title } = body;

  if (!id) {
    return NextResponse.json({ error: 'El parámetro id es requerido' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Obtener documento original
  const { data: originalDoc, error: fetchError } = await supabase
    .from('portal_documents')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !originalDoc) {
    return NextResponse.json({ error: 'Documento original no encontrado' }, { status: 404 });
  }

  // Obtener identificador del usuario
  let userIdentifier = 'Usuario MCP';
  if (auth.user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', auth.user_id)
      .single();
    if (profile) {
      userIdentifier = profile.email || profile.full_name || auth.user_id;
    } else {
      userIdentifier = auth.user_id;
    }
  }

  const titleToUse =
    new_title && typeof new_title === 'string' && new_title.trim()
      ? new_title.trim()
      : `Copia de ${originalDoc.title}`;

  // Clonar contenido
  const clonedContent = JSON.parse(JSON.stringify(originalDoc.content || {}));

  const initialHistory = [
    {
      date: new Date().toISOString(),
      user: userIdentifier,
      action: `Duplicado a partir del documento '${originalDoc.title}' (${originalDoc.id}) vía MCP`,
    },
  ];

  const payload = {
    title: titleToUse,
    type: originalDoc.type || 'document',
    content: clonedContent,
    related_products: Array.isArray(originalDoc.related_products) ? [...originalDoc.related_products] : [],
    edit_history: initialHistory,
    updated_at: new Date().toISOString(),
  };

  const { data: duplicatedDoc, error: insertError } = await supabase
    .from('portal_documents')
    .insert(payload)
    .select()
    .single();

  if (insertError) {
    console.error('[MCP documents/duplicate] Error duplicating document:', insertError);
    return NextResponse.json({ error: 'Error al duplicar el documento en la base de datos' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: 'Documento A4 duplicado exitosamente',
    original_id: originalDoc.id,
    document: duplicatedDoc,
  });
}
