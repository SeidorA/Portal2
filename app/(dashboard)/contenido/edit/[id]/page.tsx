'use client';

import React, { useState, useEffect, use } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from 'caralstable';
import { useRouter } from 'next/navigation';
import { MilkdownEditorWrapper } from '@/app/components/Editor/MilkdownEditor';
import RoadmapEditor from '@/app/components/Editor/RoadmapEditor';

export default function EditDocumentPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Document state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('published');
  const [section, setSection] = useState('General');
  const [orderIndex, setOrderIndex] = useState(0);
  const [iconName, setIconName] = useState('');
  const [useBrand, setUseBrand] = useState(false);
  const [hideToc, setHideToc] = useState(false);
  const [description, setDescription] = useState('');
  const [docType, setDocType] = useState('document');

  // To navigate back
  const [productSlug, setProductSlug] = useState('');

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documentation')
        .select('*, products(slug)')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setTitle(data.title || '');
        setSlug(data.slug || '');
        setContent(data.content || '');
        setStatus(data.status || 'published');
        setSection(data.section || 'General');
        setOrderIndex(data.order_index || 0);
        setIconName(data.icon_name || '');
        setUseBrand(data.use_brand || false);
        setHideToc(data.hide_toc || false);
        setDescription(data.description || '');
        setDocType(data.type || 'document');

        if (data.products && data.products.slug) {
          setProductSlug(data.products.slug);
        }
      }
    } catch (err: any) {
      console.error(err.message);
      alert('Error cargando documento');
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    // Don't auto-generate slug on edit unless they want to, to avoid breaking links.
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        title, slug, content, status,
        section, order_index: Number(orderIndex),
        icon_name: iconName, use_brand: useBrand, hide_toc: hideToc, description
      };

      const { error } = await supabase
        .from('documentation')
        .update(payload)
        .eq('id', id);

      if (error) throw error;

      alert('Documento actualizado correctamente.');
      if (productSlug && slug) {
        router.push(`/docs/${productSlug}/${slug}`);
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-neutral-500">Cargando documento...</div>;
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl text-neutral-900 dark:text-white font-poppins font-bold">
          Editar {docType === 'roadmap' ? 'Roadmap' : docType === 'section' ? 'Sección' : 'Documento'}
        </h1>
        {productSlug && (
          <Button variant="ghost" onClick={() => router.push(`/docs/${productSlug}/${slug}`)}>
            Volver al documento
          </Button>
        )}
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Fila 1: Título y Slug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Título del Documento</label>
              <input
                required
                value={title}
                onChange={handleTitleChange}
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug (URL amigable)</label>
              <input
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit font-mono text-sm"
              />
            </div>
          </div>

          {/* Fila 2: Sección y Orden */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-neutral-50 dark:bg-neutral-950 p-4 rounded-lg border border-neutral-100 dark:border-neutral-800">
            <div>
              <label className="block text-sm font-medium mb-1">Sección</label>
              <input
                required
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Orden (#)</label>
              <input
                type="number"
                required
                value={orderIndex}
                onChange={(e) => setOrderIndex(Number(e.target.value))}
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit text-sm"
              />
            </div>
          </div>

          {/* Fila 3: Icono y SEO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/50">
            <div>
              <label className="block text-sm font-medium mb-1">Icono de Documento</label>
              <input
                value={iconName}
                onChange={(e) => setIconName(e.target.value)}
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit text-sm mb-2"
                placeholder="Ej: Crestone, home, star..."
              />
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={useBrand}
                  onChange={(e) => setUseBrand(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                Es un Brand Logo de iconcaral2
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">Descripción SEO (Cabecera)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit text-sm resize-y"
                  rows={2}
                />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={hideToc}
                  onChange={(e) => setHideToc(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                Ocultar la Tabla de Contenidos (ToC)
              </label>
            </div>
          </div>

          {/* Fila 4: Status */}
          <div>
            <label className="block text-sm font-medium mb-1">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-inherit text-sm"
            >
              <option value="published">Publicado</option>
              <option value="draft">Borrador</option>
            </select>
          </div>

          {/* Editor Milkdown */}
          {docType === 'document' && (
            <div className="mt-4">
              <h2 className="text-xl font-poppins font-semibold mb-4 text-blue-600 dark:text-blue-400">
                Contenido
              </h2>
              <MilkdownEditorWrapper
                content={content}
                onChange={(markdown) => setContent(markdown)}
              />
            </div>
          )}

          {/* Editor Roadmap */}
          {docType === 'roadmap' && (
            <div className="mt-4 flex-1 flex flex-col min-h-[400px]">
              <h2 className="text-xl font-poppins font-semibold mb-4 text-blue-600 dark:text-blue-400">
                Roadmap Builder
              </h2>
              <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden flex flex-col">
                <RoadmapEditor
                  content={content}
                  onChange={(jsonString) => setContent(jsonString)}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <Button type="submit" variant="info" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
