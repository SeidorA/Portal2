'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from 'caralstable';
import { CaralIcon } from 'iconcaral2';
import FileUploader from '../FileUploader';

interface BattlecardEditorProps {
  content: string;
  productId?: string;
  onChange: (json: string) => void;
}

export default function BattlecardEditor({ content, productId, onChange }: BattlecardEditorProps) {
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  const isFirstRender = useRef(true);
  
  const [formData, setFormData] = useState(() => {
    try {
      if (content) {
        const parsed = JSON.parse(content);
        let compCar = parsed.comparativaCaracteristicas || [];
        if (compCar && !Array.isArray(compCar)) {
          compCar = Object.entries(compCar).map(([feature, values]: any) => ({
            feature,
            nuestro: values['Nosotros'] || values['Crestone'] || '✅',
            competidor: values[parsed.competidor] || values['Fivetran'] || values['Competidor'] || '❌'
          }));
        }

        return {
          competidor: parsed.competidor || '',
          competitorLogoUrl: parsed.competitorLogoUrl || '',
          portadaUrl: parsed.portadaUrl || '',
          customIconUrl: parsed.customIconUrl || '',
          resumen: parsed.resumen || '',
          publicoObjetivo: parsed.publicoObjetivo || '',
          casosDeUso: Array.isArray(parsed.casosDeUso) && parsed.casosDeUso.length > 0 ? parsed.casosDeUso : [''],
          ventajas: Array.isArray(parsed.ventajas) && parsed.ventajas.length > 0 ? parsed.ventajas : [''],
          comparativaCaracteristicas: compCar
        };
      }
    } catch (e) {
      console.error("Invalid Battlecard JSON", e);
    }
    return {
      competidor: '',
      competitorLogoUrl: '',
      portadaUrl: '',
      customIconUrl: '',
      resumen: '',
      publicoObjetivo: '',
      casosDeUso: [''],
      ventajas: [''],
      comparativaCaracteristicas: [] as any[]
    };
  });

  const [availableCovers, setAvailableCovers] = useState<string[]>([]);
  const [availableIconDark, setAvailableIconDark] = useState<string>('');
  
  // Fetch product features to populate empty matrix
  useEffect(() => {
    if (productId && (!formData.comparativaCaracteristicas || formData.comparativaCaracteristicas.length === 0 || availableCovers.length === 0)) {
      const fetchFeatures = async () => {
        setLoadingFeatures(true);
        try {
          const supabase = createClient();
          const { data, error } = await supabase.from('products').select('features, assets').eq('id', productId).single();
          if (error) throw error;
          
          if (data && data.assets) {
            if (Array.isArray(data.assets.cover_images)) {
              setAvailableCovers(data.assets.cover_images);
            }
            if (data.assets.icon_dark) {
              setAvailableIconDark(data.assets.icon_dark);
            }
          }

          if (data && data.features && Array.isArray(data.features)) {
            setFormData(prev => {
              // Only populate the matrix if it's currently empty
              if (prev.comparativaCaracteristicas && prev.comparativaCaracteristicas.length > 0) {
                return prev;
              }
              const matrix = data.features.map((f: any) => {
                let nuestroVal = '✅'; // default for boolean or unspecified
                if (f.type === 'text' && f.description) {
                  nuestroVal = f.description;
                } else if ((f.type === 'options' || f.type === 'tasklist') && Array.isArray(f.options) && f.options.length > 0) {
                  nuestroVal = f.options.join(', ');
                } else if (f.type === 'boolean' && f.boolean_label) {
                  nuestroVal = f.boolean_label;
                }
                
                return {
                  feature: f.title,
                  competidor: '',
                  nuestro: nuestroVal
                };
              });
              return { ...prev, comparativaCaracteristicas: matrix };
            });
          }
        } catch (err) {
          console.error("Error fetching features for battlecard", err);
        } finally {
          setLoadingFeatures(false);
        }
      };
      fetchFeatures();
      fetchFeatures();
    }
  }, [productId, formData.comparativaCaracteristicas]);

  const forceReloadFeatures = async () => {
    if (!productId || !window.confirm('Esto sobreescribirá la matriz actual con los datos del producto. ¿Continuar?')) return;
    setLoadingFeatures(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('products').select('features, assets').eq('id', productId).single();
      if (error) throw error;
      
      if (data && data.assets) {
        if (Array.isArray(data.assets.cover_images)) {
          setAvailableCovers(data.assets.cover_images);
        }
        if (data.assets.icon_dark) {
          setAvailableIconDark(data.assets.icon_dark);
        }
      }

      if (data && data.features && Array.isArray(data.features)) {
        const matrix = data.features.map((f: any) => {
          let nuestroVal = '✅';
          if (f.type === 'text' && f.description) {
            nuestroVal = f.description;
          } else if ((f.type === 'options' || f.type === 'tasklist') && Array.isArray(f.options) && f.options.length > 0) {
            nuestroVal = f.options.join(', ');
          } else if (f.type === 'boolean' && f.boolean_label) {
            nuestroVal = f.boolean_label;
          }
          return { feature: f.title, competidor: '', nuestro: nuestroVal };
        });
        updateField('comparativaCaracteristicas', matrix);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFeatures(false);
    }
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onChange(JSON.stringify(formData, null, 2));
  }, [formData]);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: 'casosDeUso' | 'ventajas', index: number, value: string) => {
    const newArr = [...formData[field]];
    newArr[index] = value;
    updateField(field, newArr);
  };

  const addArrayItem = (field: 'casosDeUso' | 'ventajas') => {
    updateField(field, [...formData[field], '']);
  };

  const removeArrayItem = (field: 'casosDeUso' | 'ventajas', index: number) => {
    const newArr = formData[field].filter((_, i) => i !== index);
    if (newArr.length === 0) newArr.push(''); // Always keep one
    updateField(field, newArr);
  };

  const handleMatrixChange = (index: number, column: 'competidor' | 'nuestro', value: string) => {
    const newMatrix = [...formData.comparativaCaracteristicas];
    newMatrix[index] = { ...newMatrix[index], [column]: value };
    updateField('comparativaCaracteristicas', newMatrix);
  };

  const moveMatrixRow = (index: number, direction: 'up' | 'down') => {
    const arr = [...formData.comparativaCaracteristicas];
    if (direction === 'up' && index > 0) {
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      updateField('comparativaCaracteristicas', arr);
    } else if (direction === 'down' && index < arr.length - 1) {
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      updateField('comparativaCaracteristicas', arr);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      
      {/* General */}
      <div className="flex flex-col gap-4 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl">
        <h3 className="font-semibold text-lg text-neutral-800 dark:text-neutral-200">Información General</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Nombre del Competidor</label>
            <input 
              value={formData.competidor}
              onChange={e => updateField('competidor', e.target.value)}
              className="px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-inherit text-sm"
              placeholder="Ej. Fivetran, Snowflake..."
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Logo del Competidor</label>
            {formData.competitorLogoUrl ? (
              <div className="flex items-center gap-2 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 bg-inherit">
                <img src={formData.competitorLogoUrl} alt="Competitor Logo" className="h-10 object-contain rounded bg-white" />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="small"
                  onClick={() => updateField('competitorLogoUrl', '')} 
                  className="text-red-500 ml-auto"
                >
                  <CaralIcon name="trash" size={16} />
                </Button>
              </div>
            ) : (
              <FileUploader 
                bucket="portal-assets"
                folder={`battlecards/${productId || 'general'}/competitors`}
                onUploadSuccess={(url) => updateField('competitorLogoUrl', url)}
              />
            )}
          </div>
        </div>
        {availableCovers.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Portada del Battlecard</label>
            <div className="flex flex-wrap gap-4">
              {availableCovers.map((cover, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => updateField('portadaUrl', cover)}
                  className={`w-32 h-20 rounded-lg overflow-hidden border-2 transition-all relative ${formData.portadaUrl === cover ? 'border-blue-500 scale-105 shadow-md' : 'border-transparent hover:border-neutral-300 opacity-70 hover:opacity-100'}`}
                >
                  <img src={cover} alt={`Portada ${idx}`} className="w-full h-full object-cover" />
                  {formData.portadaUrl === cover && (
                    <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-0.5">
                      <CaralIcon name="check" size={12} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
        {availableIconDark && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="useCustomIcon"
              checked={formData.customIconUrl === availableIconDark}
              onChange={(e) => updateField('customIconUrl', e.target.checked ? availableIconDark : '')}
              className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500"
            />
            <label htmlFor="useCustomIcon" className="text-sm font-medium text-neutral-600 dark:text-neutral-400 cursor-pointer flex items-center gap-2">
              Usar Icono Oscuro del Producto
              <img src={availableIconDark} alt="Preview" className="h-6 object-contain bg-white rounded px-1 border border-neutral-200" />
            </label>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Resumen Ejecutivo</label>
          <textarea 
            value={formData.resumen}
            onChange={e => updateField('resumen', e.target.value)}
            className="px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-inherit min-h-[100px] text-sm"
            placeholder="Describe brevemente la comparativa..."
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Público Objetivo</label>
          <textarea 
            value={formData.publicoObjetivo}
            onChange={e => updateField('publicoObjetivo', e.target.value)}
            className="px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-inherit min-h-[80px] text-sm"
            placeholder="A quién va dirigido este documento..."
          />
        </div>
      </div>

      {/* Casos de uso */}
      <div className="flex flex-col gap-3 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg text-neutral-800 dark:text-neutral-200">Casos de Uso</h3>
          <Button type="button" variant="outline" size="small" onClick={() => addArrayItem('casosDeUso')} className="flex items-center gap-1">
            <CaralIcon name="plus" size={14} /> Añadir
          </Button>
        </div>
        {formData.casosDeUso.map((caso, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input 
              value={caso}
              onChange={e => handleArrayChange('casosDeUso', i, e.target.value)}
              className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-inherit text-sm"
              placeholder="Sincronización en tiempo real..."
            />
            <Button type="button" variant="ghost" onClick={() => removeArrayItem('casosDeUso', i)} className="text-red-500 shrink-0">
              <CaralIcon name="trash" />
            </Button>
          </div>
        ))}
      </div>

      {/* Ventajas */}
      <div className="flex flex-col gap-3 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg text-neutral-800 dark:text-neutral-200">Nuestras Ventajas (Por qué ganamos)</h3>
          <Button type="button" variant="outline" size="small" onClick={() => addArrayItem('ventajas')} className="flex items-center gap-1">
            <CaralIcon name="plus" size={14} /> Añadir
          </Button>
        </div>
        {formData.ventajas.map((ventaja, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input 
              value={ventaja}
              onChange={e => handleArrayChange('ventajas', i, e.target.value)}
              className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-inherit text-sm"
              placeholder="Despliegue rápido en la nube de SAP..."
            />
            <Button type="button" variant="ghost" onClick={() => removeArrayItem('ventajas', i)} className="text-red-500 shrink-0">
              <CaralIcon name="trash" />
            </Button>
          </div>
        ))}
      </div>

      {/* Feature Matrix */}
      <div className="flex flex-col gap-4 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl bg-blue-50/20 dark:bg-blue-900/10">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg text-blue-800 dark:text-blue-300">Matriz de Características</h3>
          <div className="flex items-center gap-2">
            {loadingFeatures && <span className="text-xs text-blue-500 flex items-center gap-1"><CaralIcon name="loading" className="animate-spin" size={14} /> Cargando features...</span>}
            <Button type="button" variant="light" size="small" onClick={forceReloadFeatures} disabled={!productId || loadingFeatures} className="text-xs">
              <CaralIcon name="refresh" size={12} className="mr-1" />
              Forzar Recarga desde Producto
            </Button>
          </div>
        </div>
        
        {formData.comparativaCaracteristicas.length === 0 && !loadingFeatures && (
          <div className="text-sm text-neutral-500 p-4 bg-white dark:bg-neutral-900 rounded-lg text-center border border-dashed border-neutral-300 dark:border-neutral-700">
            No se encontraron features en el producto. Por favor, añádelas primero desde la pestaña "Features" de la edición del producto.
          </div>
        )}

        {formData.comparativaCaracteristicas.length > 0 && (
          <div className="flex flex-col gap-2">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold uppercase text-neutral-500 dark:text-neutral-400 tracking-wider px-2">
              <div className="col-span-1"></div>
              <div className="col-span-3">Característica</div>
              <div className="col-span-4 text-center text-blue-600 dark:text-blue-400">Nuestro Producto</div>
              <div className="col-span-4 text-center">Competidor ({formData.competidor || '?'})</div>
            </div>
            
            {/* Rows */}
            {formData.comparativaCaracteristicas.map((row, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center bg-white dark:bg-neutral-900 p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow">
                
                <div className="col-span-1 flex flex-col gap-0 items-center justify-center border-r border-neutral-100 pr-1">
                  <button type="button" onClick={() => moveMatrixRow(i, 'up')} disabled={i === 0} className="p-0.5 text-neutral-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-neutral-400 rounded transition-colors" title="Mover arriba">
                    <CaralIcon name="chevronUp" size={14} />
                  </button>
                  <button type="button" onClick={() => moveMatrixRow(i, 'down')} disabled={i === formData.comparativaCaracteristicas.length - 1} className="p-0.5 text-neutral-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-neutral-400 rounded transition-colors" title="Mover abajo">
                    <CaralIcon name="chevronDown" size={14} />
                  </button>
                </div>

                <div className="col-span-3 font-medium text-sm px-2 text-neutral-700 dark:text-neutral-300">
                  {row.feature}
                </div>
                <div className="col-span-4">
                  <div 
                    className="w-full px-2 py-1.5 text-sm border-2 border-blue-100 dark:border-blue-900/50 rounded-md bg-blue-50/30 dark:bg-blue-950/20 text-center text-neutral-500 cursor-not-allowed overflow-hidden text-ellipsis whitespace-nowrap"
                    title={row.nuestro || 'Se cargará dinámicamente'}
                  >
                    {row.nuestro || 'Automático'}
                  </div>
                </div>
                <div className="col-span-4">
                  <input 
                    value={row.competidor}
                    onChange={e => handleMatrixChange(i, 'competidor', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-neutral-200 dark:border-neutral-700 rounded-md bg-neutral-50 dark:bg-neutral-950 focus:bg-white text-center"
                    placeholder="Ej. Limitado / $"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
