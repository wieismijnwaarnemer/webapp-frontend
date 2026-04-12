import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { routing, locales, type Locale } from "./i18n/routing";

/**
 * Map browser/phone language codes to our supported locales.
 * iOS/Android send codes like "tr", "pl", "ar", "fa", "uk", "ru", "so", "en".
 * We match the most specific first, then fall back to the base language.
 */
const LANG_MAP: Record<string, Locale> = {
  // Exact matches
  nl: "nl",
  en: "en",
  tr: "tr",
  pl: "pl",
  so: "so",
  uk: "uk",
  ru: "ru",
  // Arabic variants → default to Syrian Arabic
  ar: "ar-sy",
  "ar-sy": "ar-sy",
  "ar-ma": "ar-ma",
  "ar-mr": "ar-ma", // Mauritania
  "ar-dz": "ar-ma", // Algeria (Maghreb)
  "ar-tn": "ar-ma", // Tunisia (Maghreb)
  "ar-ly": "ar-ma", // Libya (Maghreb)
  // Farsi/Dari variants → Afghan Dari
  fa: "fa-af",
  "fa-af": "fa-af",
  "fa-ir": "fa-af", // Iranian Farsi → map to our Dari
  prs: "fa-af", // Dari ISO code
  // Ukrainian
  "uk-ua": "uk",
  // Russian
  "ru-ru": "ru",
  // German
  de: "de",
  "de-de": "de",
  "de-at": "de",
  "de-ch": "de",
  // French
  fr: "fr",
  "fr-fr": "fr",
  "fr-be": "fr",
  "fr-ch": "fr",
  // Spanish
  es: "es",
  "es-es": "es",
  "es-mx": "es",
  "es-ar": "es",
  // Flemish / Belgian Dutch
  "nl-be": "nl-be",
  // Surinamese Dutch
  "nl-sr": "nl-sr",
  // Papiamento
  pap: "pap",
};

function resolveLocale(acceptLang: string | null): Locale | null {
  if (!acceptLang) return null;

  // Parse Accept-Language: "tr,en-US;q=0.9,en;q=0.8,nl;q=0.7"
  const langs = acceptLang
    .split(",")
    .map((part) => {
      const [lang, qPart] = part.trim().split(";");
      const q = qPart ? parseFloat(qPart.replace("q=", "")) : 1;
      return { lang: lang.trim().toLowerCase(), q };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of langs) {
    // Try exact match first (e.g. "ar-ma")
    if (LANG_MAP[lang]) return LANG_MAP[lang];
    // Try base language (e.g. "ar-eg" → try "ar")
    const base = lang.split("-")[0];
    if (LANG_MAP[base]) return LANG_MAP[base];
  }

  return null;
}

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  // Only auto-detect on first visit (no NEXT_LOCALE cookie yet)
  const hasLocaleCookie = request.cookies.has("NEXT_LOCALE");
  const pathname = request.nextUrl.pathname;

  // Check if user is on root without a locale prefix
  const isRootOrDefault =
    pathname === "/" ||
    !locales.some(
      (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
    );

  if (!hasLocaleCookie && isRootOrDefault) {
    const acceptLang = request.headers.get("accept-language");
    const detected = resolveLocale(acceptLang);

    if (detected && detected !== "nl") {
      // Redirect to the detected locale
      const url = request.nextUrl.clone();
      url.pathname = `/${detected}${pathname === "/" ? "" : pathname}`;
      const response = NextResponse.redirect(url);
      response.cookies.set("NEXT_LOCALE", detected);
      return response;
    }
  }

  return intlMiddleware(request);
}

// Need NextResponse for redirect
import { NextResponse } from "next/server";

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
