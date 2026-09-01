import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import MarkdownRenderer from '@/app/components/MarkdownRenderer';
import Link from 'next/link';
import { Button } from 'caralstable';
import Navbar from '@/app/components/Navbar';
import { Brand, CaralIcon } from 'iconcaral2';
import TableOfContents from '@/app/components/TableOfContents';
import CopyHtmlButton from '@/app/components/CopyHtmlButton';

const renderTitle = (title: string, size: number = 24) => {
  if (!title) return title;
  const match = title.match(/^!(icon|brand)-([\w-]+)!\s*(.*)$/i);
  if (match) {
    const isBrand = match[1].toLowerCase() === 'brand';
    const iconName = match[2];
    const restOfTitle = match[3];
    return (
      <span className="flex items-center gap-3">
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

export default async function NovedadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: novedad, error } = await supabase
    .from('novedades')
    .select('*, product:products(title)')
    .eq('id', id)
    .single();

  if (error || !novedad) {
    notFound();
  }

  const toc: { level: number, title: string, id: string }[] = [];
  const headingRegex = /(?:^|\n)(#{2,3})\s+([^\n]+)/g;
  let matchHeadings;
  while ((matchHeadings = headingRegex.exec(novedad.content)) !== null) {
    const level = matchHeadings[1].length;
    let title = matchHeadings[2].trim();
    if (title.endsWith('\r')) title = title.slice(0, -1);

    const cleanTitle = title.replace(/[*_`]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/!(?:icon|brand)-[\w-]+!/g, '').trim();
    const id = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    toc.push({ level, title: cleanTitle, id });
  }

  return (
    <div>
      <Navbar />
      <div className="flex flex-col w-full max-w-[1400px] mx-auto py-12 px-4">
        <div className="flex items-center w-full mb-5">
          <Link href="/novedades">
            <Button variant="ghost" iconName='arrowLeft' className='w-fit'>Volver a Novedades</Button>
          </Link>

        </div>
        <div className="flex w-full justify-between gap-10 items-start">

          <article id="article-content" className="flex-1 flex flex-col min-w-0 bg-container pt-10 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
            {novedad.cover_image && (
              <div className="w-full h-auto">
                <img
                  src={novedad.cover_image}
                  alt={novedad.title}
                  className="w-full "
                />
              </div>
            )}

            <div className="p-8 md:p-12 lg:p-16">
              <div className="flex items-center gap-4 mb-6">
                {novedad.product?.title && (
                  <span className="px-4 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-sm font-bold rounded-full font-poppins">
                    {novedad.product.title}
                  </span>
                )}
                <time className="text-sm text-neutral-800 dark:text-neutral-400 font-medium font-poppins">
                  {new Date(novedad.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </time>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-poppins font-bold text-neutral-900 dark:text-white mb-10 leading-tight">
                {renderTitle(novedad.title, 40)}
              </h1>

              <div className="prose dark:prose-invert prose-lg max-w-none prose-headings:font-poppins prose-a:text-blue-600 dark:prose-a:text-blue-400">
                <MarkdownRenderer content={novedad.content} />
              </div>
            </div>
            <div className="m-4">
              <CopyHtmlButton targetId="article-content" />
            </div>
          </article>


          {toc.length > 0 && <TableOfContents toc={toc} />}
        </div>

      </div>
    </div>
  );
}
