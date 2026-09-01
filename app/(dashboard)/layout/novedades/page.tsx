'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button, Drawer } from 'caralstable';
import { CaralIcon } from 'iconcaral2';
import FileUploader from '@/app/components/FileUploader';
import { MilkdownEditorWrapper } from '@/app/components/Editor/MilkdownEditor';

type Novedad = {
  id: string;
  title: string;
  content: string;
  cover_image: string;
  product_id: string;
  status: 'draft' | 'published';
  created_at: string;
  product?: { title: string };
};

type Product = {
  id: string;
  title: string;
};

export default function NovedadesPage() {
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Editor State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [productId, setProductId] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('published');

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Products
      const { data: prodData } = await supabase
        .from('products')
        .select('id, title')
        .order('title', { ascending: true });
      
      if (prodData) setProducts(prodData);

      // Fetch Novedades
      const { data: novData, error } = await supabase
        .from('novedades')
        .select('*, product:products(title)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching novedades:', error);
      } else if (novData) {
        setNovedades(novData as unknown as Novedad[]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openDrawer = (n?: Novedad) => {
    if (n) {
      setCurrentId(n.id);
      setTitle(n.title);
      setContent(n.content);
      setCoverImage(n.cover_image || '');
      setProductId(n.product_id || '');
      setStatus(n.status || 'published');
    } else {
      setCurrentId(null);
      setTitle('');
      setContent('');
      setCoverImage('');
      setProductId(products.length > 0 ? products[0].id : '');
      setStatus('published');
    }
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setCurrentId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !productId || !content) {
      alert("Título, producto y contenido son requeridos.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title,
        content,
        cover_image: coverImage,
        product_id: productId,
        status
      };

      if (currentId) {
        const { error } = await supabase.from('novedades').update(payload).eq('id', currentId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('novedades').insert([payload]);
        if (error) throw error;
      }

      closeDrawer();
      fetchData();
    } catch (e: any) {
      alert("Error guardando novedad: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta novedad?')) return;
    try {
      const { error } = await supabase.from('novedades').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (e: any) {
      alert("Error eliminando: " + e.message);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto py-8 px-4 h-full">
      <div className="flex flex-row justify-between items-end">
        <div className="flex flex-col">
          <h1 className="text-3xl text-neutral-900 dark:text-white font-poppins font-bold">
            Novedades (Blog)
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">
            Gestiona las entradas públicas de novedades asociadas a los productos.
          </p>
        </div>
        <Button size="l" color="primary" onClick={() => openDrawer()}>
          <CaralIcon name="plus" size="s" />
          Nueva Novedad
        </Button>
      </div>

      <div className="w-full flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden mt-6 flex flex-col">
        {loading ? (
          <div className="p-8 text-center text-neutral-500">Cargando...</div>
        ) : novedades.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">No hay novedades registradas.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-400">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-900 dark:text-white font-poppins border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Título</th>
                  <th className="px-6 py-4 font-semibold">Producto</th>
                  <th className="px-6 py-4 font-semibold">Estado</th>
                  <th className="px-6 py-4 font-semibold">Fecha</th>
                  <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {novedades.map((n) => (
                  <tr key={n.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-neutral-900 dark:text-white truncate max-w-xs">
                      {n.title}
                    </td>
                    <td className="px-6 py-4">
                      {n.product?.title || 'Desconocido'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${n.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                        {n.status === 'published' ? 'Publicado' : 'Borrador'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(n.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <Button variant="ghost" size="s" onClick={() => openDrawer(n)}>
                        <CaralIcon name="edit" size="s" />
                      </Button>
                      <Button variant="ghost" size="s" color="danger" onClick={() => handleDelete(n.id)}>
                        <CaralIcon name="delete" size="s" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        position="right"
        size="l"
        className="dark:bg-neutral-900 dark:text-white p-0 flex flex-col"
      >
        <form onSubmit={handleSave} className="flex flex-col h-full relative">
          {/* Header */}
          <div className="flex-none p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between sticky top-0 bg-white dark:bg-neutral-900 z-10">
            <h2 className="text-xl font-poppins font-bold text-neutral-900 dark:text-white">
              {currentId ? 'Editar Novedad' : 'Nueva Novedad'}
            </h2>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={closeDrawer}>Cancelar</Button>
              <Button type="submit" color="primary" loading={isSaving}>Guardar</Button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-poppins font-medium text-sm text-neutral-700 dark:text-neutral-300">
                Título de la Novedad
              </label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-4 py-2 outline-none focus:border-blue-500"
                placeholder="Ej. Nueva actualización v2.0"
              />
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col gap-2 flex-1">
                <label className="font-poppins font-medium text-sm text-neutral-700 dark:text-neutral-300">
                  Producto Asociado
                </label>
                <select 
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-4 py-2 outline-none focus:border-blue-500"
                >
                  <option value="" disabled>Selecciona un producto</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2 flex-1">
                <label className="font-poppins font-medium text-sm text-neutral-700 dark:text-neutral-300">
                  Estado
                </label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                  className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-4 py-2 outline-none focus:border-blue-500"
                >
                  <option value="published">Publicado</option>
                  <option value="draft">Borrador</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-poppins font-medium text-sm text-neutral-700 dark:text-neutral-300">
                Imagen de Portada (Opcional)
              </label>
              <FileUploader 
                onUploadSuccess={(url) => setCoverImage(url)} 
                accept="image/*"
                bucket="portal-assets"
              />
              {coverImage && (
                <div className="mt-2 relative w-full h-48 bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
                  <img src={coverImage} alt="Portada" className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => setCoverImage('')}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                  >
                    <CaralIcon name="close" size="s" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 flex-1 min-h-[500px]">
              <label className="font-poppins font-medium text-sm text-neutral-700 dark:text-neutral-300">
                Contenido (Markdown)
              </label>
              <div className="flex-1 border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-y-auto bg-white dark:bg-neutral-900 prose dark:prose-invert max-w-none">
                {isDrawerOpen && (
                  <MilkdownEditorWrapper 
                    content={content} 
                    onChange={setContent} 
                  />
                )}
              </div>
            </div>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
