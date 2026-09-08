'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button, Drawer } from 'caralstable';
import { CaralIcon } from 'iconcaral2';
import FileUploader from '@/app/components/FileUploader';
import { MilkdownEditorWrapper } from '@/app/components/Editor/MilkdownEditor';
import { extractNovedadStyle, injectNovedadStyle } from '@/app/utils/novedadStyle';

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
  const [bgColor, setBgColor] = useState('');
  const [bgImage, setBgImage] = useState('');
  const [textColor, setTextColor] = useState('');
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
      const { content: cleanContent, style } = extractNovedadStyle(n.content);
      setContent(cleanContent);
      setBgColor(style.bgColor || '');
      setBgImage(style.bgImage || '');
      setTextColor(style.textColor || '');
      setCoverImage(n.cover_image || '');
      setProductId(n.product_id || '');
      setStatus(n.status || 'published');
    } else {
      setCurrentId(null);
      setTitle('');
      setContent('');
      setBgColor('');
      setBgImage('');
      setTextColor('');
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

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || !productId || !content.trim()) {
      alert("Título, producto y contenido son requeridos.");
      return;
    }

    setIsSaving(true);
    try {
      const finalContent = injectNovedadStyle(content, {
        bgColor,
        bgImage,
        textColor,
      });

      const payload = {
        title,
        content: finalContent,
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
      if (currentId === id) {
        closeDrawer();
      }
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
                      <Button variant="ghost" size="s" onClick={() => openDrawer(n)} title="Editar">
                        <CaralIcon name="edit" size="s" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="s"
                        className="text-danger-main hover:bg-danger-main/10 hover:text-danger-hard!"
                        onClick={() => handleDelete(n.id)}
                        title="Eliminar"
                      >
                        <CaralIcon name="trash" size="s" />
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
        <div className="flex flex-col h-full relative">
          {/* Header */}
          <div className="flex-none p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between sticky top-0 bg-white dark:bg-neutral-900 z-10">
            <h2 className="text-xl font-poppins font-bold text-neutral-900 dark:text-white">
              {currentId ? 'Editar Novedad' : 'Nueva Novedad'}
            </h2>
            <div className="flex items-center gap-2">
              {currentId && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-danger-main hover:bg-danger-main/10 hover:text-danger-hard!"
                  onClick={() => handleDelete(currentId)}
                >
                  <CaralIcon name="trash" size="s" />
                  Eliminar
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={closeDrawer}>Cancelar</Button>
              <Button type="button" color="primary" loading={isSaving} onClick={handleSave}>Guardar</Button>
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

            {/* Personalización de la Entrada (Fondo y Texto) */}
            <div className="flex flex-col gap-4 p-5 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700/80 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🎨</span>
                  <label className="font-poppins font-semibold text-sm text-neutral-900 dark:text-white">
                    Personalización de Entrada (Fondo y Texto)
                  </label>
                </div>
                {(bgColor || bgImage || textColor) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setBgColor('');
                      setBgImage('');
                      setTextColor('');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium hover:underline cursor-pointer"
                  >
                    Restablecer valores por defecto
                  </button>
                )}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 -mt-2">
                Opcional. Configura el fondo y color de texto tanto para la vista web como para el correo copiado. Si no se modifican, se mantienen los valores por defecto actuales.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Color de Fondo */}
                <div className="flex flex-col gap-2">
                  <label className="font-poppins font-medium text-xs text-neutral-700 dark:text-neutral-300">
                    Color de Fondo
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor || '#ffffff'}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-neutral-300 dark:border-neutral-700 cursor-pointer p-0.5 bg-white dark:bg-neutral-800"
                      title="Seleccionar color de fondo"
                    />
                    <input
                      type="text"
                      placeholder="Por defecto (Auto)"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="flex-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-blue-500"
                    />
                    {bgColor && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setBgColor('');
                        }}
                        className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 px-2 py-1 cursor-pointer"
                        title="Limpiar color"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {/* Presets de fondo */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-neutral-400">Presets:</span>
                    {[
                      { name: 'Blanco', color: '#ffffff' },
                      { name: 'Gris Claro', color: '#f8fafc' },
                      { name: 'Crema', color: '#fffbeb' },
                      { name: 'Azul Soft', color: '#f0f9ff' },
                      { name: 'Azul Marino', color: '#0f172a' },
                      { name: 'Dark', color: '#18181b' },
                    ].map((p) => (
                      <button
                        key={p.color}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setBgColor(p.color);
                        }}
                        className="w-5 h-5 rounded-full border border-neutral-300 dark:border-neutral-600 cursor-pointer hover:scale-110 transition-transform shadow-xs"
                        style={{ backgroundColor: p.color }}
                        title={p.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Color de Texto */}
                <div className="flex flex-col gap-2">
                  <label className="font-poppins font-medium text-xs text-neutral-700 dark:text-neutral-300">
                    Color de Texto
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textColor || '#000000'}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-neutral-300 dark:border-neutral-700 cursor-pointer p-0.5 bg-white dark:bg-neutral-800"
                      title="Seleccionar color de texto"
                    />
                    <input
                      type="text"
                      placeholder="Por defecto (Auto)"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="flex-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-blue-500"
                    />
                    {textColor && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setTextColor('');
                        }}
                        className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 px-2 py-1 cursor-pointer"
                        title="Limpiar color"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {/* Presets de texto */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-neutral-400">Presets:</span>
                    {[
                      { name: 'Negro', color: '#000000' },
                      { name: 'Gris Oscuro', color: '#334155' },
                      { name: 'Blanco', color: '#ffffff' },
                      { name: 'Gris Claro', color: '#e2e8f0' },
                      { name: 'Azul Seidor', color: '#0072CA' },
                    ].map((p) => (
                      <button
                        key={p.color}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setTextColor(p.color);
                        }}
                        className="w-5 h-5 rounded-full border border-neutral-300 dark:border-neutral-600 cursor-pointer hover:scale-110 transition-transform shadow-xs"
                        style={{ backgroundColor: p.color }}
                        title={p.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Imagen / Patrón de Fondo */}
              <div className="flex flex-col gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-700/60">
                <label className="font-poppins font-medium text-xs text-neutral-700 dark:text-neutral-300">
                  Imagen o Patrón de Fondo (Opcional)
                </label>
                <div className="flex flex-col gap-2">
                  <FileUploader
                    onUploadSuccess={(url) => setBgImage(url)}
                    accept="image/*"
                    bucket="portal-assets"
                  />
                  {bgImage && (
                    <div className="relative w-full h-24 bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
                      <img src={bgImage} alt="Fondo" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setBgImage('')}
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
                        title="Quitar fondo"
                      >
                        <CaralIcon name="x" size="s" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Mini Preview Card */}
              {(bgColor || bgImage || textColor) && (
                <div className="mt-2 flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                    Vista previa de estilo
                  </span>
                  <div
                    style={{
                      backgroundColor: bgColor || undefined,
                      backgroundImage: bgImage ? `url('${bgImage}')` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      color: textColor || undefined
                    }}
                    className={`p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm ${bgColor ? '' : 'bg-white dark:bg-neutral-900'}`}
                  >
                    <div className="flex items-center gap-2 mb-2 opacity-80 text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-medium">Producto</span>
                      <span>Fecha</span>
                    </div>
                    <h4 style={{ color: textColor || undefined }} className="font-bold text-base mb-1">
                      {title || 'Título de ejemplo de la novedad'}
                    </h4>
                    <p style={{ color: textColor ? `${textColor}cc` : undefined }} className="text-xs opacity-90">
                      Así se visualizará el fondo y texto de tu novedad tanto en el portal como en el correo copiado.
                    </p>
                  </div>
                </div>
              )}
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
                    <CaralIcon name="x" size="s" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 flex-1 min-h-[700px]">
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

            {/* Zona de peligro */}
            {currentId && (
              <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Zona de peligro</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">Esta acción no se puede deshacer.</p>

                <div className="border border-red-200 dark:border-red-900/50 bg-[#FDEEED] dark:bg-red-950/20 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#641A1B] dark:text-red-400 mb-1 text-sm">Eliminar esta Novedad</h4>
                    <p className="text-xs text-[#641A1B] dark:text-red-500">La entrada de novedad se eliminará permanentemente de la base de datos.</p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleDelete(currentId)}
                    variant="danger"
                    className="shrink-0"
                  >
                    <CaralIcon name="trash" size="s" />
                    Eliminar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
}
