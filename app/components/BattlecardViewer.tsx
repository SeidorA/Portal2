'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'caralstable';
import { CaralIcon, Brand } from 'iconcaral2';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

const ApiFeatureValue = ({ apiUrl, apiScript }: { apiUrl: string, apiScript?: string }) => {
  const [data, setData] = useState<string>('Cargando...');

  useEffect(() => {
    let isMounted = true;
    fetch(apiUrl)
      .then(res => res.json())
      .then(json => {
        if (!isMounted) return;
        if (apiScript) {
          try {
            const fn = new Function('data', apiScript);
            const result = fn(json);
            if (Array.isArray(result)) {
              // Si devuelve un array de objetos con label, u array de strings
              setData(result.map(r => r.label || r).join(', '));
            } else {
              setData(String(result));
            }
          } catch (e) {
            console.error(e);
            setData('Error procesando script');
          }
        } else {
          setData('API cargada');
        }
      })
      .catch(e => {
        if (isMounted) setData('Error de conexión');
      });

    return () => { isMounted = false; };
  }, [apiUrl, apiScript]);

  return <span className="api-feature-value">{data}</span>;
};

interface BattlecardViewerProps {
  content: string;
  productTitle: string;
  productIcon?: string;
  productFeatures?: any[];
  isPrintMode?: boolean;
}

const BattlecardFooter = ({ productTitle }: { productTitle: string }) => {
  return (
    <div className="mt-auto mb-8 px-6 flex items-center justify-between w-full z-30 pt-4 border-t border-neutral-800">
      <img src="/img/logos/logo.png" alt="Seidor Analytics" className="h-8 object-contain" />
      <div className="text-neutral-800 font-medium text-sm font-poppins">
        {productTitle} Battle Card
      </div>
    </div>
  );
};

