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
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper para hacer fetch con autenticación
async function portalFetch(endpoint, options = {}) {
  const url = `${PORTAL_URL}/api/mcp/docs${endpoint}`;
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
      {
        name: "search_docs",
        description: "Busca en la documentación del portal usando palabras clave",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Término a buscar" },
          },
          required: ["query"],
        },
      },
      {
        name: "get_doc_content",
        description: "Obtiene el contenido completo (Markdown) de un artículo de la documentación dado su ID",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "ID del documento (UUID)" },
          },
          required: ["id"],
        },
      },
      {
        name: "edit_doc",
        description: "Edita el contenido (Markdown) de un artículo de la documentación. REQUIERE ROL ADMIN.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "ID del documento a editar" },
            content: { type: "string", description: "Nuevo contenido en formato Markdown" },
          },
          required: ["id", "content"],
        },
      },
    ],
  };
});

// 2. Manejar la ejecución de las herramientas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case "search_docs": {
        const { query } = request.params.arguments;
        const data = await portalFetch(`/search?q=${encodeURIComponent(query)}`);
        const resultObject = {
          results: data.results || [],
          total: (data.results || []).length,
        };
        return {
          content: [{ type: "text", text: JSON.stringify(resultObject, null, 2) }],
          structuredContent: resultObject,
        };
      }

      case "get_doc_content": {
        const { id } = request.params.arguments;
        const data = await portalFetch(`/content?id=${id}`);
        const resultObject = {
          document: data.document || {},
        };
        return {
          content: [{ type: "text", text: JSON.stringify(resultObject, null, 2) }],
          structuredContent: resultObject,
        };
      }

      case "edit_doc": {
        const { id, content } = request.params.arguments;
        const data = await portalFetch(`/edit`, {
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

      default:
        throw new Error("Unknown tool");
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
