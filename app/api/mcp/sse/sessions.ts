export interface SseSession {
  id: string;
  token: string;
  auth: { user_id: string; isAdmin: boolean };
  controller: ReadableStreamDefaultController<Uint8Array>;
  createdAt: number;
}

declare global {
  var __mcpSseSessions: Map<string, SseSession> | undefined;
}

if (!globalThis.__mcpSseSessions) {
  globalThis.__mcpSseSessions = new Map<string, SseSession>();
}

export const sessions = globalThis.__mcpSseSessions;

export function sendSseEvent(session: SseSession, event: string, data: any) {
  try {
    const encoder = new TextEncoder();
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    const payload = `event: ${event}\ndata: ${dataStr}\n\n`;
    session.controller.enqueue(encoder.encode(payload));
  } catch (err) {
    console.error(`[MCP SSE] Error sending event to session ${session.id}:`, err);
  }
}
