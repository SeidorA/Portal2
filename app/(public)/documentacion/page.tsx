import { createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';

export default async function DocumentacionPage() {
  const supabase = await createClient();

  // Get Product Portal
  const { data: product } = await supabase
    .from('products')
    .select('id')
    .ilike('slug', 'portal')
    .single();

  if (!product) {
    return <div className="p-8 text-center text-neutral-500">Aún no hay documentación disponible para Portal. Crea el producto 'Portal' (con slug 'portal') en la base de datos.</div>;
  }

  // Fetch all docs for this product to find the first one
  const { data: allDocs, error: allDocsError } = await supabase
    .from('documentation')
    .select('slug, order_index')
    .eq('product_id', product.id)
    .order('order_index', { ascending: true })
    .limit(1);

  if (allDocsError || !allDocs || allDocs.length === 0) {
    return <div className="p-8 text-center text-neutral-500">No hay documentos publicados en el producto Portal.</div>;
  }

  const firstDoc = allDocs[0];
  redirect(`/documentacion/${firstDoc.slug}`);
}