export default function BattlecardViewer({ content, productTitle, productIcon, productFeatures, isPrintMode = false }: BattlecardViewerProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  let data: any = null;
  try {
    data = JSON.parse(content || '{}');
  } catch (e) {
    console.error("Invalid Battlecard JSON", e);
  }

  const handleExportPDF = async () => {
    if (typeof window === 'undefined') return;

    setIsExporting(true);

    // Esperar a que React renderice todas las páginas (ya que isExporting = true quitará la paginación)
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4' // A4 size is 595.28 x 841.89 points
      });

      const pages = document.querySelectorAll('.battlecard-page');

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        const imgData = await toPng(page, {
          backgroundColor: '#ffffff',
          pixelRatio: 2, // High resolution
          imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // transparent 1x1 png to replace broken/cors images
          style: {
            margin: '0', // Fix offset issues caused by margin: auto
            transform: 'none'
          },
          filter: (node) => {
            // Optional: avoid rendering problematic cross-origin resources if needed
            return true;
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

      pdf.save(`Battlecard_${productTitle}_vs_${data?.competidor || 'Competidor'}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const competidor = data?.competidor || 'Competidor';
  const competitorLogoUrl = data?.competitorLogoUrl || '';
  const portadaUrl = data?.portadaUrl || '';
  const customIconUrl = data?.customIconUrl || '';
  const resumen = data?.resumen || '';

  // Data for Page 2
  const publicoObjetivo = data?.publicoObjetivo || '';
  const casosDeUso = Array.isArray(data?.casosDeUso) ? data.casosDeUso : [];
  const ventajas = Array.isArray(data?.ventajas) ? data.ventajas : (Array.isArray(data?.ventajasCompetitivas) ? data.ventajasCompetitivas : []);

  // Data for Page 3+
  const comparativaCaracteristicas = data?.comparativaCaracteristicas || {};
  let matrixItems: any[] = [];
  if (Array.isArray(comparativaCaracteristicas)) {
    matrixItems = comparativaCaracteristicas;
  } else {
    matrixItems = Object.entries(comparativaCaracteristicas).map(([feature, values]: any) => ({
      feature,
      nuestro: values[productTitle] || values['Crestone'] || values['Nosotros'] || '✅',
      competidor: values[competidor] || '❌'
    }));
  }

  const [rowHeights, setRowHeights] = useState<number[]>([]);
  const measureTableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    if (!measureTableRef.current) return;
    const tbody = measureTableRef.current.querySelector('tbody');
    if (!tbody) return;

    const measure = () => {
      const trs = Array.from(tbody.querySelectorAll('tr'));
      const heights = trs.map(tr => tr.getBoundingClientRect().height);
      // Solo actualizamos si cambiaron las alturas
      setRowHeights(prev => {
        if (prev.length === heights.length && prev.every((v, i) => Math.abs(v - heights[i]) < 2)) return prev;
        return heights;
      });
    };

    const observer = new ResizeObserver(() => measure());
    observer.observe(tbody);
    Array.from(tbody.children).forEach(child => observer.observe(child));

    // Initial measure
    measure();

    return () => observer.disconnect();
  }, [matrixItems]);

  const matrixPages: any[][] = [];
  if (matrixItems.length === 0) {
    matrixPages.push([]);
  } else if (rowHeights.length === matrixItems.length) {
    // 842px (A4 height) - 160px (headers, footers, padding) = ~680px budget
    const MAX_PAGE_HEIGHT = 680;
    let currentPage: any[] = [];
    let currentHeight = 0;

    matrixItems.forEach((item, index) => {
      const h = rowHeights[index];
      // Si la fila en sí misma mide más que el máximo, debe ir sola
      if (currentHeight + h > MAX_PAGE_HEIGHT && currentPage.length > 0) {
        matrixPages.push(currentPage);
        currentPage = [item];
        currentHeight = h;
      } else {
        currentPage.push(item);
        currentHeight += h;
      }
    });
    if (currentPage.length > 0) matrixPages.push(currentPage);
  } else {
    // Fallback while measuring (put all in one, or chunk by 3)
    const ROWS_PER_PAGE = 3;
    for (let i = 0; i < matrixItems.length; i += ROWS_PER_PAGE) {
      matrixPages.push(matrixItems.slice(i, i + ROWS_PER_PAGE));
    }
  }

  const totalPages = 3 + matrixPages.length;

  const getPageClass = (index: number) => {
    let base = "battlecard-page bg-white flex flex-col min-h-[800px] overflow-hidden border border-neutral-200 print:border-none";
    if (!isExpanded || isPrintMode || isExporting) return `${base} relative`;

    if (index === currentPageIndex || index === currentPageIndex + 1) {
      return `${base} relative`;
    }
    return `${base} absolute top-[-99999px] left-[-99999px] opacity-0 pointer-events-none`;
  };

  const coverPageClass = "battlecard-page flex flex-col items-center min-h-[800px] overflow-hidden border border-neutral-200 print:border-none";
  const getCoverPageClass = () => {
    if (!isExpanded || isPrintMode || isExporting) return `${coverPageClass} relative`;
    if (currentPageIndex === 0 || currentPageIndex + 1 === 0) return `${coverPageClass} relative`;
    return `${coverPageClass} absolute top-[-99999px] left-[-99999px] opacity-0 pointer-events-none`;
  };

  return (
    <div className="flex flex-col w-full">

      {/* Invisible Measurement Table */}
      <div className="absolute top-0 left-0 opacity-0 pointer-events-none w-[595px] -z-50" aria-hidden="true">
        <div className="px-6 pt-2 pb-0">
          <table ref={measureTableRef} className="w-full table-fixed text-left text-sm text-neutral-700 font-poppins">
            <thead className="bg-[#07153a] text-white">
              <tr>
                <th className="px-4 py-4 font-semibold w-[140px] break-words">Característica</th>
                <th className="p-4 font-semibold text-center border-l border-white/10 w-[45%]">{productTitle}</th>
                <th className="p-4 font-semibold text-center border-l border-white/10">{competidor}</th>
              </tr>
            </thead>
            <tbody>
              {matrixItems.map((row: any, idx) => {
                const liveFeature = productFeatures?.find((f: any) => f.title === row.feature);
                let liveNuestro = row.nuestro;
                if (liveFeature) {
                  let nVal: React.ReactNode = '✅';
                  if (liveFeature.type === 'text' && liveFeature.description) nVal = liveFeature.description;
                  else if ((liveFeature.type === 'options' || liveFeature.type === 'tasklist') && Array.isArray(liveFeature.options) && liveFeature.options.length > 0) nVal = liveFeature.options.join(', ');
                  else if (liveFeature.type === 'boolean' && liveFeature.boolean_label) nVal = liveFeature.boolean_label;
                  else if (liveFeature.type === 'api_select' && liveFeature.api_url) nVal = <ApiFeatureValue apiUrl={liveFeature.api_url} apiScript={liveFeature.api_script} />;
                  liveNuestro = nVal;
                }
                return (
                  <tr key={idx}>
                    <td className="p-2 text-sm font-medium border-b border-neutral-200">{row.feature}</td>
                    <td className="p-2 text-sm border-b border-neutral-200 border-l border-neutral-200">{liveNuestro}</td>
                    <td className="p-2 text-sm border-b border-neutral-200 border-l border-neutral-200">{row.competidor}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {!isExpanded && !isPrintMode && (
        <div className="flex lg:flex-row md:flex-col gap-6 w-full rounded-2xl p-4 bg-container border border-neutral-100 dark:border-neutral-800 shadow-sm mt-4">
          {/* Left Side: Background Image and Logos */}
          <div
            className="lg:w-[25%]! md:w-full aspect-square shrink-0 rounded-xl overflow-hidden relative flex items-center justify-center gap-4 p-4 shadow-inner"
            style={{ backgroundImage: 'url(/img/haz/j.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
          >
            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center text-white ${customIconUrl ? 'p-1' : ''}`}>
              {customIconUrl ? <img src={customIconUrl} className="w-full h-full object-contain drop-shadow-md" /> : productIcon ? <Brand name={productIcon as any} size={64} /> : <CaralIcon name="store" size={64} />}
            </div>
            <span className="text-white font-extrabold text-3xl font-poppins drop-shadow-md">VS</span>
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-xl flex items-center justify-center p-2 shadow-lg">
              {competitorLogoUrl ? <img src={competitorLogoUrl} className="w-full h-full object-contain" /> : <span className="font-bold text-neutral-500 text-3xl">{competidor.charAt(0)}</span>}
            </div>
          </div>

          {/* Right Side: Content */}
          <div className="flex flex-col flex-1 py-2 pr-2">
            <div className="mb-2">
              <span className="inline-block border border-red-200 text-red-500 bg-red-50 dark:bg-red-900/10 dark:border-red-900/50 dark:text-red-400 px-4 py-1 rounded-full text-[10px] font-medium tracking-wider mb-4">
                Uso interno
              </span>
              <h2 className="text-2xl font-bold font-poppins text-neutral-900 dark:text-white mb-3">
                Battle Card
              </h2>
              <div className="text-sm text-neutral-800 leading-relaxed line-clamp-5">
                {resumen || 'No hay resumen disponible para esta comparativa.'}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-auto pt-6">
              <Button variant="info" onClick={() => setIsExpanded(true)} className="flex items-center gap-2">
                <CaralIcon name="book" size={16} /> Ver ahora
              </Button>
              <Button
                type="button"
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center gap-2 text-white border-transparent"
                style={{ backgroundColor: '#07153a' }}
              >
                {isExporting ? <><CaralIcon name="sync" className="animate-spin" size={16} /> Exportando...</> : <><CaralIcon name="arrowDownToLine" size={16} /> Descargar</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {(isExpanded || isPrintMode) && (
        <div className="flex justify-between items-end mb-6 border-b border-neutral-100 dark:border-neutral-800 pb-4 no-print w-full">
          <div className="flex flex-col items-start gap-4">
            {!isPrintMode && (
              <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)} iconName='arrowLeft' className="mr-2">
                Volver
              </Button>
            )}
            <h2 className="text-2xl font-bold font-poppins text-neutral-900 dark:text-white">
              Battlecard - {productTitle} vs {competidor}
            </h2>
          </div>
          <Button
            variant="info"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin">
                  <CaralIcon name="sync" /> </div> Exportando...
              </>
            ) : (
              <>
                <CaralIcon name="arrowDownToLine" /> Exportar a PDF
              </>
            )}
          </Button>
        </div>
      )}

      {/* Wrapper for the pages and navigation */}
      <div className={`transition-all ${!isExpanded && !isPrintMode ? 'absolute top-[-99999px] left-[-99999px] opacity-0 pointer-events-none' : 'flex items-center w-full justify-center gap-4 relative'}`}>

        {isExpanded && !isPrintMode && (
          <Button
            variant="ghost"
            onClick={() => setCurrentPageIndex(prev => Math.max(0, prev - 2))}
            disabled={currentPageIndex === 0}
            className="p-3 bg-white dark:bg-neutral-800 rounded-full shadow-md z-10 disabled:opacity-30 disabled:shadow-none shrink-0"
          >
            <CaralIcon name="chevronLeft" size={24} />
          </Button>
        )}

        <div className="battlecard-content flex flex-row flex-wrap justify-center gap-4 w-full relative">

          {/* Cover Page */}
          <div
            className={getCoverPageClass()}
            style={{
              backgroundImage: portadaUrl ? `url(${portadaUrl})` : 'none',
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundColor: portadaUrl ? 'transparent' : 'white'
            }}
          >
            {/* Top section */}
            <div className={`w-full h-[150px] flex flex-col items-center justify-center relative overflow-hidden shrink-0 ${portadaUrl ? 'bg-transparent' : 'bg-[#07153a]'}`}>
              {/* Background Light Ray Simulation */}
              {!portadaUrl && <div className="absolute left-[-100px] top-[0px] w-[800px] h-[500px] opacity-20 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(14, 165, 233, 0.8) 0%, rgba(7, 21, 58, 0) 70%)' }} />}

              <div className="flex items-center gap-8 z-10">
                <div className={`w-24 h-24 rounded-2xl flex items-center justify-center border text-white ${portadaUrl ? 'bg-transparent border-transparent' : 'bg-white/5 border-white/10 backdrop-blur-md'} ${customIconUrl ? 'p-2' : ''}`}>
                  {customIconUrl ? (
                    <img src={customIconUrl} alt="Product Custom Icon" className="w-full h-full object-contain drop-shadow-md" crossOrigin="anonymous" />
                  ) : productIcon ? (
                    <Brand name={productIcon as any} size={64} />
                  ) : (
                    <CaralIcon name="store" size={64} />
                  )}
                </div>
                <span className="text-white text-3xl font-extrabold font-poppins">VS</span>
                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center border-4 border-white/20 shadow-xl overflow-hidden p-2">
                  {competitorLogoUrl ? (
                    <img
                      src={competitorLogoUrl}
                      alt={competidor}
                      className="w-full h-full object-contain"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        // Ocultar si falla la carga para evitar que html-to-image crashee
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-3xl font-bold text-neutral-400">{competidor.charAt(0)}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Isometric Graphic Placeholder */}
            <div className="w-full max-w-4xl h-[600px] -mt-[150px] relative z-20 flex justify-center items-center pointer-events-none">
              {/* We could place an image here later: <img src="/img/battlecard-graphic.png" className="max-h-full object-contain drop-shadow-2xl" /> */}
            </div>

            {/* Watermark Stamp */}
            <div className="absolute top-100 right-10 z-100 pointer-events-none -rotate-[15deg] opacity-[0.12]">
              <div className="border-[8px] border-[#07153a] rounded-3xl px-8 py-3">
                <span className="font-black text-4xl text-[#07153a] tracking-widest whitespace-nowrap">
                  SOLO USO INTERNO
                </span>
              </div>
            </div>

            {/* Text Section */}
            <div className={`w-full max-w-4xl p-6 flex flex-col items-start text-[#242528] z-30 ${portadaUrl ? 'bg-transparent' : 'bg-white'}`}>
              <h1 className="text-3xl font-semibold font-poppins mb-6 text-center w-full">
                {productTitle} vs {competidor}
              </h1>
              <div className="text-base font-poppins leading-relaxed text-sm whitespace-pre-wrap text-neutral-800">
                {resumen}
              </div>
            </div>

            {/* Footer Logo */}
            <div className="mt-auto w-full flex justify-center pb-2">
              <img src="/img/logos/logo.png" alt="Seidor Analytics" className="h-8 object-contain" />
            </div>
          </div>

          {/* Page 2: Público, Casos, Ventajas */}
          <div className={getPageClass(1)}>
            {/* Watermark Stamp */}
            <div className="absolute bottom-10 right-0 z-100 pointer-events-none -rotate-[15deg] opacity-[0.12]">
              <div className="border-[10px] border-[#07153a] rounded-3xl px-8 py-3">
                <span className="font-black text-3xl text-[#07153a] tracking-widest whitespace-nowrap">
                  SOLO USO INTERNO
                </span>
              </div>
            </div>

            <div className="flex-1 px-6 pt-2 pb-4 z-10 flex flex-col gap-8 w-full max-w-4xl mx-auto">
              {/* Público Objetivo */}
              {publicoObjetivo && (
                <section>
                  <h2 className="text-[#07153a] font-bold text-lg mb-0 font-poppins">Público Objetivo</h2>
                  <p className="text-neutral-700 text-sm leading-relaxed whitespace-pre-wrap">{publicoObjetivo}</p>
                </section>
              )}

              {/* Casos de uso */}
              {casosDeUso.length > 0 && (
                <section>
                  <h2 className="text-[#07153a] font-bold text-lg mb-0 font-poppins">Casos de Uso Principales</h2>
                  <ul className="list-disc pl-5 text-neutral-700 text-sm space-y-2">
                    {casosDeUso.map((caso: string, i: number) => <li key={i}>{caso}</li>)}
                  </ul>
                </section>
              )}

              {/* Ventajas */}
              {ventajas.length > 0 && (
                <section>
                  <h2 className="text-[#07153a] font-bold text-lg mb-0 font-poppins">Ventajas de {productTitle}</h2>
                  <ul className="list-disc pl-5 text-neutral-700 text-sm space-y-2">
                    {ventajas.map((ventaja: string, i: number) => <li key={i}>{ventaja}</li>)}
                  </ul>
                </section>
              )}
            </div>

            <div className="w-full max-w-4xl mx-auto">
              <BattlecardFooter productTitle={productTitle} />
            </div>
          </div>

          {/* Page 3+: Comparison Table */}
          {matrixPages.map((pageChunk, pageIdx) => (
            <div key={`matrix-page-${pageIdx}`} className={getPageClass(2 + pageIdx)}>
              {/* Watermark Stamp */}
              <div className="absolute bottom-10 right-0 z-100 pointer-events-none -rotate-[15deg] opacity-[0.12]">
                <div className="border-[10px] border-[#07153a] rounded-3xl px-8 py-3">
                  <span className="font-black text-3xl text-[#07153a] tracking-widest whitespace-nowrap">
                    SOLO USO INTERNO
                  </span>
                </div>
              </div>

              <div className="flex-1 px-6 pt-2 pb-4 z-10 flex flex-col gap-8 w-full max-w-4xl mx-auto">
                {pageChunk.length > 0 ? (
                  <div className="w-full overflow-hidden rounded-lg border border-neutral-200 shadow-sm mt-4">
                    <table className="w-full table-fixed text-left text-sm text-neutral-700 font-poppins">
                      <thead className="bg-[#07153a] text-white">
                        <tr>
                          <th className="px-4 py-4 font-semibold w-[140px] break-words">Característica</th>
                          <th className="p-4 font-semibold text-center border-l border-white/10 w-[45%]">{productTitle}</th>
                          <th className="p-4 font-semibold text-center border-l border-white/10">{competidor}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageChunk.map((row: any, idx) => {
                          const liveFeature = productFeatures?.find((f: any) => f.title === row.feature);
                          let liveNuestro = row.nuestro;

                          if (liveFeature) {
                            let nVal: React.ReactNode = '✅';
                            if (liveFeature.type === 'text' && liveFeature.description) nVal = liveFeature.description;
                            else if ((liveFeature.type === 'options' || liveFeature.type === 'tasklist') && Array.isArray(liveFeature.options) && liveFeature.options.length > 0) nVal = liveFeature.options.join(', ');
                            else if (liveFeature.type === 'boolean' && liveFeature.boolean_label) nVal = liveFeature.boolean_label;
                            else if (liveFeature.type === 'api_select' && liveFeature.api_url) nVal = <ApiFeatureValue apiUrl={liveFeature.api_url} apiScript={liveFeature.api_script} />;
                            liveNuestro = nVal;
                          }

                          return (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50/80 dark:bg-neutral-900/10'}>
                              <td className="p-2 text-sm font-medium border-b border-neutral-200">{row.feature}</td>
                              <td className="p-2 text-sm border-b border-neutral-200 border-l border-neutral-200">{liveNuestro}</td>
                              <td className="p-2 text-sm border-b border-neutral-200 border-l border-neutral-200">{row.competidor}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-neutral-500 text-sm text-center bg-neutral-50 p-8 rounded-lg border border-neutral-200 mt-4">
                    No hay datos de comparativa disponibles.
                  </p>
                )}
              </div>

              <div className="w-full max-w-4xl mx-auto">
                <BattlecardFooter productTitle={productTitle} />
              </div>
            </div>
          ))}

          {/* Page Last: Legal Disclaimer */}
          <div className={getPageClass(2 + matrixPages.length)}>
            <div className="flex-1 px-6 pt-2 pb-4 z-10 flex flex-col items-end justify-end gap-8 w-full max-w-4xl mx-auto">

              <div className='w-[387px]'>
                <img src="/img/logos/logo.png" alt="Seidor Analytics" className="h-12 mb-2" />
                <div className="text-neutral-700 font-poppins leading-relaxed space-y-4 text-justify text-[10px]!">
                  <span>© {new Date().getFullYear()} Seidor o una empresa filial de Seidor. Todos los derechos reservados.</span>
                  <br />
                  <br />
                  <span>Ninguna parte de esta publicación puede ser reproducida o transmitida en ninguna forma o para cualquier propósito sin el permiso expreso de Seidor o de una empresa afiliada a Seidor.</span>
                  <br />
                  <br />
                  <span>La información aquí contenida puede ser modificada sin previo aviso.</span>
                  <br />
                  <br />
                  <span>Algunos productos de software comercializados por Seidor y sus distribuidores contienen componentes de software propietarios de otros proveedores de software. Las especificaciones de los productos nacionales pueden variar.</span>
                  <br />
                  <br />
                  <span>Estos materiales son proporcionados por Seidor o una compañía afiliada de Seidor para fines informativos únicamente, sin representación ni garantía de ningún tipo y Seidor o sus empresas afiliadas no serán responsables de los errores u omisiones con respecto a los materiales. Las únicas garantías de los productos y servicios de Seidor o de sus empresas afiliadas son las que se establecen en las declaraciones de garantía expresas que acompañan a dichos productos y servicios, en su caso. Nada de lo aquí expuesto debe interpretarse como constitutivo de una garantía adicional.</span>
                  <br />
                  <br />
                  <span>Seidor y otros productos y servicios de Seidor mencionados en el presente documento, así como sus respectivos logotipos son marcas comerciales o marcas registradas de Seidor (o una empresa filial de Seidor) en España y otros países. Todos los otros nombres de productos y servicios mencionados son marcas comerciales de sus respectivas empresas.</span>
                </div>
              </div>

            </div>

            <div className="w-full max-w-4xl mx-auto">
              <BattlecardFooter productTitle={productTitle} />
            </div>
          </div>

        </div>

        {isExpanded && !isPrintMode && (
          <Button
            variant="ghost"
            onClick={() => setCurrentPageIndex(prev => Math.min(totalPages - (totalPages % 2 === 0 ? 2 : 1), prev + 2))}
            disabled={currentPageIndex >= totalPages - 2}
            className="p-3 bg-white dark:bg-neutral-800 rounded-full shadow-md z-10 disabled:opacity-30 disabled:shadow-none shrink-0"
          >
            <CaralIcon name="chevronRigth" size={24} />
          </Button>
        )}
      </div>

      <style jsx global>{`
        .battlecard-page {
          width: 595px;
          height: 842px;
          max-height: 842px;
          overflow: hidden;
          margin-left: auto;
          margin-right: auto;
          background-color: white;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        }

        @media print {
          /* Ocultar elementos no deseados */
          .no-print, header, nav, aside {
            display: none !important;
          }
          
          @page {
            margin: 0;
            size: A4 portrait;
          }

          body {
            background-color: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Posicionar el contenedor encima de todo el resto de la app (Navbar, etc.) */
          .battlecard-container {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background-color: white !important;
            z-index: 9999 !important;
          }

          .battlecard-page {
            page-break-after: always;
            page-break-inside: avoid;
            height: 842px !important;
            width: 100% !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
