"use client";

import React, { useState, useEffect } from "react";
import { CaralIcon, Brand } from "iconcaral2";
import { Button, Drawer } from "caralstable";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { createClient } from "@/utils/supabase/client";
import IconPickerModal from "@/app/components/IconPickerModal";
import FileUploader from "@/app/components/FileUploader";

type NavChildMock = {
  id: string;
  type: "link interno" | "link externo" | "titulo" | "divisor" | "espectacular";
  title?: string;
  url?: string;
  producto?: string;
  seccion?: string;
  pagina?: string;
  description?: string;
  iconName?: string;
  isBrand?: boolean;
  imageUrl?: string;
  buttonText?: string;
  linkType?: "interno" | "externo";
};

type NavItemMock = {
  id: string;
  title: string;
  description: string;
  type: "link interno" | "link externo" | "dropdown" | "avatar";
  visual: "texto" | "texto-icono" | "icono";
  cols?: number;
  children?: { [colIndex: number]: NavChildMock[] };
  url?: string;
  producto?: string;
  seccion?: string;
  pagina?: string;
};

const leftItemsMock: NavItemMock[] = [
  {
    id: "1",
    title: "Productos",
    description: "Productos desarrollados por Seidor Analitics",
    type: "dropdown",
    visual: "texto",
    cols: 3,
    children: {
      0: [
        { id: "c1-1", type: "titulo", title: "Crestone" },
        { id: "c1-2", type: "link interno", title: "Data Preservation" }
      ],
      1: [
        { id: "c2-1", type: "titulo", title: "Daiana" },
        { id: "c2-2", type: "divisor" },
        { id: "c2-3", type: "link interno", title: "Harvinguer" }
      ]
    }
  },
  {
    id: "2",
    title: "Novedades",
    description: "Últimas noticias y actualizaciones",
    type: "link externo",
    visual: "texto",
  },
];

const rightItemsMock: NavItemMock[] = [
  {
    id: "3",
    title: "Documentación interna",
    description: "Botón a la wiki y manuales",
    type: "link externo",
    visual: "texto",
  },
  {
    id: "4",
    title: "Perfil",
    description: "Avatar y configuración de usuario",
    type: "avatar",
    visual: "icono",
  },
];

