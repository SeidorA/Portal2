'use server';

import { createClient } from '@/utils/supabase/server';

export interface SearchResult {
  id: string;
  title: string;
  type: string;
  url: string;
  snippet?: string;
  icon?: string;
}

const DASHBOARD_PAGES = [
  { id: 'dash-1', title: 'Configuración', url: '/configuracion', type: 'página' },
  { id: 'dash-2', title: 'Contenido', url: '/contenido', type: 'página' },
  { id: 'dash-3', title: 'Dashboard', url: '/dashboard', type: 'página' },
  { id: 'dash-4', title: 'Documentos', url: '/documentos', type: 'página' },
  { id: 'dash-5', title: 'Oportunidades', url: '/oportunidades', type: 'página' },
  { id: 'dash-6', title: 'Perfil', url: '/perfil', type: 'página' },
  { id: 'dash-7', title: 'Productos', url: '/productos', type: 'página' },
  { id: 'dash-8', title: 'Roles', url: '/roles', type: 'página' },
  { id: 'dash-9', title: 'Tickets', url: '/tickets', type: 'página' },
  { id: 'dash-10', title: 'Usuarios', url: '/usuarios', type: 'página' },
];

export interface SearchResultResponse {
  results: SearchResult[];
}

export async function searchGlobal(query: string): Promise<SearchResultResponse> {
  if (!query || query.trim() === '') return { results: [] };
  
  const supabase = await createClient();
  const lowerQuery = query.toLowerCase().trim();
  const maxResults = 5;

  const words = lowerQuery.split(/\s+/).filter(Boolean);

  const results: SearchResult[] = [];

  // 1. Search in Dashboard Pages
  const matchedPages = DASHBOARD_PAGES.filter(p => {
    return words.every(word => p.title.toLowerCase().includes(word) || p.type.toLowerCase().includes(word));
  }).slice(0, maxResults);
  results.push(...matchedPages);

  // 2. Search in Novedades
  let novedadesQuery = supabase
    .from('novedades')
    .select('id, title, content')
    .eq('status', 'published')
    .limit(maxResults);
    
  words.forEach(word => {
    novedadesQuery = novedadesQuery.or(`title.ilike.%${word}%,content.ilike.%${word}%`);
  });

  const { data: novedadesData, error: novedadesError } = await novedadesQuery;
  if (!novedadesError && novedadesData) {
    results.push(...novedadesData.map(n => ({
      id: n.id,
      title: n.title,
      type: 'novedad',
      url: `/novedades/${n.id}`,
      snippet: n.content ? n.content.substring(0, 100) + '...' : ''
    })));
  }

  // 3. Search in Documentation
  // We try to get products slug to build the URL.
  // Note: If products doesn't have a slug, we might need to adjust this. 
  // For now, assuming products has 'slug' or we might fallback.
  // Actually let's just get the product data as well.
  let docsQuery = supabase
    .from('documentation')
    .select(`
      id, 
      title, 
      content, 
      type, 
      slug,
      products ( id, title )
    `)
    .not('status', 'eq', 'draft') // assuming published or not draft
    .limit(maxResults * 4); // get more to manually limit per type
    
  words.forEach(word => {
    docsQuery = docsQuery.or(`title.ilike.%${word}%,content.ilike.%${word}%,type.ilike.%${word}%`);
  });

  const { data: docsData, error: docsError } = await docsQuery;
    
  if (!docsError && docsData) {
    // Group and limit per type
    const counts: Record<string, number> = {
      'document': 0,
      'roadmap': 0,
      'battlecard': 0,
      'release_note': 0,
      'section': 0
    };

    docsData.forEach(doc => {
      const docType = doc.type || 'document';
      if (counts[docType] < maxResults) {
        counts[docType]++;
        // Construct the URL. If products doesn't have slug, we generate it from title for now.
        const productData = doc.products as any;
        const productSlug = productData?.slug || (productData?.title ? productData.title.toLowerCase().replace(/\\s+/g, '-') : 'unknown');
        
        results.push({
          id: doc.id,
          title: doc.title,
          type: docType,
          url: `/docs/${productSlug}/${doc.slug}`,
          snippet: doc.content ? doc.content.substring(0, 100) + '...' : ''
        });
      }
    });
  }

  return { results };
}
