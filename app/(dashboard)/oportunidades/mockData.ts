export type OpportunityStatus = string;

export interface Opportunity {
  id: string;
  clientName: string;
  productName: string;
  status: OpportunityStatus;
  country?: string;
  city?: string;
  repName?: string;
  industry?: string;
  raw?: any;
  requiresIntervention?: boolean;
  missingRequirements?: boolean;
}

export const mockOpportunities: Opportunity[] = [
  { id: 'opp-1', clientName: 'TechCorp Solutions', productName: 'Implementación SAP B1', status: 'nuevas' },
  { id: 'opp-2', clientName: 'Innovatech LLC', productName: 'Migración a AWS', status: 'nuevas' },
  { id: 'opp-3', clientName: 'Global Logistics', productName: 'Cybersecurity Audit', status: 'contacto' },
  { id: 'opp-4', clientName: 'Financiera del Norte', productName: 'Licenciamiento Office 365', status: 'contacto' },
  { id: 'opp-5', clientName: 'Hospital Central', productName: 'Renovación Infraestructura', status: 'propuesta' },
  { id: 'opp-6', clientName: 'Constructora Beta', productName: 'Implementación SAP S/4HANA', status: 'negociacion' },
  { id: 'opp-7', clientName: 'Retail Express', productName: 'App Móvil Personalizada', status: 'nuevas' },
];
