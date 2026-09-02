'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { CaralIcon } from 'iconcaral2';
import { getSearchLogsWithNames } from '@/app/actions/getSearchLogsAction';

export default function BusquedaPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalSearches: 0,
    clickRate: 0,
    topTerms: [] as { query: string; count: number }[],
  });

  const supabase = createClient();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Fetch the last 100 searches to show history with real names
      const { logs: recentLogs, error } = await getSearchLogsWithNames();

      if (error) throw new Error(error);
      setLogs(recentLogs || []);

      // Calculate Metrics client-side (or we could use RPC)
      // For a real production app with many logs, this should be done via RPC or Edge Function
      const { data: allLogs, error: allLogsError } = await supabase
        .from('search_logs')
        .select('query, clicked');

      if (!allLogsError && allLogs) {
        const total = allLogs.length;
        const clickedCount = allLogs.filter(l => l.clicked).length;
        const clickRate = total > 0 ? Math.round((clickedCount / total) * 100) : 0;

        // Count frequencies of terms
        const freq: Record<string, number> = {};
        allLogs.forEach(l => {
          const q = l.query.trim().toLowerCase();
          if (q) {
            freq[q] = (freq[q] || 0) + 1;
          }
        });

        const topTerms = Object.entries(freq)
          .map(([query, count]) => ({ query, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setMetrics({
          totalSearches: total,
          clickRate,
          topTerms
        });
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-neutral-800 font-poppins">Cargando datos de búsqueda...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-full font-poppins text-neutral-800 dark:text-neutral-200 text-neutral-900">
      <div className="flex-none p-6 border-b border-neutral-200 dark:border-neutral-800">
        <h1 className="text-2xl font-semibold mb-2">Historial de Búsquedas</h1>
        <p className="text-sm text-neutral-800">Métricas y registro de lo que buscan los usuarios en el portal.</p>
      </div>

      <div className="flex-none p-6 grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-neutral-200 dark:border-neutral-800 ">
        <div className="bg-container border border-neutral-200 dark:border-neutral-700 p-5 rounded-xl shadow-sm flex flex-col gap-2">
          <div className="text-sm text-neutral-800 font-medium">Búsquedas Totales</div>
          <div className="text-3xl font-bold">{metrics.totalSearches}</div>
        </div>
        <div className="bg-container border border-neutral-200 dark:border-neutral-700 p-5 rounded-xl shadow-sm flex flex-col gap-2">
          <div className="text-sm text-neutral-800 font-medium">Tasa de Clics (CTR)</div>
          <div className="text-3xl font-bold">{metrics.clickRate}%</div>
          <div className="text-xs text-neutral-800">Usuarios que hicieron clic en un resultado</div>
        </div>
        <div className="bg-container border border-neutral-200 dark:border-neutral-700 p-5 rounded-xl shadow-sm flex flex-col gap-2">
          <div className="text-sm text-neutral-800 font-medium">Término Más Buscado</div>
          <div className="text-xl font-bold truncate">{metrics.topTerms[0]?.query || '-'}</div>
          <div className="text-xs text-neutral-800">{metrics.topTerms[0]?.count || 0} búsquedas</div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-4">
          <h2 className="text-lg font-medium">Últimas 100 Búsquedas</h2>
        </div>
        <div className="bg-container border border-neutral-800 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-500 text-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="p-4 font-medium">Término</th>
                <th className="p-4 font-medium">Fecha y Hora</th>
                <th className="p-4 font-medium">Usuario</th>
                <th className="p-4 font-medium">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-neutral-800">No hay búsquedas registradas aún.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-neutral-800 hover:bg-neutral-50/50  transition-colors">
                    <td className="p-4 font-medium">{log.query}</td>
                    <td className="p-4 text-neutral-900">
                      {new Date(log.created_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="p-4 text-neutral-900 truncate max-w-[150px]" title={log.user_name || 'Anónimo'}>
                      {log.user_name ? log.user_name : 'Anónimo'}
                    </td>
                    <td className="p-4">
                      {log.clicked ? (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-500 text-xs font-medium">
                          <CaralIcon name="check" size="s" />
                          <span className="truncate max-w-[200px]" title={log.clicked_url}>{log.clicked_url}</span>
                        </div>
                      ) : (
                        <div className="text-danger-main text-xs flex items-center gap-2">
                          <CaralIcon name="x" size="s" />
                          Sin clic
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
