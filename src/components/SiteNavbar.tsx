"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { type Locale } from "@/i18n/routing";
import HapBanner from "./HapBanner";

function FlagIcon({ code }: { code: string }) {
  const content = (() => {
    switch (code) {
      case "nl":
        return (
          <>
            <rect width="16" height="16" fill="#AE1C28" />
            <rect y="5.333" width="16" height="5.334" fill="#FFFFFF" />
            <rect y="10.667" width="16" height="5.333" fill="#21468B" />
          </>
        );
      case "en":
        return (
          <>
            <rect width="16" height="16" fill="#012169" />
            <path d="M0 0L16 16M16 0L0 16" stroke="white" strokeWidth="2.5" />
            <path d="M0 0L16 16M16 0L0 16" stroke="#C8102E" strokeWidth="1.5" />
            <path d="M8 0V16M0 8H16" stroke="white" strokeWidth="4" />
            <path d="M8 0V16M0 8H16" stroke="#C8102E" strokeWidth="2.5" />
          </>
        );
      case "tr":
        return <rect width="16" height="16" fill="#E30A17" />;
      case "pl":
        return (
          <>
            <rect width="16" height="8" fill="#FFFFFF" />
            <rect y="8" width="16" height="8" fill="#DC143C" />
          </>
        );
      case "ar-sy":
        return (
          <>
            <rect width="16" height="5.333" fill="#CE1126" />
            <rect y="5.333" width="16" height="5.334" fill="#FFFFFF" />
            <rect y="10.667" width="16" height="5.333" fill="#000000" />
          </>
        );
      case "ar-ma":
        return <rect width="16" height="16" fill="#C1272D" />;
      case "fa-af":
        return (
          <>
            <rect width="5.333" height="16" fill="#000000" />
            <rect x="5.333" width="5.334" height="16" fill="#D32011" />
            <rect x="10.667" width="5.333" height="16" fill="#007A36" />
          </>
        );
      case "so":
        return <rect width="16" height="16" fill="#4189DD" />;
      case "uk":
        return (
          <>
            <rect width="16" height="8" fill="#005BBB" />
            <rect y="8" width="16" height="8" fill="#FFD500" />
          </>
        );
      case "ru":
        return (
          <>
            <rect width="16" height="5.333" fill="#FFFFFF" />
            <rect y="5.333" width="16" height="5.334" fill="#0039A6" />
            <rect y="10.667" width="16" height="5.333" fill="#D52B1E" />
          </>
        );
      case "de":
        return (
          <>
            <rect width="16" height="5.333" fill="#000000" />
            <rect y="5.333" width="16" height="5.334" fill="#DD0000" />
            <rect y="10.667" width="16" height="5.333" fill="#FFCC00" />
          </>
        );
      case "fr":
        return (
          <>
            <rect width="5.333" height="16" fill="#002395" />
            <rect x="5.333" width="5.334" height="16" fill="#FFFFFF" />
            <rect x="10.667" width="5.333" height="16" fill="#ED2939" />
          </>
        );
      case "es":
        return (
          <>
            <rect width="16" height="4" fill="#AA151B" />
            <rect y="4" width="16" height="8" fill="#F1BF00" />
            <rect y="12" width="16" height="4" fill="#AA151B" />
          </>
        );
      case "nl-be":
        return (
          <>
            <rect width="5.333" height="16" fill="#000000" />
            <rect x="5.333" width="5.334" height="16" fill="#FAE042" />
            <rect x="10.667" width="5.333" height="16" fill="#ED2939" />
          </>
        );
      case "nl-sr":
        return (
          <>
            <rect width="16" height="3.2" fill="#377E3F" />
            <rect y="3.2" width="16" height="1.6" fill="#FFFFFF" />
            <rect y="4.8" width="16" height="6.4" fill="#B40A2D" />
            <rect y="11.2" width="16" height="1.6" fill="#FFFFFF" />
            <rect y="12.8" width="16" height="3.2" fill="#377E3F" />
          </>
        );
      case "pap":
        return (
          <>
            <rect width="16" height="16" fill="#002B7F" />
            <rect y="6" width="16" height="4" fill="#F9E814" />
            <rect y="10" width="16" height="6" fill="#CC0000" />
          </>
        );
      default:
        return <rect width="16" height="16" fill="#e5e5e5" />;
    }
  })();

  return (
    <span className="flex h-4 w-4 shrink-0 overflow-hidden rounded-full">
      <svg viewBox="0 0 16 16" className="h-full w-full" aria-hidden="true">
        {content}
      </svg>
    </span>
  );
}

