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
  const search = searchParams.get('search') || '';
  const limitParam = parseInt(searchParams.get('limit') || '20', 10);
  const offsetParam = parseInt(searchParams.get('offset') || '0', 10);
  const limit = Math.min(Math.max(limitParam, 1), 100);
  const offset = Math.max(offsetParam, 0);

  const supabase = createAdminClient();

  let query = supabase
    .from('portal_documents')
    .select('id, title, type, content, related_products, updated_at', { count: 'exact' })
    .eq('type', 'document')
    .order('updated_at', { ascending: false });

  if (search.trim()) {
    query = query.ilike('title', `%${search.trim()}%`);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('[MCP documents/list] Error querying documents:', error);
    return NextResponse.json({ error: 'Error al consultar documentos' }, { status: 500 });
  }

  const formattedDocuments = (data || []).map((doc: any) => {
    let pagesCount = 1;
    if (doc.content) {
      if (Array.isArray(doc.content.pages)) {
        pagesCount = doc.content.pages.length;
      } else if (typeof doc.content.text === 'string') {
        pagesCount = 1;
      }
    }

    return {
      id: doc.id,
      title: doc.title,
      type: doc.type,
      pages_count: pagesCount,
      settings: doc.content?.settings || null,
      metadata: doc.content?.metadata || null,
      related_products: doc.related_products || [],
      updated_at: doc.updated_at,
    };
  });

  return NextResponse.json({
    total: count ?? formattedDocuments.length,
    documents: formattedDocuments,
  });
}
