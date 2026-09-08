"use client";

import React from "react";
import { useTranslation } from "@/app/context/LanguageContext";

export default function PortalBanner() {
  const { t } = useTranslation();

  return (
    <div className="w-full bg-seidor-main text-neutral-100 flex flex-col justify-center items-center py-10 relative overflow-hidden my-6">
      <h1 className="text-5xl font-bold mb-0 font-poppins">
        {t("home.portalBannerTitle", "Portal")}
      </h1>
      <p className="text-lg font-poppins">
        {t("home.portalBannerSubtitle", "Encuentra toda la documentación de los productos de SEIDOR")}
      </p>
      <img src="/img/haz/2.png" alt="" className="absolute top-[-80px] left-[-50px] w-[50%]" />
    </div>
  );
}