// NL first, EN second, rest alphabetical by label
const langs: { code: Locale; label: string }[] = [
  { code: "nl", label: "Nederlands" },
  { code: "en", label: "English" },
  { code: "fa-af", label: "Afghaans (دری)" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "ar-ma", label: "Marokkaans (العربية)" },
  { code: "pap", label: "Papiamentu" },
  { code: "pl", label: "Polski" },
  { code: "ru", label: "Русский" },
  { code: "so", label: "Soomaali" },
  { code: "nl-sr", label: "Sranantongo" },
  { code: "ar-sy", label: "Syrisch (العربية)" },
  { code: "tr", label: "Türkçe" },
  { code: "uk", label: "Українська" },
  { code: "nl-be", label: "Vlaams" },
];

export default function SiteNavbar({
  transparent = false,
}: {
  transparent?: boolean;
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (langRef.current && !langRef.current.contains(target)) {
        setLangOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLangOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const switchLocale = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
    setLangOpen(false);
  };

  const current = langs.find((l) => l.code === locale) ?? langs[0];
  const shortCode = current.code.includes("-")
    ? current.code.split("-")[1].toUpperCase()
    : current.code.toUpperCase();

  const defaultBg = transparent
    ? "bg-transparent"
    : "bg-white/85 backdrop-blur-xl";

  return (
    <header className="fixed left-0 right-0 top-0 z-50">
      <HapBanner />
      <nav
        className={`relative transition-all duration-300 ease-out ${
          scrolled ? "bg-white/60 backdrop-blur-xl" : defaultBg
        }`}
      >
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-px bg-black/10 transition-opacity duration-300 ${
            scrolled || !transparent ? "opacity-100" : "opacity-0"
          }`}
        />
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
          <div className="flex h-[68px] items-center justify-between lg:h-[76px]">
            <a className="flex shrink-0 items-center" href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Wieismijnwaarnemer"
                className="h-10 w-auto sm:h-12"
              />
            </a>

            <div className="flex items-center gap-2 sm:gap-3">
              <div ref={langRef} className="relative">
                <button
                  type="button"
                  onClick={() => setLangOpen((o) => !o)}
                  aria-haspopup="listbox"
                  aria-expanded={langOpen}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-black/5"
                >
                  <FlagIcon code={current.code} />
                  <span className="text-[13px] font-normal uppercase text-[#1d1d1b]">
                    {shortCode}
                  </span>
                  <svg
                    width="9"
                    height="6"
                    viewBox="0 0 9 6"
                    fill="none"
                    className={`transition-transform duration-200 ${
                      langOpen ? "rotate-180" : ""
                    }`}
                  >
                    <path
                      d="M8.1 1.61L4.78 5.03a.75.75 0 0 1-1.06 0L.4 1.61a.5.5 0 0 1 .35-.86h7a.5.5 0 0 1 .35.86z"
                      fill="#1D1D1B"
                    />
                  </svg>
                </button>
                {langOpen && (
                  <div className="absolute right-0 top-full z-50 pt-2 animate-[dropdownIn_160ms_ease-out]">
                    <div className="w-[280px] rounded-xl border border-[#e5e5e5] bg-white p-5 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
                      <p className="mb-3 text-[13px] font-medium text-[#1d1d1b]">
                        {t("chooseLang")}
                      </p>
                      <div className="flex flex-col gap-1">
                        {langs.map((l) => {
                          const active = l.code === locale;
                          return (
                            <button
                              key={l.code}
                              type="button"
                              onClick={() => switchLocale(l.code)}
                              className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors ${
                                active
                                  ? "bg-[#f5f5f5]"
                                  : "hover:bg-[#f5f5f5]"
                              }`}
                            >
                              <FlagIcon code={l.code} />
                              <span
                                className={`text-[13px] ${
                                  active
                                    ? "text-[#1d1d1b]"
                                    : "text-[#1d1d1b]/60"
                                }`}
                              >
                                {l.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <a
                href="/aanmelden"
                className="hidden items-center justify-center rounded-lg bg-[#1d1d1b] px-5 py-3 text-[14px] font-medium text-white transition-colors duration-200 hover:bg-[#1d1d1b]/85 sm:inline-flex"
              >
                {t("forPractices")}
              </a>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
