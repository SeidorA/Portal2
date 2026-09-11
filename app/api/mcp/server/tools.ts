import { createAdminClient } from '@/utils/supabase/admin';

export const MCP_TOOL_DEFINITIONS = [
  // 1. search_knowledge_base
  {
    name: 'search_knowledge_base',
    description: 'Busca artículos y guías en la Base de Conocimientos técnica y funcional del portal usando palabras clave.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Término o tema a buscar en la Base de Conocimientos' },
      },
      required: ['query'],
    },
  },
  // 2. get_knowledge_base_article
  {
    name: 'get_knowledge_base_article',
    description: 'Obtiene el contenido completo (Markdown) de un artículo de la Base de Conocimientos dado su ID.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID del artículo de la Base de Conocimientos (UUID)' },
      },
      required: ['id'],
    },
  },
  // 3. edit_knowledge_base_article
  {
    name: 'edit_knowledge_base_article',
    description: 'Edita el contenido (Markdown) de un artículo existente en la Base de Conocimientos del portal. REQUIERE ROL ADMIN.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID del artículo a editar' },
        content: { type: 'string', description: 'Nuevo contenido en formato Markdown' },
      },
      required: ['id', 'content'],
    },
  },
  // 4. list_a4_documents
  {
    name: 'list_a4_documents',
    description: 'Lista los documentos imprimibles tipo A4 y reportes multipágina disponibles en el portal con búsqueda opcional por título y paginación.',
    inputSchema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Filtro opcional para buscar por título' },
        limit: { type: 'number', description: 'Cantidad máxima de documentos a retornar (defecto: 20)' },
        offset: { type: 'number', description: 'Desplazamiento para paginación (defecto: 0)' },
      },
    },
  },
  // 5. get_a4_document
  {
    name: 'get_a4_document',
    description: 'Obtiene los detalles completos de un documento imprimible tipo A4 (título, páginas Markdown, configuración visual/portada, metadatos y productos relacionados).',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID del documento A4 (UUID)' },
      },
      required: ['id'],
    },
  },
  // 6. create_a4_document
  {
    name: 'create_a4_document',
    description: 'Generador de contenido / Creador de nuevos documentos imprimibles tipo A4 multipágina en el portal (con portada personalizable, páginas Markdown y exportación a PDF).',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Título del nuevo documento A4' },
        pages: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array de strings en formato Markdown, donde cada string representa una página A4.',
        },
        settings: {
          type: 'object',
          description: 'Configuración opcional de página y portada (hasCover, template, customTitle, subtitleText, subtitleColor, showFooter, noTableBorders, etc.)',
        },
        metadata: {
          type: 'object',
          description: 'Metadatos opcionales (tags, status: "draft"|"published", restriction: "public"|"private", language, description)',
        },
        related_products: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array de UUIDs de productos del portal relacionados con este documento.',
        },
      },
      required: ['title'],
    },
  },
  // 7. edit_a4_document
  {
    name: 'edit_a4_document',
    description: 'Edita un documento imprimible tipo A4 existente (permite actualizar su título, contenido de páginas Markdown, configuración de portada, metadatos o productos asociados).',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID del documento A4 a modificar (UUID)' },
        title: { type: 'string', description: 'Nuevo título (opcional)' },
        pages: {
          type: 'array',
          items: { type: 'string' },
          description: 'Nuevo array de páginas Markdown (opcional)',
        },
        settings: {
          type: 'object',
          description: 'Ajustes de configuración o portada a actualizar (opcional)',
        },
        metadata: {
          type: 'object',
          description: 'Metadatos a actualizar (opcional)',
        },
        related_products: {
          type: 'array',
          items: { type: 'string' },
          description: 'Nueva lista de IDs de productos asociados (opcional)',
        },
        action_description: {
          type: 'string',
          description: 'Descripción breve del cambio para registrar en el historial de edición (opcional)',
        },
      },
      required: ['id'],
    },
  },
  // 8. duplicate_a4_document
  {
    name: 'duplicate_a4_document',
    description: 'Duplica o clona un documento imprimible tipo A4 existente generando una copia idéntica con un nuevo ID y título opcional.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID del documento A4 que se desea duplicar (UUID)' },
        new_title: {
          type: 'string',
          description: 'Título para la copia clonada (opcional, por defecto "Copia de [Título Original]")',
        },
      },
      required: ['id'],
    },
  },
];

