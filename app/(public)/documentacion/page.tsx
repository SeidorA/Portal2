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

  // 1. Fetch public modules for Portal
  const { data: rawModules } = await supabase
    .from('modules')
    .select('id, allowed_roles')
    .eq('product_id', product.id)
    .eq('is_hidden', false)
    .order('order_index', { ascending: true });

  const publicModules = (rawModules || []).filter(
    (m: any) => Array.isArray(m.allowed_roles) && m.allowed_roles.includes('public')
  );
  const publicModuleIds = publicModules.map((m: any) => m.id);

  // 2. Fetch all docs for this product to find the first public one
  const { data: rawDocs, error: allDocsError } = await supabase
    .from('documentation')
    .select('slug, module_id, allowed_roles, order_index')
    .eq('product_id', product.id)
    .order('order_index', { ascending: true });

  const validDoc = (rawDocs || []).find((d: any) => {
    if (d.module_id) return publicModuleIds.includes(d.module_id);
    return Array.isArray(d.allowed_roles) && d.allowed_roles.includes('public');
  });

  if (allDocsError || !validDoc) {
    return <div className="p-8 text-center text-neutral-500">No hay documentos públicos publicados en el producto Portal.</div>;
  }

  redirect(`/documentacion/${validDoc.slug}`);
}
