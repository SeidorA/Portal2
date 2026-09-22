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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const productSlug = searchParams.get('product') || searchParams.get('product_slug') || 'crestone';

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
    const { data: publicModules } = await supabase
      .from('modules')
      .select('id, title, slug, allowed_roles')
      .eq('product_id', product.id)
      .eq('is_hidden', false);

    const publicModuleIds = (publicModules || [])
      .filter((m) => Array.isArray(m.allowed_roles) && m.allowed_roles.includes('public'))
      .map((m) => m.id);

    if (publicModuleIds.length === 0) {
      return NextResponse.json(
        { error: 'No hay módulos públicos para este producto' },
        { status: 404, headers: corsHeaders }
      );
    }

    // 3. Buscar documento por slug en los módulos públicos
    const { data: doc, error: docError } = await supabase
      .from('documentation')
      .select('*')
      .in('module_id', publicModuleIds)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (docError || !doc) {
      return NextResponse.json(
        { error: `Documento '${slug}' no encontrado o no es público` },
        { status: 404, headers: corsHeaders }
      );
    }

    // 4. Obtener módulo padre
    const parentModule = publicModules?.find((m) => m.id === doc.module_id);

    return NextResponse.json(
      {
        success: true,
        document: {
          id: doc.id,
          title: doc.title,
          sidename: doc.sidename,
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
          module: parentModule
            ? {
                id: parentModule.id,
                title: parentModule.title,
                slug: parentModule.slug,
              }
            : null,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Error in /api/public/docs/[slug]:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}
