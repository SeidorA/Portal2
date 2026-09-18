import { createAdminClient } from '@/utils/supabase/admin';
import { formatProductDocumentationBrand } from '@/utils/product-branding';

export const MCP_TOOL_DEFINITIONS = [
  // 1. search_knowledge_base
  {
    name: 'search_knowledge_base',
    description: 'Busca artículos y guías en la Base de Conocimientos técnica y funcional del portal usando palabras clave, con filtro opcional por producto y visibilidad pública.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Término o tema a buscar en la Base de Conocimientos' },
        product_slug: { type: 'string', description: 'Slug del producto opcional para acotar la búsqueda (ej: "crestone", "portal")' },
        public_only: { type: 'boolean', description: 'Si es true, solo retorna documentos pertenecientes a módulos de cabecera con rol público' },
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
  // 3. get_public_product_docs
  {
    name: 'get_public_product_docs',
    description: 'Obtiene toda la Base de Conocimientos pública de un producto (como Crestone), basada en los módulos de cabecera con visibilidad pública. Retorna el árbol de navegación, módulos y listado de artículos.',
    inputSchema: {
      type: 'object',
      properties: {
        product_slug: { type: 'string', description: 'Slug del producto (ej: "crestone", "portal")' },
        include_content: { type: 'boolean', description: 'Si es true, incluye el contenido Markdown completo de cada artículo' },
      },
      required: ['product_slug'],
    },
  },
  // 4. get_public_product_doc_by_slug
  {
    name: 'get_public_product_doc_by_slug',
    description: 'Obtiene un documento público específico de un producto mediante su slug y el slug del producto, validando que pertenezca a un módulo de cabecera público.',
    inputSchema: {
      type: 'object',
      properties: {
        product_slug: { type: 'string', description: 'Slug del producto (ej: "crestone", "portal")' },
        slug: { type: 'string', description: 'Slug del documento a consultar (ej: "introduccion")' },
      },
      required: ['product_slug', 'slug'],
    },
  },
  // 5. list_products
  {
    name: 'list_products',
    description: 'Lista los productos registrados en el portal con sus slugs, títulos y cantidad de módulos públicos en la cabecera.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  // 6. edit_knowledge_base_article
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
  // 7. list_a4_documents
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
      const { query, product_slug, public_only } = args;
      if (!query || typeof query !== 'string') {
        throw new Error('El parámetro query es requerido');
      }

      let queryBuilder = supabase
        .from('documentation')
        .select('id, title, slug, description, type, status, product_id, module_id, products(id, title, slug), modules(id, title, allowed_roles)')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%,description.ilike.%${query}%`);

      if (product_slug && typeof product_slug === 'string') {
        const { data: prod } = await supabase
          .from('products')
          .select('id')
          .ilike('slug', product_slug.trim())
          .single();
        if (prod) {
          queryBuilder = queryBuilder.eq('product_id', prod.id);
        }
      }

      const { data, error } = await queryBuilder.limit(20);
      if (error) throw new Error(`Error en búsqueda: ${error.message}`);

      let results = (data || []).map((doc: any) => {
        const isPublicModule = Array.isArray(doc.modules?.allowed_roles) && doc.modules.allowed_roles.includes('public');
        return {
          id: doc.id,
          title: doc.title,
          slug: doc.slug,
          description: doc.description,
          type: doc.type,
          status: doc.status,
          product_title: doc.products?.title || 'General',
          product_slug: doc.products?.slug || null,
          module_title: doc.modules?.title || null,
          is_public_header_module: isPublicModule,
          is_public: isPublicModule && doc.status === 'published',
        };
      });

      if (public_only) {
        results = results.filter((r: any) => r.is_public);
      }

      return { results, total: results.length };
    }

    case 'get_public_product_docs': {
      const { product_slug, include_content = false } = args;
      if (!product_slug || typeof product_slug !== 'string') {
        throw new Error('El parámetro product_slug es requerido (ej: "crestone")');
      }

      // 1. Obtener producto
      const { data: product, error: prodError } = await supabase
        .from('products')
        .select('*')
        .ilike('slug', product_slug.trim())
        .single();

      if (prodError || !product) {
        throw new Error(`Producto '${product_slug}' no encontrado`);
      }

      // 2. Obtener módulos de cabecera públicos
      const { data: allModules, error: modError } = await supabase
        .from('modules')
        .select('id, title, slug, order_index, is_hidden, allowed_roles')
        .eq('product_id', product.id)
        .eq('is_hidden', false)
        .order('order_index', { ascending: true });

      if (modError) throw new Error(`Error al obtener módulos: ${modError.message}`);

      const publicModules = (allModules || []).filter(
        (m) => Array.isArray(m.allowed_roles) && m.allowed_roles.includes('public')
      );

      if (publicModules.length === 0) {
        return {
          product: formatProductDocumentationBrand(product),
          modules: [],
          navigation: [],
          documents: [],
          message: `El producto '${product.title}' no tiene módulos con visibilidad pública configurados en la cabecera.`,
        };
      }

      const publicModuleIds = publicModules.map((m) => m.id);

      // 3. Obtener documentos de los módulos públicos
      const selectFields = include_content
        ? 'id, product_id, module_id, title, slug, content, status, section, order_index, icon_name, type, description, created_at, updated_at'
        : 'id, product_id, module_id, title, slug, status, section, order_index, icon_name, type, description, created_at, updated_at';

      const { data: docs, error: docsError } = await supabase
        .from('documentation')
        .select(selectFields)
        .in('module_id', publicModuleIds)
        .eq('status', 'published')
        .order('order_index', { ascending: true });

      if (docsError) throw new Error(`Error al obtener documentos: ${docsError.message}`);

      // 4. Construir navegación en árbol
      const navigation = publicModules.map((module) => {
        const moduleDocs = (docs || []).filter((d) => d.module_id === module.id);
        const buildSectionTree = (parentId: string | null): any[] => {
          return moduleDocs
            .filter((doc) => {
              if (!parentId) {
                return (
                  !doc.section ||
                  doc.section === 'General' ||
                  !moduleDocs.some((s) => s.type === 'section' && s.id === doc.section)
                );
              }
              return doc.section === parentId;
            })
            .map((doc) => {
              if (doc.type === 'section') {
                return {
                  id: doc.id,
                  title: doc.title,
                  slug: doc.slug,
                  type: 'section',
                  icon_name: doc.icon_name,
                  order_index: doc.order_index,
                  items: buildSectionTree(doc.id),
                };
              }
              return {
                id: doc.id,
                title: doc.title,
                slug: doc.slug,
                type: doc.type,
                icon_name: doc.icon_name,
                order_index: doc.order_index,
                url: `/documentacion/${doc.slug}`,
              };
            });
        };

        return {
          id: module.id,
          title: module.title,
          slug: module.slug,
          order_index: module.order_index,
          items: buildSectionTree(null),
        };
      });

      return {
        product: formatProductDocumentationBrand(product),
        public_header_modules: publicModules.map((m) => ({ id: m.id, title: m.title, slug: m.slug })),
        navigation,
        total_documents: (docs || []).length,
        documents: docs || [],
      };
    }

    case 'get_public_product_doc_by_slug': {
      const { product_slug, slug } = args;
      if (!product_slug || !slug) {
        throw new Error('Faltan parámetros requeridos (product_slug, slug)');
      }

      const { data: product, error: prodError } = await supabase
        .from('products')
        .select('*')
        .ilike('slug', product_slug.trim())
        .single();

      if (prodError || !product) {
        throw new Error(`Producto '${product_slug}' no encontrado`);
      }

      const { data: publicModules } = await supabase
        .from('modules')
        .select('id, title, slug, allowed_roles')
        .eq('product_id', product.id)
        .eq('is_hidden', false);

      const publicModuleIds = (publicModules || [])
        .filter((m) => Array.isArray(m.allowed_roles) && m.allowed_roles.includes('public'))
        .map((m) => m.id);

      if (publicModuleIds.length === 0) {
        throw new Error(`No hay módulos públicos configurados para el producto '${product.title}'`);
      }

      const { data: doc, error: docError } = await supabase
        .from('documentation')
        .select('*')
        .in('module_id', publicModuleIds)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (docError || !doc) {
        throw new Error(`Documento '${slug}' no encontrado o no pertenece a un módulo público de '${product.title}'`);
      }

      const parentModule = publicModules?.find((m) => m.id === doc.module_id);

      return {
        document: {
          id: doc.id,
          title: doc.title,
          slug: doc.slug,
          content: doc.content,
          type: doc.type,
          icon_name: doc.icon_name,
          section: doc.section,
          description: doc.description,
          order_index: doc.order_index,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          product: formatProductDocumentationBrand(product),
          module: parentModule ? { id: parentModule.id, title: parentModule.title, slug: parentModule.slug } : null,
        },
      };
    }

    case 'list_products': {
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('*')
        .order('title', { ascending: true });

      if (prodError) throw new Error(`Error al listar productos: ${prodError.message}`);

      const { data: modules } = await supabase
        .from('modules')
        .select('id, product_id, allowed_roles, is_hidden')
        .eq('is_hidden', false);

      const formattedProducts = (products || []).map((p: any) => {
        const prodModules = (modules || []).filter((m: any) => m.product_id === p.id);
        const publicModules = prodModules.filter((m: any) => Array.isArray(m.allowed_roles) && m.allowed_roles.includes('public'));
        return {
          id: p.id,
          title: p.title,
          slug: p.slug,
          version: p.version || '1.0.0',
          description: p.description,
          total_modules: prodModules.length,
          public_modules_count: publicModules.length,
          has_public_docs: publicModules.length > 0,
        };
      });

      return { products: formattedProducts, total: formattedProducts.length };
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
