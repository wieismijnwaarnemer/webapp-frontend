"use client";

import { useEffect, useRef, useState } from "react";

type LangCode =
  | "tr"
  | "pl"
  | "ar-sy"
  | "ar-ma"
  | "fa-af"
  | "so"
  | "uk"
  | "ru"
  | "nl"
  | "en";

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

export default function SiteNavbar({
  transparent = false,
}: {
  /** Als true: navbar begint transparant (voor hero-pagina's met donkere achtergrond). Default: false (bv. detailpagina's). */
  transparent?: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<LangCode>("nl");
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

  const langs: { code: LangCode; label: string }[] = [
    { code: "tr", label: "Türkçe" },
    { code: "pl", label: "Polski" },
    { code: "ar-sy", label: "Syrisch" },
    { code: "ar-ma", label: "Marokkaans" },
    { code: "fa-af", label: "Afghaans" },
    { code: "so", label: "Soomaali" },
    { code: "uk", label: "Українська" },
    { code: "ru", label: "Русский" },
    { code: "nl", label: "Nederlands" },
    { code: "en", label: "English" },
  ];
  const current = langs.find((l) => l.code === currentLang)!;
  const shortCode = current.code.includes("-")
    ? current.code.split("-")[1].toUpperCase()
    : current.code.toUpperCase();

  const defaultBg = transparent
    ? "bg-transparent"
    : "bg-white/85 backdrop-blur-xl";

  return (
    <header className="fixed left-0 right-0 top-0 z-50">
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
                        Kies je taal
                      </p>
                      <div className="flex flex-col gap-1">
                        {langs.map((l) => {
                          const active = l.code === currentLang;
                          return (
                            <button
                              key={l.code}
                              type="button"
                              onClick={() => {
                                setCurrentLang(l.code);
                                setLangOpen(false);
                              }}
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
                Voor praktijken
              </a>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
