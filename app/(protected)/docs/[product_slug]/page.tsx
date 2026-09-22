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

  // 2. Fetch private modules for this product
  const { data: rawModules } = await supabase
    .from('modules')
    .select('id, allowed_roles')
    .eq('product_id', product.id)
    .eq('is_hidden', false)
    .order('order_index', { ascending: true });

  const privateModules = (rawModules || []).filter(
    (m: any) => !Array.isArray(m.allowed_roles) || !m.allowed_roles.includes('public')
  );
  const privateModuleIds = privateModules.map((m: any) => m.id);

  // 3. Find the first private document for this product
  const { data: rawDocs } = await supabase
    .from('documentation')
    .select('slug, module_id, allowed_roles')
    .eq('product_id', product.id)
    .order('order_index', { ascending: true });

  const validDoc = (rawDocs || []).find((d: any) => {
    if (d.module_id) return privateModuleIds.includes(d.module_id);
    return !Array.isArray(d.allowed_roles) || !d.allowed_roles.includes('public');
  });

  if (validDoc?.slug) {
    redirect(`/docs/${product_slug}/${validDoc.slug}`);
  }

  // If no regular docs exist, but graphic module is enabled, redirect to brandbook
  if (product.assets?.enable_graphic_module) {
    redirect(`/docs/${product_slug}/recursos-graficos-logo`);
  }

  notFound();
}
