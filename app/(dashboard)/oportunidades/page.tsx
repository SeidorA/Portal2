"use client";

import React, { useState, useEffect } from 'react';
import KanbanBoard from './KanbanBoard';
import ListView from './ListView';
import OpportunityForm from './OpportunityForm';
import OpportunityDetails from './OpportunityDetails';
import { Button, Drawer } from 'caralstable';
import { createClient } from '@/utils/supabase/client';
import { Opportunity } from './mockData';
import { useRouter } from 'next/navigation';

export default function OportunidadesPage() {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [selectedInitialTab, setSelectedInitialTab] = useState<'info' | 'features' | 'reqs' | 'approvals'>('info');
  const supabase = createClient();
  const router = useRouter();

  const loadOpportunities = async () => {
    const { data: stagesData } = await supabase.from('opportunity_stages').select('*').order('order_index');
    if (stagesData) setStages(stagesData);

    // Aquí hacemos un join simple con products para tener productName
    const { data, error } = await supabase
      .from('opportunities')
      .select(`
        *,
        products ( id, title, requirements, features )
      `);

    const { data: { user } } = await supabase.auth.getUser();
    let userRoles: string[] = [];
    if (user) {
      const { data: rData } = await supabase.from('user_roles').select('role_id').eq('user_id', user.id);
      if (rData) userRoles = rData.map(r => r.role_id);
    }

    const { data: configData } = await supabase.from('product_stage_config').select('*');
    const { data: approvalsData } = await supabase.from('opportunity_approvals').select('*');

    if (!error && data) {
      const isRequirementVisible = (req: any, answers: any) => {
        if (!req.depends_on || !req.depends_on.requirement_id) return true;
        const parentId = req.depends_on.requirement_id;
        const expectedValue = req.depends_on.value;
        const parentAnswer = answers[parentId];
        if (Array.isArray(parentAnswer)) return parentAnswer.includes(expectedValue);
        return parentAnswer === expectedValue;
      };

      const isRequirementCompleted = (req: any, answer: any) => {
        if (answer === undefined || answer === null || answer === '') return false;
        if (req.type === 'tasklist') {
          if (!Array.isArray(answer)) return false;
          return req.options && req.options.every((opt: string) => answer.includes(opt));
        }
        if (req.type === 'boolean') return answer === true;
        if (Array.isArray(answer) && answer.length === 0) return false;
        return true;
      };

      const mapped = data.map(d => {
        let requiresIntervention = false;
        let missingRequirements = false;
        let missingFeatures = false;

        const config = configData?.find(c => c.product_id === d.products?.id && c.stage_id === d.status);

        if (user && config) {
          if (config && Array.isArray(config.trigger_automations)) {
            const triggers = config.trigger_automations;
            triggers.forEach((t: any) => {
              if (t.type === 'user_approval' && t.target === user.id) {
                const isApproved = approvalsData?.some(a => a.opportunity_id === d.id && a.stage_id === d.status && a.approved_by === user.id);
                if (!isApproved) requiresIntervention = true;
              }
              if (t.type === 'role_approval' && userRoles.includes(t.target)) {
                const isApproved = approvalsData?.some(a => a.opportunity_id === d.id && a.stage_id === d.status && a.role_used === t.target);
                if (!isApproved) requiresIntervention = true;
              }
            });
          }
        }

        if (config && (d.products?.requirements || d.products?.features)) {
          const reqIds = config.required_fields || [];
          const allCombined = [...(d.products.requirements || []), ...(d.products.features || [])];
          const reqs = allCombined.filter((r: any) => reqIds.includes(r.id));
          const answers = d.technical_answers || d.raw?.technical_answers || {};

          for (const req of reqs) {
            if (isRequirementVisible(req, answers) && req.is_mandatory && !isRequirementCompleted(req, answers[req.id])) {
              if (d.products?.features?.some((f: any) => f.id === req.id)) {
                missingFeatures = true;
              } else {
                missingRequirements = true;
              }
            }
          }
        }

        return {
          id: d.id,
          clientName: d.company_data?.name || 'Sin cliente',
          productName: d.products?.title || 'Producto Desconocido',
          status: d.status,
          country: d.company_data?.country || '',
          city: d.company_data?.city || '',
          industry: d.company_data?.industry || '',
          repName: d.rep_data?.name || '',
          raw: d,
          requiresIntervention,
          missingRequirements,
          missingFeatures
        };
      });
      setOpportunities(mapped);
    }
  };

  useEffect(() => {
    loadOpportunities();
  }, []);

  const toggleView = () => {
    setViewMode(prev => prev === 'kanban' ? 'list' : 'kanban');
  };

  const handleSuccess = () => {
    setIsFormDrawerOpen(false);
    loadOpportunities();
  };

  const handleOpportunityClick = (opportunity: Opportunity, initialTab: 'info' | 'features' | 'reqs' | 'approvals' = 'info') => {
    setSelectedInitialTab(initialTab);
    setSelectedOpportunity(opportunity);
  };

  return (
    <div className="w-full h-full p-4 md:p-8 animate-fade-in flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-8 gap-4 bg-container p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg">
        <div>
          <h2 className="text-[28px] font-semibold text-neutral-900">
            Oportunidades
          </h2>
          <p className="text-neutral-800 text-sm">
            Administra el estado de tus leads y oportunidades en tiempo real.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant='light'
            size='md'
            isIconButton
            iconName={viewMode === 'kanban' ? 'list' : 'grid'}
            onClick={toggleView}
          >
            Cambiar vista
          </Button>

          <Button
            variant='light'
            hasBorder
            size='md'
            iconName='gear'
            isIconButton
            onClick={() => router.push('/oportunidades/configuracion')}
          >
            Configurar Pipeline
          </Button>

          {/**<Button
            variant='light'
            hasBorder
            size='md'
            iconName='filter'
            isIconButton
          >
            Filtrar
          </Button>
          */}
          <Button
            variant='info'
            size='md'
            iconName='plus'
            onClick={() => setIsFormDrawerOpen(true)}
          >
            Nueva oportunidad
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {viewMode === 'kanban' ? (
          <KanbanBoard
            opportunities={opportunities}
            setOpportunities={setOpportunities}
            stages={stages}
            onOpportunityClick={handleOpportunityClick}
          />
        ) : (
          <ListView
            opportunities={opportunities}
            stages={stages}
            onOpportunityClick={handleOpportunityClick}
          />
        )}
      </div>

      <Drawer
        isOpen={isFormDrawerOpen}
        onClose={() => setIsFormDrawerOpen(false)}
        title="Registrar Oportunidad"
        size="lg"
      >
        <OpportunityForm onClose={() => setIsFormDrawerOpen(false)} onSuccess={handleSuccess} />
      </Drawer>

      <Drawer
        isOpen={!!selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
        title="Detalles de la Oportunidad"
        size="lg"
      >
        {selectedOpportunity && (
          <OpportunityDetails
            opportunity={selectedOpportunity}
            onClose={() => setSelectedOpportunity(null)}
            initialTab={selectedInitialTab}
            stages={stages}
          />
        )}
      </Drawer>
    </div>
  );
}

