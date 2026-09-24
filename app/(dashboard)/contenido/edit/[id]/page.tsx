'use client';

import React, { useState, useEffect, use } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/app/context/LanguageContext';
import ContentEditor from '@/app/components/ContentEditor';
import { dispatchProductWebhooksAction } from '@/app/actions/webhookActions';

export default function EditDocumentPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { t } = useTranslation();
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [docData, setDocData] = useState<any | null>(null);
  const [allDocs, setAllDocs] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [productSlug, setProductSlug] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: doc, error: docError } = await supabase
        .from('documentation')
        .select('*, products(id, slug)')
        .eq('id', id)
        .single();

      if (docError) throw docError;
      if (doc) {
        setDocData(doc);
        const prodData = doc.products as any;
        const prodSlug = prodData?.slug || '';
        const prodId = prodData?.id || doc.product_id;
        setProductSlug(prodSlug);

        // Fetch sibling docs and roles
        const [docsRes, rolesRes] = await Promise.all([
          prodId
            ? supabase.from('documentation').select('*').eq('product_id', prodId).order('order_index', { ascending: true })
            : Promise.resolve({ data: [] }),
          supabase.from('roles').select('*').order('name')
        ]);

        if (docsRes.data) setAllDocs(docsRes.data);
        if (rolesRes.data) setRoles(rolesRes.data);
      }
    } catch (err: any) {
      console.error(err.message);
      alert(t('content.errorDocLoad', 'Error cargando documento: ') + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (payload: any) => {
    try {
      const { error } = await supabase
        .from('documentation')
        .update(payload)
        .eq('id', id);

      if (error) throw error;

      if (docData?.product_id) {
        dispatchProductWebhooksAction(docData.product_id, 'docs.updated', {
          docId: id,
          slug: payload.slug,
          productSlug,
        }).catch(e => console.error('[Webhook Dispatch Error]', e));
      }

      alert(t('content.docUpdatedSuccess', 'Documento actualizado correctamente.'));
      if (productSlug && payload.slug) {
        router.push(`/docs/${productSlug}/${payload.slug}`);
      } else {
        router.push('/contenido');
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleClose = () => {
    if (productSlug && docData?.slug) {
      router.push(`/docs/${productSlug}/${docData.slug}`);
    } else {
      router.push('/contenido');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-neutral-500 text-sm">
        {t('content.loadingDoc', 'Cargando documento...')}
      </div>
    );
  }

  if (!docData) {
    return (
      <div className="p-8 text-center text-neutral-500">
        Documento no encontrado.
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-full">
      <ContentEditor
        isOpen={true}
        docToEdit={docData}
        productId={docData.product_id}
        defaultDocType={docData.type || 'document'}
        availableRoles={roles}
        allDocs={allDocs}
        currentModuleId={docData.module_id}
        initialExpanded={true}
        onClose={handleClose}
        onSave={handleSave}
        onMoved={fetchData}
      />
    </div>
  );
}
