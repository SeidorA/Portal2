'use server';

import { createAdminClient } from '@/utils/supabase/admin';

export interface ProductWebhook {
  id: string;
  product_id: string;
  name: string;
  url: string;
  secret: string | null;
  is_active: boolean;
  events: string[];
  last_status: number | null;
  last_triggered_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Obtener todos los webhooks configurados para un producto
 */
export async function getProductWebhooksAction(productId: string): Promise<{ success: boolean; data?: ProductWebhook[]; error?: string }> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('product_webhooks')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getProductWebhooksAction] Error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ProductWebhook[] };
  } catch (err: any) {
    console.error('[getProductWebhooksAction] Exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Crear o actualizar un webhook
 */
export async function saveProductWebhookAction(payload: {
  id?: string;
  productId: string;
  name: string;
  url: string;
  secret?: string;
  is_active?: boolean;
  events?: string[];
}): Promise<{ success: boolean; data?: ProductWebhook; error?: string }> {
  try {
    const supabase = createAdminClient();
    const trimmedUrl = payload.url.trim();

    if (!trimmedUrl) {
      return { success: false, error: 'La URL del webhook es requerida.' };
    }

    // Validar que sea una URL válida
    try {
      new URL(trimmedUrl);
    } catch {
      return { success: false, error: 'Por favor ingresa una URL válida (ej: https://... o http://...).' };
    }

    const webhookData = {
      product_id: payload.productId,
      name: payload.name.trim() || 'Webhook Destino',
      url: trimmedUrl,
      secret: payload.secret?.trim() || null,
      is_active: payload.is_active !== undefined ? payload.is_active : true,
      events: payload.events && payload.events.length > 0 ? payload.events : ['all'],
      updated_at: new Date().toISOString(),
    };

    if (payload.id) {
      // Actualización
      const { data, error } = await supabase
        .from('product_webhooks')
        .update(webhookData)
        .eq('id', payload.id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: data as ProductWebhook };
    } else {
      // Creación
      const { data, error } = await supabase
        .from('product_webhooks')
        .insert(webhookData)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: data as ProductWebhook };
    }
  } catch (err: any) {
    console.error('[saveProductWebhookAction] Exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Eliminar un webhook
 */
export async function deleteProductWebhookAction(webhookId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('product_webhooks')
      .delete()
      .eq('id', webhookId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('[deleteProductWebhookAction] Exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Probar conexión con un webhook en vivo (Test Ping)
 */
export async function testWebhookAction(
  url: string,
  secret?: string,
  customPayload?: Record<string, any>
): Promise<{ success: boolean; status?: number; statusText?: string; durationMs: number; responseSnippet?: string; error?: string }> {
  const startTime = Date.now();
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return { success: false, durationMs: 0, error: 'URL inválida.' };
  }

  try {
    const testBody = {
      event: 'TEST_PING',
      timestamp: new Date().toISOString(),
      source: 'Portal Technical Docs',
      message: 'Ping de prueba de conexión desde Portal v2',
      ...(customPayload || {}),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Portal-Webhook-Dispatcher/1.0',
    };

    if (secret && secret.trim()) {
      headers['x-webhook-secret'] = secret.trim();
      headers['Authorization'] = `Bearer ${secret.trim()}`;
    }

    const response = await fetch(trimmedUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(testBody),
      signal: AbortSignal.timeout(10000), // Timeout de 10 segundos
    });

    const durationMs = Date.now() - startTime;
    const responseText = await response.text();
    const snippet = responseText.slice(0, 300);

    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      durationMs,
      responseSnippet: snippet,
      error: response.ok ? undefined : `Respondió con HTTP ${response.status}: ${snippet || response.statusText}`,
    };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    return {
      success: false,
      durationMs,
      error: err.name === 'TimeoutError' ? 'Tiempo de espera agotado (Timeout > 10s)' : (err.message || 'Error de conexión'),
    };
  }
}

/**
 * Despachar eventos a todos los webhooks activos de un producto
 */
export async function dispatchProductWebhooksAction(
  productId: string,
  event: 'docs.updated' | 'release.updated' | 'faq.updated' | 'blog.updated' | 'config.updated' | string,
  payload?: Record<string, any>
): Promise<{ dispatchedCount: number; results: Array<{ id: string; url: string; success: boolean; status?: number; error?: string }> }> {
  try {
    const supabase = createAdminClient();

    // Obtener webhooks activos para este producto
    const { data: webhooks, error } = await supabase
      .from('product_webhooks')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true);

    if (error || !webhooks || webhooks.length === 0) {
      return { dispatchedCount: 0, results: [] };
    }

    const eventCategory = event.split('.')[0]; // ej: 'docs', 'release', 'faq', 'blog'

    // Filtrar los que escuchen este evento o 'all'
    const targetWebhooks = webhooks.filter((wh: ProductWebhook) => {
      if (!wh.events || wh.events.length === 0 || wh.events.includes('all')) return true;
      return wh.events.includes(eventCategory) || wh.events.includes(event);
    });

    if (targetWebhooks.length === 0) {
      return { dispatchedCount: 0, results: [] };
    }

    const timestamp = new Date().toISOString();
    const eventBody = {
      event,
      category: eventCategory,
      productId,
      timestamp,
      payload: payload || {},
    };

    // Ejecutar envíos en paralelo
    const promises = targetWebhooks.map(async (wh: ProductWebhook) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Portal-Webhook-Dispatcher/1.0',
      };

      if (wh.secret && wh.secret.trim()) {
        headers['x-webhook-secret'] = wh.secret.trim();
        headers['Authorization'] = `Bearer ${wh.secret.trim()}`;
      }

      let status = 0;
      let lastError: string | null = null;
      let success = false;

      try {
        const res = await fetch(wh.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(eventBody),
          signal: AbortSignal.timeout(8000),
        });

        status = res.status;
        success = res.ok;
        if (!res.ok) {
          const bodyText = await res.text();
          lastError = `HTTP ${res.status}: ${bodyText.slice(0, 150)}`;
        }
      } catch (fetchErr: any) {
        lastError = fetchErr.message || 'Error de conexión / Timeout';
      }

      // Actualizar estado en la base de datos de manera asíncrona
      try {
        await supabase
          .from('product_webhooks')
          .update({
            last_status: status || null,
            last_triggered_at: timestamp,
            last_error: lastError,
            updated_at: timestamp,
          })
          .eq('id', wh.id);
      } catch (dbErr) {
        console.error('[dispatchProductWebhooksAction] Error actualizando status:', dbErr);
      }

      return {
        id: wh.id,
        url: wh.url,
        success,
        status: status || undefined,
        error: lastError || undefined,
      };
    });

    const results = await Promise.all(promises);
    return { dispatchedCount: results.length, results };
  } catch (err) {
    console.error('[dispatchProductWebhooksAction] Exception:', err);
    return { dispatchedCount: 0, results: [] };
  }
}
