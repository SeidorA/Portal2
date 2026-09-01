import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import MarkdownRenderer from '@/app/components/MarkdownRenderer';
import Link from 'next/link';
import { Button } from 'caralstable';
import { link } from 'node:fs';
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

  return (
    <div>
      <Navbar />
      <div className="flex flex-col w-full max-w-7xl mx-auto py-12 px-4">
        <Link href="/novedades">
          <Button variant="ghost" iconName='arrowLeft' className='w-fit mb-5!'>Volver a Novedades</Button>
        </Link>
        <article className="flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
          {novedad.cover_image && (
            <div className="w-full h-[300px] md:h-[400px] lg:h-[500px] relative overflow-hidden bg-neutral-100 dark:bg-neutral-800">
              <img
                src={novedad.cover_image}
                alt={novedad.title}
                className="w-full h-full object-cover"
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
              <time className="text-sm text-neutral-500 dark:text-neutral-400 font-medium font-poppins">
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
        </article>
      </div>
    </div>
  );
}
