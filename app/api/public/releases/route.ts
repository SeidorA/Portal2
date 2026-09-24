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
      const pngUrl = r.pngUrl || r.png_url || null;
      const pngName = r.pngName || r.png_name || null;
      const gifUrl = r.gifUrl || r.gif_url || null;
      const gifName = r.gifName || r.gif_name || null;

      const rawFeatures = Array.isArray(r.features) ? r.features : [];
      const features = rawFeatures.map((f: any) => {
        const featTitle = lang === 'en' && f.title_en ? f.title_en : (f.title_es || f.title || '');
        const featDesc = lang === 'en' && f.description_en ? f.description_en : (f.description_es || f.description || '');
        const fPngUrl = f.pngUrl || f.png_url || null;
        const fPngName = f.pngName || f.png_name || null;
        const fGifUrl = f.gifUrl || f.gif_url || null;
        const fGifName = f.gifName || f.gif_name || null;
        const iconName = f.iconName || f.icon_name || f.icon || null;
        const isBrandIcon = f.isBrandIcon ?? f.is_brand_icon ?? f.isBrand ?? false;

        return {
          id: f.id,
          title: featTitle,
          description: featDesc,
          title_es: f.title_es || f.title || '',
          title_en: f.title_en || f.title || '',
          description_es: f.description_es || f.description || '',
          description_en: f.description_en || f.description || '',
          icon_name: iconName,
          iconName: iconName,
          is_brand_icon: isBrandIcon,
          isBrandIcon: isBrandIcon,
          png_url: fPngUrl,
          pngUrl: fPngUrl,
          png_name: fPngName,
          pngName: fPngName,
          gif_url: fGifUrl,
          gifUrl: fGifUrl,
          gif_name: fGifName,
          gifName: fGifName,
        };
      });

      return {
        id: r.id,
        version: r.version,
        is_published: r.isPublished ?? true,
        title,
        description,
        png_url: pngUrl,
        pngUrl: pngUrl,
        png_name: pngName,
        pngName: pngName,
        gif_url: gifUrl,
        gifUrl: gifUrl,
        gif_name: gifName,
        gifName: gifName,
        image_url: pngUrl || gifUrl,
        imageUrl: pngUrl || gifUrl,
        features,
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
