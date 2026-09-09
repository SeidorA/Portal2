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

  const { title, pages, settings, metadata, related_products } = body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'El campo title es requerido y debe ser una cadena no vacía' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Obtener info del usuario para el historial
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

  // Normalizar páginas
  let formattedPages: string[] = [];
  if (Array.isArray(pages)) {
    formattedPages = pages.map((p) => (typeof p === 'string' ? p : String(p)));
  } else if (typeof pages === 'string') {
    formattedPages = [pages];
  } else {
    formattedPages = [`# ${title.trim()}\n\nContenido inicial...`];
  }

  if (formattedPages.length === 0) {
    formattedPages = [''];
  }

  // Normalizar settings
  const defaultSettings = {
    pageSize: 'A4',
    showFooter: true,
    noTableBorders: false,
    cover: {
      hasCover: false,
      template: 'default',
      hiddenLogos: [] as string[],
      selectedCoverImage: '',
      titleMode: 'logo_name',
      customTitle: '',
      subtitleText: '',
      subtitleColor: '#00B0FF',
      marginTop: 120,
      marginBetween: 10,
    },
  };

  const finalSettings = {
    ...defaultSettings,
    ...(settings || {}),
    cover: {
      ...defaultSettings.cover,
      ...(settings?.cover || {}),
    },
  };

  // Normalizar metadata
  const defaultMetadata = {
    tags: '',
    status: 'draft',
    restriction: 'public',
    language: 'es',
    description: '',
  };

  const finalMetadata = {
    ...defaultMetadata,
    ...(metadata || {}),
  };

  const initialHistory = [
    {
      date: new Date().toISOString(),
      user: userIdentifier,
      action: 'Documento creado vía MCP',
    },
  ];

  const payload = {
    title: title.trim(),
    type: 'document',
    content: {
      pages: formattedPages,
      settings: finalSettings,
      metadata: finalMetadata,
    },
    related_products: Array.isArray(related_products) ? related_products : [],
    edit_history: initialHistory,
    updated_at: new Date().toISOString(),
  };

  const { data: newDoc, error } = await supabase
    .from('portal_documents')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('[MCP documents/create] Error inserting document:', error);
    return NextResponse.json({ error: 'Error al crear el documento en la base de datos' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: 'Documento A4 creado exitosamente',
    document: newDoc,
  });
}
