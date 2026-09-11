import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import MarkdownRenderer from '@/app/components/MarkdownRenderer';
import RoadmapViewer from '@/app/components/RoadmapViewer';
import ReleaseNoteViewer from '@/app/components/ReleaseNoteViewer';
import BattlecardViewer from '@/app/components/BattlecardViewer';
import BrandbookViewer, { BrandbookPageType } from '@/app/components/BrandbookViewer';
import Sidebar, { SidebarSection } from '@/app/components/Sidebar';
import Link from 'next/link';
import { Button } from 'caralstable';
import TableOfContents from '@/app/components/TableOfContents';
import BookmarkButton from '@/app/components/BookmarkButton';
import { Metadata } from 'next';
import { CaralIcon, Brand } from 'iconcaral2';

const BRANDBOOK_PAGES: Record<string, { pageType: BrandbookPageType; title: string; icon: string; order: number }> = {
  'recursos-graficos-logo': { pageType: 'logo', title: 'Logo', icon: 'image', order: 1 },
  'logo': { pageType: 'logo', title: 'Logo', icon: 'image', order: 1 },
  'recursos-graficos-isologo': { pageType: 'isologo', title: 'Isologo / Isotipo', icon: 'image', order: 2 },
  'isologo': { pageType: 'isologo', title: 'Isologo / Isotipo', icon: 'image', order: 2 },
  'isotipo': { pageType: 'isologo', title: 'Isologo / Isotipo', icon: 'image', order: 2 },
  'recursos-graficos-isologo-negativo': { pageType: 'isologo-negativo', title: 'Isologo Negativo (B&W)', icon: 'eye', order: 3 },
  'isologo-negativo': { pageType: 'isologo-negativo', title: 'Isologo Negativo (B&W)', icon: 'eye', order: 3 },
  'blanco-y-negro': { pageType: 'isologo-negativo', title: 'Isologo Negativo (B&W)', icon: 'eye', order: 3 },
  'positivo-negativo': { pageType: 'isologo-negativo', title: 'Isologo Negativo (B&W)', icon: 'eye', order: 3 },
  'recursos-graficos-zona-de-seguridad': { pageType: 'zona-de-seguridad', title: 'Zona de Seguridad', icon: 'grid', order: 4 },
  'zona-de-seguridad': { pageType: 'zona-de-seguridad', title: 'Zona de Seguridad', icon: 'grid', order: 4 },
  'recursos-graficos-color': { pageType: 'color', title: 'Paleta de Color', icon: 'settings', order: 5 },
  'color': { pageType: 'color', title: 'Paleta de Color', icon: 'settings', order: 5 },
  'colores': { pageType: 'color', title: 'Paleta de Color', icon: 'settings', order: 5 },
  'paleta': { pageType: 'color', title: 'Paleta de Color', icon: 'settings', order: 5 },
  'recursos-graficos-tipografia': { pageType: 'tipografia', title: 'Tipografía', icon: 'file', order: 6 },
  'tipografia': { pageType: 'tipografia', title: 'Tipografía', icon: 'file', order: 6 },
  'recursos-graficos-descargas': { pageType: 'descargas', title: 'Zona de Descarga', icon: 'arrowDownToLine', order: 7 },
  'descargas': { pageType: 'descargas', title: 'Zona de Descarga', icon: 'arrowDownToLine', order: 7 },
  'zona-de-descarga': { pageType: 'descargas', title: 'Zona de Descarga', icon: 'arrowDownToLine', order: 7 },
  'recursos-graficos-connections-diagram': { pageType: 'connections-diagram', title: 'Diagrama de Conexiones', icon: 'diagram', order: 8 },
  'connections-diagram': { pageType: 'connections-diagram', title: 'Diagrama de Conexiones', icon: 'diagram', order: 8 },
  'diagrama-de-conexiones': { pageType: 'connections-diagram', title: 'Diagrama de Conexiones', icon: 'diagram', order: 8 },
  'recursos-graficos-deployment-options': { pageType: 'deployment-options', title: 'Opciones de Despliegue', icon: 'cloud', order: 9 },
  'deployment-options': { pageType: 'deployment-options', title: 'Opciones de Despliegue', icon: 'cloud', order: 9 },
  'opciones-de-despliegue': { pageType: 'deployment-options', title: 'Opciones de Despliegue', icon: 'cloud', order: 9 },
  'recursos-graficos-generate-cover': { pageType: 'generate-cover', title: 'Generador de Portadas', icon: 'image', order: 10 },
  'generate-cover': { pageType: 'generate-cover', title: 'Generador de Portadas', icon: 'image', order: 10 },
  'generador-de-portadas': { pageType: 'generate-cover', title: 'Generador de Portadas', icon: 'image', order: 10 },
  'recursos-graficos-generate-deck': { pageType: 'generate-deck', title: 'Generador de Presentaciones', icon: 'presentation', order: 11 },
  'generate-deck': { pageType: 'generate-deck', title: 'Generador de Presentaciones', icon: 'presentation', order: 11 },
  'generador-de-presentaciones': { pageType: 'generate-deck', title: 'Generador de Presentaciones', icon: 'presentation', order: 11 }
};

