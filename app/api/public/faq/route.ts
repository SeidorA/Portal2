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
    const faqConfig = techConfig.faq || {};
    const langData = faqConfig[lang] || faqConfig.es || { title: 'Preguntas Frecuentes', description: '' };
    const items = (faqConfig.items || []).map((item: any) => ({
      id: item.id,
      question: item.question,
      answer: item.answer,
      docId: item.docId,
      docSlug: item.docSlug,
      docTitle: item.docTitle,
    }));

    return NextResponse.json(
      {
        success: true,
        product: product.slug,
        lang,
        title: langData.title || 'Frequently Asked Questions',
        description: langData.description || '',
        total_items: items.length,
        items,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Error in /api/public/faq:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}
