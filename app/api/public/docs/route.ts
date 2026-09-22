import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { formatProductDocumentationBrand } from '@/utils/product-branding';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

function extractDocCover(doc: any): string | null {
  if (!doc) return null;
  // 1. Direct properties
  if (doc.cover_image && typeof doc.cover_image === 'string') return doc.cover_image;
  if (doc.cover_url && typeof doc.cover_url === 'string') return doc.cover_url;
  if (doc.cover && typeof doc.cover === 'string') return doc.cover;
  if (doc.image_url && typeof doc.image_url === 'string') return doc.image_url;

  // 2. From content if object or JSON string
  if (doc.content) {
    if (typeof doc.content === 'object') {
      const cover =
        doc.content?.settings?.cover?.selectedCoverImage ||
        doc.content?.metadata?.coverUrl ||
        doc.content?.settings?.cover?.coverImage ||
        doc.content?.cover ||
        null;
      if (cover) return cover;
    } else if (typeof doc.content === 'string') {
      try {
        const parsed = JSON.parse(doc.content);
        const cover =
          parsed?.settings?.cover?.selectedCoverImage ||
          parsed?.metadata?.coverUrl ||
          parsed?.settings?.cover?.coverImage ||
          parsed?.cover ||
          null;
        if (cover) return cover;
      } catch {
        // Not JSON
      }
    }
  }

  // 3. From description if JSON
  if (doc.description && typeof doc.description === 'string') {
    try {
      const parsed = JSON.parse(doc.description);
      const cover =
        parsed?.cover_image ||
        parsed?.cover_url ||
        parsed?.selectedCoverImage ||
        parsed?.coverUrl ||
        null;
      if (cover) return cover;
    } catch {}
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productSlug = searchParams.get('product') || searchParams.get('product_slug') || 'crestone';
    const includeContent = searchParams.get('include_content') === 'true' || searchParams.get('full') === 'true';

    const supabase = createAdminClient();

    // 1. Obtener producto con assets e imágenes de marca
    const { data: product, error: prodError } = await supabase
      .from('products')
      .select('*')
      .ilike('slug', productSlug)
      .single();

    if (prodError || !product) {
      return NextResponse.json(
        { error: `Producto '${productSlug}' no encontrado` },
        { status: 404, headers: corsHeaders }
      );
    }

    // 2. Obtener módulos públicos del producto
    const { data: allModules, error: modError } = await supabase
      .from('modules')
      .select('id, title, slug, order_index, is_hidden, allowed_roles')
      .eq('product_id', product.id)
      .eq('is_hidden', false)
      .order('order_index', { ascending: true });

    if (modError) throw modError;

    // Filtrar módulos que tengan el rol 'public'
    const publicModules = (allModules || []).filter(
      (m) => Array.isArray(m.allowed_roles) && m.allowed_roles.includes('public')
    );

    const formattedProduct = formatProductDocumentationBrand(product);

    if (publicModules.length === 0) {
      return NextResponse.json(
        {
          product: formattedProduct,
          modules: [],
          navigation: [],
          documents: [],
          message: 'No hay módulos públicos para este producto.',
        },
        { headers: corsHeaders }
      );
    }

    const publicModuleIds = publicModules.map((m) => m.id);

    // 3. Obtener documentos de los módulos públicos (consultamos todos los campos para extraer portadas)
    const { data: rawDocs, error: docsError } = await supabase
      .from('documentation')
      .select('*')
      .in('module_id', publicModuleIds)
      .eq('status', 'published')
      .order('order_index', { ascending: true });

    if (docsError) throw docsError;

    // 4. Buscar portadas adicionales de portal_documents vinculadas al producto
    const portalDocCoverMap = new Map<string, string>();
    try {
      const { data: portalDocs } = await supabase
        .from('portal_documents')
        .select('id, title, slug, content')
        .or(`product_id.eq.${product.id},content->metadata->>product_id.eq.${product.id}`);

      (portalDocs || []).forEach((pd: any) => {
        const cover =
          pd.content?.settings?.cover?.selectedCoverImage ||
          pd.content?.metadata?.coverUrl ||
          pd.content?.settings?.cover?.coverImage;
        if (cover) {
          portalDocCoverMap.set(pd.id, cover);
          if (pd.slug) portalDocCoverMap.set(pd.slug, cover);
        }
      });
    } catch {
      // ignore
    }

    // Mapeo de portadas por ID y Slug de documentación
    const docCoverMap = new Map<string, string>();
    const formattedDocs = (rawDocs || []).map((doc: any) => {
      const coverUrl =
        extractDocCover(doc) ||
        portalDocCoverMap.get(doc.id) ||
        portalDocCoverMap.get(doc.slug) ||
        null;

      if (coverUrl) {
        docCoverMap.set(doc.id, coverUrl);
        if (doc.slug) docCoverMap.set(doc.slug, coverUrl);
      }

      const docObj: any = {
        ...doc,
        cover_image: coverUrl,
        cover_url: coverUrl,
      };

      if (!includeContent && 'content' in docObj) {
        delete docObj.content;
      }

      return docObj;
    });

    // 5. Construir árbol jerárquico de navegación por módulo
    const navigation = publicModules.map((module) => {
      const moduleDocs = formattedDocs.filter((d: any) => d.module_id === module.id);

      // Función recursiva para armar secciones y páginas hijas
      const buildSectionTree = (parentId: string | null): any[] => {
        return moduleDocs
          .filter((doc: any) => {
            if (!parentId) {
              return (
                !doc.section ||
                doc.section === 'General' ||
                !moduleDocs.some((s: any) => s.type === 'section' && s.id === doc.section)
              );
            }
            return doc.section === parentId;
          })
          .map((doc: any) => {
            if (doc.type === 'section') {
              return {
                id: doc.id,
                title: doc.title,
                sidename: doc.sidename,
                slug: doc.slug,
                type: 'section',
                icon_name: doc.icon_name,
                order_index: doc.order_index,
                cover_image: doc.cover_image,
                cover_url: doc.cover_url,
                items: buildSectionTree(doc.id),
              };
            }
            return {
              id: doc.id,
              title: doc.title,
              sidename: doc.sidename,
              slug: doc.slug,
              type: doc.type,
              icon_name: doc.icon_name,
              order_index: doc.order_index,
              cover_image: doc.cover_image,
              cover_url: doc.cover_url,
              url: `/docs/${doc.slug}`,
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

    // 6. Enriquecer technical_docs_config (index entries, blog y releases con portadas consistentes)
    const techDocsConfig = { ...(product.technical_docs_config || {}) };
    if (techDocsConfig.index && Array.isArray(techDocsConfig.index.entries)) {
      techDocsConfig.index.entries = techDocsConfig.index.entries.map((entry: any) => {
        let entryCover = entry.cover_image || entry.cover_url || entry.coverUrl || null;
        if (!entryCover && entry.docId) {
          entryCover = docCoverMap.get(entry.docId) || portalDocCoverMap.get(entry.docId) || null;
        }
        if (!entryCover && entry.docSlug) {
          entryCover = docCoverMap.get(entry.docSlug) || portalDocCoverMap.get(entry.docSlug) || null;
        }
        return {
          ...entry,
          cover_image: entryCover,
          cover_url: entryCover,
          coverUrl: entryCover,
          coverImage: entryCover,
          cover: entryCover,
          image: entryCover,
        };
      });
    }

    if (Array.isArray(techDocsConfig.blog)) {
      techDocsConfig.blog = techDocsConfig.blog.map((b: any) => {
        const coverUrl = b.coverUrl || b.cover_url || b.cover_image || b.coverImage || b.cover || b.image || b.imageUrl || b.image_url || null;
        return {
          ...b,
          cover_url: coverUrl,
          cover_image: coverUrl,
          coverUrl,
          coverImage: coverUrl,
          cover: coverUrl,
          image: coverUrl,
          imageUrl: coverUrl,
          image_url: coverUrl,
        };
      });
    }

    if (Array.isArray(techDocsConfig.releases)) {
      techDocsConfig.releases = techDocsConfig.releases.map((r: any) => {
        const pngUrl = r.pngUrl || r.png_url || null;
        const gifUrl = r.gifUrl || r.gif_url || null;
        return {
          ...r,
          png_url: pngUrl,
          pngUrl: pngUrl,
          gif_url: gifUrl,
          gifUrl: gifUrl,
          image_url: pngUrl || gifUrl,
          imageUrl: pngUrl || gifUrl,
          cover_url: pngUrl || gifUrl,
          cover_image: pngUrl || gifUrl,
        };
      });
    }

    return NextResponse.json(
      {
        success: true,
        product: formattedProduct,
        modules: publicModules,
        navigation,
        technical_docs: techDocsConfig,
        total_documents: formattedDocs.length,
        documents: formattedDocs,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Error in /api/public/docs:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}
