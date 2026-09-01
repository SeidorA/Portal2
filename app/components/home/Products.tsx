"use client";

import React, { useEffect, useState } from 'react';
import { Brand, CaralIcon } from 'iconcaral2';

export type ProductItem = {
  id?: string;
  title: string;
  description: string;
  link?: string;
  link_demo?: string;
  link_landing?: string;
  link_docs?: string;
  is_super?: boolean;
  light_image?: string;
  dark_image?: string;
  category?: string;
  icon_name?: string;
};

export default function Products({ products = [], cols = 4 }: { products?: ProductItem[], cols?: number }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark');
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full flex flex-col pt-10 pb-2.5">
      <div className="w-full mb-6">
        <h3 className="font-poppins font-bold text-neutral-900 dark:text-white">
          Productos
        </h3>
      </div>

      {/* Contenedor Parent con blur2.png */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 ${cols === 2 ? 'lg:grid-cols-2' : cols === 3 ? 'lg:grid-cols-3' : cols === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-[10px] bg-center bg-no-repeat w-full`}
        style={{ backgroundImage: "url('/img/blur2.png')", backgroundSize: 'contain' }}
      >
        {products.map((product, idx) => {
          const brandName = product.title.replace(/\s+/g, "");
          const lightSrc = product.light_image || `/img/index/${product.title.toLowerCase()}_ligth.png`;
          const darkSrc = product.dark_image || `/img/index/${product.title.toLowerCase()}_dark.png`;
          const imgSrc = isDark ? darkSrc : lightSrc;

          return (
            <a
              key={idx}
              href={product.link}
              className={`
                flex items-center justify-between min-h-[200px] h-full relative rounded-lg
                bg-container/50  backdrop-blur-[25px]!
                border border-white/20 dark:border-white/10
                shadow-[0_4px_6px_rgba(0,0,0,0.1)]
                hover:backdrop-blur-[40px] hover:shadow-[0_0_17px_0_rgba(0,0,0,0.2)]
                transition-all duration-1000 text-neutral-900 
                ${product.is_super ? 'lg:col-span-2 flex-row' : 'flex-col'}
              `}
            >
              <div className={`flex flex-col flex-1 p-[10px] ${product.is_super ? 'w-1/2' : 'w-full px-4 pt-4'}`}>
                <div className="flex items-center gap-[10px] mb-2">
                  <div className='bg-neutral-100 p-[5px] rounded-full text-neutral-900 flex shrink-0'>
                    {product.icon_name ? (
                      <CaralIcon name={product.icon_name as any} size={26} />
                    ) : (
                      <Brand name={brandName as any} size={26} />
                    )}
                  </div>
                  <h3 className="text-[20px] font-poppins font-semibold m-0 ">
                    {product.title}
                  </h3>
                </div>
                <p className="text-[14px] font-poppins m-0 opacity-90 leading-tight">
                  {product.description}
                </p>
              </div>
              <div className={`flex items-center justify-center ${product.is_super ? 'w-auto' : 'w-full'}`}>
                <img
                  src={imgSrc}
                  alt={product.title}
                  className="max-w-full h-auto bg-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
