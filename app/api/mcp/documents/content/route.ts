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
    .from('portal_documents')
    .select('id, title, type, content, related_products, edit_history, updated_at, created_at')
    .eq('id', id)
    .single();

  if (error || !doc) {
    return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
  }

  // Normalizar páginas para documentos A4
  let content = doc.content || {};
  if (typeof content.text === 'string' && !Array.isArray(content.pages)) {
    content = { ...content, pages: [content.text] };
  } else if (!Array.isArray(content.pages)) {
    content = { ...content, pages: [''] };
  }

  return NextResponse.json({
    document: {
      id: doc.id,
      title: doc.title,
      type: doc.type,
      content,
      related_products: doc.related_products || [],
      edit_history: doc.edit_history || [],
      updated_at: doc.updated_at,
      created_at: doc.created_at,
    },
  });
}