export async function executeMcpTool(
  toolName: string,
  args: any = {},
  auth: { user_id: string; isAdmin: boolean }
) {
  const supabase = createAdminClient();

  // Helper para obtener el nombre/email del usuario
  const getUserIdentifier = async () => {
    if (!auth.user_id) return 'Usuario MCP';
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', auth.user_id)
      .single();
    return profile?.email || profile?.full_name || auth.user_id;
  };

  switch (toolName) {
    case 'search_knowledge_base':
    case 'search_docs': {
      const { query } = args;
      if (!query || typeof query !== 'string') {
        throw new Error('El parámetro query es requerido');
      }

      const { data, error } = await supabase
        .from('documentation')
        .select('id, title, slug, description, type, product_id, products(title)')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(10);

      if (error) throw new Error(`Error en búsqueda: ${error.message}`);

      const results = (data || []).map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        slug: doc.slug,
        description: doc.description,
        type: doc.type,
        product: doc.products?.title || 'General',
      }));

      return { results, total: results.length };
    }

    case 'get_knowledge_base_article':
    case 'get_doc_content': {
      const { id } = args;
      if (!id) throw new Error('El parámetro id es requerido');

      const { data: doc, error } = await supabase
        .from('documentation')
        .select('id, title, description, content, slug, type')
        .eq('id', id)
        .single();

      if (error || !doc) throw new Error('Documento no encontrado');
      return { document: doc };
    }

    case 'edit_knowledge_base_article':
    case 'edit_doc': {
      if (!auth.isAdmin) {
        throw new Error('Acceso denegado: Se requiere rol de Admin para editar documentación vía MCP');
      }
      const { id, content } = args;
      if (!id || content === undefined) {
        throw new Error('Faltan parámetros requeridos (id, content)');
      }

      const { error } = await supabase
        .from('documentation')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw new Error(`Error al actualizar documento: ${error.message}`);
      return { success: true, message: 'Documento actualizado exitosamente' };
    }

    case 'list_a4_documents': {
      const { search = '', limit = 20, offset = 0 } = args || {};
      const numLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
      const numOffset = Math.max(Number(offset) || 0, 0);

      let query = supabase
        .from('portal_documents')
        .select('id, title, type, content, related_products, updated_at', { count: 'exact' })
        .eq('type', 'document')
        .order('updated_at', { ascending: false });

      if (search && String(search).trim()) {
        query = query.ilike('title', `%${String(search).trim()}%`);
      }

      query = query.range(numOffset, numOffset + numLimit - 1);
      const { data, count, error } = await query;

      if (error) throw new Error(`Error al listar documentos A4: ${error.message}`);

      const formatted = (data || []).map((doc: any) => {
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

      return { total: count ?? formatted.length, documents: formatted };
    }

    case 'get_a4_document': {
      const { id } = args;
      if (!id) throw new Error('El parámetro id es requerido');

      const { data: doc, error } = await supabase
        .from('portal_documents')
        .select('id, title, type, content, related_products, edit_history, updated_at, created_at')
        .eq('id', id)
        .single();

      if (error || !doc) throw new Error('Documento no encontrado');

      let content = doc.content || {};
      if (typeof content.text === 'string' && !Array.isArray(content.pages)) {
        content = { ...content, pages: [content.text] };
      } else if (!Array.isArray(content.pages)) {
        content = { ...content, pages: [''] };
      }

      return {
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
      };
    }

    case 'create_a4_document': {
      const { title, pages, settings, metadata, related_products } = args;
      if (!title || typeof title !== 'string' || !title.trim()) {
        throw new Error('El campo title es requerido');
      }

      const userIdentifier = await getUserIdentifier();

      let formattedPages: string[] = [];
      if (Array.isArray(pages)) {
        formattedPages = pages.map((p) => String(p));
      } else if (typeof pages === 'string') {
        formattedPages = [pages];
      } else {
        formattedPages = [`# ${title.trim()}\n\nContenido inicial...`];
      }
      if (formattedPages.length === 0) formattedPages = [''];

      const defaultSettings = {
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

      const defaultMetadata = {
        tags: '',
        status: 'draft',
        restriction: 'public',
        language: 'es',
        description: '',
      };

      const payload = {
        title: title.trim(),
        type: 'document',
        content: {
          pages: formattedPages,
          settings: { ...defaultSettings, ...(settings || {}), cover: { ...defaultSettings.cover, ...(settings?.cover || {}) } },
          metadata: { ...defaultMetadata, ...(metadata || {}) },
        },
        related_products: Array.isArray(related_products) ? related_products : [],
        edit_history: [
          {
            date: new Date().toISOString(),
            user: userIdentifier,
            action: 'Documento creado vía MCP',
          },
        ],
        updated_at: new Date().toISOString(),
      };

      const { data: newDoc, error } = await supabase.from('portal_documents').insert(payload).select().single();
      if (error) throw new Error(`Error al crear documento: ${error.message}`);

      return { success: true, message: 'Documento A4 creado exitosamente', document: newDoc };
    }

    case 'edit_a4_document': {
      const { id, title, pages, settings, metadata, related_products, action_description } = args;
      if (!id) throw new Error('El parámetro id es requerido');

      const { data: currentDoc, error: fetchError } = await supabase
        .from('portal_documents')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !currentDoc) throw new Error('Documento no encontrado');

      const userIdentifier = await getUserIdentifier();

      let existingContent = currentDoc.content || {};
      let updatedPages = existingContent.pages;
      if (Array.isArray(pages)) {
        updatedPages = pages.map((p) => String(p));
      } else if (typeof pages === 'string') {
        updatedPages = [pages];
      } else if (!Array.isArray(updatedPages)) {
        updatedPages = typeof existingContent.text === 'string' ? [existingContent.text] : [''];
      }

      const updatedSettings = settings
        ? { ...existingContent.settings, ...settings, cover: { ...(existingContent.settings?.cover || {}), ...(settings.cover || {}) } }
        : existingContent.settings;

      const updatedMetadata = metadata
        ? { ...(existingContent.metadata || {}), ...metadata }
        : existingContent.metadata;

      const currentHistory = Array.isArray(currentDoc.edit_history) ? currentDoc.edit_history : [];
      const newHistoryEntry = {
        date: new Date().toISOString(),
        user: userIdentifier,
        action: action_description || 'Documento actualizado vía MCP',
      };

      const updatePayload: any = {
        content: { ...existingContent, pages: updatedPages, settings: updatedSettings, metadata: updatedMetadata },
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

      if (updateError) throw new Error(`Error al actualizar documento: ${updateError.message}`);
      return { success: true, message: 'Documento A4 actualizado exitosamente', document: updatedDoc };
    }

    case 'duplicate_a4_document': {
      const { id, new_title } = args;
      if (!id) throw new Error('El parámetro id es requerido');

      const { data: originalDoc, error: fetchError } = await supabase
        .from('portal_documents')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !originalDoc) throw new Error('Documento original no encontrado');

      const userIdentifier = await getUserIdentifier();
      const titleToUse = new_title && typeof new_title === 'string' && new_title.trim()
        ? new_title.trim()
        : `Copia de ${originalDoc.title}`;

      const clonedContent = JSON.parse(JSON.stringify(originalDoc.content || {}));

      const payload = {
        title: titleToUse,
        type: originalDoc.type || 'document',
        content: clonedContent,
        related_products: Array.isArray(originalDoc.related_products) ? [...originalDoc.related_products] : [],
        edit_history: [
          {
            date: new Date().toISOString(),
            user: userIdentifier,
            action: `Duplicado a partir del documento '${originalDoc.title}' (${originalDoc.id}) vía MCP`,
          },
        ],
        updated_at: new Date().toISOString(),
      };

      const { data: duplicatedDoc, error: insertError } = await supabase
        .from('portal_documents')
        .insert(payload)
        .select()
        .single();

      if (insertError) throw new Error(`Error al duplicar documento: ${insertError.message}`);
      return {
        success: true,
        message: 'Documento A4 duplicado exitosamente',
        original_id: originalDoc.id,
        document: duplicatedDoc,
      };
    }

    default:
      throw new Error(`Herramienta desconocida: ${toolName}`);
  }
}
