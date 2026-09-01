import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import MarkdownRenderer from '@/app/components/MarkdownRenderer';
import RoadmapViewer from '@/app/components/RoadmapViewer';
import ReleaseNoteViewer from '@/app/components/ReleaseNoteViewer';
import BattlecardViewer from '@/app/components/BattlecardViewer';
import Sidebar, { SidebarSection } from '@/app/components/Sidebar';
import Link from 'next/link';
import DocsSidebarToggle from '@/app/components/DocsSidebarToggle';
import { Button } from 'caralstable';
import TableOfContents from '@/app/components/TableOfContents';
import { Metadata } from 'next';
import { CaralIcon, Brand } from 'iconcaral2';

export async function generateMetadata({
  params
}: {
  params: Promise<{ product_slug: string, doc_slug: string }>
}): Promise<Metadata> {
  const supabase = await createClient();
  const { product_slug, doc_slug } = await params;

  const { data: product } = await supabase
    .from('products')
    .select('id, title')
    .eq('slug', product_slug)
    .single();

  if (!product) return {};

  const { data: doc } = await supabase
    .from('documentation')
    .select('title, description')
    .eq('product_id', product.id)
    .eq('slug', doc_slug)
    .single();

  if (!doc) return {};

  return {
    title: `${doc.title} - ${product.title}`,
    description: doc.description || `Documentación de ${doc.title} para ${product.title}`,
  };
}

