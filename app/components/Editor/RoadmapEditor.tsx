import React, { useState, useEffect } from 'react';
import { Button } from 'caralstable';
import { CaralIcon, Brand } from 'iconcaral2';
import IconPickerModal from '@/app/components/IconPickerModal';

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
  years: RoadmapYear[];
}

const createEmptyQuarters = (yearStr: string): RoadmapQuarter[] => [
  {
    id: `q1-${yearStr}`,
    name: `Q1 ${yearStr}`,
    months: [
      { id: `m1-${yearStr}`, name: 'Enero', features: [] },
      { id: `m2-${yearStr}`, name: 'Febrero', features: [] },
      { id: `m3-${yearStr}`, name: 'Marzo', features: [] },
    ]
  },
  {
    id: `q2-${yearStr}`,
    name: `Q2 ${yearStr}`,
    months: [
      { id: `m4-${yearStr}`, name: 'Abril', features: [] },
      { id: `m5-${yearStr}`, name: 'Mayo', features: [] },
      { id: `m6-${yearStr}`, name: 'Junio', features: [] },
    ]
  },
  {
    id: `q3-${yearStr}`,
    name: `Q3 ${yearStr}`,
    months: [
      { id: `m7-${yearStr}`, name: 'Julio', features: [] },
      { id: `m8-${yearStr}`, name: 'Agosto', features: [] },
      { id: `m9-${yearStr}`, name: 'Septiembre', features: [] },
    ]
  },
  {
    id: `q4-${yearStr}`,
    name: `Q4 ${yearStr}`,
    months: [
      { id: `m10-${yearStr}`, name: 'Octubre', features: [] },
      { id: `m11-${yearStr}`, name: 'Noviembre', features: [] },
      { id: `m12-${yearStr}`, name: 'Diciembre', features: [] },
    ]
  }
];

const currentYear = new Date().getFullYear().toString();
const defaultData: RoadmapData = {
  description: '',
  years: [
    {
      year: currentYear,
      quarters: createEmptyQuarters(currentYear)
    }
  ]
};

interface RoadmapEditorProps {
  content: string;
  onChange: (jsonString: string) => void;
}

