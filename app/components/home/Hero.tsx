"use client";

import React from "react";
import styles from "./hero.module.css";
import { useTranslation } from "@/app/context/LanguageContext";

export default function Hero() {
  const { t } = useTranslation();

  return (
    <div className={`${styles.heroBanner} relative flex flex-col items-center justify-center w-full min-h-[50vh]`}>
      <img
        src="/img/blur1.png"
        className={styles.blur1}
        alt=""
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
      <div className={`${styles.container} relative z-10 w-full flex flex-col items-center text-neutral-900`}>
        <h1 className={styles.title}>
          {t("home.heroTitle", "Explore el ecosistema de SEIDOR Analytics")}
        </h1>
        <p className={`${styles.phero} mt-4 text-neutral-800`}>
          {t("home.heroSubtitle", "Conoce nuestras soluciones, accede a sus documentaciones y mantente al tanto de los próximos eventos.")}
        </p>
      </div>
    </div>
  );
}
