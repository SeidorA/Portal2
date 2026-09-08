"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Tabs } from 'caralstable';
import { createClient } from '@/utils/supabase/client';
import RequirementsBoard from './RequirementsBoard';
import StageBuilder from './StageBuilder';
import OpportunityFieldBuilder from './OpportunityFieldBuilder';
import AutomationBuilder from './AutomationBuilder';
import AccessBuilder from './AccessBuilder';
import { useTranslation } from '@/app/context/LanguageContext';

export default function ConfigurarPipelinePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'etapas' | 'campos' | 'requisitos' | 'triggers' | 'accesos'>('etapas');
  const [stages, setStages] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [configData, setConfigData] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const loadData = async () => {
      // 1. Cargar Estados (Stages)
      const { data: stagesData } = await supabase
        .from('opportunity_stages')
        .select('*')
        .order('order_index');

      if (stagesData) setStages(stagesData);

      // 2. Cargar Productos (para poder elegir a qué producto configuramos los requisitos)
      const { data: productsData } = await supabase
        .from('products')
        .select('id, title, requirements, features')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (productsData) setProducts(productsData);
      if (productsData && productsData.length > 0) {
        setSelectedProduct(productsData[0].id);
        loadConfigData(productsData[0].id);
      }

      // 3. Cargar perfiles
      const { data: profilesData } = await supabase.from('profiles').select('id, email').order('email');
      if (profilesData) setProfiles(profilesData);

      // 4. Cargar roles
      const { data: rolesData } = await supabase.from('roles').select('id, name').order('name');
      if (rolesData) setRoles(rolesData);
    };

    loadData();
  }, []);

  const loadConfigData = async (productId: string) => {
    const { data } = await supabase
      .from('product_stage_config')
      .select('*')
      .eq('product_id', productId);

    if (data) setConfigData(data);
  };

  const handleProductChange = (productId: string) => {
    setSelectedProduct(productId);
    loadConfigData(productId);
  };

  const handleBoardChange = (newConfig: any[]) => {
    setConfigData(newConfig);
  };

  const handleSave = async () => {
    if (!selectedProduct) return;

    // First, delete existing config for this product
    await supabase
      .from('product_stage_config')
      .delete()
      .eq('product_id', selectedProduct);

    // Insert new config
    const toInsert = configData.map(c => ({
      product_id: selectedProduct,
      stage_id: c.stage_id,
      required_fields: c.required_fields || [],
      auto_advance_on_complete: c.auto_advance_on_complete || false,
      trigger_automations: c.trigger_automations || [],
      access_roles: c.access_roles || []
    }));

    if (toInsert.length > 0) {
      const { error } = await supabase
        .from('product_stage_config')
        .insert(toInsert);

      if (error) {
        alert(t('opportunities.errorSaving', "Error al guardar: ") + error.message);
        return;
      }
    }

    alert(t('opportunities.configSavedSuccess', 'Configuración guardada exitosamente'));
  };

  return (
    <div className="w-full h-full p-4 md:p-8 animate-fade-in flex flex-col">

      <div className='absolute bottom-15 right-15 z-10'>
        <Button variant="info" iconName="save" onClick={handleSave}>
          {t('opportunities.saveChanges', 'Guardar Cambios')}
        </Button>
      </div>

      <div className="flex items-center gap-2 text-sm text-neutral-800 mb-2 bg-container border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
        <Button variant='ghost' className='text-neutral-800!' iconName='house' onClick={() => router.push('/')} />
        <span>/</span>
        <button onClick={() => router.push('/oportunidades')} className="hover:text-blue-600 transition-colors">
          {t('opportunities.breadcrumbOpportunities', 'Oportunidades')}
        </button>
        <span>/</span>
        <span className="text-neutral-900 font-medium">{t('opportunities.breadcrumbConfig', 'Configuración de Pipeline')}</span>
      </div>

      <div className="bg-container p-4 mb-4 border border-neutral-200 dark:border-neutral-800 rounded-lg">
        {/* HEADER */}
        <Button variant="ghost"
          onClick={() => router.push('/oportunidades')}
          iconName='arrowLeft'
          className='mb-4 p-0!'
        >
          {t('opportunities.backBtn', 'Volver')}
        </Button>

        <div className="mb-8">
          <h2 className="text-[28px] font-semibold text-neutral-900">
            {t('opportunities.pipelineTitle', 'Pipeline de Oportunidades')}
          </h2>
          <p className="text-neutral-800 text-sm">
            {t('opportunities.pipelineSubtitle', 'Configura las etapas, requisitos obligatorios, automatizaciones y permisos.')}
          </p>
        </div>


        {/* TABS */}
        <div className="w-full">
          <Tabs
            tabs={[
              { label: t('opportunities.tabPipelineStages', 'Estados del Pipeline') },
              { label: t('opportunities.tabOpportunityFields', 'Campos de Oportunidad') },
              { label: t('opportunities.tabRequirementsMatrix', 'Formulario de Requisitos') },
              { label: t('opportunities.tabTriggersAutomations', 'Triggers y Automatizaciones') },
              { label: t('opportunities.tabAccesses', 'Accesos') }
            ]}
            activeIndex={
              activeTab === 'etapas' ? 0 :
                activeTab === 'campos' ? 1 :
                  activeTab === 'requisitos' ? 2 :
                    activeTab === 'triggers' ? 3 : 4
            }
            onChange={(idx) => {
              const tabsMap: any = { 0: 'etapas', 1: 'campos', 2: 'requisitos', 3: 'triggers', 4: 'accesos' };
              setActiveTab(tabsMap[idx]);
            }}
          />
        </div>

      </div>
      {/* CONTENT */}
      <div className="flex-1 bg-container border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 overflow-y-auto">
        {activeTab === 'etapas' && (
          <StageBuilder />
        )}

        {activeTab === 'campos' && (
          <OpportunityFieldBuilder />
        )}

        {activeTab === 'requisitos' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white">
                {t('opportunities.techReqsMatrix', 'Matriz de Requisitos Técnicos')}
              </h3>

              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">{t('opportunities.productLabel', 'Producto:')}</span>
                <select
                  className="h-9 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
                  value={selectedProduct || ''}
                  onChange={(e) => handleProductChange(e.target.value)}
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedProduct && (
              <RequirementsBoard
                product={products.find(p => p.id === selectedProduct)}
                stages={stages}
                configData={configData}
                onChange={handleBoardChange}
              />
            )}
          </div>
        )}

        {activeTab === 'triggers' && (
          <AutomationBuilder
            products={products}
            stages={stages}
            selectedProduct={selectedProduct}
            onProductChange={handleProductChange}
            configData={configData}
            onChange={handleBoardChange}
            profiles={profiles}
            roles={roles}
          />
        )}



        {activeTab === 'accesos' && (
          <AccessBuilder
            products={products}
            stages={stages}
            selectedProduct={selectedProduct}
            onProductChange={handleProductChange}
            configData={configData}
            onChange={handleBoardChange}
            roles={roles}
          />
        )}
      </div>
    </div>
  );
}

