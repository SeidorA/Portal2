import React, { useState, useEffect } from 'react';
import { Button } from 'caralstable';
import { CaralIcon, Brand } from 'iconcaral2';
import IconPickerModal from '@/app/components/IconPickerModal';
import {
  isMultilingualContent,
  parseMultilingualContent,
  composeMultilingualContent,
} from '@/utils/multilingual-content';

export interface RoadmapFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
  isBrand?: boolean;
  completed: boolean;
  type?: 'feature' | 'enhancement' | 'integration';
}

export interface RoadmapMonth {
  id: string;
  name: string;
  features: RoadmapFeature[];
}

export interface RoadmapQuarter {
  id: string;
  name: string;
  months: RoadmapMonth[];
}

export interface RoadmapYear {
  year: string;
  quarters: RoadmapQuarter[];
}

export interface RoadmapData {
  description: string;
  defaultView?: 'cards' | 'timeline';
  years: RoadmapYear[];
}

const createEmptyQuarters = (yearStr: string, isEnglish: boolean = false): RoadmapQuarter[] => [
  {
    id: `q1-${yearStr}`,
    name: `Q1 ${yearStr}`,
    months: [
      { id: `m1-${yearStr}`, name: isEnglish ? 'January' : 'Enero', features: [] },
      { id: `m2-${yearStr}`, name: isEnglish ? 'February' : 'Febrero', features: [] },
      { id: `m3-${yearStr}`, name: isEnglish ? 'March' : 'Marzo', features: [] },
    ],
  },
  {
    id: `q2-${yearStr}`,
    name: `Q2 ${yearStr}`,
    months: [
      { id: `m4-${yearStr}`, name: isEnglish ? 'April' : 'Abril', features: [] },
      { id: `m5-${yearStr}`, name: isEnglish ? 'May' : 'Mayo', features: [] },
      { id: `m6-${yearStr}`, name: isEnglish ? 'June' : 'Junio', features: [] },
    ],
  },
  {
    id: `q3-${yearStr}`,
    name: `Q3 ${yearStr}`,
    months: [
      { id: `m7-${yearStr}`, name: isEnglish ? 'July' : 'Julio', features: [] },
      { id: `m8-${yearStr}`, name: isEnglish ? 'August' : 'Agosto', features: [] },
      { id: `m9-${yearStr}`, name: isEnglish ? 'September' : 'Septiembre', features: [] },
    ],
  },
  {
    id: `q4-${yearStr}`,
    name: `Q4 ${yearStr}`,
    months: [
      { id: `m10-${yearStr}`, name: isEnglish ? 'October' : 'Octubre', features: [] },
      { id: `m11-${yearStr}`, name: isEnglish ? 'November' : 'Noviembre', features: [] },
      { id: `m12-${yearStr}`, name: isEnglish ? 'December' : 'Diciembre', features: [] },
    ],
  },
];

const currentYear = new Date().getFullYear().toString();
const defaultDataEs: RoadmapData = {
  description: '',
  years: [
    {
      year: currentYear,
      quarters: createEmptyQuarters(currentYear, false),
    },
  ],
};

const defaultDataEn: RoadmapData = {
  description: '',
  years: [
    {
      year: currentYear,
      quarters: createEmptyQuarters(currentYear, true),
    },
  ],
};

function parseSingleRoadmapJson(jsonStr: string, isEnglish: boolean = false): RoadmapData {
  if (!jsonStr || !jsonStr.trim()) return isEnglish ? defaultDataEn : defaultDataEs;
  try {
    const parsed = JSON.parse(jsonStr.trim());
    if (parsed.year && parsed.quarters && !parsed.years) {
      return {
        description: parsed.description || '',
        years: [{ year: parsed.year, quarters: parsed.quarters }],
      };
    }
    if (parsed.years && Array.isArray(parsed.years)) {
      return parsed;
    }
  } catch (e) {
    console.error('Error parsing roadmap json', e);
  }
  return isEnglish ? defaultDataEn : defaultDataEs;
}

