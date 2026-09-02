'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { CaralIcon } from 'iconcaral2';
import { Button } from 'caralstable';

interface StorageItem {
  name: string;
  id: string | null;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, any> | null;
}

export default function RecursosPage() {
  const [items, setItems] = useState<StorageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [itemToMove, setItemToMove] = useState<StorageItem | null>(null);
  const [destinationPath, setDestinationPath] = useState('');
  const [contextMenu, setContextMenu] = useState<{ visible: boolean, x: number, y: number, item: StorageItem | null }>({ visible: false, x: 0, y: 0, item: null });

  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(prev => ({ ...prev, visible: false }));
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const fetchItems = async (path: string = '') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('portal-assets')
        .list(path, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
        });

      if (error) throw error;

      // Supabase list includes a weird ".emptyFolderPlaceholder" sometimes, filter it
      const filtered = (data || []).filter(item => item.name !== '.emptyFolderPlaceholder');
      setItems(filtered);
    } catch (error: any) {
      console.error('Error fetching storage items:', error.message);
      alert('Error al cargar archivos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(currentPath);
  }, [currentPath]);

  const handleNavigate = (folderName: string) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setCurrentPath(newPath);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setCurrentPath('');
      return;
    }
    const parts = currentPath.split('/');
    const newPath = parts.slice(0, index + 1).join('/');
    setCurrentPath(newPath);
  };

  const getPublicUrl = (fileName: string) => {
    const filePath = currentPath ? `${currentPath}/${fileName}` : fileName;
    const { data } = supabase.storage.from('portal-assets').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = currentPath ? `${currentPath}/${file.name}` : file.name;

        const { error } = await supabase.storage
          .from('portal-assets')
          .upload(filePath, file, { upsert: true });

        if (error) throw error;
      }
      fetchItems(currentPath);
    } catch (error: any) {
      console.error('Error uploading:', error.message);
      alert('Error al subir archivo: ' + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const listAllFiles = async (folderPath: string): Promise<string[]> => {
    let allFiles: string[] = [];
    const { data, error } = await supabase.storage.from('portal-assets').list(folderPath, { limit: 1000 });
    if (error) return [];

    for (const item of data || []) {
      const itemPath = folderPath ? `${folderPath}/${item.name}` : item.name;
      const isFolder = item.id === null || item.metadata === null;
      if (isFolder) {
        if (item.name !== '.emptyFolderPlaceholder') {
          const subFiles = await listAllFiles(itemPath);
          allFiles = allFiles.concat(subFiles);
        } else {
          allFiles.push(itemPath); // Include the placeholder so the folder deletes completely
        }
      } else {
        allFiles.push(itemPath);
      }
    }
    // Also include the folder's own empty placeholder if it exists at this root level (usually deleted when all contents are deleted)
    return allFiles;
  };

  const handleDelete = async (item: StorageItem) => {
    const isFolder = item.id === null || item.metadata === null;
    const typeStr = isFolder ? 'la carpeta' : 'el archivo';
    if (!window.confirm(`¿Estás seguro de que deseas eliminar ${typeStr} "${item.name}"?`)) return;

    setUploading(true);
    try {
      const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;

      let filesToRemove = [itemPath];
      if (isFolder) {
        filesToRemove = await listAllFiles(itemPath);
        // Also push the placeholder of the folder itself in case it's an empty folder
        filesToRemove.push(`${itemPath}/.emptyFolderPlaceholder`);
      }

      if (filesToRemove.length > 0) {
        const { error } = await supabase.storage
          .from('portal-assets')
          .remove(filesToRemove);
        if (error) throw error;
      }

      fetchItems(currentPath);
    } catch (error: any) {
      console.error('Error deleting:', error.message);
      alert('Error al eliminar: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const createFolder = async () => {
    const folderName = window.prompt("Nombre de la nueva carpeta:");
    if (!folderName || folderName.trim() === "") return;

    // Supabase uses virtual folders, so we upload a placeholder file to create it
    const safeFolderName = folderName.trim().replace(/\s+/g, '-');
    const folderPath = currentPath
      ? `${currentPath}/${safeFolderName}/.emptyFolderPlaceholder`
      : `${safeFolderName}/.emptyFolderPlaceholder`;

    setUploading(true);
    try {
      // Create an empty file
      const emptyFile = new File([""], ".emptyFolderPlaceholder", { type: "text/plain" });
      const { error } = await supabase.storage
        .from('portal-assets')
        .upload(folderPath, emptyFile, { upsert: true });

      if (error) throw error;
      fetchItems(currentPath);
    } catch (error: any) {
      console.error('Error creating folder:', error.message);
      alert('Error al crear carpeta: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const openMoveModal = (item: StorageItem) => {
    setItemToMove(item);
    setDestinationPath(currentPath);
    setMoveModalOpen(true);
  };

  const handleMove = async () => {
    if (!itemToMove) return;

    setUploading(true);
    try {
      const isFolder = itemToMove.id === null || itemToMove.metadata === null;
      const oldBasePath = currentPath ? `${currentPath}/${itemToMove.name}` : itemToMove.name;
      const cleanDest = destinationPath.replace(/^\/+|\/+$/g, '');
      const newBasePath = cleanDest ? `${cleanDest}/${itemToMove.name}` : itemToMove.name;

      if (oldBasePath === newBasePath) {
        setMoveModalOpen(false);
        setUploading(false);
        return; // No change
      }

      if (isFolder) {
        const filesToMove = await listAllFiles(oldBasePath);
        // Move the placeholder of the folder itself if it exists
        filesToMove.push(`${oldBasePath}/.emptyFolderPlaceholder`);

        for (const filePath of filesToMove) {
          const relativePath = filePath.substring(oldBasePath.length);
          const newFilePath = newBasePath + relativePath;
          const { error } = await supabase.storage.from('portal-assets').move(filePath, newFilePath);
          if (error && error.message !== 'The resource was not found') {
            throw error; // Ignore not found errors for placeholders
          }
        }
      } else {
        const { error } = await supabase.storage
          .from('portal-assets')
          .move(oldBasePath, newBasePath);

        if (error) throw error;
      }

      setMoveModalOpen(false);
      fetchItems(currentPath);
    } catch (error: any) {
      console.error('Error moving:', error.message);
      alert('Error al mover: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, item: StorageItem) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, item });
  };

  const breadcrumbs = currentPath.split('/').filter(Boolean);

  return (
    <div className="flex flex-col h-full bg-full font-poppins text-neutral-800 dark:text-neutral-200 text-neutral-900 animate-fade-in relative">
      <div className="flex-none p-6 flex items-center justify-between p-4 bg-container rounded-xl">
        <div>
          <h1 className="text-2xl font-semibold mb-2 flex items-center gap-2">
            <CaralIcon name="image" size="m" /> Recursos
          </h1>
          <div className="flex items-center gap-2 text-sm text-neutral-800">
            <button
              onClick={() => handleBreadcrumbClick(-1)}
              className="hover:text-info-main hover:underline transition-colors"
            >
              raíz
            </button>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <CaralIcon name="chevronRigth" size="s" />
                <button
                  onClick={() => handleBreadcrumbClick(idx)}
                  className="hover:text-info-main hover:underline transition-colors"
                >
                  {crumb}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            onChange={handleUpload}
          />
          <Button
            onClick={() => createFolder()}
            isLoading={uploading}
            iconName="newFile"
            variant='ghost'
          >
            Nueva Carpeta
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            isLoading={uploading}
            iconName="arrowUpToLine"
            variant='info'
          >
            Subir Archivo
          </Button>

        </div>
      </div>

      <div className="flex-1 overflow-auto pt-6">
        {loading ? (
          <div className="text-center py-12 text-neutral-500">Cargando archivos...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center gap-4 text-neutral-500 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl">
            <CaralIcon name="folder" size="l" />
            <p>Esta carpeta está vacía.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {items.map((item) => {
              const isFolder = item.id === null || item.metadata === null;

              if (isFolder) {
                return (
                  <div
                    key={item.name}
                    className="bg-container border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:shadow-lg cursor-pointer transition-all group"
                    onClick={() => handleNavigate(item.name)}
                    onContextMenu={(e) => handleContextMenu(e, item)}
                  >
                    <div className="text-info-main opacity-80 group-hover:opacity-100 transition-opacity">
                      <CaralIcon name="folder" size="l" />
                    </div>
                    <span className="text-sm font-medium text-center truncate w-full" title={item.name}>{item.name}</span>
                  </div>
                );
              }

              // File
              const isImage = item.metadata?.mimetype?.startsWith('image/');
              const url = getPublicUrl(item.name);

              return (
                <div
                  key={item.name}
                  className="bg-container border border-neutral-200 dark:border-neutral-800 rounded-xl flex flex-col overflow-hidden hover:shadow-lg transition-all group relative"
                  onContextMenu={(e) => handleContextMenu(e, item)}
                >
                  <div className="h-32 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center overflow-hidden">
                    {isImage ? (
                      <img src={url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="text-neutral-400">
                        <CaralIcon name="file" size="l" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex flex-col gap-1">
                    <span className="text-sm font-medium truncate w-full" title={item.name}>{item.name}</span>
                    <span className="text-xs text-neutral-500 truncate">{item.metadata?.mimetype || 'Archivo'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Mover */}
      {moveModalOpen && itemToMove && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 w-[400px] shadow-2xl flex flex-col gap-4">
            <h3 className="text-lg font-semibold">Mover {itemToMove.id === null ? 'Carpeta' : 'Archivo'}</h3>
            <p className="text-sm text-neutral-600">Estás moviendo <strong>{itemToMove.name}</strong>. Escribe la ruta de la carpeta destino (déjalo en blanco para mover a la raíz).</p>
            <input
              type="text"
              value={destinationPath}
              onChange={(e) => setDestinationPath(e.target.value)}
              placeholder="ej: uploads/imagenes"
              className="w-full p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm outline-none focus:border-info-main"
            />
            <div className="flex gap-2 justify-end mt-2">
              <Button variant="ghost" onClick={() => setMoveModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleMove} isLoading={uploading}>Mover</Button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.visible && contextMenu.item && (
        <div
          className="fixed z-[200] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-xl rounded-xl py-2 flex flex-col min-w-[150px] animate-fade-in"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()} // Prevent closing immediately if they click inside the menu
        >
          {contextMenu.item && (contextMenu.item.id !== null && contextMenu.item.metadata !== null) && (
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 w-full text-left transition-colors border-b border-neutral-100 dark:border-neutral-800"
              onClick={() => {
                const url = getPublicUrl(contextMenu.item!.name);
                navigator.clipboard.writeText(url);
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
            >
              <CaralIcon name="link" size="s" />
              Copiar enlace
            </button>
          )}
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 w-full text-left transition-colors"
            onClick={() => {
              openMoveModal(contextMenu.item!);
              setContextMenu(prev => ({ ...prev, visible: false }));
            }}
          >
            <CaralIcon name="chevronsUp" size="s" />
            Mover
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm text-danger-main hover:bg-danger-light w-full text-left transition-colors"
            onClick={() => {
              handleDelete(contextMenu.item!);
              setContextMenu(prev => ({ ...prev, visible: false }));
            }}
          >
            <CaralIcon name="trash" size="s" />
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}
