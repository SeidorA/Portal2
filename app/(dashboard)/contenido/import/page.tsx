'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from 'caralstable';
import { useRouter } from 'next/navigation';
import { parseDocusaurusMarkdown, ParsedDocusaurusDoc } from '@/utils/docusaurus-parser';
import { MilkdownEditorWrapper } from '@/app/components/Editor/MilkdownEditor';

export default function ImportDocumentPage() {
  const router = useRouter();
  const supabase = createClient();

  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  
  const [file, setFile] = useState<File | null>(null);
  const [parsedDoc, setParsedDoc] = useState<ParsedDocusaurusDoc | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('id, name').order('name');
    if (data) {
      setProducts(data);
      if (data.length > 0) setSelectedProductId(data[0].id);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const text = await selectedFile.text();
      const parsed = parseDocusaurusMarkdown(text, selectedFile.name);
      setParsedDoc(parsed);
    }
  };

  const handleImport = async () => {
    if (!parsedDoc) return alert('No hay documento parseado');
    if (!selectedProductId) return alert('Selecciona un producto');

    try {
      setSaving(true);
      const payload = {
        title: parsedDoc.title,
        slug: parsedDoc.slug,
        content: parsedDoc.content,
        status: 'draft', // Guardar como borrador por defecto para revisión
        section: parsedDoc.section,
        order_index: parsedDoc.order_index,
        icon_name: parsedDoc.icon_name,
        use_brand: parsedDoc.use_brand,
        product_id: selectedProductId,
        type: 'document',
        hide_toc: false
      };

      const { data, error } = await supabase
        .from('documentation')
        .insert([payload])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique violation
          throw new Error('Ya existe un documento con ese slug para este producto.');
        }
        throw error;
      }

      alert('Documento importado correctamente.');
      router.push(`/contenido`);
    } catch (error: any) {
      alert('Error al importar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl text-neutral-900 dark:text-white font-poppins font-bold">
          Importar de Docusaurus
        </h1>
        <Button variant="ghost" onClick={() => router.push('/contenido')}>
          Volver
        </Button>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm flex flex-col gap-6">
        
        {/* Selección de Producto y Archivo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Producto Destino</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit"
            >
              <option value="" disabled>Selecciona un producto</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Archivo Markdown (.md)</label>
            <input
              type="file"
              accept=".md"
              onChange={handleFileChange}
              className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        </div>

        {/* Vista previa de metadatos extraídos */}
        {parsedDoc && (
          <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg">
            <h2 className="text-lg font-bold mb-4 text-blue-600 dark:text-blue-400">Vista Previa de Extracción</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Título</label>
                <input 
                  value={parsedDoc.title} 
                  onChange={(e) => setParsedDoc({...parsedDoc, title: e.target.value})}
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-2 py-1 bg-white dark:bg-neutral-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Slug</label>
                <input 
                  value={parsedDoc.slug} 
                  onChange={(e) => setParsedDoc({...parsedDoc, slug: e.target.value})}
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-2 py-1 bg-white dark:bg-neutral-900 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Sección (Sidebar Label)</label>
                <input 
                  value={parsedDoc.section} 
                  onChange={(e) => setParsedDoc({...parsedDoc, section: e.target.value})}
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-2 py-1 bg-white dark:bg-neutral-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Posición (Order)</label>
                <input 
                  type="number"
                  value={parsedDoc.order_index} 
                  onChange={(e) => setParsedDoc({...parsedDoc, order_index: Number(e.target.value)})}
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-2 py-1 bg-white dark:bg-neutral-900 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Icono de Documento</label>
                <input 
                  value={parsedDoc.icon_name} 
                  onChange={(e) => setParsedDoc({...parsedDoc, icon_name: e.target.value})}
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-2 py-1 bg-white dark:bg-neutral-900 text-sm"
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={parsedDoc.use_brand} 
                    onChange={(e) => setParsedDoc({...parsedDoc, use_brand: e.target.checked})}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  Es un Brand Logo de iconcaral2
                </label>
              </div>
            </div>

            <div className="mt-6 border-t border-neutral-200 dark:border-neutral-800 pt-4">
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Contenido Convertido</label>
              <div className="max-h-[500px] overflow-y-auto border border-neutral-300 dark:border-neutral-700 rounded-md">
                <MilkdownEditorWrapper
                  content={parsedDoc.content}
                  onChange={(markdown) => setParsedDoc({...parsedDoc, content: markdown})}
                />
              </div>
              <p className="text-xs text-neutral-500 mt-2">Puedes editar el contenido antes de importarlo. El documento se guardará como borrador (Draft).</p>
            </div>

            <div className="flex justify-end mt-6">
              <Button onClick={handleImport} variant="info" disabled={saving || !selectedProductId}>
                {saving ? 'Importando...' : 'Importar a Base de Datos'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
