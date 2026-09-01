import React from 'react';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import { Brand, CaralIcon } from 'iconcaral2';

const renderTitle = (title: string, size: number = 24) => {
  if (!title) return title;
  const match = title.match(/^!(icon|brand)-([\w-]+)!\s*(.*)$/i);
  if (match) {
    const isBrand = match[1].toLowerCase() === 'brand';
    const iconName = match[2].toLowerCase();
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

export default async function PublicNovedadesPage() {
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

  return (
    <div className="w-full">
      <Navbar />
      <div className="flex">
        <div className="w-64 shrink-0 p-6 bg-container h-[calc(100vh-64px)] border-r border-neutral-200 dark:border-neutral-800 sticky top-[64px] overflow-y-auto">
          <h3 className="text-lg font-bold mb-4 font-poppins text-neutral-900 dark:text-white">Posteos Recientes</h3>
          <ul className="flex flex-col gap-4">
            {novedades?.slice(0, 5).map((novedad: any) => (
              <li key={novedad.id}>
                <Link
                  href={`/novedades/${novedad.id}`}
                  className="text-sm text-neutral-800 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 font-poppins line-clamp-2 transition-colors"
                >
                  {renderTitle(novedad.title, 20)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className='max-w-7xl mx-auto py-12 px-4'>
          <div className="mb-10 text-center">
            <h1 className="text-4xl md:text-5xl font-poppins font-bold text-neutral-900 dark:text-white mb-4">
              Novedades
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 font-poppins max-w-2xl mx-auto">
              Mantente al día con las últimas actualizaciones, lanzamientos y noticias de nuestros productos.
            </p>
          </div>

          <div className="flex flex-col gap-10">
            {!novedades || novedades.length === 0 ? (
              <div className="text-center py-20 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                <h2 className="text-xl font-poppins font-semibold text-neutral-800 dark:text-neutral-200 mb-2">No hay novedades por el momento</h2>
                <p className="text-neutral-500">Vuelve pronto para enterarte de lo nuevo.</p>
              </div>
            ) : (
              novedades.map((novedad: any) => (
                <article
                  key={novedad.id}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row group"
                >
                  {novedad.cover_image && (
                    <div className="w-full md:w-2/5 lg:w-1/3 aspect-video md:aspect-auto relative overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                      <img
                        src={novedad.cover_image}
                        alt={novedad.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}

                  <div className="flex flex-col p-6 md:p-8 flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      {novedad.product?.title && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-semibold rounded-full font-poppins">
                          {novedad.product.title}
                        </span>
                      )}
                      <time className="text-sm text-neutral-800 font-medium">
                        {new Date(novedad.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </time>
                    </div>

                    <h2 className="text-2xl font-poppins font-bold text-neutral-900 dark:text-white mb-3 group-hover:text-blue-600 transition-colors">
                      <Link href={`/novedades/${novedad.id}`} className="focus:outline-none">
                        {renderTitle(novedad.title, 28)}
                      </Link>
                    </h2>

                    <p className="text-neutral-600 dark:text-neutral-300 line-clamp-3 mb-6 font-poppins leading-relaxed">
                      {stripMarkdown(novedad.content)}
                    </p>

                    <div className="mt-auto pt-4 flex">
                      <Link
                        href={`/novedades/${novedad.id}`}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold font-poppins transition-colors"
                      >
                        Ver más
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
        </div>
      </div>
    </div>
  );
}
