'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button, Drawer } from 'caralstable';
import { CaralIcon } from 'iconcaral2';
import { useTranslation } from '@/app/context/LanguageContext';

interface ApiKey {
  id: string;
  name: string;
  created_at: string;
}

type LlmTab = 'Antigravity' | 'Gemini' | 'Claude' | 'Chat GPT' | 'Daiana';

const EXPIRATION_OPTIONS = [
  { label: '1 Día', value: 1 },
  { label: '7 Días', value: 7 },
  { label: '15 Días', value: 15 },
  { label: '30 Días', value: 30 },
  { label: '90 Días', value: 90 },
];

export default function ProfileApisTab() {
  const { t } = useTranslation();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [expiresInDays, setExpiresInDays] = useState<number>(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newlyGeneratedToken, setNewlyGeneratedToken] = useState<string | null>(null);
  const [selectedLlm, setSelectedLlm] = useState<LlmTab>('Antigravity');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('api_keys')
        .select('id, name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKeys(data || []);
    } catch (error) {
      console.error('Error fetching keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert('Ingresa un nombre descriptivo para el token');
      return;
    }

    setIsGenerating(true);
    setNewlyGeneratedToken(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const rawToken =
        'mcp_' +
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 10);

      const { error } = await supabase.from('api_keys').insert({
        user_id: user.id,
        name: newName.trim(),
        token: rawToken,
      });

      if (error) throw error;

      setNewlyGeneratedToken(rawToken);
      setNewName('');
      fetchKeys();
    } catch (error: any) {
      alert('Error al generar el token: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteKey = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas revocar este token de acceso? Los asistentes que lo utilicen perderán conexión.')) {
      return;
    }

    try {
      const { error } = await supabase.from('api_keys').delete().eq('id', id);
      if (error) throw error;
      fetchKeys();
    } catch (error: any) {
      alert('Error al revocar el token: ' + error.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const formatExpiry = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + 90);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const getFutureExpiryDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  // Endpoint template por LLM
  const getEndpointForLlm = (llm: LlmTab) => {
    const tokenPlaceholder = newlyGeneratedToken ? newlyGeneratedToken : '"tu_token_pac"';
    return `https://v2.portal.seidoranalytics.com/api/mcp/sse?token=${tokenPlaceholder}`;
  };

  // Tutoriales paso a paso por LLM
  const getTutorialForLlm = (llm: LlmTab) => {
    const tokenValue = newlyGeneratedToken || 'tu_token_pac';
    const sseUrl = `https://v2.portal.seidoranalytics.com/api/mcp/sse?token=${tokenValue}`;

    switch (llm) {
      case 'Antigravity':
        return {
          title: 'Conexión con Antigravity (Google Agentic IDE)',
          steps: [
            {
              step: 1,
              title: 'Abre la configuración MCP',
              description: 'En tu espacio de trabajo o directorio raíz, abre el archivo .gemini/config/mcp_config.json (global) o .agents/mcp_config.json (workspace).',
            },
            {
              step: 2,
              title: 'Agrega el servidor MCP del Portal',
              description: 'Inserta el servidor en la sección mcpServers con el endpoint SSE o el paquete npx:',
              code: JSON.stringify(
                {
                  mcpServers: {
                    'portal-docs-mcp': {
                      url: sseUrl,
                    },
                  },
                },
                null,
                2
              ),
            },
            {
              step: 3,
              title: '¡Listo para consultar y editar!',
              description: 'Guarda los cambios. Antigravity cargará automáticamente las herramientas de la Base de Conocimientos y del Generador de Documentos A4.',
            },
          ],
        };

      case 'Gemini':
        return {
          title: 'Conexión con Google Gemini',
          steps: [
            {
              step: 1,
              title: 'Accede a la configuración de herramientas',
              description: 'En Google AI Studio o en tu entorno de integración con Gemini, dirígete al panel de Extensiones / Servidores MCP.',
            },
            {
              step: 2,
              title: 'Configura la conexión SSE',
              description: 'Selecciona el protocolo SSE (Server-Sent Events) y pega el endpoint generado con tu token:',
              code: sseUrl,
            },
            {
              step: 3,
              title: 'Habilita las herramientas',
              description: 'Guarda la conexión. Gemini tendrá acceso inmediato para responder consultas y redactar documentos con el conocimiento actualizado del Portal.',
            },
          ],
        };

      case 'Claude':
        return {
          title: 'Conexión con Claude Desktop & Claude Code',
          steps: [
            {
              step: 1,
              title: 'Abre la configuración de Claude',
              description: 'En Claude Desktop, ve a Settings → Developer y haz clic en "Edit Config" para editar claude_desktop_config.json.',
            },
            {
              step: 2,
              title: 'Pega el bloque de configuración',
              description: 'Añade el servidor del portal dentro del objeto "mcpServers":',
              code: JSON.stringify(
                {
                  mcpServers: {
                    'portal-docs': {
                      url: sseUrl,
                    },
                  },
                },
                null,
                2
              ),
            },
            {
              step: 3,
              title: 'Reinicia Claude Desktop',
              description: 'Cierra y vuelve a abrir Claude Desktop. Verás activas las herramientas con el ícono de herramientas (martillo).',
            },
          ],
        };

      case 'Chat GPT':
        return {
          title: 'Conexión con ChatGPT / Cursor IDE',
          steps: [
            {
              step: 1,
              title: 'Ve a Configuración de MCP',
              description: 'En Cursor abre Settings → Features → MCP. En ChatGPT Developer Mode, ve a Custom Actions / MCP Connectors.',
            },
            {
              step: 2,
              title: 'Añade el nuevo conector SSE',
              description: 'Elige el tipo "SSE" y pega el endpoint con tu token de acceso:',
              code: sseUrl,
            },
            {
              step: 3,
              title: 'Guarda y verifica',
              description: 'Guarda los cambios. Ahora podrás pedirle al asistente que consulte guías, productos y cree documentos en el Portal.',
            },
          ],
        };

      case 'Daiana':
        return {
          title: 'Conexión con Daiana Copilot',
          steps: [
            {
              step: 1,
              title: 'Ingresa al panel de integraciones',
              description: 'En el panel de administración de Daiana, selecciona la pestaña de Fuentes de Conocimiento y Conectores MCP.',
            },
            {
              step: 2,
              title: 'Ingresa la URL del conector',
              description: 'Pega la URL de conexión en el campo "Portal Seidor Analytics":',
              code: sseUrl,
            },
            {
              step: 3,
              title: 'Valida la conexión',
              description: 'Haz clic en "Probar y Guardar". Daiana sincronizará automáticamente el contenido y productos habilitados para tu usuario.',
            },
          ],
        };
    }
  };

  const tutorial = getTutorialForLlm(selectedLlm);
  const currentEndpoint = getEndpointForLlm(selectedLlm);

  return (
    <div className="flex flex-col w-full text-neutral-900 dark:text-white">
      {/* Title */}
      <h2 className="font-poppins font-bold text-2xl text-neutral-900 dark:text-white">
        {t('profile.devSettingsTitle', 'Developer Settings')}
      </h2>

      {/* Divider */}
      <div className="border-b border-neutral-300 dark:border-neutral-700 my-5" />

      {/* Section 1: Personal access token (pac) */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-poppins font-bold text-base text-neutral-900 dark:text-white">
              {t('profile.pacTitle', 'Personal access token (pac)')}
            </h3>
            <p className="text-sm text-neutral-800 dark:text-neutral-400 mt-0.5 max-w-xl">
              {t('profile.pacSubtitle', 'Genera tokens de acceso para permitir el acceso a la información y herramientas de tu perfil vía API.')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setNewlyGeneratedToken(null);
              setNewName('');
              setExpiresInDays(30);
              setIsDrawerOpen(true);
            }}
            title={t('profile.createTokenButton', 'Crear nuevo token')}
            className="w-10 h-10 shrink-0 border border-neutral-400 dark:border-neutral-600 rounded-lg flex items-center justify-center text-neutral-800 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-2xl font-light"
          >
            +
          </button>
        </div>

        {/* List of active tokens */}
        <div className="flex flex-col gap-3 mt-1">
          {loading ? (
            <div className="py-4 text-sm text-neutral-500">{t('profile.loadingTokens', 'Cargando tokens...')}</div>
          ) : keys.length === 0 ? (
            <div className="py-4 text-sm text-neutral-500">
              {t('profile.noTokens', 'No tienes tokens activos aún. Haz clic en el botón + para crear tu primer Personal Access Token.')}
            </div>
          ) : (
            keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between py-1.5 gap-4"
              >
                <div>
                  <h4 className="font-poppins font-bold text-sm text-neutral-900 dark:text-white">
                    {key.name}
                  </h4>
                  <p className="text-sm text-neutral-800 dark:text-neutral-400 mt-0.5">
                    {t('profile.created', 'Creado:')} {formatDate(key.created_at)} &nbsp;&nbsp;|&nbsp;&nbsp; {t('profile.expires', 'Finaliza:')} {formatExpiry(key.created_at)}
                  </p>
                </div>

                <Button
                  variant="danger"
                  hasBorder
                  iconName="x"
                  onClick={() => deleteKey(key.id)}
                  size="sm"
                >
                  {t('profile.revoke', 'Revocar')}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-b border-neutral-300 dark:border-neutral-700 my-6" />

      {/* Section 2: Conecta */}
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="font-poppins font-bold text-base text-neutral-900 dark:text-white">
            {t('profile.connectionTutorialTitle', 'Tutorial de Conexión')}
          </h3>
          <p className="text-neutral-800 dark:text-neutral-400 text-sm mt-0.5 max-w-2xl">
            {t('profile.connectionTutorialSubtitle', 'Selecciona tu asistente o entorno para ver la guía paso a paso de integración:')}
          </p>
        </div>

        {/* LLM Underline Tabs */}
        <div className="flex items-center gap-6 border-b border-neutral-200 dark:border-neutral-800 pt-2">
          {(['Antigravity', 'Gemini', 'Claude', 'Chat GPT', 'Daiana'] as const).map((tab) => {
            const isActive = selectedLlm === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedLlm(tab)}
                className={`pb-2.5 font-medium transition-all relative cursor-pointer ${
                  isActive
                    ? 'font-bold text-neutral-900 dark:text-white'
                    : 'text-neutral-800 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                {tab}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Step-by-Step Tutorial Card */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <h5 className="font-poppins font-bold text-sm text-neutral-900 dark:text-white">
              {tutorial.title}
            </h5>
          </div>

          <div className="space-y-4">
            {tutorial.steps.map((s) => (
              <div key={s.step} className="flex items-start gap-3.5">
                <span className="w-6 h-6 shrink-0 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center justify-center mt-0.5">
                  {s.step}
                </span>

                <div className="flex-1 min-w-0">
                  <h6 className="font-poppins font-semibold text-sm text-neutral-900 dark:text-white">
                    {s.title}
                  </h6>
                  <p className="text-sm text-neutral-800 dark:text-neutral-400 mt-0.5 leading-relaxed">
                    {s.description}
                  </p>

                  {s.code && (
                    <div className="my-4 relative group">
                      <pre className="bg-[#111827] dark:bg-black text-[#34D399] p-3 rounded-lg text-[11px] font-mono overflow-x-auto border border-neutral-800 leading-relaxed">
                        {s.code}
                      </pre>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(s.code!)}
                        className="absolute top-2 right-2 p-1 text-neutral-400 hover:text-white bg-neutral-800/80 rounded transition-colors cursor-pointer"
                        title={t('profile.copy', 'Copiar')}
                      >
                        <CaralIcon name={copiedText === s.code ? 'check' : 'copy'} size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drawer: Crear Nuevo Token */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setNewlyGeneratedToken(null);
        }}
        title={t('profile.drawerCreateTitle', 'Generar Personal Access Token')}
        size="md"
      >
        <div className="p-6 flex flex-col h-full justify-between">
          {newlyGeneratedToken ? (
            <div className="space-y-6">
              <div className="p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    {t('profile.tokenGeneratedNoticeTitle', '¡Tu Personal Access Token ha sido generado!')}
                  </p>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed">
                  {t('profile.tokenGeneratedNoticeSubtitle', 'Guarda este token en un lugar seguro. Por motivos de seguridad no volverá a mostrarse.')}
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white dark:bg-neutral-900 p-3 rounded-xl font-mono text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 select-all truncate">
                    {newlyGeneratedToken}
                  </code>
                  <Button
                    variant="info"
                    size="sm"
                    onClick={() => copyToClipboard(newlyGeneratedToken)}
                    className="shrink-0 rounded-xl"
                  >
                    {copiedText === newlyGeneratedToken ? t('profile.copied', '¡Copiado!') : t('profile.copy', 'Copiar')}
                  </Button>
                </div>
              </div>

              <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-2 bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <p>🔒 <strong>Vigencia:</strong> {expiresInDays} {expiresInDays === 1 ? 'día' : 'días'} (hasta el {getFutureExpiryDate(expiresInDays)}).</p>
                <p>💡 {t('profile.tokenRevokeNotice', 'Puedes revocar el acceso en cualquier momento desde la lista de tokens activos.')}</p>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  variant="light"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setNewlyGeneratedToken(null);
                  }}
                  className="rounded-xl"
                >
                  {t('profile.close', 'Cerrar')}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={generateKey} className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1.5 font-poppins">
                    {t('profile.tokenNameLabel', 'Nombre del Token / Asistente')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('profile.tokenNamePlaceholder', 'Ej: Gemini CLI, Antigravity, Claude Desktop...')}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded-xl border border-[#8A99AD] dark:border-neutral-600 bg-white dark:bg-neutral-900 px-4 py-3 text-sm font-poppins text-neutral-900 dark:text-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all shadow-2xs placeholder:text-neutral-400"
                    autoFocus
                  />
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1.5">
                    {t('profile.tokenNameHelper', 'Usa un nombre que te ayude a identificar en qué dispositivo o asistente lo utilizas.')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1.5 font-poppins">
                    {t('profile.expirationTimeLabel', 'Tiempo de Expiración')}
                  </label>
                  <div className="relative">
                    <select
                      value={expiresInDays}
                      onChange={(e) => setExpiresInDays(Number(e.target.value))}
                      className="w-full appearance-none rounded-xl border border-[#8A99AD] dark:border-neutral-600 bg-white dark:bg-neutral-900 px-4 py-3 text-sm font-poppins text-neutral-900 dark:text-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all cursor-pointer pr-10 shadow-2xs"
                    >
                      {EXPIRATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label} ({opt.value === 1 ? '1 día de vigencia' : `${opt.value} días de vigencia`})
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-800 dark:text-neutral-300">
                      <CaralIcon name="chevronDown" size={16} />
                    </div>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1.5">
                    📅 El token expirará automáticamente el <strong>{getFutureExpiryDate(expiresInDays)}</strong>.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <Button
                  variant="ghost"
                  onClick={() => setIsDrawerOpen(false)}
                  type="button"
                >
                  {t('common.cancel', 'Cancelar')}
                </Button>
                <Button
                  variant="info"
                  type="submit"
                  isLoading={isGenerating}
                >
                  {t('profile.generateTokenButton', 'Generar Token')}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Drawer>
    </div>
  );
}

