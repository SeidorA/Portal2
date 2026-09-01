"use client";

import React from "react";

export default function Hero() {
  return (
    <div className="relative flex flex-col items-center justify-center py-[70px] w-full min-h-[50vh]">
      <img
        src="/img/blur1.png"
        className="absolute -top-[220px] -left-[370px] z-0 max-h-[1200px]"
        alt=""
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
      <div className="relative z-10 w-full flex flex-col items-center text-neutral-900">
        <h1 className="text-[96px]! text-center leading-[0.9] font-bold">
          Explore el ecosistema de SEIDOR Analytics
        </h1>
        <p className="mt-4 font-semibold text-[24px] max-w-[750px] text-center mx-auto text-neutral-800 ">
          Conoce nuestras soluciones, accede a sus documentaciones y mantente al tanto de los próximos eventos.
        </p>
      </div>
    </div>
  );
}
