export type TicketCategory = 'Todas' | 'IT Support' | 'Cybersecurity' | 'IT Infrastructure' | 'People and Culture';

export interface TicketService {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
}

export const ticketCategories: { id: TicketCategory; label: string; icon: string }[] = [
  { id: 'Todas', label: 'Todas', icon: 'grid' },
  { id: 'IT Support', label: 'IT Support', icon: 'computer' },
  { id: 'Cybersecurity', label: 'Cybersecurity', icon: 'lock' },
  { id: 'IT Infrastructure', label: 'IT Infrastructure', icon: 'server' },
  { id: 'People and Culture', label: 'People and Culture', icon: 'users' }
];

export const mockTickets: TicketService[] = [
  {
    id: '1',
    title: 'Acceso a Recursos Cloud - SEGURIDAD',
    description: 'Solicitud de accesos y permisos a recursos Cloud (Azure o AWS).',
    category: 'Cybersecurity'
  },
  {
    id: '2',
    title: 'Acción solicitada | PDI',
    description: '¿Querés proponer una acción de desarrollo en tu PDI? Completá este formulario.',
    category: 'People and Culture'
  },
  {
    id: '3',
    title: 'Activación de Office o Windows - SOPORTE',
    description: 'Solicitud de activación de Office o Windows',
    category: 'IT Support'
  },
  {
    id: '4',
    title: 'Agregar dominio Externo a Teams - SEGURIDAD',
    description: 'Solicitar autorización para contactarse con clientes externos por Teams.',
    category: 'Cybersecurity'
  },
  {
    id: '5',
    title: 'Alta y Baja Flota Telefónica - INFRA',
    description: 'Solicitudes para sumarse o salir de la flota telefónica',
    category: 'IT Infrastructure'
  },
  {
    id: '6',
    title: 'Contraseña/MFA Office365 corporativo - SEGURIDAD',
    description: 'Inconvenientes con Contraseña, MFA o login del correo corporativo exclusivamente.',
    category: 'Cybersecurity'
  },
  {
    id: '7',
    title: 'Creación de Grupo en Teams - INFRA',
    description: 'Solicitud para la creación de un grupo en Teams',
    category: 'IT Infrastructure'
  },
  {
    id: '8',
    title: 'Creación de Virtual Machine - INFRA',
    description: 'Solicitud para la creación de una Virtual Machine',
    category: 'IT Infrastructure'
  },
  {
    id: '9',
    title: 'Creación Mail para Externo - SOPORTE',
    description: 'Solicitud de Creación de Cuenta de Mail para Externo',
    category: 'IT Support'
  }
];
