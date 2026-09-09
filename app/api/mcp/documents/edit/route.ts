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

  const { id, title, pages, settings, metadata, related_products, action_description } = body;

  if (!id) {
    return NextResponse.json({ error: 'El parámetro id es requerido' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Obtener documento actual
  const { data: currentDoc, error: fetchError } = await supabase
    .from('portal_documents')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !currentDoc) {
    return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
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

  // Preparar contenido actualizado
  let existingContent = currentDoc.content || {};
  let updatedPages = existingContent.pages;
  if (Array.isArray(pages)) {
    updatedPages = pages.map((p) => (typeof p === 'string' ? p : String(p)));
  } else if (typeof pages === 'string') {
    updatedPages = [pages];
  } else if (!Array.isArray(updatedPages)) {
    if (typeof existingContent.text === 'string') {
      updatedPages = [existingContent.text];
    } else {
      updatedPages = [''];
    }
  }

  const updatedSettings = settings
    ? {
        ...(existingContent.settings || {}),
        ...settings,
        cover: {
          ...((existingContent.settings && existingContent.settings.cover) || {}),
          ...(settings.cover || {}),
        },
      }
    : existingContent.settings || {
        pageSize: 'A4',
        showFooter: true,
        noTableBorders: false,
        cover: {
          hasCover: false,
          template: 'default',
          hiddenLogos: [],
          selectedCoverImage: '',
          titleMode: 'logo_name',
          customTitle: '',
          subtitleText: '',
          subtitleColor: '#00B0FF',
          marginTop: 120,
          marginBetween: 10,
        },
      };

  const updatedMetadata = metadata
    ? {
        ...(existingContent.metadata || {}),
        ...metadata,
      }
    : existingContent.metadata || {
        tags: '',
        status: 'draft',
        restriction: 'public',
        language: 'es',
        description: '',
      };

  const updatedContent = {
    ...existingContent,
    pages: updatedPages,
    settings: updatedSettings,
    metadata: updatedMetadata,
  };

  const currentHistory = Array.isArray(currentDoc.edit_history) ? currentDoc.edit_history : [];
  const newHistoryEntry = {
    date: new Date().toISOString(),
    user: userIdentifier,
    action: action_description || 'Documento actualizado vía MCP',
  };

  const updatePayload: any = {
    content: updatedContent,
    edit_history: [...currentHistory, newHistoryEntry],
    updated_at: new Date().toISOString(),
  };

  if (title !== undefined && typeof title === 'string' && title.trim()) {
    updatePayload.title = title.trim();
  }

  if (related_products !== undefined && Array.isArray(related_products)) {
    updatePayload.related_products = related_products;
  }

  const { data: updatedDoc, error: updateError } = await supabase
    .from('portal_documents')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('[MCP documents/edit] Error updating document:', updateError);
    return NextResponse.json({ error: 'Error al actualizar el documento en la base de datos' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: 'Documento A4 actualizado exitosamente',
    document: updatedDoc,
  });
}