interface RoadmapEditorProps {
  content: string;
  onChange: (jsonString: string) => void;
}

export default function RoadmapEditor({ content, onChange }: RoadmapEditorProps) {
  const [activeView, setActiveView] = useState<'visual' | 'list' | 'json'>('visual');
  const [activeLang, setActiveLang] = useState<'es' | 'en'>('es');
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');

  const [dataByLang, setDataByLang] = useState<{ es: RoadmapData; en: RoadmapData }>(() => {
    if (content) {
      if (isMultilingualContent(content)) {
        const { es, en } = parseMultilingualContent(content);
        return {
          es: parseSingleRoadmapJson(es, false),
          en: parseSingleRoadmapJson(en, true),
        };
      } else {
        const parsed = parseSingleRoadmapJson(content, false);
        return {
          es: parsed,
          en: defaultDataEn,
        };
      }
    }
    return {
      es: defaultDataEs,
      en: defaultDataEn,
    };
  });

  const currentData = dataByLang[activeLang] || (activeLang === 'en' ? defaultDataEn : defaultDataEs);

  const [pickerTarget, setPickerTarget] = useState<{
    y: number;
    q: number;
    m: number;
    f: number;
    icon: string;
    isBrand: boolean;
  } | null>(null);

  const save = (newData: RoadmapData, targetLang: 'es' | 'en' = activeLang) => {
    const updated = {
      ...dataByLang,
      [targetLang]: newData,
    };
    setDataByLang(updated);

    const composed = composeMultilingualContent({
      es: JSON.stringify(updated.es, null, 2),
      en: JSON.stringify(updated.en, null, 2),
    });
    onChange(composed);
  };

  const copyStructureFromEs = () => {
    const esData = dataByLang.es;
    const clonedYears: RoadmapYear[] = JSON.parse(JSON.stringify(esData.years || []));

    // Traducir nombres de meses estándar al clonar si es posible
    const monthTranslationMap: Record<string, string> = {
      enero: 'January',
      febrero: 'February',
      marzo: 'March',
      abril: 'April',
      mayo: 'May',
      junio: 'June',
      julio: 'July',
      agosto: 'August',
      septiembre: 'September',
      octubre: 'October',
      noviembre: 'November',
      diciembre: 'December',
    };

    clonedYears.forEach((y) => {
      y.quarters.forEach((q) => {
        q.months.forEach((m) => {
          const lowerName = m.name.toLowerCase().trim();
          if (monthTranslationMap[lowerName]) {
            m.name = monthTranslationMap[lowerName];
          }
        });
      });
    });

    const newEnData: RoadmapData = {
      description: dataByLang.en.description || esData.description || '',
      defaultView: esData.defaultView,
      years: clonedYears,
    };

    save(newEnData, 'en');
  };

  const addPreviousYear = () => {
    const newData = { ...currentData };
    const firstYear = parseInt(newData.years[0].year);
    const newYearStr = (firstYear - 1).toString();
    newData.years.unshift({
      year: newYearStr,
      quarters: createEmptyQuarters(newYearStr, activeLang === 'en'),
    });
    save(newData);
  };

  const addNextYear = () => {
    const newData = { ...currentData };
    const lastYear = parseInt(newData.years[newData.years.length - 1].year);
    const newYearStr = (lastYear + 1).toString();
    newData.years.push({
      year: newYearStr,
      quarters: createEmptyQuarters(newYearStr, activeLang === 'en'),
    });
    save(newData);
  };

  const removeYear = (yIndex: number) => {
    if (currentData.years.length <= 1) return;
    const newData = { ...currentData };
    newData.years.splice(yIndex, 1);
    save(newData);
  };

  const addFeature = (yIndex: number, qIndex: number, mIndex: number) => {
    const newData = { ...currentData };
    newData.years[yIndex].quarters[qIndex].months[mIndex].features.push({
      id: Math.random().toString(36).substr(2, 9),
      title: activeLang === 'en' ? 'New Feature' : 'Nueva Feature',
      description: '',
      icon: 'star',
      isBrand: false,
      completed: false,
      type: 'feature',
    });
    save(newData);
  };

  const updateFeature = (
    yIndex: number,
    qIndex: number,
    mIndex: number,
    fIndex: number,
    field: string,
    value: any
  ) => {
    const newData = { ...currentData };
    newData.years[yIndex].quarters[qIndex].months[mIndex].features[fIndex] = {
      ...newData.years[yIndex].quarters[qIndex].months[mIndex].features[fIndex],
      [field]: value,
    };
    save(newData);
  };

  const removeFeature = (yIndex: number, qIndex: number, mIndex: number, fIndex: number) => {
    const newData = { ...currentData };
    newData.years[yIndex].quarters[qIndex].months[mIndex].features.splice(fIndex, 1);
    save(newData);
  };

  const moveFeature = (
    yIndex: number,
    qIndex: number,
    mIndex: number,
    fIndex: number,
    targetYIndex: number,
    targetQIndex: number,
    targetMIndex: number
  ) => {
    if (yIndex === targetYIndex && qIndex === targetQIndex && mIndex === targetMIndex) return;
    const newData = { ...currentData };
    const feature = newData.years[yIndex].quarters[qIndex].months[mIndex].features.splice(fIndex, 1)[0];
    newData.years[targetYIndex].quarters[targetQIndex].months[targetMIndex].features.push(feature);
    save(newData);
  };

  const handleApplyJson = () => {
    setJsonError('');
    try {
      const trimmed = jsonText.trim();

      // 1. Si el usuario pegó el formato completo con delimitadores --- es --- y --- en ---
      if (isMultilingualContent(trimmed)) {
        const { es: esText, en: enText } = parseMultilingualContent(trimmed);
        const parsedEs = parseSingleRoadmapJson(esText, false);
        const parsedEn = parseSingleRoadmapJson(enText, true);

        if (!parsedEs.years || !Array.isArray(parsedEs.years)) {
          setJsonError('El JSON de Español es inválido. Debe contener un arreglo "years".');
          return;
        }
        if (!parsedEn.years || !Array.isArray(parsedEn.years)) {
          setJsonError('El JSON de Inglés es inválido. Debe contener un arreglo "years".');
          return;
        }

        const updated = { es: parsedEs, en: parsedEn };
        setDataByLang(updated);
        onChange(
          composeMultilingualContent({
            es: JSON.stringify(parsedEs, null, 2),
            en: JSON.stringify(parsedEn, null, 2),
          })
        );
        setActiveView('visual');
        return;
      }

      // 2. Si es un JSON individual para el idioma activo
      const parsed = JSON.parse(trimmed);
      if (!parsed.years || !Array.isArray(parsed.years)) {
        setJsonError('Estructura inválida. Debe contener un arreglo "years".');
        return;
      }

      save(parsed, activeLang);
      setActiveView('visual');
    } catch (e: any) {
      setJsonError(`JSON Inválido: ${e.message}`);
    }
  };

  useEffect(() => {
    if (activeView === 'json') {
      const textToEdit = JSON.stringify(currentData, null, 2);
      setJsonText(textToEdit);
      setJsonError('');
    }
  }, [activeView, currentData, activeLang]);

  return (
    <div className="flex flex-col gap-6 p-4 overflow-y-auto h-full">
      {/* Selector de Vistas e Idiomas */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        {/* Selector de Pestañas de Idioma */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <button
            type="button"
            onClick={() => {
              setActiveLang('es');
              setJsonError('');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 cursor-pointer ${
              activeLang === 'es'
                ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-sm border border-neutral-200 dark:border-neutral-700'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <span>🇪🇸</span>
            <span>Español</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveLang('en');
              setJsonError('');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 cursor-pointer ${
              activeLang === 'en'
                ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-sm border border-neutral-200 dark:border-neutral-700'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <span>🇬🇧</span>
            <span>English</span>
          </button>
        </div>

        {/* Selector de Tipo de Vista */}
        <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveView('visual')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors cursor-pointer ${
              activeView === 'visual'
                ? 'bg-white dark:bg-neutral-900 shadow text-blue-600 dark:text-blue-400'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            Vista Visual
          </button>
          <button
            type="button"
            onClick={() => setActiveView('list')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors cursor-pointer ${
              activeView === 'list'
                ? 'bg-white dark:bg-neutral-900 shadow text-blue-600 dark:text-blue-400'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            Vista Lista
          </button>
          <button
            type="button"
            onClick={() => setActiveView('json')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors cursor-pointer ${
              activeView === 'json'
                ? 'bg-white dark:bg-neutral-900 shadow text-blue-600 dark:text-blue-400'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            Vista JSON
          </button>
        </div>
      </div>

      {/* Botón de ayuda para copiar estructura de ES a EN */}
      {activeLang === 'en' && (
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
            <CaralIcon name="circleInfo" size={16} />
            <span>¿Quieres sincronizar la estructura de años, trimestres e íconos desde la versión en Español?</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={copyStructureFromEs}
            className="text-xs border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400"
          >
            Copiar estructura desde Español
          </Button>
        </div>
      )}

      {/* Cabecera de configuración general */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 flex flex-col gap-2">
          <label className="font-semibold text-sm">
            Descripción del Roadmap ({activeLang === 'es' ? 'Español' : 'English'})
          </label>
          <textarea
            className="border border-neutral-300 dark:border-neutral-700 rounded-md p-2 bg-transparent w-full min-h-[60px]"
            value={currentData.description}
            onChange={(e) => save({ ...currentData, description: e.target.value })}
            placeholder={activeLang === 'en' ? 'Brief roadmap description...' : 'Breve descripción del roadmap...'}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-sm">Vista por Defecto al Abrir</label>
          <select
            className="border border-neutral-300 dark:border-neutral-700 rounded-md p-2.5 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={currentData.defaultView || 'timeline'}
            onChange={(e) =>
              save({ ...currentData, defaultView: e.target.value as 'cards' | 'timeline' })
            }
          >
            <option value="timeline">Línea de Tiempo</option>
            <option value="cards">Vista por Trimestre</option>
          </select>
          <p className="text-xs text-neutral-500">Define cómo se mostrará inicialmente este roadmap.</p>
        </div>
      </div>

      {/* VISTA VISUAL */}
      {activeView === 'visual' && (
        <div className="flex flex-col gap-8 mt-4">
          <div className="flex justify-center">
            <Button type="button" variant="ghost" onClick={addPreviousYear}>
              + Añadir Año Anterior ({parseInt(currentData.years[0].year) - 1})
            </Button>
          </div>

          {currentData.years.map((y, yi) => (
            <div
              key={yi}
              className="flex flex-col gap-6 p-6 border-2 border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-950"
            >
              <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-800 pb-4">
                <h2 className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{y.year}</h2>
                {currentData.years.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeYear(yi)}
                    className="text-red-500 hover:underline text-sm font-semibold cursor-pointer"
                  >
                    Eliminar Año {y.year}
                  </button>
                )}
              </div>

              {y.quarters.map((q, qi) => (
                <div
                  key={q.id}
                  className="border border-neutral-300 dark:border-neutral-700 rounded-lg p-4 bg-neutral-50 dark:bg-neutral-900"
                >
                  <h3 className="text-xl font-bold mb-4">{q.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {q.months.map((m, mi) => (
                      <div
                        key={m.id}
                        className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4 rounded-md"
                      >
                        <h4 className="font-semibold text-lg border-b pb-2 mb-4">{m.name}</h4>

                        <div className="flex flex-col gap-4 mb-4">
                          {m.features.map((f, fi) => (
                            <div
                              key={f.id}
                              className="flex flex-col gap-2 border border-neutral-200 dark:border-neutral-800 p-3 rounded bg-neutral-50 dark:bg-neutral-900 relative group"
                            >
                              <div className="flex justify-between items-center gap-2">
                                <select
                                  className="text-xs font-semibold px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md outline-none focus:ring-1 focus:ring-blue-500"
                                  value={f.type || 'feature'}
                                  onChange={(e) => updateFeature(yi, qi, mi, fi, 'type', e.target.value)}
                                >
                                  <option value="feature">Feature</option>
                                  <option value="enhancement">Mejora</option>
                                  <option value="integration">Integración</option>
                                </select>

                                <div className="flex items-center gap-1">
                                  <label className="flex items-center gap-1 text-xs cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={f.completed}
                                      onChange={(e) =>
                                        updateFeature(yi, qi, mi, fi, 'completed', e.target.checked)
                                      }
                                      className="rounded text-green-600 focus:ring-green-500"
                                    />
                                    <span>Completado</span>
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => removeFeature(yi, qi, mi, fi)}
                                    className="text-red-500 hover:text-red-700 p-1 opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    title="Eliminar feature"
                                  >
                                    <CaralIcon name="trash" size={14} />
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPickerTarget({
                                      y: yi,
                                      q: qi,
                                      m: mi,
                                      f: fi,
                                      icon: f.icon,
                                      isBrand: f.isBrand || false,
                                    })
                                  }
                                  className="w-8 h-8 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex items-center justify-center shrink-0 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                                  title="Seleccionar ícono"
                                >
                                  {f.isBrand ? (
                                    <Brand name={f.icon as any} size={18} />
                                  ) : (
                                    <CaralIcon name={f.icon as any} size={18} />
                                  )}
                                </button>
                                <input
                                  type="text"
                                  className="w-full text-sm font-semibold border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 bg-transparent"
                                  value={f.title}
                                  onChange={(e) => updateFeature(yi, qi, mi, fi, 'title', e.target.value)}
                                  placeholder="Título de la feature..."
                                />
                              </div>

                              <textarea
                                className="w-full text-xs border border-neutral-300 dark:border-neutral-700 rounded p-1.5 bg-transparent min-h-[40px] resize-y"
                                value={f.description}
                                onChange={(e) =>
                                  updateFeature(yi, qi, mi, fi, 'description', e.target.value)
                                }
                                placeholder="Descripción..."
                              />

                              {/* Reubicar feature (Mover a otro mes) */}
                              <div className="flex items-center justify-between border-t border-neutral-200 dark:border-neutral-800 pt-2 mt-1">
                                <span className="text-[10px] text-neutral-400">Mover a:</span>
                                <select
                                  className="text-[10px] bg-transparent border border-neutral-200 dark:border-neutral-800 rounded px-1 py-0.5 outline-none"
                                  value={`${yi}-${qi}-${mi}`}
                                  onChange={(e) => {
                                    const [targetY, targetQ, targetM] = e.target.value
                                      .split('-')
                                      .map(Number);
                                    moveFeature(yi, qi, mi, fi, targetY, targetQ, targetM);
                                  }}
                                >
                                  {currentData.years.map((targetYear, tyi) =>
                                    targetYear.quarters.map((targetQuarter, tqi) =>
                                      targetQuarter.months.map((targetMonth, tmi) => (
                                        <option
                                          key={`${tyi}-${tqi}-${tmi}`}
                                          value={`${tyi}-${tqi}-${tmi}`}
                                          className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                                        >
                                          {targetMonth.name} {targetYear.year}
                                        </option>
                                      ))
                                    )
                                  )}
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => addFeature(yi, qi, mi)}
                          className="w-full text-xs justify-center border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-solid py-1.5"
                        >
                          + Añadir Feature
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}

          <div className="flex justify-center">
            <Button type="button" variant="ghost" onClick={addNextYear}>
              + Añadir Siguiente Año ({parseInt(currentData.years[currentData.years.length - 1].year) + 1})
            </Button>
          </div>
        </div>
      )}

      {/* VISTA LISTA */}
      {activeView === 'list' && (
        <div className="flex flex-col gap-6 mt-4">
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-neutral-950">
            {currentData.years.map((y, yi) => (
              <div key={yi} className="border-b border-neutral-200 dark:border-neutral-800 last:border-b-0">
                <div className="bg-neutral-100 dark:bg-neutral-900 px-4 py-3 font-bold text-lg text-blue-600 dark:text-blue-400 flex justify-between items-center">
                  <span>Año {y.year}</span>
                  <span className="text-xs font-normal text-neutral-500">
                    {y.quarters.reduce((acc, q) => acc + q.months.reduce((mAcc, m) => mAcc + m.features.length, 0), 0)}{' '}
                    features
                  </span>
                </div>

                {y.quarters.map((q, qi) => (
                  <div key={q.id} className="p-4 border-t border-neutral-100 dark:border-neutral-900">
                    <h4 className="font-semibold text-sm text-neutral-500 uppercase tracking-wider mb-3">
                      {q.name}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {q.months.map((m, mi) => (
                        <div
                          key={m.id}
                          className="bg-neutral-50 dark:bg-neutral-900/50 p-3 rounded border border-neutral-200 dark:border-neutral-800"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-sm">{m.name}</span>
                            <span className="text-xs bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-600 dark:text-neutral-400">
                              {m.features.length}
                            </span>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            {m.features.map((f, fi) => (
                              <div
                                key={f.id}
                                className="flex items-center justify-between text-xs bg-white dark:bg-neutral-900 p-1.5 rounded border border-neutral-200 dark:border-neutral-800"
                              >
                                <span
                                  className={`truncate flex-1 font-medium ${f.completed ? 'line-through text-neutral-400' : ''}`}
                                >
                                  {f.title}
                                </span>
                                <span className="text-[10px] text-neutral-400 shrink-0 ml-1">
                                  {f.type || 'feature'}
                                </span>
                              </div>
                            ))}
                            {m.features.length === 0 && (
                              <span className="text-[11px] text-neutral-400 italic">Sin features</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISTA JSON */}
      {activeView === 'json' && (
        <div className="flex flex-col gap-4 mt-4 flex-1">
          <div className="flex justify-between items-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Edita directamente el JSON estructural del Roadmap ({activeLang === 'es' ? 'Español' : 'English'}), o pega
              el bloque multilingüe completo con <code>--- es ---</code> y <code>--- en ---</code>.
            </p>
            <Button type="button" variant="info" onClick={handleApplyJson}>
              Validar y Aplicar
            </Button>
          </div>

          {jsonError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 rounded-md text-sm">
              <span className="font-semibold">Error:</span> {jsonError}
            </div>
          )}

          <textarea
            className="w-full flex-1 min-h-[400px] font-mono text-sm p-4 bg-neutral-900 text-neutral-100 rounded-lg border border-neutral-800 outline-none focus:border-blue-500 transition-colors"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            spellCheck={false}
          />
        </div>
      )}

      {/* Selector de Icono Modal */}
      <IconPickerModal
        isOpen={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        initialIconName={pickerTarget?.icon || ''}
        initialIsBrand={pickerTarget?.isBrand || false}
        onSelect={(iconName, isBrand) => {
          if (pickerTarget) {
            const newData = { ...currentData };
            newData.years[pickerTarget.y].quarters[pickerTarget.q].months[pickerTarget.m].features[pickerTarget.f].icon =
              iconName;
            newData.years[pickerTarget.y].quarters[pickerTarget.q].months[pickerTarget.m].features[pickerTarget.f].isBrand =
              isBrand;
            save(newData);
            setPickerTarget(null);
          }
        }}
      />
    </div>
  );
}
