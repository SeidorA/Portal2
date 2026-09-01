import React from 'react';

import { ProductItem } from './Products';

export default function Actin({ products = [], cols = 3 }: { products?: ProductItem[], cols?: number }) {
  return (
    <div className="w-full flex flex-col gap-[10px] mb-12">
      <div className={`grid grid-cols-1 md:grid-cols-2 ${cols === 2 ? 'lg:grid-cols-2' : cols === 4 ? 'lg:grid-cols-4' : cols === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-3'} gap-[10px]`}>
        {products.map((item, idx) => (
          <a
            key={idx}
            href={item.link}
            className={`
              rounded-lg h-full transition-all duration-300
              bg-container/50 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.2)]
              hover:opacity-90 flex flex-col border border-white/20 dark:border-white/10
              text-neutral-900
            `}
            style={{
              backgroundImage: `url(${item.light_image || item.dark_image})`,
              backgroundPosition: 'center bottom',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'contain',
              padding: '10px 10px 150px 10px'
            }}
          >
            <h3 className="text-[20px] font-poppins font-semibold ">
              {item.title}
            </h3>
            <p className="text-[14px] font-poppins mt-2 ">
              {item.description}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