export async function generateMetadata({
  params
}: {
  params: Promise<{ product_slug: string, doc_slug: string }>
}): Promise<Metadata> {
  const supabase = await createClient();
  const { product_slug, doc_slug } = await params;

  const { data: product } = await supabase
    .from('products')
    .select('id, title, assets')
    .eq('slug', product_slug)
    .single();

  if (!product) return {};

  const brandbookInfo = BRANDBOOK_PAGES[doc_slug];
  if (brandbookInfo) {
    return {
      title: `${brandbookInfo.title} - Recursos Gráficos - ${product.title}`,
      description: `Manual de identidad visual y recursos gráficos de ${product.title}`,
    };
  }

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

  // 1. Get Product with full assets
  const { data: product } = await supabase
    .from('products')
    .select('id, title, slug, icon_name, features, link_demo, link_landing, link_docs, assets, light_image, dark_image')
    .eq('slug', product_slug)
    .single();

  if (!product) notFound();

  const brandbookInfo = BRANDBOOK_PAGES[doc_slug];
  const isBrandbookPage = Boolean(brandbookInfo);
  const isGraphicModuleEnabled = Boolean(product.assets?.enable_graphic_module ?? false);

  if (isBrandbookPage && !isGraphicModuleEnabled) {
    notFound();
  }

  // Check auth for Edit button
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Fetch all docs for this product (to build Sidebar and Topbar)
  const { data: allDocs, error: allDocsError } = await supabase
    .from('documentation')
    .select('id, title, slug, module_id, section, order_index, content, icon_name, use_brand, hide_toc, description, type, updated_at')
    .eq('product_id', product.id)
    .order('order_index', { ascending: true });

  if (!isBrandbookPage) {
    if (allDocsError || !allDocs || allDocs.length === 0) {
      notFound();
    }
  }

  // 3. Find current document (if not brandbook)
  const currentDoc = (allDocs || []).find(d => d.slug === doc_slug);
  if (!isBrandbookPage && !currentDoc) notFound();

  // Fetch modules for this product to build top tabs
  const { data: modules } = await supabase
    .from('modules')
    .select('id, title, order_index, is_hidden')
    .eq('product_id', product.id)
    .eq('is_hidden', false)
    .order('order_index', { ascending: true });

  const activeModule = isBrandbookPage ? 'recursos-graficos' : currentDoc?.module_id;

  // 4. Build Top Bar Modules (Tabs)
  const topTabs: any[] = (modules || []).map(mod => {
    const firstDocForModule = (allDocs || []).find(d => d.module_id === mod.id);
    if (!firstDocForModule) return null;
    return {
      id: mod.id,
      title: mod.title,
      href: `/docs/${product_slug}/${firstDocForModule.slug}`,
      isActive: !isBrandbookPage && mod.id === activeModule
    };
  }).filter(Boolean);

  // Add "Recursos gráficos" tab if graphic module is enabled
  if (isGraphicModuleEnabled) {
    topTabs.push({
      id: 'recursos-graficos',
      title: 'Recursos gráficos',
      href: `/docs/${product_slug}/recursos-graficos-logo`,
      isActive: isBrandbookPage
    });
  }

  // 5. Build Dynamic Sidebar Sections
  const sidebarDynamicSections: SidebarSection[] = [];

  if (isBrandbookPage) {
    sidebarDynamicSections.push({
      title: 'Recursos Gráficos',
      items: [
        {
          label: 'Logo',
          icon: null,
          isBrand: false,
          href: `/docs/${product_slug}/recursos-graficos-logo`,
          variant: brandbookInfo.pageType === 'logo' ? 'info' : 'ghost'
        },
        {
          label: 'Isologo / Isotipo',
          icon: null,
          isBrand: false,
          href: `/docs/${product_slug}/recursos-graficos-isologo`,
          variant: brandbookInfo.pageType === 'isologo' ? 'info' : 'ghost'
        },
        {
          label: 'Isologo Negativo (B&W)',
          icon: null,
          isBrand: false,
          href: `/docs/${product_slug}/recursos-graficos-isologo-negativo`,
          variant: brandbookInfo.pageType === 'isologo-negativo' ? 'info' : 'ghost'
        },
        {
          label: 'Zona de Seguridad',
          icon: null,
          isBrand: false,
          href: `/docs/${product_slug}/recursos-graficos-zona-de-seguridad`,
          variant: brandbookInfo.pageType === 'zona-de-seguridad' ? 'info' : 'ghost'
        },
        {
          label: 'Paleta de Color',
          icon: null,
          isBrand: false,
          href: `/docs/${product_slug}/recursos-graficos-color`,
          variant: brandbookInfo.pageType === 'color' ? 'info' : 'ghost'
        },
        {
          label: 'Tipografía',
          icon: null,
          isBrand: false,
          href: `/docs/${product_slug}/recursos-graficos-tipografia`,
          variant: brandbookInfo.pageType === 'tipografia' ? 'info' : 'ghost'
        },
        {
          label: 'Zona de Descarga',
          icon: null,
          isBrand: false,
          href: `/docs/${product_slug}/recursos-graficos-descargas`,
          variant: brandbookInfo.pageType === 'descargas' ? 'info' : 'ghost'
        }
      ]
    });

    sidebarDynamicSections.push({
      title: 'Ayudas',
      items: [
        {
          label: 'Diagrama de Conexiones',
          icon: null,
          isBrand: false,
          href: `/docs/${product_slug}/recursos-graficos-connections-diagram`,
          variant: brandbookInfo.pageType === 'connections-diagram' ? 'info' : 'ghost'
        },
        {
          label: 'Opciones de Despliegue',
          icon: null,
          isBrand: false,
          href: `/docs/${product_slug}/recursos-graficos-deployment-options`,
          variant: brandbookInfo.pageType === 'deployment-options' ? 'info' : 'ghost'
        },
        {
          label: 'Generador de Portadas',
          icon: null,
          isBrand: false,
          href: `/docs/${product_slug}/recursos-graficos-generate-cover`,
          variant: brandbookInfo.pageType === 'generate-cover' ? 'info' : 'ghost'
        },
        {
          label: 'Generador de Presentaciones',
          icon: null,
          isBrand: false,
          href: `/docs/${product_slug}/recursos-graficos-generate-deck`,
          variant: brandbookInfo.pageType === 'generate-deck' ? 'info' : 'ghost'
        }
      ]
    });
  } else {
    const activeModuleDocs = (allDocs || []).filter(d => d.module_id === activeModule);

    const buildTree = (parentId: string | null): any[] => {
      const children = activeModuleDocs
        .filter(d => {
          if (parentId === null) {
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
    if (currentDoc && currentDoc.type === 'release_note' && currentDoc.content) {
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

    if (currentDoc && currentDoc.type === 'release_note' && releaseNotesData) {
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
          sidebarDynamicSections.push({
            title: item.label,
            items: item.children
          });
        } else {
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

  // 6. Generate Table of Contents
  let toc: { level: number, title: string, id: string }[] = [];
  if (isBrandbookPage) {
    if (brandbookInfo.pageType === 'logo') {
      toc = [
        { level: 2, title: 'Versiones de Logotipo', id: 'versiones-de-logotipo' },
        { level: 2, title: 'Especificaciones de Uso', id: 'especificaciones-de-uso' }
      ];
    } else if (brandbookInfo.pageType === 'isologo') {
      toc = [
        { level: 2, title: 'Variantes del Isologo', id: 'variantes-del-isologo' }
      ];
    } else if (brandbookInfo.pageType === 'isologo-negativo') {
      toc = [
        { level: 2, title: 'Versiones Monocromáticas', id: 'versiones-monocromaticas' }
      ];
    } else if (brandbookInfo.pageType === 'zona-de-seguridad') {
      toc = [
        { level: 2, title: 'Diagrama de Seguridad', id: 'diagrama-de-seguridad' }
      ];
    } else if (brandbookInfo.pageType === 'color') {
      toc = [
        { level: 2, title: 'Paleta de Colores', id: 'paleta-de-colores' }
      ];
    } else if (brandbookInfo.pageType === 'tipografia') {
      toc = [
        { level: 2, title: 'Espécimen Tipográfico', id: 'especimen-tipografico' },
        { level: 2, title: 'Jerarquía y Escala Tipográfica', id: 'jerarquia-tipografica' }
      ];
    } else if (brandbookInfo.pageType === 'descargas') {
      toc = [
        { level: 2, title: 'Rack de Descargas', id: 'rack-de-descargas' }
      ];
    }
  } else if (currentDoc) {
    const headingRegex = /(?:^|\n)(#{2,3})\s+([^\n]+)/g;
    let match;
    while ((match = headingRegex.exec(currentDoc.content)) !== null) {
      const level = match[1].length;
      let title = match[2].trim();
      if (title.endsWith('\r')) title = title.slice(0, -1);
      const cleanTitle = title.replace(/[*_`]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/!(?:icon|brand)-[\w-]+!/g, '').trim();
      const id = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      toc.push({ level, title: cleanTitle, id });
    }
  }

  let releaseNotesData: any = null;
  if (currentDoc && currentDoc.type === 'release_note' && currentDoc.content) {
    try {
      const res = await fetch(currentDoc.content);
      if (res.ok) {
        releaseNotesData = await res.json();
      }
    } catch (e) {
      console.error('Failed to fetch release notes:', e);
    }
  }

  return (
    <div className="h-full w-full">
      {/* TOP BAR (Ancestors / Modules) */}
      <header className="h-[60px] bg-container/50 border-b border-neutral-800/50 dark:border-neutral-800/50 backdrop-blur-md sticky top-0 z-10 flex items-end px-8 gap-6">
        <div className="hidden md:!block font-bold font-poppins text-lg mr-4 border-r border-neutral-300 dark:border-neutral-700 pr-6 pb-4">
          {product.title}
        </div>
        <nav className="flex gap-1 items-center overflow-x-auto no-scrollbar">
          {topTabs.map((tab: any) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`
                  px-3 pb-4 text-sm font-medium transition-colors whitespace-nowrap
                  ${tab.isActive
                  ? 'text-info-main border-b-2 border-info-main font-semibold'
                  : 'text-neutral-600 hover:text-info-main/80 dark:text-neutral-400 dark:hover:text-neutral-200'
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
        <Sidebar
          dynamicSections={sidebarDynamicSections}
          className="sticky top-[60px] h-[calc(100vh-60px)]"
        />

        {/* MAIN CONTENT WRAPPER */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* DOCUMENT & TOC AREA */}
          <div className="flex flex-1 max-w-8xl mx-auto w-full lg:px-8 md:px-0 pb-10 gap-10 items-start relative">

            {/* MAIN CONTENT */}
            <main className="flex-1 min-w-0 px-6 pt-6">

              {isBrandbookPage ? (
                <>
                  <div className="mb-8 flex justify-between items-center gap-4">
                    <div>
                      <h1 className="text-4xl font-poppins font-bold text-neutral-900 mb-3 dark:text-white">
                        {brandbookInfo.title}
                      </h1>
                      <p className="text-base text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed">
                        {['connections-diagram', 'deployment-options', 'generate-cover', 'generate-deck'].includes(brandbookInfo.pageType)
                          ? `Herramientas interactivas y recursos de ayuda para ${product.title}.`
                          : `Recursos gráficos y lineamientos oficiales de identidad visual para ${product.title}.`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <BookmarkButton
                        url={`/docs/${product_slug}/${doc_slug}`}
                        title={`${brandbookInfo.title} - ${product.title}`}
                        category={['connections-diagram', 'deployment-options', 'generate-cover', 'generate-deck'].includes(brandbookInfo.pageType) ? "Ayudas" : "Recursos Gráficos"}
                        showText={true}
                        className="border border-neutral-200 dark:border-neutral-700 bg-white/80 dark:bg-neutral-800/80 shadow-2xs"
                      />
                    </div>
                  </div>

                  <BrandbookViewer pageType={brandbookInfo.pageType} product={product} />

                  <div className="mt-12 pt-6 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500 flex items-center justify-between">
                    <span>{['connections-diagram', 'deployment-options', 'generate-cover', 'generate-deck'].includes(brandbookInfo.pageType) ? 'Ayudas' : 'Recursos Gráficos'} • {product.title}</span>
                    <span>Portal Brand Guidelines</span>
                  </div>
                </>
              ) : currentDoc && (
                <>
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

                    <div className="flex items-center gap-2 shrink-0">
                      <BookmarkButton
                        url={`/docs/${product_slug}/${currentDoc.slug}`}
                        title={currentDoc.title}
                        category="Base de Conocimientos"
                        showText={true}
                        className="border border-neutral-200 dark:border-neutral-700 bg-white/80 dark:bg-neutral-800/80 shadow-2xs"
                      />

                      {user && (
                        <Link href={`/contenido/edit/${currentDoc.id}`} className="hidden md:!block">
                          <Button
                            variant="ghost"
                            iconName='edit'
                            className="flex items-center gap-2 border border-neutral-200 dark:border-neutral-700">
                            Editar entrada
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>

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

                  <div className="mt-10 pt-6 border-t border-neutral-100 dark:border-neutral-800 text-sm text-neutral-800">
                    Última actualización: {new Date(currentDoc.updated_at || Date.now()).toLocaleDateString()}
                  </div>
                </>
              )}

            </main>

            {/* TABLE OF CONTENTS (Right Sticky Sidebar) */}
            {!isBrandbookPage && !currentDoc?.hide_toc && currentDoc?.type !== 'release_note' && currentDoc?.type !== 'roadmap' && currentDoc?.type !== 'battlecard' && (
              <TableOfContents toc={toc} rawContent={currentDoc?.content} />
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
