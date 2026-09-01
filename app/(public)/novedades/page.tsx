import React from 'react';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import { Brand, CaralIcon } from 'iconcaral2';
import { Button } from 'caralstable';

const renderTitle = (title: string, size: number = 24) => {
  if (!title) return title;
  const match = title.match(/^!(icon|brand)-([\w-]+)!\s*(.*)$/i);
  if (match) {
    const isBrand = match[1].toLowerCase() === 'brand';
    const iconName = match[2];
    const restOfTitle = match[3];
    return (
      <span className="flex items-center gap-2">
        {isBrand ? (
          <Brand name={iconName as any} className="shrink-0" size={size} />
        ) : (
          <CaralIcon name={iconName as any} className="text-blue-500 shrink-0" size={size} />
        )}
        <span>{restOfTitle}</span>
      </span>
    );
  }
  return title;
};

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

  // Helper function to strip basic markdown for preview
  const stripMarkdown = (md: string) => {
    if (!md) return '';
    return md
      .replace(/!\[.*?\]\(.*?\)/g, '') // images
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // links
      .replace(/[#*`_]/g, '') // headings, bold, italic, code
      .trim();
  };

  const allNovedades = novedades || [];
  const recentPosts = allNovedades.slice(0, 5);

  // Extract unique products
  const uniqueProducts = Array.from(
    new Set(allNovedades.map((n: any) => n.product?.title).filter(Boolean))
  ) as string[];

  // Filter main list
  const filteredNovedades = filterProduct
    ? allNovedades.filter((n: any) => n.product?.title === filterProduct)
    : allNovedades;

  return (
    <div className="w-full bg-full min-h-screen">
      <Navbar />

      <div className="max-w-[1400px] mx-auto py-12 px-4 md:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-poppins font-bold text-neutral-900">
            Novedades
          </h1>
          <p className="text-lg text-neutral-800 font-poppins max-w-2xl">
            Mantente al día con los últimos lanzamientos de productos, actualizaciones técnicas, integraciones y guías de Seidor Analytics.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-10">
          <Link href="/novedades">
            <Button variant={!filterProduct ? 'primary' : 'light'} className="rounded-full!">
              Todos
            </Button>
          </Link>
          {uniqueProducts.map((prod) => (
            <Link key={prod} href={`/novedades?product=${encodeURIComponent(prod)}`}>
              <Button
                variant={filterProduct === prod ? 'primary' : 'light'}
                isPill
                hasBorder
                className={`${filterProduct === prod ? '' : 'text-neutral-800 bg-transparent! border border-neutral-800'}`}
                iconName={prod as any}
              >
                {prod}
              </Button>
            </Link>
          ))}
        </div>

        {/* Main Layout Grid */}
        <div className="flex sm:flex-col lg:flex-row gap-10 items-start">

          {/* Main Content Area */}
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredNovedades.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-white dark:bg-neutral-800 rounded-3xl border border-neutral-200 dark:border-neutral-700">
                <h2 className="text-xl font-poppins font-semibold text-neutral-800 dark:text-neutral-200 mb-2">No hay noticias</h2>
                <p className="text-neutral-500">Vuelve pronto para enterarte de lo nuevo.</p>
              </div>
            ) : (
              filteredNovedades.map((novedad: any) => (
                <article
                  key={novedad.id}
                  className="bg-container border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
                >
                  {novedad.cover_image && (
                    <div className="w-full aspect-[16/4] relative overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                      <img
                        src={novedad.cover_image}
                        alt={novedad.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}

                  <div className="flex flex-col p-6 flex-1">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      {novedad.product?.title && (
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-bold rounded-full font-poppins uppercase tracking-wider">
                          {novedad.product.title}
                        </span>
                      )}
                      <time className="text-[12px] text-neutral-400 dark:text-neutral-100 font-medium">
                        {new Date(novedad.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </time>
                    </div>

                    <h2 className="text-xl font-poppins font-bold text-neutral-900 mb-3 group-hover:text-blue-600 transition-colors leading-tight">
                      <Link href={`/novedades/${novedad.id}`} className="focus:outline-none">
                        {renderTitle(novedad.title, 24)}
                      </Link>
                    </h2>

                    <p className="text-neutral-800 line-clamp-3 mb-6 font-poppins text-sm leading-relaxed">
                      {stripMarkdown(novedad.content)}
                    </p>

                    <div className="mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-800">
                      <Link
                        href={`/novedades/${novedad.id}`}
                        className="inline-flex items-center gap-2 text-neutral-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400 font-bold font-poppins text-sm transition-colors"
                      >
                        Leer más
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          {/* Sidebar */}
          <aside className="sm:w-full lg:w-[380px] shrink-0 bg-white dark:bg-neutral-800 p-8 rounded-3xl border border-neutral-200 dark:border-neutral-700 sticky top-[80px]">
            <div className="flex items-center gap-3 mb-8">
              <CaralIcon name="newspaper" />
              <h3 className="text-xl font-bold font-poppins text-neutral-900 dark:text-white">Posteos Recientes</h3>
            </div>
            <ul className="flex flex-col gap-6">
              {recentPosts.map((novedad: any, index: number) => (
                <li key={novedad.id} className={`group ${index !== recentPosts.length - 1 ? 'border-b border-neutral-100 dark:border-neutral-700 pb-6' : ''}`}>
                  <Link href={`/novedades/${novedad.id}`} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      {novedad.product?.title && (
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider font-poppins">
                          {novedad.product.title}
                        </span>
                      )}
                      <time className="text-[11px] text-neutral-400 font-medium font-poppins">
                        {new Date(novedad.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </time>
                    </div>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                      {renderTitle(novedad.title, 18)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>

        </div>
      </div>
    </div>
  );
}