export default function RoadmapEditor({ content, onChange }: RoadmapEditorProps) {
  const [activeView, setActiveView] = useState<'visual' | 'list' | 'json'>('visual');
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');

  const [data, setData] = useState<RoadmapData>(() => {
    if (content) {
      try {
        const parsed = JSON.parse(content);
        // Automatic backward compatibility migration
        if (parsed.year && parsed.quarters && !parsed.years) {
          return {
            description: parsed.description || '',
            years: [{ year: parsed.year, quarters: parsed.quarters }]
          };
        }
        if (parsed.years) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing roadmap json', e);
      }
    }
    return defaultData;
  });
  
  const [pickerTarget, setPickerTarget] = useState<{y: number, q: number, m: number, f: number, icon: string, isBrand: boolean} | null>(null);

  const save = (newData: RoadmapData) => {
    setData(newData);
    onChange(JSON.stringify(newData));
  };

  const addPreviousYear = () => {
    const newData = { ...data };
    const firstYear = parseInt(newData.years[0].year);
    const newYearStr = (firstYear - 1).toString();
    newData.years.unshift({
      year: newYearStr,
      quarters: createEmptyQuarters(newYearStr)
    });
    save(newData);
  };

  const addNextYear = () => {
    const newData = { ...data };
    const lastYear = parseInt(newData.years[newData.years.length - 1].year);
    const newYearStr = (lastYear + 1).toString();
    newData.years.push({
      year: newYearStr,
      quarters: createEmptyQuarters(newYearStr)
    });
    save(newData);
  };

  const removeYear = (yIndex: number) => {
    if (data.years.length <= 1) return;
    const newData = { ...data };
    newData.years.splice(yIndex, 1);
    save(newData);
  };

  const addFeature = (yIndex: number, qIndex: number, mIndex: number) => {
    const newData = { ...data };
    newData.years[yIndex].quarters[qIndex].months[mIndex].features.push({
      id: Math.random().toString(36).substr(2, 9),
      title: 'Nueva Feature',
      description: '',
      icon: 'star',
      isBrand: false,
      completed: false,
      type: 'feature',
    });
    save(newData);
  };

  const updateFeature = (yIndex: number, qIndex: number, mIndex: number, fIndex: number, field: string, value: any) => {
    const newData = { ...data };
    newData.years[yIndex].quarters[qIndex].months[mIndex].features[fIndex] = {
      ...newData.years[yIndex].quarters[qIndex].months[mIndex].features[fIndex],
      [field]: value
    };
    save(newData);
  };

  const removeFeature = (yIndex: number, qIndex: number, mIndex: number, fIndex: number) => {
    const newData = { ...data };
    newData.years[yIndex].quarters[qIndex].months[mIndex].features.splice(fIndex, 1);
    save(newData);
  };

  const moveFeature = (yIndex: number, qIndex: number, mIndex: number, fIndex: number, targetYIndex: number, targetQIndex: number, targetMIndex: number) => {
    if (yIndex === targetYIndex && qIndex === targetQIndex && mIndex === targetMIndex) return;
    const newData = { ...data };
    const feature = newData.years[yIndex].quarters[qIndex].months[mIndex].features.splice(fIndex, 1)[0];
    newData.years[targetYIndex].quarters[targetQIndex].months[targetMIndex].features.push(feature);
    save(newData);
  };

  const handleApplyJson = () => {
    setJsonError('');
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.years || !Array.isArray(parsed.years)) {
        setJsonError('Estructura inválida. Debe contener un arreglo "years".');
        return;
      }
      save(parsed);
      setActiveView('visual');
    } catch (e: any) {
      setJsonError(`JSON Inválido: ${e.message}`);
    }
  };

  useEffect(() => {
    if (activeView === 'json') {
      const textToEdit = (content === '' || content === '{}') ? JSON.stringify(defaultData, null, 2) : JSON.stringify(data, null, 2);
      setJsonText(textToEdit);
      setJsonError('');
    }
  }, [activeView, data, content]);

  return (
    <div className="flex flex-col gap-6 p-4 overflow-y-auto h-full">
      <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1 shrink-0 mx-auto w-fit">
        <button 
          type="button"
          onClick={() => setActiveView('visual')}
          className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeView === 'visual' ? 'bg-white dark:bg-neutral-900 shadow text-blue-600 dark:text-blue-400' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
        >
          Vista Visual
        </button>
        <button 
          type="button"
          onClick={() => setActiveView('list')}
          className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeView === 'list' ? 'bg-white dark:bg-neutral-900 shadow text-blue-600 dark:text-blue-400' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
        >
          Vista Lista
        </button>
        <button 
          type="button"
          onClick={() => setActiveView('json')}
          className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeView === 'json' ? 'bg-white dark:bg-neutral-900 shadow text-blue-600 dark:text-blue-400' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
        >
          Vista JSON
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-semibold">Descripción del Roadmap</label>
        <textarea 
          className="border border-neutral-300 dark:border-neutral-700 rounded-md p-2 bg-transparent w-full min-h-[60px]"
          value={data.description}
          onChange={e => save({ ...data, description: e.target.value })}
        />
      </div>

      {activeView === 'visual' && (
        <div className="flex flex-col gap-8 mt-4">
          <div className="flex justify-center">
            <Button type="button" variant="ghost" onClick={addPreviousYear}>
              + Añadir Año Anterior ({parseInt(data.years[0].year) - 1})
            </Button>
          </div>

          {data.years.map((y, yi) => (
            <div key={yi} className="flex flex-col gap-6 p-6 border-2 border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-950">
              <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-800 pb-4">
                <h2 className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{y.year}</h2>
                {data.years.length > 1 && (
                  <button type="button" onClick={() => removeYear(yi)} className="text-red-500 hover:underline text-sm font-semibold">
                    Eliminar Año {y.year}
                  </button>
                )}
              </div>

              {y.quarters.map((q, qi) => (
                <div key={q.id} className="border border-neutral-300 dark:border-neutral-700 rounded-lg p-4 bg-neutral-50 dark:bg-neutral-900">
                  <h3 className="text-xl font-bold mb-4">{q.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {q.months.map((m, mi) => (
                      <div key={m.id} className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4 rounded-md">
                        <h4 className="font-semibold text-lg border-b pb-2 mb-4">{m.name}</h4>
                        
                        <div className="flex flex-col gap-4 mb-4">
                          {m.features.map((f, fi) => (
                            <div key={f.id} className="flex flex-col gap-2 border border-neutral-200 dark:border-neutral-800 p-3 rounded bg-neutral-50 dark:bg-neutral-900 relative group">
                              <div className="flex justify-between items-center gap-2">
                                <select
                                  className="text-xs font-semibold px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md outline-none focus:ring-1 focus:ring-blue-500"
                                  value={f.type || 'feature'}
                                  onChange={e => updateFeature(yi, qi, mi, fi, 'type', e.target.value)}
                                >
                                  <option value="feature">Nueva Característica</option>
                                  <option value="enhancement">Mejora</option>
                                  <option value="integration">Integración</option>
                                </select>
                                
                                <button 
                                  type="button"
                                  onClick={() => removeFeature(yi, qi, mi, fi)}
                                  className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 dark:hover:bg-red-950 rounded"
                                  title="Eliminar feature"
                                >
                                  <CaralIcon name="trash" size={16} />
                                </button>
                              </div>
                              
                              <input 
                                className="font-semibold bg-transparent border-b border-neutral-300 dark:border-neutral-700 w-11/12"
                                value={f.title}
                                onChange={e => updateFeature(yi, qi, mi, fi, 'title', e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
                                placeholder="Título de la Feature"
                              />
                              <textarea
                                className="text-sm bg-transparent border border-neutral-300 dark:border-neutral-700 rounded p-1 w-full mt-1"
                                value={f.description}
                                onChange={e => updateFeature(yi, qi, mi, fi, 'description', e.target.value)}
                                placeholder="Descripción breve..."
                                rows={2}
                              />
                              <div className="flex items-center justify-between mt-2">
                                <button
                                  type="button"
                                  onClick={() => setPickerTarget({ y: yi, q: qi, m: mi, f: fi, icon: f.icon, isBrand: f.isBrand || false })}
                                  className="flex items-center gap-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
                                >
                                  {f.icon ? (
                                    f.isBrand ? <Brand name={f.icon as any} size={16} /> : <CaralIcon name={f.icon as any} size={16} className="text-blue-600 dark:text-blue-400" />
                                  ) : (
                                    <CaralIcon name="image" size={16} />
                                  )}
                                  {f.icon || 'Elegir Ícono'}
                                </button>
                                <label className="flex items-center gap-1 text-sm cursor-pointer">
                                  <input 
                                    type="checkbox"
                                    checked={f.completed}
                                    onChange={e => updateFeature(yi, qi, mi, fi, 'completed', e.target.checked)}
                                    className="rounded text-green-500"
                                  />
                                  Completada
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>

                        <Button type="button" variant="ghost" onClick={() => addFeature(yi, qi, mi)} className="w-full justify-center">
                          + Añadir Feature
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}

          <div className="flex justify-center mt-4">
            <Button type="button" variant="ghost" onClick={addNextYear}>
              + Añadir Año Siguiente ({parseInt(data.years[data.years.length - 1].year) + 1})
            </Button>
          </div>
        </div>
      )}

      {activeView === 'list' && (
        <div className="flex flex-col gap-6 mt-4">
          <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-300">Vista de Lista</h3>
              <p className="text-sm text-blue-600 dark:text-blue-400">Edita las features de forma rápida y reasígnalas fácilmente a otros años, trimestres o meses.</p>
            </div>
            <Button type="button" variant="primary" onClick={() => addFeature(0, 0, 0)}>+ Añadir Feature a {data.years[0].year} Q1</Button>
          </div>
          
          <div className="flex flex-col gap-8">
            {data.years.map((y, yi) => (
              <div key={yi} className="flex flex-col gap-6 p-4 border border-neutral-300 dark:border-neutral-700 rounded-lg">
                <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 border-b border-neutral-200 dark:border-neutral-800 pb-2">{y.year}</h3>
                
                {y.quarters.map((q, qi) => (
                  <div key={q.id} className="flex flex-col gap-3">
                    <h4 className="text-lg font-bold border-b border-neutral-200 dark:border-neutral-800 pb-1">{q.name}</h4>
                    
                    {q.months.map((m, mi) => (
                      <div key={m.id} className="flex flex-col gap-2 pl-4 border-l-2 border-neutral-100 dark:border-neutral-800 mb-2">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-semibold text-neutral-500">{m.name}</h5>
                          <button 
                            type="button" 
                            onClick={() => addFeature(yi, qi, mi)} 
                            className="text-xs font-semibold text-blue-500 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded"
                          >
                            + Añadir
                          </button>
                        </div>
                        
                        {m.features.length === 0 && (
                          <div className="text-xs text-neutral-400 dark:text-neutral-500 italic py-1">Sin features programadas para {m.name.toLowerCase()} {y.year}</div>
                        )}
                        
                        {m.features.map((f, fi) => (
                          <div key={f.id} className="flex flex-row gap-4 items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-lg hover:border-blue-300 transition-colors">
                            <div className="flex-1 flex flex-col gap-2">
                              <div className="flex gap-2">
                                <input 
                                  className="font-semibold bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-blue-500 focus:bg-neutral-50 dark:focus:bg-neutral-800 flex-1 px-1 transition-colors outline-none"
                                  value={f.title}
                                  onChange={e => updateFeature(yi, qi, mi, fi, 'title', e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
                                  placeholder="Título de la Feature"
                                />
                              </div>
                              <input
                                className="text-sm bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-blue-500 focus:bg-neutral-50 dark:focus:bg-neutral-800 w-full px-1 transition-colors outline-none text-neutral-600 dark:text-neutral-400"
                                value={f.description}
                                onChange={e => updateFeature(yi, qi, mi, fi, 'description', e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
                                placeholder="Descripción breve..."
                              />
                            </div>
                            
                            <div className="w-px h-12 bg-neutral-200 dark:bg-neutral-800 mx-2"></div>
                            
                            <div className="flex flex-col gap-2 min-w-[200px]">
                              <select
                                className="text-xs font-semibold px-2 py-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md outline-none focus:ring-1 focus:ring-blue-500"
                                value={f.type || 'feature'}
                                onChange={e => updateFeature(yi, qi, mi, fi, 'type', e.target.value)}
                              >
                                <option value="feature">Nueva Característica</option>
                                <option value="enhancement">Mejora</option>
                                <option value="integration">Integración</option>
                              </select>
                              
                              <select
                                className="text-xs font-medium px-2 py-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md outline-none"
                                value={`${yi}-${qi}-${mi}`}
                                onChange={e => {
                                  const [targetY, targetQ, targetM] = e.target.value.split('-').map(Number);
                                  moveFeature(yi, qi, mi, fi, targetY, targetQ, targetM);
                                }}
                              >
                                {data.years.map((ty, tyi) => (
                                  <optgroup key={tyi} label={`Año ${ty.year}`}>
                                    {ty.quarters.map((tq, tqi) => (
                                      tq.months.map((tm, tmi) => (
                                        <option key={tm.id} value={`${tyi}-${tqi}-${tmi}`}>{tq.name} - {tm.name}</option>
                                      ))
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setPickerTarget({ y: yi, q: qi, m: mi, f: fi, icon: f.icon, isBrand: f.isBrand || false })}
                                className="flex items-center justify-center w-8 h-8 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700"
                                title="Cambiar ícono"
                              >
                                {f.icon ? (
                                  f.isBrand ? <Brand name={f.icon as any} size={16} /> : <CaralIcon name={f.icon as any} size={16} className="text-blue-600 dark:text-blue-400" />
                                ) : (
                                  <CaralIcon name="image" size={16} />
                                )}
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => updateFeature(yi, qi, mi, fi, 'completed', !f.completed)}
                                className={`flex items-center justify-center w-8 h-8 border rounded transition-colors ${f.completed ? 'bg-green-100 border-green-300 text-green-600 dark:bg-green-900/30 dark:border-green-800' : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-400 hover:text-green-500'}`}
                                title="Marcar como completada"
                              >
                                <CaralIcon name="check" size={14} />
                              </button>

                              <button 
                                type="button"
                                onClick={() => removeFeature(yi, qi, mi, fi)}
                                className="flex items-center justify-center w-8 h-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded transition-colors"
                                title="Eliminar feature"
                              >
                                <CaralIcon name="trash" size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeView === 'json' && (
        <div className="flex flex-col gap-4 mt-4 flex-1">
          <div className="flex justify-between items-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Edita directamente el JSON estructural del Roadmap. Si estaba vacío, te hemos provisto una plantilla base.
            </p>
            <Button type="button" variant="primary" onClick={handleApplyJson}>
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
            onChange={e => setJsonText(e.target.value)}
            spellCheck={false}
          />
        </div>
      )}

      <IconPickerModal
        isOpen={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        initialIconName={pickerTarget?.icon || ''}
        initialIsBrand={pickerTarget?.isBrand || false}
        onSelect={(iconName, isBrand) => {
          if (pickerTarget) {
            const newData = { ...data };
            newData.years[pickerTarget.y].quarters[pickerTarget.q].months[pickerTarget.m].features[pickerTarget.f].icon = iconName;
            newData.years[pickerTarget.y].quarters[pickerTarget.q].months[pickerTarget.m].features[pickerTarget.f].isBrand = isBrand;
            save(newData);
            setPickerTarget(null);
          }
        }}
      />
    </div>
  );
}
