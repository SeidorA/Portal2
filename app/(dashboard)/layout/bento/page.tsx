"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Brand, CaralIcon } from 'iconcaral2';
import { ProductItem } from '@/app/components/home/Products';
import { Button, Drawer, Toggle } from 'caralstable';
import FileUploader from '@/app/components/FileUploader';
import { getBentoConfig, updateBentoConfig } from '@/app/actions/bentoConfig';

export default function BentoEditorPage() {
  const [ownTechProducts, setOwnTechProducts] = useState<ProductItem[]>([]);
  const [actinProducts, setActinProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  
  // Grid Columns State
  const [ownTechCols, setOwnTechCols] = useState(4);
  const [actinCols, setActinCols] = useState(3);

  const supabase = createClient();

  // Drag and Drop State
  const [draggedItem, setDraggedItem] = useState<{ category: string, index: number } | null>(null);
  const [dragOverItem, setDragOverItem] = useState<{ category: string, index: number } | null>(null);

  // Quick Edit State
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
    loadConfig();

    // Theme detection for proper image rendering (dark/light)
    setIsDark(document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark');
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const loadConfig = async () => {
    const config = await getBentoConfig();
    setOwnTechCols(config.ownTechCols);
    setActinCols(config.actinCols);
  };

  const handleConfigChange = async (type: 'own_tech' | 'actin', val: number) => {
    const newConfig = {
      ownTechCols: type === 'own_tech' ? val : ownTechCols,
      actinCols: type === 'actin' ? val : actinCols
    };
    if (type === 'own_tech') setOwnTechCols(val);
    else setActinCols(val);
    
    await updateBentoConfig(newConfig);
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('hide_in_bento', false)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setOwnTechProducts(data.filter(p => p.category === 'own_tech'));
        setActinProducts(data.filter(p => p.category === 'actin'));
      }
    } catch (error: any) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (category: string, index: number) => {
    setDraggedItem({ category, index });
  };

  const handleDragOver = (e: React.DragEvent, category: string, index: number) => {
    e.preventDefault();
    if (dragOverItem?.category !== category || dragOverItem?.index !== index) {
      setDragOverItem({ category, index });
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDrop = async (category: string, index: number) => {
    if (!draggedItem || draggedItem.category !== category || draggedItem.index === index) {
      handleDragEnd();
      return;
    }

    const isOwnTech = category === 'own_tech';
    const list = isOwnTech ? [...ownTechProducts] : [...actinProducts];
    const [movedItem] = list.splice(draggedItem.index, 1);
    list.splice(index, 0, movedItem);

    // Optimistic update
    if (isOwnTech) setOwnTechProducts(list);
    else setActinProducts(list);
    handleDragEnd();

    try {
      // Save new order to database
      for (let i = 0; i < list.length; i++) {
        await supabase
          .from('products')
          .update({ order_index: i })
          .eq('id', list[i].id);
      }
    } catch (error: any) {
      alert('Error al reordenar: ' + error.message);
      fetchProducts(); // Revert on error
    }
  };

  const openQuickEdit = (product: ProductItem) => {
    setEditingProduct({ ...product });
    setIsDrawerOpen(true);
  };

  const handleQuickSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({
          description: editingProduct.description,
          is_super: editingProduct.is_super,
          light_image: editingProduct.light_image,
          dark_image: editingProduct.dark_image
        })
        .eq('id', editingProduct.id);

      if (error) throw error;

      const updatedProduct = { ...editingProduct };
      if (updatedProduct.category === 'own_tech') {
        setOwnTechProducts(ownTechProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      } else {
        setActinProducts(actinProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      }
      setIsDrawerOpen(false);
    } catch (error: any) {
      alert("Error al guardar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-neutral-500">Cargando visualizador Bento...</div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto py-8 px-4 h-full">
      <div className="flex flex-col">
        <h1 className="text-3xl text-neutral-900 dark:text-white font-poppins font-bold">
          Ordenador de Bento (Inicio)
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-2">
          Arrastra y suelta las tarjetas para modificar visualmente el orden en el que aparecerán los productos en la página principal.
        </p>
      </div>

      <div className="w-full flex flex-col rounded-xl shadow-sm relative ">
        {/* Background Blur Simulation to look exactly like the home page */}
        <div
          className="absolute inset-0 z-0 bg-center bg-no-repeat opacity-50 pointer-events-none"
          style={{ backgroundImage: "url('/img/blur2.png')", backgroundSize: 'contain' }}
        ></div>

        <div className="relative z-10 w-full mb-6 mt-4 flex items-center justify-between">
          <h3 className="font-poppins font-bold text-neutral-900 dark:text-white">
            Productos Own Tech
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Columnas:</span>
            <select
              value={ownTechCols}
              onChange={(e) => handleConfigChange('own_tech', Number(e.target.value))}
              className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm px-2 py-1 text-neutral-900 dark:text-white"
            >
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
          </div>
        </div>

        {/* Bento Grid Own Tech */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${ownTechCols === 2 ? 'lg:grid-cols-2' : ownTechCols === 3 ? 'lg:grid-cols-3' : ownTechCols === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-[10px] w-full relative z-10`}>
          {ownTechProducts.map((product, idx) => {
            const brandName = product.title.replace(/\s+/g, "");
            const lightSrc = product.light_image || `/img/index/${product.title.toLowerCase()}_ligth.png`;
            const darkSrc = product.dark_image || `/img/index/${product.title.toLowerCase()}_dark.png`;
            const imgSrc = isDark ? darkSrc : lightSrc;

            const isDragged = draggedItem?.category === 'own_tech' && draggedItem?.index === idx;
            const isDragOver = dragOverItem?.category === 'own_tech' && dragOverItem?.index === idx && draggedItem?.index !== idx;

            return (
              <div
                key={product.id || idx}
                draggable
                onDragStart={() => handleDragStart('own_tech', idx)}
                onDragOver={(e) => handleDragOver(e, 'own_tech', idx)}
                onDrop={() => handleDrop('own_tech', idx)}
                onDragEnd={handleDragEnd}
                className={`
                  flex items-center justify-between min-h-[200px] h-full relative rounded-lg cursor-grab active:cursor-grabbing
                  bg-white/60 dark:bg-neutral-800/60 backdrop-blur-[25px]
                  border transition-all duration-300 text-neutral-900 group
                  ${product.is_super ? 'lg:col-span-2 flex-row' : 'flex-col'}
                  ${isDragged ? 'opacity-50 scale-95 border-blue-500 z-50' : 'opacity-100 border-white/20 dark:border-white/10'}
                  ${isDragOver ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'shadow-[0_4px_6px_rgba(0,0,0,0.1)] hover:shadow-[0_0_17px_0_rgba(0,0,0,0.2)]'}
                `}
              >
                <div className={`flex flex-col flex-1 p-[10px] pointer-events-none ${product.is_super ? 'w-1/2' : 'w-full px-4 pt-4'}`}>
                  <div className="flex items-center gap-[10px] mb-2">
                    <div className='bg-neutral-100 p-[5px] rounded-full text-neutral-900 flex shrink-0'>
                      {product.icon_name ? (
                        <CaralIcon name={product.icon_name as any} size={26} />
                      ) : (
                        <Brand name={brandName as any} size={26} />
                      )}
                    </div>
                    <h3 className="text-[20px] font-poppins font-semibold m-0 text-neutral-900 dark:text-white">
                      {product.title}
                    </h3>
                  </div>
                  <p className="text-[14px] font-poppins m-0 opacity-90 leading-tight text-neutral-700 dark:text-neutral-300">
                    {product.description}
                  </p>
                </div>

                <div className={`flex items-center justify-center pointer-events-none ${product.is_super ? 'w-auto' : 'w-full'}`}>
                  <img
                    src={imgSrc}
                    alt={product.title}
                    className="max-w-full h-auto bg-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>

                {/* Visual indicator for drag handle */}
                <div className="absolute top-2 right-2 flex flex-col gap-2 p-1.5 ">
                  <div className="bg-neutral-900/10 dark:bg-white/10 rounded p-1 flex items-center justify-center">
                    <CaralIcon name="arrowUpArrowDown" size="s" className="text-neutral-800 dark:text-neutral-200" />
                  </div>
                  <button
                    onClick={() => openQuickEdit(product)}
                    className="bg-info-main hover:bg-info-dark text-white rounded p-1 flex items-center justify-center shadow-lg transition-colors"
                  >
                    <CaralIcon name="edit" size="s" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="relative z-10 w-full mb-6 mt-12 flex items-center justify-between">
          <h3 className="font-poppins font-bold text-neutral-900 dark:text-white">
            Productos Act-in
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Columnas:</span>
            <select
              value={actinCols}
              onChange={(e) => handleConfigChange('actin', Number(e.target.value))}
              className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm px-2 py-1 text-neutral-900 dark:text-white"
            >
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
          </div>
        </div>

        {/* Bento Grid Act-in */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${actinCols === 2 ? 'lg:grid-cols-2' : actinCols === 4 ? 'lg:grid-cols-4' : actinCols === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-3'} gap-[10px] w-full relative z-10`}>
          {actinProducts.map((product, idx) => {
            const brandName = product.title.replace(/\s+/g, "");
            const lightSrc = product.light_image || `/img/index/${product.title.toLowerCase()}_ligth.png`;
            const darkSrc = product.dark_image || `/img/index/${product.title.toLowerCase()}_dark.png`;
            const imgSrc = isDark ? darkSrc : lightSrc;

            const isDragged = draggedItem?.category === 'actin' && draggedItem?.index === idx;
            const isDragOver = dragOverItem?.category === 'actin' && dragOverItem?.index === idx && draggedItem?.index !== idx;

            return (
              <div
                key={product.id || idx}
                draggable
                onDragStart={() => handleDragStart('actin', idx)}
                onDragOver={(e) => handleDragOver(e, 'actin', idx)}
                onDrop={() => handleDrop('actin', idx)}
                onDragEnd={handleDragEnd}
                className={`
                  flex items-center justify-between min-h-[200px] h-full relative rounded-lg cursor-grab active:cursor-grabbing
                  bg-white/60 dark:bg-neutral-800/60 backdrop-blur-[25px]
                  border transition-all duration-300 text-neutral-900 group
                  ${product.is_super ? 'lg:col-span-2 flex-row' : 'flex-col'}
                  ${isDragged ? 'opacity-50 scale-95 border-blue-500 z-50' : 'opacity-100 border-white/20 dark:border-white/10'}
                  ${isDragOver ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'shadow-[0_4px_6px_rgba(0,0,0,0.1)] hover:shadow-[0_0_17px_0_rgba(0,0,0,0.2)]'}
                `}
              >
                <div className={`flex flex-col flex-1 p-[10px] pointer-events-none ${product.is_super ? 'w-1/2' : 'w-full px-4 pt-4'}`}>
                  <div className="flex items-center gap-[10px] mb-2">
                    <div className='bg-neutral-100 p-[5px] rounded-full text-neutral-900 flex shrink-0'>
                      {product.icon_name ? (
                        <CaralIcon name={product.icon_name as any} size={26} />
                      ) : (
                        <Brand name={brandName as any} size={26} />
                      )}
                    </div>
                    <h3 className="text-[20px] font-poppins font-semibold m-0 text-neutral-900 dark:text-white">
                      {product.title}
                    </h3>
                  </div>
                  <p className="text-[14px] font-poppins m-0 opacity-90 leading-tight text-neutral-700 dark:text-neutral-300">
                    {product.description}
                  </p>
                </div>

                <div className={`flex items-center justify-center pointer-events-none ${product.is_super ? 'w-auto' : 'w-full'}`}>
                  <img
                    src={imgSrc}
                    alt={product.title}
                    className="max-w-full h-auto bg-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>

                {/* Visual indicator for drag handle */}
                <div className="absolute top-2 right-2 flex flex-col gap-2 p-1.5 ">
                  <div className="bg-neutral-900/10 dark:bg-white/10 rounded p-1 flex items-center justify-center">
                    <CaralIcon name="arrowUpArrowDown" size="s" className="text-neutral-800 dark:text-neutral-200" />
                  </div>
                  <button
                    onClick={() => openQuickEdit(product)}
                    className="bg-info-main hover:bg-info-dark text-white rounded p-1 flex items-center justify-center shadow-lg transition-colors"
                  >
                    <CaralIcon name="edit" size="s" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={`Edición Rápida: ${editingProduct?.title || ''}`}
        size="md"
      >
        {editingProduct && (
          <form onSubmit={handleQuickSave} className="flex flex-col gap-6 p-4 h-full">
            <div>
              <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Descripción</label>
              <textarea
                value={editingProduct.description || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:border-blue-500 h-24 resize-none"
                placeholder="Descripción del producto..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-neutral-500 dark:text-neutral-400 mb-2">Imagen Claro</label>
                <div className="h-28 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex flex-col items-center justify-center overflow-hidden relative">
                  {editingProduct.light_image ? (
                    <>
                      <img src={editingProduct.light_image} alt="Preview Claro" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setEditingProduct({ ...editingProduct, light_image: '' })} className="absolute top-1 right-1 bg-white/80 p-1 rounded text-red-500 hover:bg-white text-xs">Quitar</button>
                    </>
                  ) : (
                    <div className="flex items-center flex-col scale-75 opacity-70 hover:opacity-100 transition-opacity">
                      <FileUploader onUploadSuccess={(url) => setEditingProduct({ ...editingProduct, light_image: url })} />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-500 dark:text-neutral-400 mb-2">Imagen Oscuro</label>
                <div className="h-28 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex flex-col items-center justify-center overflow-hidden relative">
                  {editingProduct.dark_image ? (
                    <>
                      <img src={editingProduct.dark_image} alt="Preview Oscuro" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setEditingProduct({ ...editingProduct, dark_image: '' })} className="absolute top-1 right-1 bg-white/80 p-1 rounded text-red-500 hover:bg-white text-xs">Quitar</button>
                    </>
                  ) : (
                    <div className="flex items-center flex-col scale-75 opacity-70 hover:opacity-100 transition-opacity">
                      <FileUploader onUploadSuccess={(url) => setEditingProduct({ ...editingProduct, dark_image: url })} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center mt-2 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-800">
              <Toggle
                checked={!!editingProduct.is_super}
                onChange={(checked) => setEditingProduct({ ...editingProduct, is_super: checked })}
                label="Modo Súper (Ocupa el doble de espacio horizontal)"
              />
            </div>

            <div className="mt-auto pt-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsDrawerOpen(false)}>Cancelar</Button>
              <Button type="submit" variant="primary" disabled={isSaving}>
                {isSaving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        )}
      </Drawer>
    </div>
  );
}
