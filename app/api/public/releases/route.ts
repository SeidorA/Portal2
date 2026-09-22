import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

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
    const lang = (searchParams.get('lang') || 'es') as 'es' | 'en';
    const versionQuery = searchParams.get('version');
    const includeDrafts = searchParams.get('include_drafts') === 'true';

    const supabase = createAdminClient();

    const { data: product, error: prodError } = await supabase
      .from('products')
      .select('id, title, slug, technical_docs_config')
      .ilike('slug', productSlug)
      .single();

    if (prodError || !product) {
      return NextResponse.json(
        { error: `Producto '${productSlug}' no encontrado` },
        { status: 404, headers: corsHeaders }
      );
    }

    const techConfig = product.technical_docs_config || {};
    const allReleases = (techConfig.releases || []) as any[];

    // Filtrar releases publicados (o todos si se especifican borradores con clave privada)
    let filteredReleases = includeDrafts
      ? allReleases
      : allReleases.filter((r) => r.isPublished);

    if (versionQuery && versionQuery !== 'latest') {
      filteredReleases = filteredReleases.filter((r) => r.version === versionQuery);
    }

    const formattedReleases = filteredReleases.map((r) => {
      const title = lang === 'en' && r.title_en ? r.title_en : (r.title_es || r.title || `Release ${r.version}`);
      const description = lang === 'en' && r.description_en ? r.description_en : (r.description_es || r.description || '');

      return {
        id: r.id,
        version: r.version,
        is_published: r.isPublished ?? true,
        title,
        description,
        png_url: r.pngUrl || null,
        png_name: r.pngName || null,
        gif_url: r.gifUrl || null,
        gif_name: r.gifName || null,
      };
    });

    return NextResponse.json(
      {
        success: true,
        product: product.slug,
        lang,
        total_releases: formattedReleases.length,
        releases: formattedReleases,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Error in /api/public/releases:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}
