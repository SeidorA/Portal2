import Hero from "../components/home/Hero";
import Products from "../components/home/Products";
import Actin from "../components/home/Actin";
import DocsList from "../components/home/DocsList";
import PortalBanner from "../components/home/PortalBanner";
import { createClient } from '@/utils/supabase/server';
import Navbar from "../components/Navbar";
import { getBentoConfig } from "../actions/bentoConfig";

export default async function Home() {
  const supabase = await createClient();
  const bentoConfig = await getBentoConfig();
  const { data: products } = await supabase.from('products').select('*').order('order_index', { ascending: true }).order('created_at', { ascending: false });

  const ownTechProducts = products?.filter(p => p.category === 'own_tech' && !p.hide_in_bento) || [];
  const actinProducts = products?.filter(p => p.category === 'actin' && !p.hide_in_bento) || [];

  return (
    <>
      <Navbar />
      <div className="flex flex-col w-full max-w-[1500px] mx-auto py-4">
        <Hero />
        <Products products={ownTechProducts} cols={bentoConfig.ownTechCols} />
        <Actin products={actinProducts} cols={bentoConfig.actinCols} />
      </div>
      <PortalBanner />
      <div className="flex flex-col w-full max-w-[1500px] mx-auto py-4">
        <DocsList />
      </div>
    </>
  );
}
