"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Locale, TranslationKey, getTranslation } from "../locales";
import { CaralIcon } from "iconcaral2";

interface LanguageContextType {
  language: Locale;
  setLanguage: (lang: Locale) => void;
  t: (key: TranslationKey | string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "es",
  setLanguage: () => { },
  t: (key: string, fallback?: string) => fallback || key,
});

const COOKIE_NAME = "portal_lang";
const STORAGE_KEY = "portal_lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Locale>("es");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(STORAGE_KEY) as Locale;
      if (savedLang === "es" || savedLang === "en") {
        setLanguageState(savedLang);
      } else {
        // Match browser language preference if available
        const browserLang = navigator.language?.toLowerCase().startsWith("en") ? "en" : "es";
        setLanguageState(browserLang);
      }
    } catch {
      // Ignore localStorage errors in SSR / private mode
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Locale) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.cookie = `${COOKIE_NAME}=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Ignore storage errors
    }
  };

  const t = (key: TranslationKey | string, fallback?: string): string => {
    return getTranslation(language, key, fallback);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { language, setLanguage } = useTranslation();

  return (
    <div className={`flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg ${className}`}>
      <button
        type="button"
        onClick={() => setLanguage("es")}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${language === "es"
          ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-bold"
          : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          }`}
        title="Cambiar a Español"
      >
        <span>🇪🇸</span>
        <span>ES</span>
      </button>
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${language === "en"
          ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-bold"
          : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          }`}
        title="Switch to English"
      >
        <span>🇺🇸</span>
        <span>EN</span>
      </button>
    </div>
  );
}

export function LanguageDropdown({ className = "" }: { className?: string }) {
  const { language, setLanguage, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languages: { code: Locale; name: string; flag: string }[] = [
    { code: "es", name: t("common.spanish", "Español"), flag: "🇪🇸" },
    { code: "en", name: t("common.english", "English"), flag: "🇺🇸" },
  ];

  const current = languages.find((l) => l.code === language) || languages[0];

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg  bg-white dark:bg-neutral-800/80 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer shadow-2xs"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">{current.flag}</span>
          <span className="font-medium font-poppins">{current.name}</span>
        </div>
        <CaralIcon
          name="chevronDown"
          size={14}
          classname={`text-neutral-800 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700/80 rounded-xl shadow-lg z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-neutral-800 border-b border-neutral-100 dark:border-neutral-800">
            {t("common.language", "Idioma")}
          </div>
          {languages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer text-left ${isSelected
                  ? "bg-blue-50/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold"
                  : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{lang.flag}</span>
                  <span>{lang.name}</span>
                </div>
                {isSelected && <CaralIcon name="check" size={14} classname="text-blue-600 dark:text-blue-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
