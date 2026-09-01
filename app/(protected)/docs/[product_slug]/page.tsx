import { createClient } from '@/utils/supabase/server';
import { redirect, notFound } from 'next/navigation';

export default async function ProductDocsRedirect({ params }: { params: Promise<{ product_slug: string }> }) {
  const supabase = await createClient();
  const { product_slug } = await params;

  // 1. Get the product id from the slug
  const { data: product, error: prodError } = await supabase
    .from('products')
    .select('id')
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
    .order('ancestor', { ascending: false }) // Recursos might come first depending on sort, but let's just order by order_index
    .order('order_index', { ascending: true })
    .limit(1)
    .single();

  if (docError || !doc) {
    // If product exists but has no docs, we could just show a placeholder, but let's 404 for now
    notFound();
  }

  // 3. Redirect to the actual document
  redirect(`/docs/${product_slug}/${doc.slug}`);
}
