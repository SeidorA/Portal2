import React from 'react';
import Products from '../../components/home/Products';
import Actin from '../../components/home/Actin';
import { createClient } from '@/utils/supabase/server';
import { getBentoConfig } from '../../actions/bentoConfig';

export default async function Dashboard() {
  const supabase = await createClient();
  const bentoConfig = await getBentoConfig();
  const { data: { user } } = await supabase.auth.getUser();
  
  let userName = "Usuario";
  if (user) {
    const meta = user.user_metadata || {};
    const fullName = meta.full_name || meta.name || meta.display_name || user.email?.split('@')[0] || "Usuario";
    userName = fullName.split(' ')[0];
  }
  const { data: products } = await supabase.from('products').select('*').order('order_index', { ascending: true }).order('created_at', { ascending: false });

  const ownTechProducts = products?.filter(p => p.category === 'own_tech' && !p.hide_in_bento) || [];
  const actinProducts = products?.filter(p => p.category === 'actin' && !p.hide_in_bento) || [];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-[32px] text-neutral-900 dark:text-white font-poppins font-bold">
          Hola, {userName} 👋
        </h1>
        <p className="text-p text-neutral-600 dark:text-neutral-400 font-poppins mt-2">
          Bienvenido a tu panel principal. Desde aquí puedes acceder rápidamente a todas las soluciones y herramientas que tenemos para ti.
        </p>
      </div>

      <div className="flex flex-col gap-12">
        <Products products={ownTechProducts} cols={bentoConfig.ownTechCols} />
        <Actin products={actinProducts} cols={bentoConfig.actinCols} />
      </div>
    </div>
  );
}
