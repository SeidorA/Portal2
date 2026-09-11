#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Configuración - Asumimos que el portal corre en localhost:3000 por defecto
const PORTAL_URL = process.env.PORTAL_URL || 'http://localhost:3000';
const PORTAL_API_KEY = process.env.PORTAL_API_KEY;

if (!PORTAL_API_KEY) {
  console.error("ERROR: Debes proveer la variable de entorno PORTAL_API_KEY");
  console.error("Ejemplo: PORTAL_API_KEY=tu_token npx portal-docs-mcp");
  process.exit(1);
}

const server = new Server(
  {
    name: "portal-docs-mcp",
    version: "1.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper para hacer fetch con autenticación a la API de MCP del portal
async function portalFetch(endpoint, options = {}) {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = path.startsWith('/api/')
    ? `${PORTAL_URL}${path}`
    : `${PORTAL_URL}/api/mcp${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${PORTAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(
      `El portal respondió con contenido no JSON (${contentType}, HTTP ${response.status}) desde ${url}. ` +
      `Asegúrate de que Next.js esté corriendo en ${PORTAL_URL}. Fragmento recibido: ${text.slice(0, 100)}...`
    );
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }
  return data;
}

// 1. Registrar las herramientas
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Herramientas para la Base de Conocimiento (Knowledge Base)
      {
        name: "search_knowledge_base",
        description: "Busca artículos y guías en la Base de Conocimientos técnica y funcional del portal usando palabras clave.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Término o tema a buscar en la Base de Conocimientos" },
          },
          required: ["query"],
        },
      },
      {
        name: "get_knowledge_base_article",
        description: "Obtiene el contenido completo (Markdown) de un artículo de la Base de Conocimientos dado su ID.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "ID del artículo de la Base de Conocimientos (UUID)" },
          },
          required: ["id"],
        },
      },
      {
        name: "edit_knowledge_base_article",
        description: "Edita el contenido (Markdown) de un artículo existente en la Base de Conocimientos del portal. REQUIERE ROL ADMIN.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "ID del artículo a editar" },
            content: { type: "string", description: "Nuevo contenido en formato Markdown" },
          },
          required: ["id", "content"],
        },
      },

      // Herramientas para Documentos Tipo A4 / Generador de Contenido
      {
        name: "list_a4_documents",
        description: "Lista los documentos imprimibles tipo A4 y reportes multipágina disponibles en el portal con búsqueda opcional por título y paginación.",
        inputSchema: {
          type: "object",
          properties: {
            search: { type: "string", description: "Filtro opcional para buscar por título" },
            limit: { type: "number", description: "Cantidad máxima de documentos a retornar (defecto: 20)" },
            offset: { type: "number", description: "Desplazamiento para paginación (defecto: 0)" },
          },
        },
      },
      {
        name: "get_a4_document",
        description: "Obtiene los detalles completos de un documento imprimible tipo A4 (título, páginas Markdown, configuración visual/portada, metadatos y productos relacionados).",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "ID del documento A4 (UUID)" },
          },
          required: ["id"],
        },
      },
      {
        name: "create_a4_document",
        description: "Generador de contenido / Creador de nuevos documentos imprimibles tipo A4 multipágina en el portal (con portada personalizable, páginas Markdown y exportación a PDF).",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Título del nuevo documento A4" },
            pages: {
              type: "array",
              items: { type: "string" },
              description: "Array de strings en formato Markdown, donde cada string representa una página A4.",
            },
            settings: {
              type: "object",
              description: "Configuración opcional de página y portada (hasCover, template, customTitle, subtitleText, subtitleColor, showFooter, noTableBorders, etc.)",
            },
            metadata: {
              type: "object",
              description: "Metadatos opcionales (tags, status: 'draft'|'published', restriction: 'public'|'private', language, description)",
            },
            related_products: {
              type: "array",
              items: { type: "string" },
              description: "Array de UUIDs de productos del portal relacionados con este documento.",
            },
          },
          required: ["title"],
        },
      },
      {
        name: "edit_a4_document",
        description: "Edita un documento imprimible tipo A4 existente (permite actualizar su título, contenido de páginas Markdown, configuración de portada, metadatos o productos asociados).",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "ID del documento A4 a modificar (UUID)" },
            title: { type: "string", description: "Nuevo título (opcional)" },
            pages: {
              type: "array",
              items: { type: "string" },
              description: "Nuevo array de páginas Markdown (opcional)",
            },
            settings: {
              type: "object",
              description: "Ajustes de configuración o portada a actualizar (opcional)",
            },
            metadata: {
              type: "object",
              description: "Metadatos a actualizar (opcional)",
            },
            related_products: {
              type: "array",
              items: { type: "string" },
              description: "Nueva lista de IDs de productos asociados (opcional)",
            },
            action_description: {
              type: "string",
              description: "Descripción breve del cambio para registrar en el historial de edición (opcional)",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "duplicate_a4_document",
        description: "Duplica o clona un documento imprimible tipo A4 existente generando una copia idéntica con un nuevo ID y título opcional.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "ID del documento A4 que se desea duplicar (UUID)" },
            new_title: {
              type: "string",
              description: "Título para la copia clonada (opcional, por defecto 'Copia de [Título Original]')",
            },
          },
          required: ["id"],
        },
      },
    ],
  };
});

// 2. Manejar la ejecución de las herramientas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      // Base de Conocimiento (Knowledge Base) endpoints
      case "search_knowledge_base":
      case "search_docs": {
        const { query } = request.params.arguments;
        const data = await portalFetch(`/docs/search?q=${encodeURIComponent(query)}`);
        const resultObject = {
          results: data.results || [],
          total: (data.results || []).length,
        };
        return {
          content: [{ type: "text", text: JSON.stringify(resultObject, null, 2) }],
          structuredContent: resultObject,
        };
      }

      case "get_knowledge_base_article":
      case "get_doc_content": {
        const { id } = request.params.arguments;
        const data = await portalFetch(`/docs/content?id=${id}`);
        const resultObject = {
          document: data.document || {},
        };
        return {
          content: [{ type: "text", text: JSON.stringify(resultObject, null, 2) }],
          structuredContent: resultObject,
        };
      }

      case "edit_knowledge_base_article":
      case "edit_doc": {
        const { id, content } = request.params.arguments;
        const data = await portalFetch(`/docs/edit`, {
          method: 'POST',
          body: JSON.stringify({ id, content }),
        });
        const resultObject = {
          success: true,
          message: data.message || "Documento actualizado exitosamente",
        };
        return {
          content: [{ type: "text", text: JSON.stringify(resultObject, null, 2) }],
          structuredContent: resultObject,
        };
      }

      // A4 Document endpoints
      case "list_a4_documents": {
        const { search = '', limit = 20, offset = 0 } = request.params.arguments || {};
        const queryParams = new URLSearchParams();
        if (search) queryParams.set('search', search);
        if (limit) queryParams.set('limit', String(limit));
        if (offset) queryParams.set('offset', String(offset));

        const data = await portalFetch(`/documents/list?${queryParams.toString()}`);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          structuredContent: data,
        };
      }

      case "get_a4_document": {
        const { id } = request.params.arguments;
        const data = await portalFetch(`/documents/content?id=${encodeURIComponent(id)}`);
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          structuredContent: data,
        };
      }

      case "create_a4_document": {
        const { title, pages, settings, metadata, related_products } = request.params.arguments;
        const data = await portalFetch(`/documents/create`, {
          method: 'POST',
          body: JSON.stringify({ title, pages, settings, metadata, related_products }),
        });
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          structuredContent: data,
        };
      }

      case "edit_a4_document": {
        const { id, title, pages, settings, metadata, related_products, action_description } = request.params.arguments;
        const data = await portalFetch(`/documents/edit`, {
          method: 'POST',
          body: JSON.stringify({ id, title, pages, settings, metadata, related_products, action_description }),
        });
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          structuredContent: data,
        };
      }

      case "duplicate_a4_document": {
        const { id, new_title } = request.params.arguments;
        const data = await portalFetch(`/documents/duplicate`, {
          method: 'POST',
          body: JSON.stringify({ id, new_title }),
        });
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          structuredContent: data,
        };
      }

      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

// 3. Iniciar el servidor
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Portal Docs MCP Server running on stdio");
}

run().catch(console.error);
