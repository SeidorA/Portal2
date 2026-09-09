import { NextRequest, NextResponse } from 'next/server';
import { authenticateMcpRequest } from '@/app/api/mcp/auth';
import { sessions, sendSseEvent } from './sessions';
import { MCP_TOOL_DEFINITIONS, executeMcpTool } from '../server/tools';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 1. Validar autenticación
  const auth = await authenticateMcpRequest(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token') || searchParams.get('apiKey') || searchParams.get('api') || '';

  const sessionId = crypto.randomUUID();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Registrar sesión
      sessions.set(sessionId, {
        id: sessionId,
        token,
        auth,
        controller,
        createdAt: Date.now(),
      });

      // Enviar evento inicial 'endpoint' especificando a dónde debe enviar los mensajes POST el cliente
      const endpointUrl = `/api/mcp/sse/messages?sessionId=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(token)}`;
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`event: endpoint\ndata: ${endpointUrl}\n\n`));

      console.log(`[MCP SSE] Sesión conectada: ${sessionId} (Usuario: ${auth.user_id})`);
    },
    cancel() {
      sessions.delete(sessionId);
      console.log(`[MCP SSE] Sesión desconectada: ${sessionId}`);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'Falta el parámetro sessionId' }, { status: 400 });
  }

  const session = sessions.get(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Sesión SSE no encontrada o cerrada' }, { status: 404 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'JSON inválido en el cuerpo de la petición' }, { status: 400 });
  }

  const { jsonrpc, id, method, params } = body || {};

  if (!method) {
    return NextResponse.json({ error: 'Falta el campo method' }, { status: 400 });
  }

  // Procesar método JSON-RPC
  try {
    if (method === 'initialize') {
      const response = {
        jsonrpc: jsonrpc || '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: 'portal-docs-mcp',
            version: '1.2.0',
          },
        },
      };
      sendSseEvent(session, 'message', response);
      return new Response('Accepted', { status: 202 });
    }

    if (method === 'notifications/initialized' || method === 'initialized') {
      return new Response('Accepted', { status: 202 });
    }

    if (method === 'ping') {
      const response = {
        jsonrpc: jsonrpc || '2.0',
        id,
        result: {},
      };
      sendSseEvent(session, 'message', response);
      return new Response('Accepted', { status: 202 });
    }

    if (method === 'tools/list') {
      const response = {
        jsonrpc: jsonrpc || '2.0',
        id,
        result: {
          tools: MCP_TOOL_DEFINITIONS,
        },
      };
      sendSseEvent(session, 'message', response);
      return new Response('Accepted', { status: 202 });
    }

    if (method === 'tools/call') {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};

      try {
        const result = await executeMcpTool(toolName, toolArgs, session.auth);
        const response = {
          jsonrpc: jsonrpc || '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
            structuredContent: result,
          },
        };
        sendSseEvent(session, 'message', response);
      } catch (err: any) {
        const errorResponse = {
          jsonrpc: jsonrpc || '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: `Error: ${err.message}`,
              },
            ],
            isError: true,
          },
        };
        sendSseEvent(session, 'message', errorResponse);
      }
      return new Response('Accepted', { status: 202 });
    }

    // Método desconocido
    const response = {
      jsonrpc: jsonrpc || '2.0',
      id,
      error: {
        code: -32601,
        message: `Método no soportado: ${method}`,
      },
    };
    sendSseEvent(session, 'message', response);
    return new Response('Accepted', { status: 202 });
  } catch (err: any) {
    console.error(`[MCP SSE POST] Error procesando método ${method}:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
