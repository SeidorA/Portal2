import React, { useState, useEffect } from 'react';
import { Button } from 'caralstable';
import { CaralIcon } from 'iconcaral2';
import { createClient } from '@/utils/supabase/client';

interface FeatureImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (productId: string, featureTitle: string, format: string) => void;
}

export default function FeatureImportModal({
  isOpen,
  onClose,
  onInsert,
}: FeatureImportModalProps) {
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  
  const [features, setFeatures] = useState<any[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<any | null>(null);

  const [format, setFormat] = useState<string>('list');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedProduct(null);
      setSelectedFeature(null);
      setFormat('list');
      fetchProducts();
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, title, features')
        .order('title');
      
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
    setFeatures(product.features || []);
    setStep(2);
  };

  const handleSelectFeature = (feature: any) => {
    setSelectedFeature(feature);
    setStep(3);
  };

  const handleConfirm = () => {
    if (selectedProduct && selectedFeature && format) {
      onInsert(selectedProduct.id, selectedFeature.title, format);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
            {step === 1 && '1. Seleccionar Producto'}
            {step === 2 && '2. Seleccionar Feature'}
            {step === 3 && '3. Formato de Salida'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-white rounded-lg transition-colors"
          >
            <CaralIcon name="x" size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col h-[400px] overflow-y-auto bg-neutral-50/50 dark:bg-neutral-900/50">
          
          {loading && step === 1 && (
            <div className="flex-1 flex items-center justify-center text-neutral-500">Cargando productos...</div>
          )}

          {step === 1 && !loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {products.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSelectProduct(p)}
                  className="p-4 text-left border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group"
                >
                  <div className="font-semibold text-neutral-900 dark:text-white group-hover:text-blue-600 transition-colors">{p.title}</div>
                  <div className="text-sm text-neutral-500 mt-1">{p.features?.length || 0} features disponibles</div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setStep(1)}
                className="text-sm text-blue-600 mb-2 flex items-center gap-1 hover:underline self-start"
              >
                <CaralIcon name="arrowLeft" size={14} /> Volver a productos
              </button>
              {features.length === 0 ? (
                <div className="text-neutral-500 text-center py-8">Este producto no tiene features configuradas.</div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {features.map((f, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectFeature(f)}
                      className="p-3 text-left border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 rounded-lg hover:border-blue-500 hover:shadow-md transition-all flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-medium text-neutral-900 dark:text-white group-hover:text-blue-600">{f.title}</div>
                        <div className="text-xs text-neutral-500 uppercase tracking-wider">{f.type}</div>
                      </div>
                      <CaralIcon name="chevronRigth" size={16} className="text-neutral-400 group-hover:text-blue-600" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => setStep(2)}
                className="text-sm text-blue-600 flex items-center gap-1 hover:underline self-start"
              >
                <CaralIcon name="arrowLeft" size={14} /> Volver a features
              </button>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/50">
                <span className="text-sm text-blue-600 dark:text-blue-400 font-semibold block mb-1">Feature Seleccionada</span>
                <span className="text-neutral-900 dark:text-white font-medium">{selectedProduct?.title} &rarr; {selectedFeature?.title}</span>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">¿Cómo deseas que se muestre en el documento?</label>
                <div className="grid grid-cols-1 gap-3">
                  <label className={`p-4 border rounded-lg cursor-pointer transition-all flex gap-3 ${format === 'list' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:bg-neutral-50 dark:hover:bg-neutral-900'}`}>
                    <input type="radio" name="format" value="list" checked={format === 'list'} onChange={(e) => setFormat(e.target.value)} className="mt-1" />
                    <div>
                      <div className="font-medium text-neutral-900 dark:text-white">Lista con viñetas</div>
                      <div className="text-sm text-neutral-500 mt-1">
                        • Opción A<br/>
                        • Opción B
                      </div>
                    </div>
                  </label>
                  <label className={`p-4 border rounded-lg cursor-pointer transition-all flex gap-3 ${format === 'comma' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:bg-neutral-50 dark:hover:bg-neutral-900'}`}>
                    <input type="radio" name="format" value="comma" checked={format === 'comma'} onChange={(e) => setFormat(e.target.value)} className="mt-1" />
                    <div>
                      <div className="font-medium text-neutral-900 dark:text-white">Párrafo separado por comas</div>
                      <div className="text-sm text-neutral-500 mt-1">Opción A, Opción B, Opción C</div>
                    </div>
                  </label>
                  <label className={`p-4 border rounded-lg cursor-pointer transition-all flex gap-3 ${format === 'quote' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:bg-neutral-50 dark:hover:bg-neutral-900'}`}>
                    <input type="radio" name="format" value="quote" checked={format === 'quote'} onChange={(e) => setFormat(e.target.value)} className="mt-1" />
                    <div>
                      <div className="font-medium text-neutral-900 dark:text-white">Bloque de cita (Quote)</div>
                      <div className="text-sm text-neutral-500 mt-1 border-l-2 border-neutral-300 pl-2">Opción A<br/>Opción B</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-neutral-200 dark:border-neutral-800">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          {step === 3 && (
            <Button variant="info" onClick={handleConfirm}>
              Insertar Feature
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
