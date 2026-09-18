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

    // 3. Obtener documentos de los módulos públicos
    const selectFields = includeContent
      ? 'id, product_id, module_id, title, slug, content, status, section, order_index, icon_name, type, description, created_at, updated_at'
      : 'id, product_id, module_id, title, slug, status, section, order_index, icon_name, type, description, created_at, updated_at';

    const { data: docs, error: docsError } = await supabase
      .from('documentation')
      .select(selectFields)
      .in('module_id', publicModuleIds)
      .eq('status', 'published')
      .order('order_index', { ascending: true });

    if (docsError) throw docsError;

    // 4. Construir árbol jerárquico de navegación por módulo
    const navigation = publicModules.map((module) => {
      const moduleDocs = (docs || []).filter((d) => d.module_id === module.id);

      // Función recursiva para armar secciones y páginas hijas
      const buildSectionTree = (parentId: string | null) => {
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

    return NextResponse.json(
      {
        success: true,
        product: formattedProduct,
        modules: publicModules,
        navigation,
        total_documents: (docs || []).length,
        documents: docs || [],
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
