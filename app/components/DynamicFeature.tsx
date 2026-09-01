'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface DynamicFeatureProps {
  productId: string;
  featureTitle: string;
  format: 'list' | 'comma' | 'quote';
}

const ApiFeatureFetcher = ({ apiUrl, apiScript, format }: { apiUrl: string, apiScript?: string, format: string }) => {
  const [data, setData] = useState<string[] | string>('Cargando...');
  const [error, setError] = useState(false);

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
              setData(result.map(r => {
                if (typeof r === 'string' || typeof r === 'number') return String(r);
                if (typeof r === 'object' && r !== null) {
                  return r.label || r.name || r.title || r.id || Object.values(r)[0] || JSON.stringify(r);
                }
                return String(r);
              }));
            } else {
              setData(String(result));
            }
          } catch (e) {
            console.error(e);
            setError(true);
            setData('Error procesando script');
          }
        } else {
          setData('API cargada');
        }
      })
      .catch(e => {
        if (isMounted) {
          setError(true);
          setData('Error de conexión');
        }
      });

    return () => { isMounted = false; };
  }, [apiUrl, apiScript]);

  if (error || typeof data === 'string') {
    return <span className="text-red-500">{data}</span>;
  }

  // Si data es un array de strings (valores de la API convertidos)
  const items = data as string[];
  if (format === 'list') {
    return (
      <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem' }} className="my-4 space-y-2 text-neutral-700 dark:text-neutral-300">
        {items.map((item, idx) => <li key={idx}>{item}</li>)}
      </ul>
    );
  }
  if (format === 'comma') {
    return <span className="text-neutral-700 dark:text-neutral-300">{items.join(', ')}</span>;
  }
  if (format === 'quote') {
    return (
      <blockquote className="border-l-4 border-blue-500 pl-4 italic text-neutral-600 dark:text-neutral-400 my-4 bg-blue-50 dark:bg-blue-900/20 py-2 pr-4 rounded-r-md">
        {items.map((item, idx) => <div key={idx}>{item}</div>)}
      </blockquote>
    );
  }
  return null;
};

export default function DynamicFeature({ productId, featureTitle, format }: DynamicFeatureProps) {
  const [feature, setFeature] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadFeature() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('features')
          .eq('id', productId)
          .single();
        
        if (error) throw error;
        const features = data?.features || [];
        const found = features.find((f: any) => f.title === featureTitle);
        setFeature(found);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    
    if (productId && featureTitle) {
      loadFeature();
    }
  }, [productId, featureTitle]);

  if (loading) return <span className="text-neutral-400 text-sm animate-pulse">Cargando feature...</span>;
  
  if (!feature) {
    return <span className="text-red-500 text-sm">⚠️ Feature "{featureTitle}" no encontrada</span>;
  }

  // Manejar features por API
  if ((feature.use_api || feature.type === 'api_select') && feature.api_url) {
    return <ApiFeatureFetcher apiUrl={feature.api_url} apiScript={feature.api_script} format={format} />;
  }

  // Manejar features locales (estáticas)
  let items: string[] = [];

  if (feature.type === 'options' || feature.type === 'tasklist') {
    items = Array.isArray(feature.options) ? feature.options : [];
  } else if (feature.type === 'boolean') {
    items = [feature.boolean_label || 'Sí'];
  } else {
    items = [feature.description || ''];
  }

  if (items.length === 0) {
    return <span className="text-neutral-500 italic">Sin datos</span>;
  }

  if (format === 'list') {
    return (
      <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem' }} className="my-4 space-y-2 text-neutral-700 dark:text-neutral-300">
        {items.map((item, idx) => <li key={idx}>{item}</li>)}
      </ul>
    );
  }
  if (format === 'comma') {
    return <span className="text-neutral-700 dark:text-neutral-300">{items.join(', ')}</span>;
  }
  if (format === 'quote') {
    return (
      <blockquote className="border-l-4 border-blue-500 pl-4 italic text-neutral-600 dark:text-neutral-400 my-4 bg-blue-50 dark:bg-blue-900/20 py-2 pr-4 rounded-r-md">
        {items.map((item, idx) => <div key={idx}>{item}</div>)}
      </blockquote>
    );
  }

  return <span>{items.join(', ')}</span>;
}
