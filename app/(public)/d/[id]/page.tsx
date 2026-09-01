'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import MarkdownRenderer from '@/app/components/MarkdownRenderer';
import DocumentCover from '@/app/components/DocumentCover';
import { CaralIcon, Brand } from 'iconcaral2';
import { Button } from 'caralstable';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { useRouter } from 'next/navigation';

export default function PublicDocumentView({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProductsData, setRelatedProductsData] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPagedMode, setIsPagedMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pageScale, setPageScale] = useState(1);
  const [pagesPerScreen, setPagesPerScreen] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [toolbarLeft, setToolbarLeft] = useState('50%');
  const [userId, setUserId] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<any>({});
  const [canEdit, setCanEdit] = useState(false);
  
  const router = useRouter();

  const fullscreenContainerRef = React.useRef<HTMLDivElement>(null);
  const scrollTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();
  const docId = unwrappedParams.id;

  useEffect(() => {
    async function fetchDoc() {
      const { data, error } = await supabase
        .from('portal_documents')
        .select('*')
        .eq('id', docId)
        .single();

      if (error) {
        console.error(error);
        setDoc(null);
      } else {
        setDoc(data);
        if (data.related_products && data.related_products.length > 0) {
          const { data: prods } = await supabase.from('products').select('id, title, assets, light_image, dark_image, icon_name').in('id', data.related_products);
          if (prods) setRelatedProductsData(prods);
        }
      }
      // Fetch user preferences
      const { data: { user } } = await supabase.auth.getUser();
      let initPrefs: any = {};

      try {
        const localPrefs = JSON.parse(localStorage.getItem('document_preferences') || '{}');
        initPrefs = { ...localPrefs };
      } catch (e) { }

      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase.from('profiles').select('document_preferences').eq('id', user.id).single();
        if (profile?.document_preferences) {
          initPrefs = { ...initPrefs, ...profile.document_preferences };
        }
        
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('roles(name)')
          .eq('user_id', user.id)
          .single();
          
        const roleName = (roleData?.roles as any)?.name?.toLowerCase();
        if (roleName === 'admin' || roleName === 'administrador' || roleName === 'editor') {
          setCanEdit(true);
        }
      }

      setPreferences(initPrefs);
      if (initPrefs.isSidebarOpen !== undefined) setIsSidebarOpen(initPrefs.isSidebarOpen);
      if (initPrefs.isPagedMode !== undefined) setIsPagedMode(initPrefs.isPagedMode);
      if (initPrefs.pagesPerScreen !== undefined) setPagesPerScreen(initPrefs.pagesPerScreen);

      setLoading(false);
    }

    if (docId) fetchDoc();
  }, [docId]);

  const updatePreference = async (updates: any) => {
    if (updates.isSidebarOpen !== undefined) setIsSidebarOpen(updates.isSidebarOpen);
    if (updates.isPagedMode !== undefined) setIsPagedMode(updates.isPagedMode);
    if (updates.pagesPerScreen !== undefined) setPagesPerScreen(updates.pagesPerScreen);

    const newPrefs = { ...preferences, ...updates };
    setPreferences(newPrefs);

    try {
      localStorage.setItem('document_preferences', JSON.stringify(newPrefs));
    } catch (e) { }

    if (userId) {
      await supabase.from('profiles').update({ document_preferences: newPrefs }).eq('id', userId);
    }
  };

  useEffect(() => {
    if (isPagedMode && typeof window !== 'undefined') {
      const updateScale = () => {
        const availableHeight = window.innerHeight - 32; // 32px padding
        const containerWidth = fullscreenContainerRef.current ? fullscreenContainerRef.current.clientWidth : window.innerWidth;
        const availableWidth = (containerWidth / pagesPerScreen) - 64; // 64px padding for safety

        setPageScale(Math.min(1, availableHeight / 1123, availableWidth / 794));
      };
      updateScale();
      window.addEventListener('resize', updateScale);
      return () => window.removeEventListener('resize', updateScale);
    } else {
      setPageScale(1);
    }
  }, [isPagedMode, pagesPerScreen]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    const el = fullscreenContainerRef.current;
    if (!el) return;

    const updatePosition = () => {
      const rect = el.getBoundingClientRect();
      setToolbarLeft(`${rect.left + rect.width / 2}px`);
    };

    updatePosition();
    const observer = new ResizeObserver(() => updatePosition());
    observer.observe(el);

    return () => observer.disconnect();
  }, [loading, doc]);
  useEffect(() => {
    if (!doc) return;

    const settings = doc.content?.settings || { pageSize: 'auto', showFooter: false };
    const contentPages = doc.content?.pages || (doc.content?.text ? [doc.content.text] : []);
    const hasCover = settings.pageSize === 'A4' && settings.cover?.hasCover;
    const maxPages = contentPages.length + (hasCover ? 1 : 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (isPagedMode) {
        if (e.key === 'ArrowRight') {
          setCurrentPage(prev => {
            const next = prev + pagesPerScreen;
            return next > maxPages ? prev : next;
          });
        } else if (e.key === 'ArrowLeft') {
          setCurrentPage(prev => {
            const prevPage = prev - pagesPerScreen;
            return prevPage < 1 ? 1 : prevPage;
          });
        }
      } else {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          const scrollContainer = isFullscreen ? fullscreenContainerRef.current : document.querySelector('main');
          if (scrollContainer) {
            e.preventDefault();

            // Find current page in view
            let current = 1;
            for (let i = 1; i <= maxPages; i++) {
              const el = document.getElementById(`page-${i}`);
              if (el) {
                const rect = el.getBoundingClientRect();
                // If top of the page is above the middle of the screen
                if (rect.top < window.innerHeight / 2 + 100) {
                  current = i;
                }
              }
            }

            let target = current;
            if (e.key === 'ArrowDown') target = Math.min(maxPages, current + 1);
            if (e.key === 'ArrowUp') {
              const currentEl = document.getElementById(`page-${current}`);
              // If the top of the current page is near or below the top edge of the screen
              if (currentEl && currentEl.getBoundingClientRect().top > -50) {
                target = Math.max(1, current - 1);
              } else {
                target = current;
              }
            }

            const targetEl = document.getElementById(`page-${target}`);
            if (targetEl) {
              targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPagedMode, doc, isFullscreen, pagesPerScreen]);


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-neutral-950">
        <span className="text-neutral-500 animate-pulse font-poppins">Cargando documento...</span>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-white dark:bg-neutral-950 p-6">
        <h1 className="text-2xl font-bold font-poppins text-neutral-900 dark:text-neutral-100 mb-2">
          Documento no encontrado
        </h1>
        <p className="text-neutral-500 text-center">
          El documento que intentas ver no existe o ha sido eliminado.
        </p>
      </div>
    );
  }

  const settings = doc.content?.settings || { pageSize: 'auto', showFooter: false };
  const contentPages = doc.content?.pages || (doc.content?.text ? [doc.content.text] : []);
  const hasCover = settings.pageSize === 'A4' && settings.cover?.hasCover;
  const totalPages = contentPages.length + (hasCover ? 1 : 0);

  const handleExportPDF = async () => {
    if (typeof window === 'undefined') return;
    setIsExporting(true);

    // Esperar a que React renderice todas las páginas en modo continuo
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      const pages = document.querySelectorAll('.document-page');

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        const imgData = await toPng(page, {
          backgroundColor: '#ffffff',
          pixelRatio: 2,
          imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
          style: {
            margin: '0',
            transform: 'none'
          }
        });

        if (i > 0) {
          pdf.addPage();
        }

        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(`${doc?.title || 'Documento'}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleNextPage = () => {
    setCurrentPage(prev => {
      const next = prev + pagesPerScreen;
      return next > totalPages ? prev : next;
    });
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => {
      const prevPage = prev - pagesPerScreen;
      return prevPage < 1 ? 1 : prevPage;
    });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!isPagedMode) return;

    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 1;
    const isAtTop = target.scrollTop === 0;

    if (e.deltaY > 0 && isAtBottom) {
      if (!scrollTimeout.current) {
        handleNextPage();
        scrollTimeout.current = setTimeout(() => { scrollTimeout.current = null; }, 800);
      }
    } else if (e.deltaY < 0 && isAtTop) {
      if (!scrollTimeout.current) {
        handlePrevPage();
        scrollTimeout.current = setTimeout(() => { scrollTimeout.current = null; }, 800);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (fullscreenContainerRef.current) {
        fullscreenContainerRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
    } else {
      document.exitFullscreen();
    }
  };
  const pages = doc.content?.pages || (doc.content?.text ? [doc.content.text] : []);

  const effectivePagedMode = isPagedMode && !isExporting;

  const pagedStyle = (effectivePagedMode) && settings.pageSize === 'A4' ? {
    transform: `scale(${pageScale})`,
    transformOrigin: 'top center',
    marginBottom: `-${(1 - pageScale) * 1123}px`,
  } : undefined;

  return (
    <div className={`flex w-full relative ${isPagedMode ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      {/* Sidebar */}
      <div
        className={`transition-all duration-300 ease-in-out sticky top-0 h-screen border-r border-neutral-200 dark:border-neutral-800 bg-container ${isSidebarOpen ? 'w-100  opacity-100' : ' sticky top-0 w-0 opacity-0 overflow-hidden border-none'
          }`}
      >
        <div className="w-full h-full p-4 flex flex-col overflow-y-auto">
          <div className="flex items-start justify-between mb-6">
            <div className="flex flex-col gap-3 flex-1 pb-4 border-b border-neutral-700">
              {relatedProductsData.length > 0 ? (
                relatedProductsData.map((prod, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {prod.icon_name ? (
                      <Brand name={prod.icon_name} size={24} />
                    ) : (
                      <CaralIcon name="cube" size={24} />
                    )}
                    <h3 className="font-poppins font-bold text-neutral-900  text-lg leading-tight">
                      {prod.title}
                    </h3>
                  </div>
                ))
              ) : (
                <h3 className="font-poppins font-bold text-neutral-900 dark:text-neutral-100">Información</h3>
              )}
            </div>
            <button onClick={() => updatePreference({ isSidebarOpen: false })} className="text-neutral-700 hover:text-neutral-800 dark:hover:text-neutral-200 mt-1">
              <CaralIcon name="closeSidebarLeft" size={20} />
            </button>
          </div>

          <div className="space-y-6 pb-4 border-b border-neutral-900 w-full'">
            {doc.content?.metadata?.description && (
              <div className='py-4'>
                <h3 className="font-poppins font-semibold text-neutral-900 dark:text-neutral-100 text-base mb-1">{doc.title}</h3>

                <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{doc.content.metadata.description}</p>
              </div>
            )}

            <div>
              <h4 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider mb-2">Idioma</h4>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                {(doc.content?.metadata?.language || 'es') === 'es' ? 'Español' :
                  (doc.content?.metadata?.language === 'en' ? 'Inglés' :
                    (doc.content?.metadata?.language === 'pt' ? 'Portugués' :
                      (doc.content?.metadata?.language === 'de' ? 'Alemán' : doc.content?.metadata?.language || 'Español')))}
              </p>
            </div>

            {doc.content?.metadata?.tags && (
              <div>
                <h4 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider mb-2">Etiquetas</h4>
                <div className="flex flex-wrap gap-1.5">
                  {doc.content.metadata.tags.split(',').map((tag: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full text-[11px] font-medium text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className='space-y-6 py-4 border-b border-neutral-900 w-full'>
            <h4 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider mb-2">Controles</h4>
            <div className="flex items-center gap-2">
              <div className="flex gap-2 items-center">
                <span>Paginas</span>
                <p className='font-bold text-neutral-900 dark:text-neutral-100'>{currentPage}</p>
                |
                <p className='font-bold text-neutral-900 dark:text-neutral-100'>{totalPages}</p>
              </div>
              <div className="flex justify-between w-full border-l border-neutral-900 px-2">
                <Button onClick={() => setIsPagedMode(!isPagedMode)} iconName={isPagedMode ? 'list' : 'book'} isIconButton variant='light' className='border border-neutral-700' />
                <Button onClick={handlePrevPage} disabled={currentPage === 1} iconName='arrowLeft' isIconButton variant='light' className='border border-neutral-700' />
                <Button onClick={toggleFullscreen} iconName="arrowsMaximize" isIconButton variant='light' className='border border-neutral-700' />
                {isPagedMode && settings.pageSize === 'A4' && (
                  <Button
                    variant='light'
                    className='border border-neutral-700 text-black font-bold'
                    onClick={() => setPagesPerScreen(prev => prev === 1 ? 2 : 1)}
                  >
                    {pagesPerScreen}
                  </Button>
                )}
                <Button onClick={handleNextPage} disabled={currentPage + pagesPerScreen > totalPages} iconName='arrowRight' isIconButton variant='light' className='border border-neutral-700' />
              </div>
            </div>
          </div>

          <Button variant='info' iconName={isExporting ? 'loader' : 'arrowDownToLine'} className='w-full font-poppins font-semibold' onClick={handleExportPDF} disabled={isExporting}>
            {isExporting ? 'Generando PDF...' : 'Descargar PDF'}
          </Button>
          {canEdit && (
            <Button variant='ghost' iconName='edit' className='w-full mt-2 border border-neutral-500' onClick={() => router.push(`/documentos/edit/${docId}`)}>
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div
        ref={fullscreenContainerRef}
        onWheel={handleWheel}
        className={`flex-1 flex flex-col ${settings.pageSize === 'A4' ? 'bg-[#1E2837]' : 'bg-white dark:bg-neutral-950'} relative ${isFullscreen ? 'h-screen overflow-y-auto' : (effectivePagedMode ? 'h-screen overflow-hidden' : '')}`}
      >
        {!isSidebarOpen && !isFullscreen && (
          <>
            <div
              className="fixed bottom-6 z-50 left-1/2 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex items-center p-2"
              style={{ transform: 'translateX(-50%)' }}
            >
              {!isSidebarOpen && (
                <div className="border-r border-neutral-200 dark:border-neutral-700 pr-2 mr-2">
                  <Button onClick={() => updatePreference({ isSidebarOpen: true })} iconName="circleInfo" isIconButton variant='light' className='rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300' />
                </div>
              )}
              <div className="flex gap-3 items-center px-4 border-r border-neutral-200 dark:border-neutral-700 text-sm mr-2">
                <span className="text-neutral-600 dark:text-neutral-400">Pagina</span>
                <span className='font-bold text-neutral-900 dark:text-neutral-100'>{currentPage}</span>
                <span className="text-neutral-300 dark:text-neutral-600">|</span>
                <span className='font-bold text-neutral-800'>{totalPages}</span>
              </div>
              <div className="flex gap-2">

                <Button onClick={toggleFullscreen} iconName="arrowsMaximize" isIconButton variant='light' className='rounded-lg' />
                <Button onClick={() => updatePreference({ isPagedMode: !isPagedMode })} iconName={isPagedMode ? 'list' : 'book'} isIconButton variant='light' className='border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300' />
                <Button onClick={handleExportPDF} disabled={isExporting} iconName={isExporting ? 'loader' : 'arrowDownToLine'} isIconButton variant='light' className='border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300' />
                <Button onClick={handlePrevPage} disabled={currentPage === 1} iconName='arrowLeft' isIconButton variant='dark' className='rounded-lg' />
                {isPagedMode && settings.pageSize === 'A4' && (
                  <Button
                    variant='light'
                    className='border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 font-bold min-w-[40px] px-0 flex justify-center items-center'
                    onClick={() => updatePreference({ pagesPerScreen: pagesPerScreen === 1 ? 2 : 1 })}
                  >
                    {pagesPerScreen}
                  </Button>
                )}

                <Button onClick={handleNextPage} disabled={currentPage + pagesPerScreen > totalPages} iconName='arrowRight' isIconButton variant='dark' className='rounded-lg' />
              </div>
            </div>
          </>
        )}

        {doc.content?.metadata?.status === 'draft' && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-warning-main text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg opacity-80 pointer-events-none">
            Borrador
          </div>
        )}
        <div
          className={`w-full ${settings.pageSize === 'A4' ? (effectivePagedMode ? 'flex flex-row transition-transform duration-500 ease-in-out h-full' : 'flex flex-col gap-12 items-center mx-auto py-12') : 'max-w-4xl py-12 px-6 sm:px-12 mx-auto'}`}
          style={effectivePagedMode && settings.pageSize === 'A4' ? { width: `${(totalPages / pagesPerScreen) * 100}%`, transform: `translateX(-${(Math.floor((currentPage - 1) / pagesPerScreen)) * (100 / (totalPages / pagesPerScreen))}%)` } : undefined}
        >
          {doc.type === 'document' ? (
            <>
              {hasCover && (
                <div className={effectivePagedMode && settings.pageSize === 'A4' ? `flex items-center ${pagesPerScreen === 2 ? 'justify-end pr-2' : 'justify-center'} h-full relative` : ''} style={effectivePagedMode && settings.pageSize === 'A4' ? { width: `${100 / totalPages}%` } : undefined}>
                  <div id="page-1" style={pagedStyle} className={`document-page ${settings.pageSize === 'A4' ? 'w-[794px] min-h-[1123px] bg-white dark:bg-neutral-950 shadow-xl border border-neutral-200 dark:border-neutral-800 flex flex-col' : ''} relative overflow-hidden`}>
                    <DocumentCover
                      title={doc.title}
                      products={relatedProductsData}
                      coverSettings={settings.cover}
                      documentMetadata={doc.content?.metadata}
                    />
                  </div>
                </div>
              )}
              {contentPages.map((pageText: string, index: number) => {
                const pageNumber = hasCover ? index + 2 : index + 1;
                const globalIndex = hasCover ? index + 1 : index;
                const alignmentClass = pagesPerScreen === 2
                  ? (globalIndex % 2 === 0 ? 'justify-end pr-2' : 'justify-start pl-2')
                  : 'justify-center';

                return (
                  <div key={index} className={effectivePagedMode && settings.pageSize === 'A4' ? `flex items-center ${alignmentClass} h-full relative` : ''} style={effectivePagedMode && settings.pageSize === 'A4' ? { width: `${100 / totalPages}%` } : undefined}>
                    <div id={`page-${pageNumber}`} style={pagedStyle} className={`document-page ${settings.pageSize === 'A4' ? 'w-[794px] min-h-[1123px] bg-white dark:bg-neutral-950 shadow-xl border border-neutral-200 dark:border-neutral-800 flex flex-col' : ''} relative overflow-hidden`}>
                      {doc.content?.metadata?.restriction === 'internal' && (
                        <div className="absolute top-60 right-10 z-[100] pointer-events-none -rotate-[15deg] opacity-[0.12]">
                          <div className="border-[8px] border-red-500 rounded-3xl px-8 py-3 bg-white/20 backdrop-blur-sm">
                            <span className="font-black text-4xl text-red-500 tracking-widest whitespace-nowrap">
                              SOLO USO INTERNO
                            </span>
                          </div>
                        </div>
                      )}
                      <div className={`prose prose-neutral dark:prose-invert max-w-none flex-1 z-10 ${settings.pageSize === 'A4' ? 'p-6 pb-12' : ''}`}>
                        <MarkdownRenderer content={pageText || ''} noTableBorders={settings.noTableBorders} />
                      </div>

                      {/* Footer */}
                      {settings.showFooter && (
                        <div className="mt-auto border-t border-neutral-200 dark:border-neutral-800 p-6 flex items-center justify-between">
                          <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-400">
                            {doc.title}
                          </div>
                          {pages.length > 1 && (
                            <div className="flex items-center justify-center gap-1 text-xs font-semibold text-neutral-400">
                              <span className="font-bold">{pageNumber}</span>
                              <span className="opacity-50">/</span>
                              <span className="opacity-70">{totalPages}</span>
                            </div>
                          )}
                          <div className="h-6">
                            <img src="/img/logos/logo.png" alt="Seidor analytics" className="h-full object-contain" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 py-20 bg-white dark:bg-neutral-950 rounded-lg shadow-sm">
              <h1 className="text-3xl font-bold font-poppins text-neutral-900 dark:text-neutral-100 mb-4 text-center">
                {doc.title}
              </h1>
              <p className="text-neutral-500 text-center">
                Las presentaciones interactivas aún no están soportadas en esta vista pública.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
