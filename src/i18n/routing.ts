import { defineRouting } from "next-intl/routing";

export const locales = [
  "nl",
  "en",
  "tr",
  "pl",
  "ar-sy",
  "ar-ma",
  "fa-af",
  "so",
  "uk",
  "ru",
] as const;

export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "nl",
  localePrefix: "as-needed", // nl has no prefix, others get /en, /tr, etc.
});
