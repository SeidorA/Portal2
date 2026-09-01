import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Brand, CaralIcon } from 'iconcaral2';
import fallbackData from './connections.json';

interface ConnectionItem {
  id: string;
  title: string;
  description: string;
  iconName: string | null;
  useBrand: boolean;
  link: string;
}

interface ConnectionsData {
  origins: ConnectionItem[];
  destinations: ConnectionItem[];
}

export const CrestoneConnections: React.FC = () => {
  const [data, setData] = useState<ConnectionsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('https://raw.githubusercontent.com/SeidorA/DocuCrestone/refs/heads/main/static/api/connections.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch connections');
        }
        return res.json();
      })
      .then((jsonData: ConnectionsData) => {
        if (active) {
          setData(jsonData);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch live connections, falling back to local snapshot:', err);
        if (active) {
          setData(fallbackData as ConnectionsData);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-xl bg-[var(--color-container-50)] border border-[var(--color-neutral-400)] my-6">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-[var(--color-seidor-main)] rounded-full animate-spin mb-4" />
        <p className="text-[var(--color-neutral-800)] font-medium">Cargando conexiones...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-xl bg-red-50 border border-red-200 my-6">
        <p className="text-red-600 font-medium">No se pudieron cargar las conexiones en este momento.</p>
      </div>
    );
  }

  const renderIcon = (item: ConnectionItem) => {
    if (!item.iconName) {
      return <CaralIcon name={"file" as any} size={24} />;
    }

    const normalizedIconName = item.iconName.trim();

    if (item.useBrand) {
      return <Brand name={normalizedIconName as any} size={24} />;
    } else {
      return <CaralIcon name={normalizedIconName as any} size={24} />;
    }
  };

  const getExternalLink = (link: string) => {
    if (link.startsWith('http')) {
      return link;
    }
    const normalizedLink = link.startsWith('/') ? link : `/${link}`;
    // Si queremos que funcione localmente con el mismo hostname, retornamos el link relativo, 
    // pero si es un link viejo de Docusaurus lo mandamos al de producción viejo temporalmente:
    if (link.includes('/docs/documentation')) {
      return `https://crestone-help.seidoranalytics.com${normalizedLink}`;
    }
    return normalizedLink;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
      <div>
        <h3 className="text-xl font-bold text-[var(--color-neutral-900)] mb-6 pb-2 border-b-2 border-blue-100 inline-block">
          Orígenes
        </h3>
        <div className="flex flex-col gap-3">
          {data.origins.map((item) => (
            <Link href={getExternalLink(item.link)} key={item.id} className="flex items-center gap-4 p-3 rounded-xl bg-container border border-transparent shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-seidor-main hover:bg-seidor-main/10 transition-all duration-300 no-underline">
              <div className="flex items-center justify-center w-11 h-11 bg-blue-50 text-blue-600 rounded-lg shrink-0 transition-transform duration-300 group-hover:scale-110">
                {renderIcon(item)}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-[var(--color-neutral-900)]">{item.title.trim()}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-[var(--color-neutral-900)] mb-6 pb-2 border-b-2 border-blue-100 inline-block">
          Destinos
        </h3>
        <div className="flex flex-col gap-3">
          {data.destinations.map((item) => (
            <Link href={getExternalLink(item.link)} key={item.id} className="flex items-center gap-4 p-3 rounded-xl bg-container border border-transparent shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-seidor-main hover:bg-seidor-main/10 transition-all duration-300 no-underline">
              <div className="flex items-center justify-center w-11 h-11 bg-blue-50 text-blue-600 rounded-lg shrink-0 transition-transform duration-300 group-hover:scale-110">
                {renderIcon(item)}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-[var(--color-neutral-900)]">{item.title.trim()}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
