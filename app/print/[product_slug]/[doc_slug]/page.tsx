import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import BattlecardViewer from '@/app/components/BattlecardViewer';
import AutoPrint from '@/app/components/AutoPrint';

export default async function PrintDocumentPage({
  params
}: {
  params: Promise<{ product_slug: string, doc_slug: string }>
}) {
  const supabase = await createClient();
  const { product_slug, doc_slug } = await params;

  const { data: product } = await supabase
    .from('products')
    .select('id, title, icon_name, features')
    .eq('slug', product_slug)
    .single();

  if (!product) notFound();

  const { data: doc } = await supabase
    .from('documentation')
    .select('title, content, type')
    .eq('product_id', product.id)
    .eq('slug', doc_slug)
    .single();

  if (!doc) notFound();

  if (doc.type === 'battlecard') {
    return (
      <div className="w-full bg-white flex flex-col items-center py-8">
        <AutoPrint />
        <BattlecardViewer
          content={doc.content}
          productTitle={product.title}
          productIcon={product.icon_name}
          productFeatures={product.features}
          isPrintMode={true}
        />
      </div>
    );
  }

  // Not a battlecard, just a fallback
  return <div className="p-8">Document type not supported for print layout yet.</div>;
}
