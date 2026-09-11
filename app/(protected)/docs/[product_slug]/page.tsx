import { createClient } from '@/utils/supabase/server';
import { redirect, notFound } from 'next/navigation';

export default async function ProductDocsRedirect({ params }: { params: Promise<{ product_slug: string }> }) {
  const supabase = await createClient();
  const { product_slug } = await params;

  // 1. Get the product id and assets from the slug
  const { data: product, error: prodError } = await supabase
    .from('products')
    .select('id, assets')
    .eq('slug', product_slug)
    .single();

  if (prodError || !product) {
    notFound();
  }

  // 2. Find the first document for this product (usually in Recursos)
  const { data: doc, error: docError } = await supabase
    .from('documentation')
    .select('slug')
    .eq('product_id', product.id)
    .order('order_index', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (doc?.slug) {
    redirect(`/docs/${product_slug}/${doc.slug}`);
  }

  // If no regular docs exist, but graphic module is enabled, redirect to brandbook
  if (product.assets?.enable_graphic_module) {
    redirect(`/docs/${product_slug}/recursos-graficos-logo`);
  }

  notFound();
}