export default function NavBarConfigPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [leftItems, setLeftItems] = useState<NavItemMock[]>(leftItemsMock);
  const [rightItems, setRightItems] = useState<NavItemMock[]>(rightItemsMock);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NavItemMock | null>(null);
  const [editingList, setEditingList] = useState<"left" | "right" | null>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isChildDrawerOpen, setIsChildDrawerOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<{ parentId: string, colIndex: number, child: NavChildMock } | null>(null);
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [dbDocs, setDbDocs] = useState<any[]>([]);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const fetchConfigAndData = async () => {
      const supabase = createClient();
      const [configRes, productsRes, docsRes] = await Promise.all([
        supabase.from('global_config').select('data').eq('section', 'navbar').single(),
        supabase.from('products').select('id, title, slug').order('order_index'),
        supabase.from('documentation').select('id, title, slug, section, product_id').order('order_index')
      ]);

      if (configRes.data?.data) {
        setLeftItems(configRes.data.data.leftItems || []);
        setRightItems(configRes.data.data.rightItems || []);
      }

      if (productsRes.data) setDbProducts(productsRes.data);
      if (docsRes.data) setDbDocs(docsRes.data);

      setIsLoading(false);
    };

    fetchConfigAndData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('global_config')
      .upsert({
        section: 'navbar',
        data: { leftItems, rightItems },
        updated_at: new Date().toISOString()
      }, { onConflict: 'section' });

    setIsSaving(false);
    if (error) {
      alert("Error al guardar: " + error.message);
    } else {
      alert("Configuración del NavBar guardada correctamente.");
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    // Handle internal column drags
    if (source.droppableId.includes("-col-")) {
      const [sourceParentId, sourceColStr] = source.droppableId.split("-col-");
      const [destParentId, destColStr] = destination.droppableId.split("-col-");

      const sourceCol = parseInt(sourceColStr);
      const destCol = parseInt(destColStr);

      const updateList = (list: NavItemMock[], setList: any) => {
        const parentIndex = list.findIndex(i => i.id === sourceParentId);
        if (parentIndex !== -1) {
          const newList = [...list];
          const parentItem = { ...newList[parentIndex] };
          const newChildren = { ...(parentItem.children || {}) };

          const sourceItems = Array.from(newChildren[sourceCol] || []);
          const destItems = sourceParentId === destParentId && sourceCol === destCol
            ? sourceItems
            : Array.from(newChildren[destCol] || []);

          const [moved] = sourceItems.splice(source.index, 1);
          destItems.splice(destination.index, 0, moved);

          newChildren[sourceCol] = sourceItems;
          newChildren[destCol] = destItems;

          parentItem.children = newChildren;
          newList[parentIndex] = parentItem;
          setList(newList);
          return true;
        }
        return false;
      };

      if (!updateList(leftItems, setLeftItems)) {
        updateList(rightItems, setRightItems);
      }
      return;
    }

    if (source.droppableId === destination.droppableId) {
      if (source.droppableId === 'left') {
        const items = Array.from(leftItems);
        const [reorderedItem] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reorderedItem);
        setLeftItems(items);
      } else if (source.droppableId === 'right') {
        const items = Array.from(rightItems);
        const [reorderedItem] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reorderedItem);
        setRightItems(items);
      }
    } else {
      let sourceList = source.droppableId === 'left' ? Array.from(leftItems) : Array.from(rightItems);
      let destList = destination.droppableId === 'left' ? Array.from(leftItems) : Array.from(rightItems);

      const [movedItem] = sourceList.splice(source.index, 1);
      destList.splice(destination.index, 0, movedItem);

      if (source.droppableId === 'left') {
        setLeftItems(sourceList);
        setRightItems(destList);
      } else {
        setRightItems(sourceList);
        setLeftItems(destList);
      }
    }
  };

  const handleAddChildToCol = (parentId: string, colIndex: number) => {
    const newChild: NavChildMock = {
      id: `new-${Date.now()}`,
      type: "link interno",
      title: "Nuevo Elemento",
    };

    const updateList = (list: NavItemMock[], setList: any) => {
      const parentIndex = list.findIndex(i => i.id === parentId);
      if (parentIndex !== -1) {
        const newList = [...list];
        const parentItem = { ...newList[parentIndex] };
        const newChildren = { ...(parentItem.children || {}) };

        const colItems = Array.from(newChildren[colIndex] || []);
        colItems.push(newChild);
        newChildren[colIndex] = colItems;

        parentItem.children = newChildren;
        newList[parentIndex] = parentItem;
        setList(newList);
        return true;
      }
      return false;
    };

    if (!updateList(leftItems, setLeftItems)) {
      updateList(rightItems, setRightItems);
    }
  };

  const handleAddParentItem = (listType: "left" | "right") => {
    const newItem: NavItemMock = {
      id: Date.now().toString(),
      title: "Nuevo Elemento",
      description: "",
      type: "link externo",
      visual: "texto",
    };
    if (listType === "left") {
      setLeftItems([...leftItems, newItem]);
    } else {
      setRightItems([...rightItems, newItem]);
    }
  };

  const renderItem = (item: NavItemMock, index: number) => (
    <Draggable key={item.id} draggableId={item.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="bg-neutral-50 dark:bg-neutral-800/50 flex flex-col p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors hover:border-neutral-300 dark:hover:border-neutral-600 mb-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                {...provided.dragHandleProps}
                className="cursor-grab text-neutral-800 hover:text-neutral-600 dark:hover:text-neutral-200 active:cursor-grabbing"
              >
                <CaralIcon name="arrowUpArrowDown" size="m" />
              </div>

              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-2 min-w-[120px] mb-3">
                  {item.type === "dropdown" ? (
                    <span className="bg-success-light text-success-hard border border-success-hard text-[10px] px-2 py-0.5 rounded-full font-poppins font-medium">
                      Desplegable
                    </span>
                  ) : item.type === "avatar" ? (
                    <span className="bg-info-light text-info-hard border border-info-hard text-[10px] px-2 py-0.5 rounded-full font-poppins font-medium">
                      Avatar / Sign In
                    </span>
                  ) : (
                    <span className="bg-neutral-200 text-neutral-600 border border-neutral-300 dark:bg-neutral-700 dark:text-neutral-300 dark:border-neutral-600 text-[10px] px-2 py-0.5 rounded-full font-poppins font-medium capitalize">
                      {item.type}
                    </span>
                  )}

                  {item.cols && (
                    <span className="bg-warning-light text-warning-hard border border-warning-hard text-[10px] px-2 py-0.5 rounded-full font-poppins font-medium">
                      {item.cols} Col
                    </span>
                  )}
                </div>

                <p className="font-semibold text-neutral-900 dark:text-white text-[15px] font-poppins">
                  {item.title}
                </p>
                <p className="text-sm text-neutral-800 font-poppins">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-neutral-800">
              {item.type === "dropdown" && (
                <button
                  className="hover:text-neutral-900 dark:hover:text-white transition-colors"
                  title="Expandir/Contraer"
                  onClick={() => {
                    setExpandedItems(prev =>
                      prev.includes(item.id)
                        ? prev.filter(id => id !== item.id)
                        : [...prev, item.id]
                    );
                  }}
                >
                  <CaralIcon name={expandedItems.includes(item.id) ? "chevronUp" : "chevronDown"} size="m" />
                </button>
              )}
              <button
                className="hover:text-info-main transition-colors"
                title="Editar"
                onClick={() => {
                  setEditingItem(item);
                  setEditingList(leftItems.some(i => i.id === item.id) ? "left" : "right");
                  setIsDrawerOpen(true);
                }}
              >
                <CaralIcon name="edit" size="m" />
              </button>
            </div>
          </div>

          {/* Expanded Grid */}
          {item.type === "dropdown" && expandedItems.includes(item.id) && (
            <div className="mt-4 grid gap-4 w-full" style={{ gridTemplateColumns: `repeat(${item.cols || 1}, minmax(0, 1fr))` }}>
              {Array.from({ length: item.cols || 1 }).map((_, colIndex) => (
                <div key={colIndex} className="bg-neutral-100 border border-neutral-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-3 border-b border-neutral-200 pb-2">
                    <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Col {colIndex + 1}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" isIconButton iconName="arrowsMaximize" />
                      <Button
                        variant="ghost"
                        isIconButton
                        iconName="plus"
                        onClick={() => handleAddChildToCol(item.id, colIndex)}
                      />
                    </div>
                  </div>
                  <Droppable droppableId={`${item.id}-col-${colIndex}`} type="child">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="flex flex-col gap-2 min-h-[50px]"
                      >
                        {(item.children?.[colIndex] || []).map((child, childIndex) => (
                          <Draggable key={child.id} draggableId={child.id} index={childIndex}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md p-2 flex items-center justify-between group"
                              >
                                <div className="flex items-center gap-2">
                                  <div {...provided.dragHandleProps} className="text-neutral-800 cursor-grab active:cursor-grabbing">
                                    <CaralIcon name="arrowUpArrowDown" size="s" />
                                  </div>
                                  {child.type === "divisor" ? (
                                    <div className="h-px bg-neutral-300 dark:bg-neutral-600 w-24"></div>
                                  ) : (
                                    <span className={`text-sm ${child.type === 'titulo' ? 'font-semibold text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300'}`}>
                                      {child.title}
                                    </span>
                                  )}
                                </div>
                                <div className="transition-opacity flex items-center gap-1 text-neutral-900">
                                  <button
                                    className="hover:text-info-main"
                                    onClick={() => {
                                      setEditingChild({ parentId: item.id, colIndex, child });
                                      setIsChildDrawerOpen(true);
                                    }}
                                  >
                                    <CaralIcon name="edit" size="s" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );

  if (!isMounted || isLoading) return null;

  return (
    <div className="flex flex-col gap-8 w-full  mx-auto py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between bg-container px-6 py-4 rounded-xl">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white font-poppins">
            Configuración del NavBar
          </h1>
          <p className="text-neutral-800 font-poppins mt-1">
            Organiza los elementos de la barra de navegación usando drag & drop.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => {
            setLeftItems(leftItemsMock);
            setRightItems(rightItemsMock);
          }}>
            Descartar
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-col gap-6">
          {/* Accesos Izquierda */}
          <section className="bg-container border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white font-poppins flex items-center gap-2">
                Accesos <span className="text-neutral-800 font-normal">(Izquierda)</span>
              </h2>
              <Button variant="ghost" isIconButton iconName="plus" onClick={() => handleAddParentItem("left")} />
            </div>
            <Droppable droppableId="left" type="parent">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex flex-col min-h-[100px]"
                >
                  {leftItems.map((item, index) => renderItem(item, index))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </section>

          {/* Accesos Derecha */}
          <section className="bg-container border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white font-poppins flex items-center gap-2">
                Accesos <span className="text-neutral-800 font-normal">(Derecha)</span>
              </h2>
              <Button variant="ghost" isIconButton iconName="plus" onClick={() => handleAddParentItem("right")} />
            </div>
            <Droppable droppableId="right" type="parent">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex flex-col min-h-[100px]"
                >
                  {rightItems.map((item, index) => renderItem(item, index))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </section>
        </div>
      </DragDropContext>

      {/* Edit Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Editar elemento"
        className="!z-[9999]"
        size="lg"
      >
        {editingItem && (
          <div className="flex flex-col gap-5 p-4  h-full">
            {editingItem.type !== "avatar" && (
              <>
                <div>
                  <label className="text-sm font-semibold mb-1 block text-neutral-900 dark:text-neutral-200 font-poppins">Nombre</label>
                  <input
                    className="w-full border border-neutral-300 dark:border-neutral-700 bg-transparent rounded p-2 text-sm text-neutral-900 dark:text-white font-poppins outline-none focus:border-info-main"
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block text-neutral-900 dark:text-neutral-200 font-poppins">Descripción (Opcional)</label>
                  <textarea
                    className="w-full border border-neutral-300 dark:border-neutral-700 bg-transparent rounded p-2 text-sm text-neutral-900 dark:text-white font-poppins outline-none focus:border-info-main min-h-[80px]"
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  />
                </div>
              </>
            )}
            <div>
              <label className="text-sm font-semibold mb-1 block text-neutral-900 dark:text-neutral-200 font-poppins">Tipo</label>
              <select
                className="w-full border border-neutral-300 dark:border-neutral-700 bg-transparent rounded p-2 text-sm text-neutral-900 dark:text-white font-poppins outline-none focus:border-info-main"
                value={editingItem.type}
                onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value as any })}
              >
                <option value="link externo">Link Externo</option>
                <option value="link interno">Link Interno</option>
                <option value="dropdown">Desplegable</option>
                <option value="avatar">Avatar / Sign In</option>
              </select>
            </div>
            {editingItem.type === "avatar" && (
              <div className="bg-info-light border border-info-main p-4 rounded text-info-dark text-sm font-poppins">
                Este elemento carga automáticamente los datos y opciones del usuario activo (o mostrará iniciar sesión si no hay sesión iniciada), por lo que no requiere configuración adicional de su aspecto.
              </div>
            )}
            {editingItem.type !== "avatar" && (
              <>
                <div>
                  <label className="text-sm font-semibold mb-1 block text-neutral-900 dark:text-neutral-200 font-poppins">Visual</label>
                  <select
                    className="w-full border border-neutral-300 dark:border-neutral-700 bg-transparent rounded p-2 text-sm text-neutral-900 dark:text-white font-poppins outline-none focus:border-info-main"
                    value={editingItem.visual}
                    onChange={(e) => setEditingItem({ ...editingItem, visual: e.target.value as any })}
                  >
                    <option value="texto">Solo texto</option>
                    <option value="texto-icono">Texto + Icono</option>
                    <option value="icono">Solo icono</option>
                  </select>
                </div>
                {(editingItem.visual === "texto-icono" || editingItem.visual === "icono") && (
                  <div>
                    <label className="text-sm font-semibold mb-1 block text-neutral-900 dark:text-neutral-200 font-poppins">Icono</label>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 border border-neutral-300 dark:border-neutral-700 rounded flex items-center justify-center text-neutral-600 dark:text-neutral-300">
                        {editingItem.iconName ? (
                          editingItem.isBrand ? (
                            <Brand name={editingItem.iconName as any} size="m" />
                          ) : (
                            <CaralIcon name={editingItem.iconName as any} size="m" />
                          )
                        ) : (
                          <CaralIcon name="image" size="m" />
                        )}
                      </div>
                      <Button variant="outline" onClick={() => setIsIconPickerOpen(true)}>
                        Seleccionar Icono
                      </Button>
                      {editingItem.iconName && (
                        <Button variant="ghost" onClick={() => setEditingItem({ ...editingItem, iconName: undefined, isBrand: undefined })}>
                          Quitar
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
            {editingItem.type === "dropdown" && (
              <div>
                <label className="text-sm font-semibold mb-1 block text-neutral-900 dark:text-neutral-200 font-poppins">Columnas (Max 4)</label>
                <input
                  type="number"
                  min={1}
                  max={4}
                  className="w-full border border-neutral-300 dark:border-neutral-700 bg-transparent rounded p-2 text-sm text-neutral-900 dark:text-white font-poppins outline-none focus:border-info-main"
                  value={editingItem.cols || 1}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setEditingItem({ ...editingItem, cols: Math.min(4, Math.max(1, val)) });
                  }}
                />
              </div>
            )}
            
            {editingItem.type === "link externo" && (
              <div>
                <label className="text-sm font-semibold mb-1 block text-neutral-900 dark:text-neutral-200 font-poppins">URL del Link</label>
                <input
                  className="w-full border border-neutral-300 dark:border-neutral-700 bg-transparent rounded p-2 text-sm text-neutral-900 dark:text-white font-poppins outline-none focus:border-info-main"
                  value={editingItem.url || ""}
                  placeholder="https://"
                  onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                />
              </div>
            )}
            {editingItem.type === "link interno" && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-semibold mb-1 block text-neutral-900 dark:text-neutral-200 font-poppins">Producto</label>
                  <select
                    className="w-full border border-neutral-300 dark:border-neutral-700 bg-transparent rounded p-2 text-sm text-neutral-900 dark:text-white font-poppins outline-none focus:border-info-main"
                    value={editingItem.producto || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, producto: e.target.value, seccion: "", pagina: "" })}
                  >
                    <option value="">Selecciona un producto</option>
                    {dbProducts.map(p => (
                      <option key={p.id} value={p.slug}>{p.title}</option>
                    ))}
                  </select>
                </div>
                {editingItem.producto && (
                  <div>
                    <label className="text-sm font-semibold mb-1 block text-neutral-900 dark:text-neutral-200 font-poppins">Sección</label>
                    <select
                      className="w-full border border-neutral-300 dark:border-neutral-700 bg-transparent rounded p-2 text-sm text-neutral-900 dark:text-white font-poppins outline-none focus:border-info-main"
                      value={editingItem.seccion || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, seccion: e.target.value, pagina: "" })}
                    >
                      <option value="">Selecciona una sección</option>
                      {Array.from(new Set(
                        dbDocs.filter(d => {
                          const prod = dbProducts.find(p => p.slug === editingItem.producto);
                          return prod && d.product_id === prod.id;
                        }).map(d => d.section || 'General')
                      )).map(sec => (
                        <option key={sec as string} value={sec as string}>{sec as string}</option>
                      ))}
                    </select>
                  </div>
                )}
                {editingItem.seccion && (
                  <div>
                    <label className="text-sm font-semibold mb-1 block text-neutral-900 dark:text-neutral-200 font-poppins">Página</label>
                    <select
                      className="w-full border border-neutral-300 dark:border-neutral-700 bg-transparent rounded p-2 text-sm text-neutral-900 dark:text-white font-poppins outline-none focus:border-info-main"
                      value={editingItem.pagina || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, pagina: e.target.value })}
                    >
                      <option value="">Selecciona una página</option>
                      {dbDocs.filter(d => {
                        const prod = dbProducts.find(p => p.slug === editingItem.producto);
                        return prod && d.product_id === prod.id && (d.section || 'General') === editingItem.seccion;
                      }).map(d => (
                        <option key={d.id} value={d.slug}>{d.title}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button
                variant="info"
                onClick={() => {
                  if (editingList === "left") {
                    setLeftItems(leftItems.map(i => i.id === editingItem.id ? editingItem : i));
                  } else {
                    setRightItems(rightItems.map(i => i.id === editingItem.id ? editingItem : i));
                  }
                  setIsDrawerOpen(false);
                }}
              >
                Guardar
              </Button>
            </div>

            <div className="mt-8 border-t border-danger-main/30 pt-4">
              <h4 className="text-neutral-900 font-bold mb-1 text-lg font-poppins">Zona de peligro</h4>
              <p className="text-sm text-neutral-800 mb-4 font-poppins">Tenga cuidado con las siguientes funciones ya que no se pueden deshacer.</p>

              <div className="border rder-danger-main bg-danger-light rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h5 className="text-danger-dark font-bold font-poppins text-[15px]">Eliminar Elemento</h5>
                  <p className="text-danger-dark text-sm mt-0.5 font-poppins">El elemento no estará más disponible en el navbar.</p>
                </div>
                <Button
                  variant="danger"
                  iconName="trash"
                  onClick={() => {
                    if (editingList === "left") {
                      setLeftItems(leftItems.filter(i => i.id !== editingItem.id));
                    } else {
                      setRightItems(rightItems.filter(i => i.id !== editingItem.id));
                    }
                    setIsDrawerOpen(false);
                  }}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Edit Child Drawer */}
      <Drawer
        isOpen={isChildDrawerOpen}
        onClose={() => setIsChildDrawerOpen(false)}
        title="Editar componente"
        size="lg"
        className="!z-[9999]"
      >
        {editingChild && (
          <div className="flex flex-col gap-5 p-4 h-full">
            <div>
              <label className="text-sm font-semibold mb-1 block text-neutral-900 dark:text-neutral-200 font-poppins">Tipo</label>
              <select
                className="w-full border border-neutral-300 dark:border-neutral-700 bg-transparent rounded p-2 text-sm text-neutral-900 dark:text-white font-poppins outline-none focus:border-info-main"
                value={editingChild.child.type}
                onChange={(e) => setEditingChild({ ...editingChild, child: { ...editingChild.child, type: e.target.value as any } })}
              >
                <option value="link interno">Link Interno</option>
                <option value="link externo">Link Externo</option>
                <option value="titulo">Título</option>
                <option value="divisor">Divisor</option>
                <option value="espectacular" disabled={
                  (() => {
                    if (editingChild.child.type === 'espectacular') return false;
                    const parent = leftItems.find(i => i.id === editingChild.parentId) || rightItems.find(i => i.id === editingChild.parentId);
                    return parent?.children?.[editingChild.colIndex]?.some(c => c.type === 'espectacular' && c.id !== editingChild.child.id) ?? false;
                  })()
                }>Espectacular</option>
              </select>
            </div>

            {editingChild.child.type !== 'divisor' && (
              <div>
                <label className="text-sm font-semibold mb-1 block text-neutral-900 dark:text-neutral-200 font-poppins">Título</label>
                <input
                  className="w-full border border-neutral-300 dark:border-neutral-700 bg-transparent rounded p-2 text-sm text-neutral-900 dark:text-white font-poppins outline-none focus:border-info-main"
                  value={editingChild.child.title || ""}
                  onChange={(e) => setEditingChild({ ...editingChild, child: { ...editingChild.child, title: e.target.value } })}
                />
              </div>
            )}

            {(editingChild.child.type === 'link interno' || editingChild.child.type === 'link externo' || editingChild.child.type === 'espectacular') && (
              <>
                <div>
                  <label className="text-sm font-semibold mb-1 block text-neutral-900 dark:text-neutral-200 font-poppins">Descripción</label>
                  <textarea
                    className="w-full border border-neutral-300 dark:border-neutral-700 bg-transparent rounded p-2 text-sm text-neutral-900 dark:text-white font-poppins outline-none focus:border-info-main resize-none"
                    rows={2}
                    value={editingChild.child.description || ""}
                    onChange={(e) => setEditingChild({ ...editingChild, child: { ...editingChild.child, description: e.target.value } })}
                  />
                </div>
                {editingChild.child.type !== 'espectacular' && (
                  <div>
                    <label className="text-sm font-semibold mb-1 block text-neutral-900 dark:text-neutral-200 font-poppins">Icono</label>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 border border-neutral-300 dark:border-neutral-700 rounded flex items-center justify-center text-neutral-600 dark:text-neutral-300">
                        {editingChild.child.iconName ? (
                          editingChild.child.isBrand ? (
                            <Brand name={editingChild.child.iconName as any} size="m" />
                          ) : (
                            <CaralIcon name={editingChild.child.iconName as any} size="m" />
                          )
                        ) : (
                          <CaralIcon name="image" size="m" />
                        )}
                      </div>
                      <Button variant="outline" onClick={() => setIsIconPickerOpen(true)}>
                        Seleccionar Icono
                      </Button>
                      {editingChild.child.iconName && (
                        <Button variant="ghost" onClick={() => setEditingChild({ ...editingChild, child: { ...editingChild.child, iconName: undefined, isBrand: undefined } })}>
                          Quitar
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {editingChild.child.type === 'espectacular' && (
                  <>
                    <div>
                      <label className="text-sm font-semibold mb-1 block text-neutral-900 dark:text-neutral-200 font-poppins">Imagen</label>
                      <div className="flex flex-col gap-2">
                        {editingChild.child.imageUrl && (
                          <img src={editingChild.child.imageUrl} alt="preview" className="w-full h-32 object-cover rounded border border-neutral-300 dark:border-neutral-700" />
                        )}
                        <FileUploader
                          bucket="portal-assets"
                          folder="navbar"
                          onUploadSuccess={(url) => setEditingChild({ ...editingChild, child: { ...editingChild.child, imageUrl: url } })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-1 block text-neutral-900 dark:text-neutral-200 font-poppins">Texto del Botón</label>
                      <input
                        className="w-full border border-neutral-300 dark:border-neutral-700 bg-transparent rounded p-2 text-sm text-neutral-900 dark:text-white font-poppins outline-none focus:border-info-main"
                        value={editingChild.child.buttonText || ""}
                        onChange={(e) => setEditingChild({ ...editingChild, child: { ...editingChild.child, buttonText: e.target.value } })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-1 block text-neutral-900 dark:text-neutral-200 font-poppins">Tipo de Enlace</label>
                      <select
                        className="w-full border border-neutral-300 dark:border-neutral-700 bg-transparent rounded p-2 text-sm text-neutral-900 dark:text-white font-poppins outline-none focus:border-info-main"
                        value={editingChild.child.linkType || "interno"}
                        onChange={(e) => setEditingChild({ ...editingChild, child: { ...editingChild.child, linkType: e.target.value as any } })}
                      >
                        <option value="interno">Interno</option>
                        <option value="externo">Externo</option>
                      </select>
                    </div>
                  </>
                )}
              </>
            )}

            {(editingChild.child.type === 'link externo' || (editingChild.child.type === 'espectacular' && editingChild.child.linkType === 'externo')) && (
              <div>
                <label className="text-sm font-semibold mb-1 block text-neutral-900 dark:text-neutral-200 font-poppins">URL del Link</label>
                <input
                  className="w-full border border-neutral-300 dark:border-neutral-700 bg-transparent rounded p-2 text-sm text-neutral-900 dark:text-white font-poppins outline-none focus:border-info-main"
                  value={editingChild.child.url || ""}
                  placeholder="https://"
                  onChange={(e) => setEditingChild({ ...editingChild, child: { ...editingChild.child, url: e.target.value } })}
                />
              </div>
            )}
            {(editingChild.child.type === 'link interno' || (editingChild.child.type === 'espectacular' && (!editingChild.child.linkType || editingChild.child.linkType === 'interno'))) && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-semibold mb-1 block text-neutral-900 dark:text-neutral-200 font-poppins">Producto</label>
                  <select
                    className="w-full border border-neutral-300 dark:border-neutral-700 bg-transparent rounded p-2 text-sm text-neutral-900 dark:text-white font-poppins outline-none focus:border-info-main"
                    value={editingChild.child.producto || ""}
                    onChange={(e) => setEditingChild({ ...editingChild, child: { ...editingChild.child, producto: e.target.value, seccion: "", pagina: "" } })}
                  >
                    <option value="">Selecciona un producto</option>
                    {dbProducts.map(p => (
                      <option key={p.id} value={p.slug}>{p.title}</option>
                    ))}
                  </select>
                </div>
                {editingChild.child.producto && (
                  <div>
                    <label className="text-sm font-semibold mb-1 block text-neutral-900 dark:text-neutral-200 font-poppins">Sección</label>
                    <select
                      className="w-full border border-neutral-300 dark:border-neutral-700 bg-transparent rounded p-2 text-sm text-neutral-900 dark:text-white font-poppins outline-none focus:border-info-main"
                      value={editingChild.child.seccion || ""}
                      onChange={(e) => setEditingChild({ ...editingChild, child: { ...editingChild.child, seccion: e.target.value, pagina: "" } })}
                    >
                      <option value="">Selecciona una sección</option>
                      {Array.from(new Set(
                        dbDocs.filter(d => {
                          const prod = dbProducts.find(p => p.slug === editingChild.child.producto);
                          return prod && d.product_id === prod.id;
                        }).map(d => d.section || 'General')
                      )).map(sec => (
                        <option key={sec as string} value={sec as string}>{sec as string}</option>
                      ))}
                    </select>
                  </div>
                )}
                {editingChild.child.producto && editingChild.child.seccion && (
                  <div>
                    <label className="text-sm font-semibold mb-1 block text-neutral-900 dark:text-neutral-200 font-poppins">Página</label>
                    <select
                      className="w-full border border-neutral-300 dark:border-neutral-700 bg-transparent rounded p-2 text-sm text-neutral-900 dark:text-white font-poppins outline-none focus:border-info-main"
                      value={editingChild.child.pagina || ""}
                      onChange={(e) => setEditingChild({ ...editingChild, child: { ...editingChild.child, pagina: e.target.value } })}
                    >
                      <option value="">Selecciona una página</option>
                      {dbDocs.filter(d => {
                        const prod = dbProducts.find(p => p.slug === editingChild.child.producto);
                        return prod && d.product_id === prod.id && (d.section || 'General') === editingChild.child.seccion;
                      }).map(d => (
                        <option key={d.id} value={d.slug}>{d.title}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button
                variant="info"
                onClick={() => {
                  const updateList = (list: NavItemMock[], setList: any) => {
                    const parentIndex = list.findIndex(i => i.id === editingChild.parentId);
                    if (parentIndex !== -1) {
                      const newList = [...list];
                      const parentItem = { ...newList[parentIndex] };
                      const newChildren = { ...(parentItem.children || {}) };
                      const colItems = Array.from(newChildren[editingChild.colIndex] || []);

                      const childIndex = colItems.findIndex(c => c.id === editingChild.child.id);
                      if (childIndex !== -1) {
                        colItems[childIndex] = editingChild.child;
                        newChildren[editingChild.colIndex] = colItems;
                        parentItem.children = newChildren;
                        newList[parentIndex] = parentItem;
                        setList(newList);
                      }
                      return true;
                    }
                    return false;
                  };

                  if (!updateList(leftItems, setLeftItems)) {
                    updateList(rightItems, setRightItems);
                  }
                  setIsChildDrawerOpen(false);
                }}
              >
                Guardar
              </Button>
            </div>

            <div className="mt-8 border-t border-danger-main/30 pt-4">
              <h4 className="text-neutral-900 font-bold mb-1 text-lg font-poppins">Zona de peligro</h4>
              <p className="text-sm text-neutral-800 mb-4 font-poppins">Tenga cuidado con las siguientes funciones ya que no se pueden deshacer.</p>

              <div className="border border-danger-main bg-danger-light rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h5 className="text-danger-dark font-bold font-poppins text-[15px]">Eliminar Componente</h5>
                  <p className="text-danger-dark text-sm mt-0.5 font-poppins">El componente interno se eliminará de la columna.</p>
                </div>
                <Button
                  variant="danger"
                  iconName="trash"
                  onClick={() => {
                    const updateList = (list: NavItemMock[], setList: any) => {
                      const parentIndex = list.findIndex(i => i.id === editingChild.parentId);
                      if (parentIndex !== -1) {
                        const newList = [...list];
                        const parentItem = { ...newList[parentIndex] };
                        const newChildren = { ...(parentItem.children || {}) };
                        const colItems = Array.from(newChildren[editingChild.colIndex] || []);

                        const childIndex = colItems.findIndex(c => c.id === editingChild.child.id);
                        if (childIndex !== -1) {
                          colItems.splice(childIndex, 1);
                          newChildren[editingChild.colIndex] = colItems;
                          parentItem.children = newChildren;
                          newList[parentIndex] = parentItem;
                          setList(newList);
                        }
                        return true;
                      }
                      return false;
                    };

                    if (!updateList(leftItems, setLeftItems)) {
                      updateList(rightItems, setRightItems);
                    }
                    setIsChildDrawerOpen(false);
                  }}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <IconPickerModal
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        onSelect={(iconName, isBrand) => {
          if (isChildDrawerOpen && editingChild) {
            setEditingChild({ ...editingChild, child: { ...editingChild.child, iconName, isBrand } });
          } else if (isDrawerOpen && editingItem) {
            setEditingItem({ ...editingItem, iconName, isBrand });
          }
          setIsIconPickerOpen(false);
        }}
        initialIconName={isChildDrawerOpen ? editingChild?.child?.iconName : editingItem?.iconName}
        initialIsBrand={isChildDrawerOpen ? editingChild?.child?.isBrand : editingItem?.isBrand}
      />
    </div>
  );
}
