import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Sidebar, { SidebarSection } from '@/app/components/Sidebar';

export default async function DocsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ product_slug: string }>;
}) {
  const supabase = await createClient();
  const { product_slug } = await params;

  // 1. Get Product
  const { data: product, error: prodError } = await supabase
    .from('products')
    .select('*')
    .eq('slug', product_slug)
    .single();

  if (prodError || !product) {
    notFound();
  }

  // 2. Get all docs for this product to build the sidebar and ancestors bar
  const { data: docs } = await supabase
    .from('documentation')
    .select('id, title, slug, ancestor, section, order_index')
    .eq('product_id', product.id)
    .order('order_index', { ascending: true });

  // 3. Extract unique Ancestors and build dynamic Sidebar Sections
  const ancestorsMap: Record<string, string> = {}; // ancestor -> first doc slug
  const hierarchy: Record<string, Record<string, any[]>> = {};
  
  if (docs) {
    docs.forEach(doc => {
      const ancestor = doc.ancestor || 'Recursos';
      const section = doc.section || 'General';
      
      if (!hierarchy[ancestor]) hierarchy[ancestor] = {};
      if (!hierarchy[ancestor][section]) hierarchy[ancestor][section] = [];
      hierarchy[ancestor][section].push(doc);

      // Save the first doc slug for each ancestor for the Top Bar links
      if (!ancestorsMap[ancestor]) {
        ancestorsMap[ancestor] = doc.slug;
      }
    });
  }

  // Convert hierarchy to SidebarSections for the CURRENT ancestor.
  // Wait, in a Server Component layout, how do we know the "current" ancestor? 
  // We don't have access to the full URL path in layout.tsx natively to check the active doc_slug unless we parse headers or pass it from page.tsx.
  // The simplest way to show the Sidebar is to render ALL sections for ALL ancestors, or group them. 
  // If the user wants a Top Bar that filters the sidebar... we can either use client-side state for the active ancestor, or just pass ALL of them to the Sidebar and group them.
  // Since the original Sidebar doesn't have collapsible "Ancestors", let's build the dynamic sections for ALL ancestors but append the Ancestor name to the section title, or just build one massive sidebar.
  // Actually, the user asked for a top bar for Ancestors. To make it dynamic without client state, we would need the URL to be `/docs/[product_slug]/[ancestor_slug]/[doc_slug]`. 
  // But our URL is just `/docs/[product_slug]/[doc_slug]`. So we can find the active Ancestor by looking at the current `doc_slug`.
  // Wait, `layout.tsx` doesn't get `doc_slug` in its params! Next.js layouts only get params up to their folder level.
  // Workaround: We can make `layout.tsx` a Client Component? No, we need to fetch from Supabase.
  // Workaround 2: We can just render the Sidebar inside `page.tsx` instead of `layout.tsx`.
  // Let's do that! We'll remove the Sidebar from `layout.tsx` and put it in `page.tsx` where we have `doc_slug`.

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 bg-neutral-50/50 dark:bg-neutral-950/50">
        {children}
      </div>
    </div>
  );
}
