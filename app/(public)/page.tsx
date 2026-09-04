import Hero from "../components/home/Hero";
import Products from "../components/home/Products";
import Actin from "../components/home/Actin";
import DocsList from "../components/home/DocsList";
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
      <div className="w-full bg-seidor-main text-neutral-100 flex flex-col justify-center items-center py-10 relative overflow-hidden my-6">
        <h1 className="text-5xl font-bold mb-0">Portal</h1>
        <p className="text-lg">Encuentra toda la documentación de los productos de SEIDOR</p>
        <img src="img/haz/2.png" alt="" className="absolute top-[-80px] left-[-50px] w-[50%]" />

      </div>
      <div className="flex flex-col w-full max-w-[1500px] mx-auto py-4">
        <DocsList />
      </div>

    </>
  );
}
