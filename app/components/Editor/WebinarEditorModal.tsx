import React, { useState, useRef } from 'react';
import { CaralIcon } from 'iconcaral2';
import { Button, TextInput } from 'caralstable';
import { createClient } from '@/utils/supabase/client';

interface WebinarEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (markdownString: string) => void;
}

export function WebinarEditorModal({ isOpen, onClose, onInsert }: WebinarEditorModalProps) {
  const supabase = createClient();
  
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [duration, setDuration] = useState('00:00:00');
  const [lang, setLang] = useState('ES');
  const [version, setVersion] = useState('1.0');
  const [description, setDescription] = useState('');
  const [speakers, setSpeakers] = useState('');
  
  const [imgType, setImgType] = useState<'upload' | 'manual'>('upload');
  const [manualImgPath, setManualImgPath] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) {
      alert("El título y la URL son obligatorios.");
      return;
    }

    let finalImgPath = manualImgPath;

    if (imgType === 'upload' && selectedFile) {
      setIsUploading(true);
      try {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `webinar_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `assets/webinars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('portal-assets')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('portal-assets')
          .getPublicUrl(filePath);

        finalImgPath = publicUrl;
      } catch (err) {
        console.error("Error subiendo la imagen", err);
        alert("Hubo un error subiendo la imagen. Revisa la consola.");
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    } else if (imgType === 'upload' && !selectedFile) {
      alert("Por favor selecciona una imagen para subir.");
      return;
    }

    if (!finalImgPath) {
        alert("Debes proveer una imagen (subiéndola o ingresando la ruta).");
        return;
    }

    // Build the Markdown String
    // We escape double quotes inside the attributes just in case
    const safeTitle = title.replace(/"/g, '&quot;');
    const safeImg = finalImgPath.replace(/"/g, '&quot;');
    const safeUrl = url.replace(/"/g, '&quot;');
    const safeDesc = description.replace(/"/g, '&quot;');
    const safeSpeakers = speakers.replace(/"/g, '&quot;');

    let markdownString = `<Webinar title="${safeTitle}" img="${safeImg}" duration="${duration}" version="${version}" url="${safeUrl}" lang="${lang}" description="${safeDesc}"`;
    
    if (safeSpeakers) {
      markdownString += ` speakers="${safeSpeakers}"`;
    }
    markdownString += ` />`;

    onInsert(markdownString);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setUrl('');
    setDuration('00:00:00');
    setLang('ES');
    setVersion('1.0');
    setDescription('');
    setSpeakers('');
    setImgType('upload');
    setManualImgPath('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col my-auto">
        
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 rounded-t-xl shrink-0">
          <h3 className="font-semibold text-lg text-neutral-800 dark:text-neutral-200 m-0 flex items-center gap-2">
            <CaralIcon name="video" size={20} />
            Insertar Componente Webinar
          </h3>
          <button 
            type="button" 
            onClick={handleClose}
            className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 bg-transparent border-0 cursor-pointer p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            <CaralIcon name="xCircle" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Título *</label>
              <TextInput 
                value={title} 
                onChange={(e: any) => setTitle(e.target.value)} 
                placeholder="Ej: Add Source and destination" 
                required 
              />
            </div>
            
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">URL del Video (YouTube o Enlace) *</label>
              <TextInput 
                value={url} 
                onChange={(e: any) => setUrl(e.target.value)} 
                placeholder="Ej: https://www.youtube.com/embed/..." 
                required 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Duración</label>
              <TextInput 
                value={duration} 
                onChange={(e: any) => setDuration(e.target.value)} 
                placeholder="00:00:00" 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Idioma</label>
              <TextInput 
                value={lang} 
                onChange={(e: any) => setLang(e.target.value)} 
                placeholder="ES, EN, etc." 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Versión</label>
              <TextInput 
                value={version} 
                onChange={(e: any) => setVersion(e.target.value)} 
                placeholder="1.0" 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Oradores (Opcional)</label>
              <TextInput 
                value={speakers} 
                onChange={(e: any) => setSpeakers(e.target.value)} 
                placeholder="Ej: Juan Pérez" 
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Descripción</label>
            <TextInput 
              value={description} 
              onChange={(e: any) => setDescription(e.target.value)} 
              placeholder="Breve descripción del webinar..." 
              multiline
              rows={3}
            />
          </div>

          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-neutral-50 dark:bg-neutral-800/50 flex flex-col gap-4">
            <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Imagen de Portada *</label>
            
            <div className="flex gap-4 mb-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input 
                  type="radio" 
                  name="imgType" 
                  checked={imgType === 'upload'} 
                  onChange={() => setImgType('upload')}
                  className="text-blue-600"
                />
                Subir nueva imagen
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input 
                  type="radio" 
                  name="imgType" 
                  checked={imgType === 'manual'} 
                  onChange={() => setImgType('manual')}
                  className="text-blue-600"
                />
                Ruta Manual (Migración)
              </label>
            </div>

            {imgType === 'upload' ? (
              <div className="flex flex-col gap-2">
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="text-sm text-neutral-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
                />
                {selectedFile && <p className="text-xs text-neutral-500 mt-1">Seleccionado: {selectedFile.name}</p>}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <TextInput 
                  value={manualImgPath} 
                  onChange={(e: any) => setManualImgPath(e.target.value)} 
                  placeholder="Ej: crestone/webinars/tuto1.png" 
                />
                <p className="text-xs text-neutral-500">Se usará como ruta relativa o URL tal cual está escrita.</p>
              </div>
            )}
          </div>
        </form>

        <div className="flex justify-end gap-3 p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 rounded-b-xl shrink-0">
          <Button variant="ghost" onClick={handleClose} type="button" disabled={isUploading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} type="button" disabled={isUploading}>
            {isUploading ? 'Subiendo...' : 'Insertar Webinar'}
          </Button>
        </div>

      </div>
    </div>
  );
}
