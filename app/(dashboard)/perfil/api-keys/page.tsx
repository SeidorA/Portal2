'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button, TextInput } from 'caralstable';
import { CaralIcon, Brand } from 'iconcaral2';

interface ApiKey {
  id: string;
  name: string;
  created_at: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [newlyGeneratedToken, setNewlyGeneratedToken] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
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
      alert('Error al cargar los tokens');
    } finally {
      setLoading(false);
    }
  };

  const generateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert('Ingresa un nombre para el token');
      return;
    }

    setIsGenerating(true);
    setNewlyGeneratedToken(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no encontrado');

      const rawToken = 'mcp_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      const { error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          name: newName.trim(),
          token: rawToken
        });

      if (error) throw error;

      setNewlyGeneratedToken(rawToken);
      setNewName('');
      alert('Token generado con éxito');
      fetchKeys();
    } catch (error) {
      console.error('Error generating key:', error);
      alert('Error al generar el token');
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteKey = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este token?')) return;

    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Token eliminado');
      fetchKeys();
    } catch (error) {
      console.error('Error deleting key:', error);
      alert('Error al eliminar el token');
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-8 pt-12 animate-fade-in pb-20">
      <div className="mb-12">
        <h1 className="text-4xl font-poppins font-extrabold text-neutral-900 dark:text-white mb-3 tracking-tight">
          Tokens de API (MCP)
        </h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl leading-relaxed">
          Genera tokens de acceso para conectar asistentes de IA (como Claude Code o Cursor) a la documentación de la plataforma.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
              Crear Nuevo Token
            </h2>
            <form onSubmit={generateKey} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Nombre del Token
                </label>
                <TextInput
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej. Claude Code Local"
                  className="w-full"
                />
              </div>
              <Button type="submit" variant="info" className="w-full" isLoading={isGenerating}>
                Generar Token
              </Button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          {newlyGeneratedToken && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-bold text-emerald-900 mb-2">¡Token Generado!</h3>
              <p className="text-sm text-emerald-700 mb-4">Copia tu token ahora. No podrás volver a verlo.</p>
              <code className="block bg-white text-neutral-900 px-4 py-2 rounded-lg font-mono text-sm border border-emerald-200">
                {newlyGeneratedToken}
              </code>
            </div>
          )}

          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-neutral-200">
              <h2 className="text-xl font-bold text-neutral-900">Tus Tokens Activos</h2>
            </div>

            {loading ? (
              <div className="p-8 text-center">Cargando tokens...</div>
            ) : keys.length === 0 ? (
              <div className="p-12 text-center">No tienes tokens</div>
            ) : (
              <div className="divide-y divide-neutral-200">
                {keys.map((key) => (
                  <div key={key.id} className="p-6 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-neutral-900">{key.name}</h3>
                      <p className="text-sm text-neutral-500 mt-1">Creado: {new Date(key.created_at).toLocaleDateString()}</p>
                    </div>
                    <Button variant="danger" onClick={() => deleteKey(key.id)}>Revocar</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
