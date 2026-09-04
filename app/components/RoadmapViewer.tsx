"use client";
import React, { useState } from 'react';
import { CaralIcon, Brand } from 'iconcaral2';
import { Tabs, Timeline } from 'caralstable';
import { RoadmapData } from './Editor/RoadmapEditor';

interface RoadmapViewerProps {
  content: string;
  productTitle?: string;
  productIcon?: string;
}

export default function RoadmapViewer({ content, productTitle, productIcon }: RoadmapViewerProps) {
  let rawData: any = null;
  let data: RoadmapData | null = null;

  try {
    if (content) {
      rawData = JSON.parse(content);
      // Backward compatibility logic
      if (rawData.year && rawData.quarters && !rawData.years) {
        data = {
          description: rawData.description || '',
          years: [{ year: rawData.year, quarters: rawData.quarters }]
        };
      } else {
        data = rawData as RoadmapData;
      }
    }
  } catch (e) {
    console.error("Error parsing roadmap JSON", e);
  }

  if (!data || !data.years) {
    return <div className="p-10 text-neutral-500">El roadmap está vacío o tiene un formato inválido.</div>;
  }

  const [showPast, setShowPast] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'timeline'>('timeline');

  const currentYear = new Date().getFullYear();
  const currentQ = Math.floor(new Date().getMonth() / 3) + 1;

  const isPastQuarter = (yearStr: string, qIndex: number) => {
    const y = parseInt(yearStr);
    if (y < currentYear) return true;
    if (y === currentYear && qIndex + 1 < currentQ) return true;
    return false;
  };

  const quarterHasFeatures = (q: any) => {
    return q.months?.some((m: any) =>
      m.features && m.features.some((f: any) => f.title && f.title.trim() !== '')
    ) ?? false;
  };

  const hasPastQuarters = data.years.some(y =>
    y.quarters.some((q, qi) => isPastQuarter(y.year, qi) && quarterHasFeatures(q))
  );

  const visibleYears = data.years.map(y => {
    const visibleQuarters = y.quarters.filter((q, qi) => {
      // Si el Q no tiene información en ningún mes, no mostrarlo directamente
      if (!quarterHasFeatures(q)) return false;

      const isPast = isPastQuarter(y.year, qi);
      return showPast ? isPast : !isPast;
    });
    return { ...y, quarters: visibleQuarters };
  }).filter(y => y.quarters.length > 0);

  return (
    <div className="flex flex-col gap-10 w-full mt-4">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {data.description ? (
          <div className="text-lg text-neutral-700 dark:text-neutral-300">
            <p className="leading-relaxed">{data.description}</p>
          </div>
        ) : <div />}


      </div>

      <div className="w-full min-h-40 rounded-2xl flex items-center gap-5 justify-center bg-neutral-100 text-seidor-main"
        style={{
          backgroundImage: "url('/img/haz/7.png')",
          backgroundSize: "50% auto",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "-20% 60%",
        }
        }
      >
        <Brand name={(productIcon as any) || "SAP"} size={60} />
        <h1 className='font-extrabold text-9xl '>Roadmap {productTitle || 'SAP'}</h1>
      </div>

      <p>Cada avance que verán está pensado para sumar valor real a los usuarios, mejorar la eficiencia del equipo y mantenernos un paso adelante en innovación.</p>

      {hasPastQuarters && (
        <div className='w-full min-h-24 flex gap-2 justify-center items-center bg-seidor-main rounded-lg text-neutral-100 hover:bg-seidor-hard transition-all duration-300 cursor-pointer'
          style={{
            backgroundImage: "url('/img/haz/3.png')",
            backgroundSize: "40% auto",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "0% 50%",
          }}
          onClick={() => setShowPast(!showPast)}
        >
          <p className='font-extrabold text-2xl'> {showPast ? 'Ocultar timeline' : 'Ver anteriores'} </p>
          <CaralIcon name={showPast ? 'chevronUp' : 'chevronDown'} size={24} />
        </div>
      )}


      <p>A continuación, encontrarán un resumen de las principales iniciativas organizadas por trimestre 👇</p>


      <div className="w-full bg-full/10 py-4 sticky top-15 z-50 backdrop-blur-md">

        <div className="w-100">
          <Tabs
            tabs={[{ label: 'Vista por Trimestre' }, { label: 'Línea de Tiempo' }]}
            activeIndex={viewMode === 'cards' ? 0 : 1}
            onChange={(index) => setViewMode(index === 0 ? 'cards' : 'timeline')}
          />
        </div>
      </div>

      {viewMode === 'cards' ? (
        visibleYears.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 dark:text-neutral-400 italic bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
            No hay iniciativas programadas para este período.
          </div>
        ) : (
        <div className="flex flex-col gap-16">
          {visibleYears.map((y, yi) => (
            <div key={yi} className="flex flex-col gap-8">
              <h2 className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 border-b-2 border-blue-200 dark:border-blue-900 pb-2">
                Año {y.year}
              </h2>

              <div className="flex flex-col gap-10">
                {y.quarters.map((q, qi) => (
                  <div key={q.id} className="flex flex-col gap-6">

                    {/* Quarter Header */}
                    <h3 className="text-2xl font-poppins font-semibold text-neutral-900 dark:text-white">
                      {q.name}
                    </h3>

                    {/* Months Container */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {q.months.map((m, mi) => (
                        <div key={m.id} className="relative flex flex-col p-6 bg-[#f5f6f8] dark:bg-neutral-900 rounded-xl overflow-hidden shadow-sm border border-neutral-200 dark:border-neutral-800 animate-slide-up" style={{ animationDelay: `${mi * 100}ms` }}>
                          {/* Decorative Road Image */}
                          <img
                            src={`/img/haz/Road${((yi * 12) + (qi * 3) + mi) % 5 + 1}.png`}
                            alt=""
                            className="absolute top-0 left-0 w-72 h-auto object-cover z-0"
                          />

                          {/* Month Header */}
                          <h4 className="relative z-10 text-[1.3rem] font-bold font-poppins mb-8 text-neutral-100 pt-2 text-shadow-md darl:text-shadow-lg  ">
                            {m.name} | {y.year}
                          </h4>

                          {/* Features List */}
                          <div className="relative z-10 flex flex-col divide-y divide-neutral-200 dark:divide-neutral-800">
                            {m.features.map((f, fi) => (
                              <div key={f.id} className={`flex flex-col gap-3 py-6 ${fi === 0 ? 'pt-0' : ''} ${fi === m.features.length - 1 ? 'pb-0 border-b-0' : ''}`}>

                                {/* Tags / Completed Chip */}
                                <div className="flex justify-between items-center mb-1">
                                  {(!f.type || f.type === 'feature') && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#daf4ec] text-[#13644a] border border-[#13644a]">
                                      Features
                                      <CaralIcon name="gear" size={12} />
                                    </span>
                                  )}
                                  {f.type === 'enhancement' && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#daf4ec] text-[#13644a] border border-[#13644a]">
                                      Mejora
                                      <CaralIcon name="wrench" size={12} />
                                    </span>
                                  )}
                                  {f.type === 'integration' && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#9ecfff] text-[#002f5d] border border-[#2b88d8]">
                                      Integrations
                                      <CaralIcon name="cube" size={12} />
                                    </span>
                                  )}

                                  {f.completed && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                      <CaralIcon name="check" size={12} /> Completado
                                    </span>
                                  )}
                                </div>

                                {/* Title & Icon */}
                                <div className="flex items-start gap-3 mt-1 text-neutral-900 dark:text-black!">
                                  {f.icon && (
                                    <span className="shrink-0 mt-0.5 ">
                                      {f.isBrand ? (
                                        <Brand name={f.icon as any} size={28} />
                                      ) : (
                                        <CaralIcon name={f.icon as any} size={28} />
                                      )}
                                    </span>
                                  )}
                                  <h5 className="text-[1.15rem] font-poppins font-semibold leading-tight">
                                    {f.title}
                                  </h5>
                                </div>

                                {/* Description */}
                                {f.description && (
                                  <p className="text-neutral-700 dark:text-neutral-400 text-[0.95rem] leading-relaxed mt-1">
                                    {f.description}
                                  </p>
                                )}

                              </div>
                            ))}

                            {m.features.length === 0 && (
                              <div className="text-neutral-400 italic text-sm text-center py-4">
                                Sin features programadas
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        )
      ) : (
        visibleYears.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 dark:text-neutral-400 italic bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 w-full max-w-5xl mx-auto">
            No hay iniciativas programadas para este período.
          </div>
        ) : (
        <div className="flex flex-col w-full max-w-5xl mx-auto">
          {visibleYears.map((y, yi) => (
            <React.Fragment key={yi}>
              {y.quarters.map((q, qi) => (
                <React.Fragment key={q.id}>
                  {q.months.map((m, mi) => {
                    const isFirst = yi === 0 && qi === 0 && mi === 0;
                    const isLast = yi === visibleYears.length - 1 && qi === y.quarters.length - 1 && mi === q.months.length - 1;

                    return (
                      <Timeline
                        key={m.id}
                        hideTopLine={isFirst}
                        hideBottomLine={isLast}
                        variant="seidor"
                      >
                        <div className="flex flex-col bg-container rounded-xl p-8 shadow-sm border border-neutral-200 dark:border-neutral-800 w-full overflow-hidden relative mb-12 ml-4 animate-slide-up" style={{ animationDelay: `${mi * 150}ms` }}>
                          <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-6 z-10">
                            {m.name} | {y.year}
                          </h3>

                          <div className="flex flex-col gap-8 pl-4">
                            {m.features.map(f => (
                              <div key={f.id} className="flex flex-col gap-1">
                                <div className="flex items-start gap-4">
                                  <span className={`shrink-0 mt-0.5 rounded-full flex items-center justify-center border w-9 h-9 ${f.completed ? 'bg-white border-green-500 text-green-500' : 'bg-neutral-100 border-neutral-300 text-neutral-800'}`}>
                                    {f.completed ? <CaralIcon name="check" size={18} /> : <CaralIcon name="clock" size={18} />}
                                  </span>

                                  <div className="flex flex-col pt-[2px]">
                                    <div className="flex items-center gap-3">
                                      {f.icon && (
                                        <span className="shrink-0 text-blue-600 dark:text-blue-400">
                                          {f.isBrand ? (
                                            <Brand name={f.icon as any} size={24} />
                                          ) : (
                                            <CaralIcon name={f.icon as any} size={24} />
                                          )}
                                        </span>
                                      )}
                                      <h5 className="text-[1.1rem] font-bold text-neutral-900 dark:text-white leading-tight">
                                        {f.title}
                                      </h5>
                                    </div>
                                    {f.description && (
                                      <p className="text-neutral-700 dark:text-neutral-100 text-[0.95rem] mt-2 pl-[36px]">
                                        {f.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {m.features.length === 0 && (
                              <div className="text-neutral-400 italic text-sm pl-2">
                                Sin iniciativas
                              </div>
                            )}
                          </div>
                        </div>
                      </Timeline>
                    );
                  })}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </div>
        )
      )}
    </div>
  );
}
