import { es, Translations } from "./es";
import { en } from "./en";

export type Locale = "es" | "en";

export const dictionaries: Record<Locale, Translations> = {
  es,
  en,
};

// Nested keys type helper (e.g. "sidebar.home" | "common.save")
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<Translations>;

export function getTranslation(locale: Locale, key: string, fallback?: string): string {
  const dict = dictionaries[locale] || dictionaries.es;
  const parts = key.split(".");
  let current: any = dict;

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return fallback || key;
    }
  }

  return typeof current === "string" ? current : (fallback || key);
}
