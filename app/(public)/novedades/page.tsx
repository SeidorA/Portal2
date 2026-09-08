import React from 'react';
import { createClient } from '@/utils/supabase/server';
import Navbar from '@/app/components/Navbar';
import NovedadesListClient from './NovedadesListClient';

export default async function PublicNovedadesPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product: filterProduct } = await searchParams;
  const supabase = await createClient();

  // Fetch only published news
  const { data: novedades, error } = await supabase
    .from('novedades')
    .select('id, title, content, cover_image, created_at, product:products(title)')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching novedades:', error);
  }

  const allNovedades = novedades || [];

  // Extract unique products
  const uniqueProducts = Array.from(
    new Set(allNovedades.map((n: any) => n.product?.title).filter(Boolean))
  ) as string[];

  return (
    <div className="w-full bg-full min-h-screen">
      <Navbar />
      <NovedadesListClient
        novedades={allNovedades}
        filterProduct={filterProduct}
        uniqueProducts={uniqueProducts}
      />
    </div>
  );
}

