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
    const postSlug = searchParams.get('slug');
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
    const allPosts = (techConfig.blog || []) as any[];

    // Filtrar posts publicados
    let filteredPosts = includeDrafts
      ? allPosts
      : allPosts.filter((p) => p.isPublished);

    if (postSlug) {
      filteredPosts = filteredPosts.filter((p) => p.slug === postSlug);
    }

    const formattedPosts = filteredPosts.map((p) => {
      const title = lang === 'en' && p.title_en ? p.title_en : (p.title_es || p.title || 'Untitled');
      const content = lang === 'en' && p.content_en ? p.content_en : (p.content_es || p.content || '');
      const coverUrl = p.coverUrl || p.cover_url || p.cover_image || p.coverImage || p.cover || p.image || p.imageUrl || p.image_url || null;
      const coverName = p.coverName || p.cover_name || null;

      return {
        id: p.id,
        slug: p.slug,
        is_published: p.isPublished ?? true,
        title,
        content,
        cover_url: coverUrl,
        cover_name: coverName,
        coverUrl,
        cover_image: coverUrl,
        coverImage: coverUrl,
        cover: coverUrl,
        image: coverUrl,
        imageUrl: coverUrl,
        image_url: coverUrl,
      };
    });

    return NextResponse.json(
      {
        success: true,
        product: product.slug,
        lang,
        total_posts: formattedPosts.length,
        posts: formattedPosts,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Error in /api/public/blog:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}