export default async function DocumentViewerPage({
  params
}: {
  params: Promise<{ product_slug: string, doc_slug: string }>
}) {
  const supabase = await createClient();
  const { product_slug, doc_slug } = await params;

  // 1. Get Product
  const { data: product } = await supabase
    .from('products')
    .select('id, title, icon_name, features, link_demo, link_landing, link_docs')
    .eq('slug', product_slug)
    .single();

  if (!product) notFound();

  // Check auth for Edit button
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Fetch all docs for this product (to build Sidebar and Topbar)
  const { data: allDocs, error: allDocsError } = await supabase
    .from('documentation')
    .select('id, title, slug, module_id, section, order_index, content, icon_name, use_brand, hide_toc, description, type')
    .eq('product_id', product.id)
    .order('order_index', { ascending: true });

  if (allDocsError || !allDocs || allDocs.length === 0) {
    notFound();
  }

  // 3. Find current document
  const currentDoc = allDocs.find(d => d.slug === doc_slug);
  if (!currentDoc) notFound();

  // Fetch modules for this product to build top tabs
  const { data: modules } = await supabase
    .from('modules')
    .select('id, title, order_index, is_hidden')
    .eq('product_id', product.id)
    .eq('is_hidden', false)
    .order('order_index', { ascending: true });

  const activeModule = currentDoc.module_id;
  const activeModuleTitle = modules?.find(m => m.id === activeModule)?.title || 'Recursos';

  // 4. Build Top Bar Modules (Tabs)
  // Only show modules that have at least one published/visible document to link to
  const topTabs = (modules || []).map(mod => {
    const firstDocForModule = allDocs.find(d => d.module_id === mod.id);
    if (!firstDocForModule) return null;
    return {
      id: mod.id,
      title: mod.title,
      href: `/docs/${product_slug}/${firstDocForModule.slug}`,
      isActive: mod.id === activeModule
    };
  }).filter(Boolean);

  // 5. Build Dynamic Sidebar Sections for the ACTIVE Module
  const activeModuleDocs = allDocs.filter(d => d.module_id === activeModule);

  // Función recursiva para construir el árbol de navegación
  const buildTree = (parentId: string | null): any[] => {
    const children = activeModuleDocs
      .filter(d => {
        if (parentId === null) {
          // Raíz: no tiene section, o su section no existe
          if (!d.section) return true;
          const parentExists = activeModuleDocs.find(s => s.id === d.section);
          return !parentExists;
        } else {
          return d.section === parentId;
        }
      })
      .sort((a, b) => a.order_index - b.order_index);

    return children.map(child => {
      const isSection = child.type === 'section' || activeModuleDocs.some(d => d.section === child.id);
      if (isSection) {
        return {
          label: child.title,
          icon: child.icon_name || null,
          isBrand: false,
          children: buildTree(child.id)
        };
      } else {
        return {
          label: child.title,
          icon: child.icon_name || null,
          isBrand: false,
          href: `/docs/${product_slug}/${child.slug}`,
          variant: child.slug === doc_slug ? 'info' : 'ghost'
        };
      }
    });
  };

  let releaseNotesData: any = null;
  if (currentDoc.type === 'release_note' && currentDoc.content) {
    try {
      const res = await fetch(currentDoc.content);
      if (res.ok) {
        releaseNotesData = await res.json();
      }
    } catch (e) {
      console.error('Failed to fetch release notes:', e);
    }
  }

  const recursiveItems = buildTree(null);

  const sidebarDynamicSections: SidebarSection[] = [];

  if (currentDoc.type === 'release_note' && releaseNotesData) {
    const versions = Object.keys(releaseNotesData).sort((a, b) => b.localeCompare(a));
    sidebarDynamicSections.push({
      title: 'Versiones',
      items: versions.map(v => ({
        label: releaseNotesData[v].version,
        icon: 'box',
        isBrand: false,
        href: `#v${v}`,
        variant: 'ghost'
      }))
    });
  } else {
    recursiveItems.forEach(item => {
      if (item.children) {
        // Si es una sección en el nivel raíz, la hacemos un grupo de texto estático
        sidebarDynamicSections.push({
          title: item.label,
          items: item.children
        });
      } else {
        // Documento suelto en la raíz
        const lastSection = sidebarDynamicSections[sidebarDynamicSections.length - 1];
        if (lastSection && lastSection.title === null) {
          lastSection.items.push(item);
        } else {
          sidebarDynamicSections.push({
            title: null,
            items: [item]
          });
        }
      }
    });
  }

  // Add the product links at the top of the sidebar only if we are in the first module (or 'Recursos')
  if (topTabs.length > 0 && topTabs[0]?.id === activeModule) {
    const defaultIcon = product.icon_name || 'apps';
    const linkItems: any[] = [];
    
    if (product.link_demo && product.link_demo.trim() !== '' && product.link_demo !== '#') {
      linkItems.push({
        label: 'Live Demo',
        icon: defaultIcon,
        isBrand: true,
        href: product.link_demo,
        variant: 'ghost'
      });
    }
    
    if (product.link_landing && product.link_landing.trim() !== '' && product.link_landing !== '#') {
      linkItems.push({
        label: 'Landing page',
        icon: defaultIcon,
        isBrand: true,
        href: product.link_landing,
        variant: 'ghost'
      });
    }
    
    if (product.link_docs && product.link_docs.trim() !== '' && product.link_docs !== '#') {
      linkItems.push({
        label: 'Documentation',
        icon: 'book',
        isBrand: false,
        href: product.link_docs,
        variant: 'ghost'
      });
    }

    if (linkItems.length > 0) {
      sidebarDynamicSections.unshift({
        title: null,
        items: linkItems
      });
    }
  }

  // 6. Generate Table of Contents from current doc markdown (H2 and H3 only)
  const toc: { level: number, title: string, id: string }[] = [];
  // Use a more robust regex that ignores \r
  const headingRegex = /(?:^|\n)(#{2,3})\s+([^\n]+)/g;
  let match;
  while ((match = headingRegex.exec(currentDoc.content)) !== null) {
    const level = match[1].length;
    let title = match[2].trim();
    if (title.endsWith('\r')) title = title.slice(0, -1);

    // Remove markdown formatting like **, *, _, ` and icon tags
    const cleanTitle = title.replace(/[*_`]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/!(?:icon|brand)-[\w-]+!/g, '').trim();
    const id = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    toc.push({ level, title: cleanTitle, id });
  }

  return (
    <div className="h-full w-full">
      {/* TOP BAR (Ancestors) */}
      <header className="h-[60px] bg-container/50 border-b border-neutral-800/50 dark:border-neutral-800/50 backdrop-blur-md sticky top-0 z-10 flex items-end px-8 gap-6">
        <div className="font-bold font-poppins text-lg mr-4 border-r border-neutral-300 dark:border-neutral-700 pr-6 pb-4">
          {product.title}
        </div>
        <nav className="flex gap-1 items-center">
          {topTabs.map((tab: any) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`
                  px-2 pb-4 text-sm font-medium transition-colors
                  ${tab.isActive
                  ? 'text-info-main border-b-2 border-info-main'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-info-main/80'
                }
                `}
            >
              {tab.title}
            </Link>
          ))}
        </nav>
      </header>

      <div className="flex w-full h-full min-h-screen items-start">
        {/* SIDEBAR (Dynamic) */}
        <div className="sticky top-[60px] h-[calc(100vh-60px)] shrink-0">
          <Sidebar dynamicSections={sidebarDynamicSections} />
        </div>

        {/* MAIN CONTENT WRAPPER */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* DOCUMENT & TOC AREA */}
          <div className="flex flex-1 max-w-8xl mx-auto w-full px-8 md:px-0 pb-10 gap-10 items-start relative">

            {/* MARKDOWN CONTENT */}
            <main className="flex-1 min-w-0 px-10">

              <div className="mb-8 flex justify-between items-center gap-4">
                <div>
                  <h1 className="text-4xl font-poppins font-bold text-neutral-900 mb-4 dark:text-white flex items-center gap-4">
                    {currentDoc.icon_name && (
                      <span className="inline-flex shrink-0 bg-neutral-100 rounded-full p-4 text-neutral-900 dark:text-neutral-500!">
                        {currentDoc.use_brand ? (
                          <Brand name={currentDoc.icon_name as any} size={40} />
                        ) : (
                          <CaralIcon name={currentDoc.icon_name as any} size={40} />
                        )}
                      </span>
                    )}
                    {currentDoc.title}
                  </h1>

                  {currentDoc.description && currentDoc.type !== 'release_note' && (
                    <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
                      {currentDoc.description}
                    </p>
                  )}
                </div>

                {user && (
                  <Link href={`/contenido/edit/${currentDoc.id}`}>
                    <Button
                      variant="ghost"
                      iconName='edit'
                      className="shrink-0 flex items-center gap-2 border border-neutral-200 dark:border-neutral-700">
                      Editar entrada
                    </Button>
                  </Link>
                )}
              </div>

              {(() => {
                console.log("Raw description from DB for", currentDoc.title, "is:", currentDoc.description);
                return null;
              })()}
              {currentDoc.type === 'release_note' ? (
                <ReleaseNoteViewer
                  data={releaseNotesData}
                  docBaseUrl={(() => {
                    try { return JSON.parse(currentDoc.description || '{}').docBaseUrl || ''; }
                    catch { return ''; }
                  })()}
                  imgFolder={(() => {
                    try { return JSON.parse(currentDoc.description || '{}').imgFolder || ''; }
                    catch { return currentDoc.description || ''; }
                  })()}
                />
              ) : currentDoc.type === 'roadmap' ? (
                <RoadmapViewer
                  content={currentDoc.content}
                  productTitle={product.title}
                  productIcon={product.icon_name}
                />
              ) : currentDoc.type === 'battlecard' ? (
                <BattlecardViewer
                  content={currentDoc.content}
                  productTitle={product.title}
                  productIcon={product.icon_name}
                  productFeatures={product.features}
                />
              ) : (
                <MarkdownRenderer content={currentDoc.content} />
              )}

              <div className="mt-10 pt-6 border-t border-neutral-100 dark:border-neutral-800 text-sm text-neutral-800 dark:text-neutral-400">
                Última actualización: {new Date(currentDoc.updated_at || Date.now()).toLocaleDateString()}
              </div>

            </main>

            {/* TABLE OF CONTENTS (Right Sticky Sidebar) */}
            {!currentDoc.hide_toc && currentDoc.type !== 'release_note' && currentDoc.type !== 'roadmap' && currentDoc.type !== 'battlecard' && <TableOfContents toc={toc} />}

          </div>
        </div>
      </div>
    </div>
  );
}
