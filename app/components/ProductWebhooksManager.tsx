'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from 'caralstable';
import { CaralIcon } from 'iconcaral2';
import Modal from '@/app/components/Modal';
import Input from '@/app/components/Input';
import {
  ProductWebhook,
  getProductWebhooksAction,
  saveProductWebhookAction,
  deleteProductWebhookAction,
  testWebhookAction,
} from '@/app/actions/webhookActions';

interface ProductWebhooksManagerProps {
  productId: string;
  productSlug?: string;
  productTitle?: string;
}

export default function ProductWebhooksManager({
  productId,
  productSlug = 'crestone',
  productTitle = 'Crestone',
}: ProductWebhooksManagerProps) {
  const [webhooks, setWebhooks] = useState<ProductWebhook[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<ProductWebhook | null>(null);
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formSecret, setFormSecret] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formEvents, setFormEvents] = useState<string[]>(['all']);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Ping Testing State
  const [testingId, setTestingId] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<
    Record<string, { success: boolean; status?: number; durationMs: number; error?: string }>
  >({});

  // Sandbox / Live Tester State
  const [sandboxUrl, setSandboxUrl] = useState('');
  const [sandboxSecret, setSandboxSecret] = useState('');
  const [isSandboxTesting, setIsSandboxTesting] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<{
    success: boolean;
    status?: number;
    statusText?: string;
    durationMs: number;
    responseSnippet?: string;
    error?: string;
  } | null>(null);

  // Copied State
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showDocuCode, setShowDocuCode] = useState(false);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const loadWebhooks = useCallback(async () => {
    if (!productId) return;
    try {
      setLoading(true);
      const res = await getProductWebhooksAction(productId);
      if (res.success && res.data) {
        setWebhooks(res.data);
      }
    } catch (err) {
      console.error('Error cargando webhooks:', err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadWebhooks();
  }, [loadWebhooks]);

  const handleOpenAddModal = () => {
    setEditingWebhook(null);
    setFormName('');
    setFormUrl('');
    setFormSecret('');
    setFormIsActive(true);
    setFormEvents(['all']);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (wh: ProductWebhook) => {
    setEditingWebhook(wh);
    setFormName(wh.name);
    setFormUrl(wh.url);
    setFormSecret(wh.secret || '');
    setFormIsActive(wh.is_active);
    setFormEvents(wh.events && wh.events.length > 0 ? wh.events : ['all']);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleGenerateSecret = () => {
    const randomSecret = 'whsec_' + Array.from(crypto.getRandomValues(new Uint8Array(18)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    setFormSecret(randomSecret);
  };

  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUrl.trim()) {
      setModalError('La URL del webhook es requerida.');
      return;
    }

    try {
      setIsSaving(true);
      setModalError(null);
      const res = await saveProductWebhookAction({
        id: editingWebhook ? editingWebhook.id : undefined,
        productId,
        name: formName.trim() || `Webhook ${productTitle}`,
        url: formUrl.trim(),
        secret: formSecret.trim() || undefined,
        is_active: formIsActive,
        events: formEvents,
      });

      if (!res.success) {
        setModalError(res.error || 'Error guardando el webhook.');
        return;
      }

      setIsModalOpen(false);
      await loadWebhooks();
    } catch (err: any) {
      setModalError(err.message || 'Error inesperado.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteWebhook = async (whId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este webhook?')) return;
    try {
      const res = await deleteProductWebhookAction(whId);
      if (res.success) {
        setWebhooks(prev => prev.filter(w => w.id !== whId));
      } else {
        alert('Error eliminando webhook: ' + res.error);
      }
    } catch (err: any) {
      alert('Error eliminando webhook: ' + err.message);
    }
  };

  const handleTestPing = async (wh: ProductWebhook) => {
    setTestingId(wh.id);
    try {
      const res = await testWebhookAction(wh.url, wh.secret || undefined, {
        webhookName: wh.name,
        productId,
        productSlug,
      });

      setPingResults(prev => ({
        ...prev,
        [wh.id]: {
          success: res.success,
          status: res.status,
          durationMs: res.durationMs,
          error: res.error,
        },
      }));
      // Recargar para ver si actualizó last_status en DB
      loadWebhooks();
    } catch (err: any) {
      setPingResults(prev => ({
        ...prev,
        [wh.id]: {
          success: false,
          durationMs: 0,
          error: err.message,
        },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleRunSandboxTest = async () => {
    if (!sandboxUrl.trim()) return;
    setIsSandboxTesting(true);
    setSandboxResult(null);

    try {
      const res = await testWebhookAction(sandboxUrl.trim(), sandboxSecret.trim() || undefined, {
        testMode: 'sandbox',
        productSlug,
        timestamp: new Date().toISOString(),
      });
      setSandboxResult(res);
    } catch (err: any) {
      setSandboxResult({
        success: false,
        durationMs: 0,
        error: err.message || 'Error de conexión',
      });
    } finally {
      setIsSandboxTesting(false);
    }
  };

  const docuCodeSnippet = `// app/api/webhooks/portal-sync/route.ts (En tu proyecto DocuCrestone)
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-webhook-secret");
    
    // 1. Validar secret si se configuró
    if (process.env.PORTAL_WEBHOOK_SECRET && secret !== process.env.PORTAL_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();
    console.log("[Portal Webhook] Señal recibida:", payload.event);

    // 2. Si es solo un ping de prueba
    if (payload.event === "TEST_PING") {
      return NextResponse.json({ success: true, message: "Ping exitoso desde Portal" });
    }

    // 3. ¡REVALIDAR O ACTUALIZAR DOCUMENTACIÓN INMEDIATAMENTE!
    // Ej: revalidatePath('/docs') o llamar a tu sincronizador interno
    // await sincronizarConPortal();

    return NextResponse.json({ success: true, event: payload.event });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}`;

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER EXPLICATIVO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-transparent border border-sky-500/20 dark:border-sky-500/30">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
            <CaralIcon name={'bolt' as any} size={22} />
          </div>
          <div>
            <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              Sincronización en Tiempo Real (Webhooks Push)
              <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 font-semibold">
                Nuevo
              </span>
            </h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
              En lugar de esperar 1 hora para consultar cambios, Portal envía una señal HTTP instantánea al proyecto receptor cada vez que se actualiza o publica contenido de <strong>{productTitle}</strong>.
            </p>
          </div>
        </div>

        <Button
          variant="info"
          onClick={handleOpenAddModal}
          iconName="plus"
          size="md"
          className="shrink-0 flex items-center gap-2"
        >
          Agregar Webhook
        </Button>
      </div>

      {/* GUÍA RÁPIDA PARA DESARROLLADORES LOCALES */}
      <div className="p-5 rounded-2xl bg-neutral-50/70 dark:bg-neutral-900/50 border border-neutral-200/80 dark:border-neutral-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 font-bold text-sm">
            <CaralIcon name={'gear' as any} size={18} classname="text-sky-500" />
            <span>¿Cómo probar Webhooks en Local desde Portal Online?</span>
          </div>
          <button
            type="button"
            onClick={() => setShowDocuCode(!showDocuCode)}
            className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            {showDocuCode ? 'Ocultar código del receptor' : 'Ver código receptor para DocuCrestone'}
            <CaralIcon name={'chevronDown' as any} size={12} classname={`transition-transform ${showDocuCode ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="text-xs text-neutral-600 dark:text-neutral-400 flex flex-col gap-2">
          <p>
            Como Portal corre en la nube, no puede alcanzar directamente a <code className="bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-800 dark:text-neutral-200 font-mono">http://localhost:3000</code> en tu PC. Para recibir los webhooks en tu entorno local:
          </p>
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="text-neutral-500 font-sans">1. Ejecuta en tu terminal:</span>
            <span className="bg-neutral-900 text-neutral-200 px-2.5 py-1 rounded-lg border border-neutral-800 flex items-center gap-2">
              <code>npx ngrok http 3000</code>
              <button
                type="button"
                onClick={() => copyToClipboard('npx ngrok http 3000', 'ngrok-cmd')}
                className="text-neutral-400 hover:text-white"
                title="Copiar comando"
              >
                <CaralIcon name={copiedKey === 'ngrok-cmd' ? 'check' : ('copy' as any)} size={12} />
              </button>
            </span>
            <span className="text-neutral-500 font-sans">2. Copia la URL pública generada (ej: <code className="text-sky-500">https://xyz.ngrok-free.app/api/webhooks/portal-sync</code>) y agrégala abajo.</span>
          </div>
        </div>

        {showDocuCode && (
          <div className="mt-2 relative bg-[#080b11] dark:bg-[#05070a] border border-neutral-800 rounded-xl p-4 font-mono text-xs text-neutral-300 shadow-inner">
            <div className="flex justify-between items-center mb-2 border-b border-neutral-800/80 pb-2">
              <span className="text-neutral-500 text-[11px] font-sans">app/api/webhooks/portal-sync/route.ts</span>
              <Button
                variant="ghost"
                size="sm"
                iconName={copiedKey === 'docu-code' ? 'check' : ('copy' as any)}
                className={`text-neutral-400 hover:text-white ${copiedKey === 'docu-code' ? 'text-green-400!' : ''}`}
                onClick={() => copyToClipboard(docuCodeSnippet, 'docu-code')}
              >
                {copiedKey === 'docu-code' ? '¡Copiado!' : 'Copiar código'}
              </Button>
            </div>
            <pre className="overflow-x-auto text-[11px] leading-relaxed text-neutral-300">
              {docuCodeSnippet}
            </pre>
          </div>
        )}
      </div>

      {/* LISTADO DE WEBHOOKS */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <CaralIcon name={'link' as any} size={16} classname="text-sky-500" />
            Destinos Registrados para {productTitle} ({webhooks.length})
          </h4>
          <button
            type="button"
            onClick={loadWebhooks}
            className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center gap-1 cursor-pointer"
          >
            <CaralIcon name={'sync' as any} size={12} classname={loading ? 'animate-spin' : ''} />
            Actualizar lista
          </button>
        </div>

        {loading ? (
          <div className="p-8 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-center text-sm text-neutral-500 gap-2">
            <CaralIcon name={'sync' as any} size={18} classname="animate-spin text-sky-500" />
            Cargando destinos...
          </div>
        ) : webhooks.length === 0 ? (
          <div className="p-8 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/40 border border-dashed border-neutral-300 dark:border-neutral-800 flex flex-col items-center justify-center text-center gap-2">
            <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-500">
              <CaralIcon name="globe" size={20} />
            </div>
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              Aún no hay webhooks registrados para {productTitle}
            </p>
            <p className="text-xs text-neutral-500 max-w-md">
              Agrega la URL de tu proyecto de documentación (producción o ngrok local) para que reciba las señales automáticas.
            </p>
            <Button
              variant="info"
              onClick={handleOpenAddModal}
              iconName="plus"
              size="sm"
              className="mt-2"
            >
              Configurar primer Webhook
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {webhooks.map((wh) => {
              const ping = pingResults[wh.id];
              const isTestingThis = testingId === wh.id;

              return (
                <div
                  key={wh.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 shadow-2xs transition-all hover:border-neutral-300 dark:hover:border-neutral-700"
                >
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                        {wh.name}
                      </span>
                      {wh.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Activo
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-500">
                          Pausado
                        </span>
                      )}

                      {/* Event badges */}
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                        {wh.events?.includes('all') ? 'Todos los eventos' : wh.events?.join(', ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-neutral-600 dark:text-neutral-400 break-all">
                      <span className="text-sky-500 font-bold">POST</span>
                      <span className="truncate">{wh.url}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(wh.url, `url-${wh.id}`)}
                        className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white shrink-0 cursor-pointer"
                        title="Copiar URL"
                      >
                        <CaralIcon name={copiedKey === `url-${wh.id}` ? 'check' : 'copy'} size={12} />
                      </button>
                    </div>

                    {/* Último estado de entrega */}
                    <div className="flex items-center gap-3 text-[11px] text-neutral-500 mt-0.5">
                      {wh.last_status ? (
                        <span className={`flex items-center gap-1 font-semibold ${wh.last_status >= 200 && wh.last_status < 300 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                          <CaralIcon name={wh.last_status >= 200 && wh.last_status < 300 ? ('check' as any) : ('close' as any)} size={12} />
                          HTTP {wh.last_status} {wh.last_status === 200 ? 'OK' : ''}
                        </span>
                      ) : (
                        <span className="text-neutral-400">Sin disparos recientes</span>
                      )}

                      {wh.last_triggered_at && (
                        <span>
                          Último envío: {new Date(wh.last_triggered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      )}

                      {wh.last_error && (
                        <span className="text-red-500 truncate max-w-xs" title={wh.last_error}>
                          • Error: {wh.last_error}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ACCIONES Y PING RESULT */}
                  <div className="flex items-center gap-2 shrink-0">
                    {ping && (
                      <div className={`text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-mono ${ping.success ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                        <CaralIcon name={ping.success ? 'check' : ('close' as any)} size={12} />
                        <span>{ping.success ? `${ping.status} OK (${ping.durationMs}ms)` : `Fallo (${ping.durationMs}ms)`}</span>
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTestPing(wh)}
                      disabled={isTestingThis}
                      iconName={isTestingThis ? ('sync' as any) : ('play' as any)}
                      className="text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 flex items-center gap-1.5"
                    >
                      {isTestingThis ? 'Probando...' : 'Test Ping'}
                    </Button>

                    <Button
                      variant="ghost"
                      isIconButton
                      size="sm"
                      iconName={'pen' as any}
                      onClick={() => handleOpenEditModal(wh)}
                      title="Editar Webhook"
                    />

                    <Button
                      variant="danger"
                      isIconButton
                      size="sm"
                      iconName={'trash' as any}
                      onClick={() => handleDeleteWebhook(wh.id)}
                      title="Eliminar Webhook"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TESTER RÁPIDO / SANDBOX EN VIVO */}
      <div className="p-5 rounded-2xl bg-neutral-50/70 dark:bg-neutral-900/50 border border-neutral-200/80 dark:border-neutral-800 flex flex-col gap-4">
        <div>
          <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <CaralIcon name={'bolt' as any} size={16} classname="text-amber-500" />
            Probador Rápido de Webhook (Live Ping Sandbox)
          </h4>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
            Prueba cualquier URL directamente desde el servidor de Portal para verificar si tu receptor responde antes de registrarlo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-6 flex flex-col gap-1">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              URL del Receptor
            </label>
            <input
              type="text"
              value={sandboxUrl}
              onChange={(e) => setSandboxUrl(e.target.value)}
              placeholder="https://tu-ngrok.ngrok-free.app/api/webhooks/portal-sync"
              className="w-full text-xs font-mono px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 focus:outline-hidden focus:border-sky-500 text-neutral-900 dark:text-neutral-100"
            />
          </div>

          <div className="md:col-span-4 flex flex-col gap-1">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Secret Opcional (x-webhook-secret)
            </label>
            <input
              type="text"
              value={sandboxSecret}
              onChange={(e) => setSandboxSecret(e.target.value)}
              placeholder="whsec_..."
              className="w-full text-xs font-mono px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 focus:outline-hidden focus:border-sky-500 text-neutral-900 dark:text-neutral-100"
            />
          </div>

          <div className="md:col-span-2">
            <Button
              variant="info"
              onClick={handleRunSandboxTest}
              disabled={isSandboxTesting || !sandboxUrl.trim()}
              iconName={isSandboxTesting ? ('sync' as any) : ('play' as any)}
              className="w-full flex items-center justify-center gap-2"
            >
              {isSandboxTesting ? 'Enviando...' : 'Enviar Ping'}
            </Button>
          </div>
        </div>

        {sandboxResult && (
          <div className={`p-4 rounded-xl text-xs font-mono border ${sandboxResult.success ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-red-500/5 border-red-500/20 text-red-600 dark:text-red-400'}`}>
            <div className="flex items-center justify-between font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <CaralIcon name={sandboxResult.success ? 'check' : ('close' as any)} size={14} />
                {sandboxResult.success ? `¡Conexión Exitosa! (HTTP ${sandboxResult.status})` : `Error de Conexión (${sandboxResult.status || 'Sin respuesta'})`}
              </span>
              <span>Latencia: {sandboxResult.durationMs} ms</span>
            </div>
            {sandboxResult.error && (
              <p className="mt-1 text-[11px] text-red-500">
                Detalle: {sandboxResult.error}
              </p>
            )}
            {sandboxResult.responseSnippet && (
              <div className="mt-2 p-2 rounded bg-black/40 text-neutral-300 overflow-x-auto text-[11px]">
                <span className="text-neutral-500 font-sans">Respuesta del receptor: </span>
                {sandboxResult.responseSnippet}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL PARA CREAR / EDITAR WEBHOOK */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingWebhook ? 'Editar Webhook' : `Nuevo Webhook para ${productTitle}`}
        width="md"
      >
        <form onSubmit={handleSaveWebhook} className="flex flex-col gap-4">
          {modalError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
              {modalError}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Nombre descriptivo *
            </label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ej. DocuCrestone Producción o Testing Ngrok Local"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              URL del Endpoint (POST) *
            </label>
            <Input
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              placeholder="https://proyecto-doc.com/api/webhooks/portal-sync"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Secreto de Seguridad (Secret Token)
              </label>
              <button
                type="button"
                onClick={handleGenerateSecret}
                className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
              >
                Generar aleatorio
              </button>
            </div>
            <Input
              value={formSecret}
              onChange={(e) => setFormSecret(e.target.value)}
              placeholder="whsec_..."
            />
            <p className="text-[11px] text-neutral-500">
              Se enviará en el header <code className="font-mono">x-webhook-secret</code> y en <code className="font-mono">Authorization: Bearer</code> para validar autenticidad.
            </p>
          </div>

          {/* Estado activo */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-100/60 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
            <div>
              <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">
                Habilitar Webhook
              </span>
              <span className="text-[11px] text-neutral-500">
                Si está desactivado, Portal no enviará peticiones a esta URL.
              </span>
            </div>
            <input
              type="checkbox"
              checked={formIsActive}
              onChange={(e) => setFormIsActive(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded cursor-pointer"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="info"
              disabled={isSaving}
              iconName={isSaving ? ('sync' as any) : ('save' as any)}
            >
              {isSaving ? 'Guardando...' : editingWebhook ? 'Actualizar Webhook' : 'Crear Webhook'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
