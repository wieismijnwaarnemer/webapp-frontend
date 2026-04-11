"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  allePraktijken,
  type PraktijkDetails,
} from "@/data/praktijk-extras";
import { zoekPraktijken } from "@/lib/praktijk-search";

type PraktijkHit = PraktijkDetails & { afstandKm?: number };

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

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Maximale afstand waarop we een praktijk nog als "in de buurt" beschouwen.
const MAX_NEARBY_KM = 4;
// Als de geolocation-accuracy slechter is dan dit, vertrouwen we het niet.
const MIN_ACCURACY_M = 10_000;

export default function WieIsMijnWaarnemerHomepage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [nearby, setNearby] = useState<PraktijkHit[] | null>(null);
  const [locationPromptOpen, setLocationPromptOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<
    "tr" | "pl" | "ar-sy" | "ar-ma" | "fa-af" | "so" | "uk" | "ru" | "nl" | "en"
  >("nl");
  const searchRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    const dismissed =
      typeof localStorage !== "undefined" &&
      localStorage.getItem("locationPromptDismissed") === "1";
    if (dismissed) return;

    if ("permissions" in navigator) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((status) => {
          if (status.state === "granted") {
            handleLocate();
          } else if (status.state === "prompt") {
            setLocationPromptOpen(true);
          }
        })
        .catch(() => setLocationPromptOpen(true));
    } else {
      setLocationPromptOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const typedMatches = useMemo<PraktijkHit[]>(() => {
    return zoekPraktijken(query, 8);
  }, [query]);

  useEffect(() => {
    const closeAll = () => {
      setShowDropdown(false);
      setNearby(null);
      setGeoError(null);
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) {
        closeAll();
      }
      if (langRef.current && !langRef.current.contains(target)) {
        setLangOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeAll();
        setLangOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const handleLocate = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoError("Locatie wordt niet ondersteund door deze browser.");
      setShowDropdown(true);
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    setNearby(null);
    setShowDropdown(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (accuracy && accuracy > MIN_ACCURACY_M) {
          setGeoLoading(false);
          setGeoError(
            "Je locatie is te onnauwkeurig om praktijken in de buurt te tonen. Zoek op naam of postcode."
          );
          return;
        }
        const sorted = allePraktijken
          .map((p) => ({
            ...p,
            afstandKm: haversineKm(
              { lat: latitude, lng: longitude },
              { lat: p.lat, lng: p.lng }
            ),
          }))
          .sort((a, b) => a.afstandKm - b.afstandKm)
          .filter((p) => p.afstandKm <= MAX_NEARBY_KM)
          .slice(0, 5);
        if (sorted.length === 0) {
          setGeoError(
            "Geen praktijken in jouw buurt gevonden. Zoek op naam of postcode."
          );
          setNearby(null);
        } else {
          setNearby(sorted);
        }
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        setGeoError(
          err.code === 1
            ? "Locatietoestemming geweigerd."
            : "Kon locatie niet ophalen."
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 }
    );
  };

  const pickPraktijk = (p: PraktijkDetails) => {
    setShowDropdown(false);
    setNearby(null);
    router.push(`/praktijk/${p.id}`);
  };

  const submitSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const first = (nearby && nearby[0]) ?? typedMatches[0];
    if (first) {
      pickPraktijk(first);
    }
  };

  const beschikbareSteden = useMemo(() => {
    const set = new Set<string>();
    for (const p of allePraktijken) set.add(p.stad);
    return Array.from(set).sort((a, b) => a.localeCompare(b, "nl"));
  }, []);

  const praktijkCountPerStad = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of allePraktijken) {
      map[p.stad] = (map[p.stad] ?? 0) + 1;
    }
    return map;
  }, []);

  const steps = useMemo(
    () => [
      {
        n: 1,
        title: "Zoek op naam",
        text: "Typ de naam van uw huisartsenpraktijk of gebruik uw locatie.",
        icon: (
          <svg className="h-6 w-6 text-[#1d1d1b] sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
        ),
      },
      {
        n: 2,
        title: "Zie de waarnemer",
        text: "Direct duidelijk welke praktijk vandaag waarneemt.",
        icon: (
          <svg className="h-6 w-6 text-[#1d1d1b] sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <path d="M8 12l3 3 5-6" />
          </svg>
        ),
      },
      {
        n: 3,
        title: "Bel of bezoek",
        text: "U heeft meteen het juiste adres en telefoonnummer.",
        icon: (
          <svg className="h-6 w-6 text-[#1d1d1b] sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
          </svg>
        ),
      },
    ],
    []
  );

  const pickStad = (stad: string) => {
    setQuery(stad);
    setShowDropdown(true);
    setNearby(null);
    setGeoError(null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const dropdownList: PraktijkHit[] = nearby ?? typedMatches;
  const showNearbyHeader = nearby !== null && nearby.length > 0;
  const hasTypedQuery = query.trim().length >= 1;
  const dropdownOpen =
    showDropdown &&
    (dropdownList.length > 0 ||
      geoError !== null ||
      geoLoading ||
      hasTypedQuery);

  const dismissLocationPrompt = () => {
    setLocationPromptOpen(false);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("locationPromptDismissed", "1");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Locatie-popup */}
      {locationPromptOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-[fadeIn_200ms_ease-out]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="location-prompt-title"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={dismissLocationPrompt}
          />
          <div className="relative w-full max-w-[420px] origin-center animate-[popupIn_240ms_cubic-bezier(0.16,1,0.3,1)] rounded-2xl bg-white p-6 shadow-[0_24px_60px_-12px_rgba(15,23,40,0.35)] sm:p-7">
            <div className="flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#3585ff]">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <h2
                id="location-prompt-title"
                className="mt-4 text-[18px] font-semibold leading-snug text-[#1d1d1b] sm:text-[19px]"
              >
                Praktijken in uw buurt tonen?
              </h2>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#6b7280]">
                Met uw locatie tonen we direct de dichtstbijzijnde huisartsen. Uw locatie blijft op uw apparaat.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setLocationPromptOpen(false);
                  handleLocate();
                }}
                className="w-full rounded-xl bg-[#1d1d1b] px-5 py-3 text-[14px] font-semibold text-white transition-colors hover:brightness-125"
              >
                Sta toe
              </button>
              <button
                type="button"
                onClick={dismissLocationPrompt}
                className="w-full rounded-xl border border-gray-200 bg-white px-5 py-3 text-[14px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Nee, bedankt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <header className="fixed left-0 right-0 top-0 z-50">
        <nav
          className={`relative transition-all duration-300 ease-out ${
            scrolled ? "bg-white/60 backdrop-blur-xl" : "bg-transparent"
          }`}
        >
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/20 transition-opacity duration-300 ${
              scrolled ? "opacity-100" : "opacity-0"
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
                {/* Taal-dropdown */}
                <div ref={langRef} className="relative">
                  {(() => {
                    const langs: { code: typeof currentLang; label: string }[] = [
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
                    return (
                      <>
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
                            className={`transition-transform duration-200 ${langOpen ? "rotate-180" : ""}`}
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
                                        active ? "bg-[#f5f5f5]" : "hover:bg-[#f5f5f5]"
                                      }`}
                                    >
                                      <FlagIcon code={l.code} />
                                      <span
                                        className={`text-[13px] ${
                                          active ? "text-[#1d1d1b]" : "text-[#1d1d1b]/60"
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
                      </>
                    );
                  })()}
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

      {/* Hero */}
      <section className="px-2 pb-2 pt-[72px] sm:px-3 sm:pb-3 sm:pt-[76px] lg:pt-[80px]">
        <div className="relative mx-auto flex min-h-[calc(100vh-80px-1.5rem)] w-full max-w-[1600px] flex-col rounded-3xl bg-[linear-gradient(135deg,#f0eafc_0%,#f5f0ff_40%,#eee8fb_100%)] lg:rounded-[2.5rem]">
          {/* Achtergrond-afbeelding laag */}
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl bg-cover bg-right bg-no-repeat lg:rounded-[2.5rem] lg:bg-center"
            style={{ backgroundImage: "url('/hero.png')" }}
          >
            {/* Donkere leesbaarheidsoverlay */}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,40,0.55)_0%,rgba(15,23,40,0.45)_50%,rgba(15,23,40,0.65)_100%)] lg:bg-[linear-gradient(90deg,rgba(15,23,40,0.75)_0%,rgba(15,23,40,0.65)_30%,rgba(15,23,40,0.45)_55%,rgba(15,23,40,0.3)_100%)]" />
            {/* Extra vignet links op desktop voor tekstleesbaarheid */}
            <div className="absolute inset-0 hidden lg:block lg:bg-[radial-gradient(ellipse_70%_90%_at_20%_50%,rgba(15,23,40,0.45)_0%,rgba(15,23,40,0)_70%)]" />
          </div>

          <div className="relative mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center px-4 py-20 sm:px-6 sm:py-24 md:py-28 lg:px-10 lg:py-0">
            <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
              {/* Content */}
              <div className="flex flex-col text-center lg:text-left">
                <h1 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] text-white sm:text-[2.4rem] md:text-[2.75rem] lg:text-[3rem] xl:text-[3.4rem]">
                  Is uw huisartsenpraktijk gesloten?
                  <br />
                  <span className="text-[#7ab0ff]">Vind hier direct uw waarnemer.</span>
                </h1>

                <p
                  className="mx-auto mt-4 max-w-xl text-[17px] font-medium leading-relaxed text-white sm:mt-6 sm:text-[19px] lg:mx-0"
                  style={{ textShadow: "0 1px 12px rgba(15,23,40,0.55)" }}
                >
                  Zoek uw huisartsenpraktijk en zie direct welke arts vandaag waarneemt.
                </p>

                <div className="mx-auto mt-8 w-full max-w-[760px] lg:mx-0">
                  <div ref={searchRef} className="relative">
                    <form
                      onSubmit={submitSearch}
                      className="flex flex-col gap-2 rounded-2xl border border-white/80 bg-white p-2 shadow-[0_12px_40px_-8px_rgba(15,23,40,0.18)] ring-1 ring-black/5 transition-all focus-within:shadow-[0_16px_50px_-8px_rgba(53,133,255,0.25)] focus-within:ring-[#3585ff]/30 lg:flex-row lg:items-center"
                    >
                      <div className="flex flex-1 items-center pl-3">
                        <svg className="mr-3 h-5 w-5 shrink-0 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          value={query}
                          onChange={(e) => {
                            setQuery(e.target.value);
                            setShowDropdown(true);
                            setGeoError(null);
                            setNearby(null);
                          }}
                          onFocus={() => setShowDropdown(true)}
                          placeholder="Zoek uw huisartsenpraktijk (bijv. Huisartspraktijk Milad)"
                          className="w-full bg-transparent py-3 pr-2 text-[15px] text-[#0f1728] placeholder:text-[#9ca3af] outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full shrink-0 rounded-xl bg-[#1d1d1b] px-6 py-3.5 text-[14px] font-medium text-white transition-colors duration-200 hover:bg-[#1d1d1b]/85 lg:w-auto"
                      >
                        Zoek
                      </button>
                    </form>


                    {dropdownOpen && (
                      <div className="absolute left-0 right-0 top-full z-40 mt-2 origin-top animate-[dropdownIn_180ms_ease-out] overflow-hidden rounded-2xl border border-black/[0.05] bg-white shadow-[0_10px_30px_-10px_rgba(15,23,40,0.18),0_24px_60px_-18px_rgba(15,23,40,0.22)] lg:max-w-[540px]">
                        {geoLoading && (
                          <div className="flex items-center gap-3 px-4 py-4">
                            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                              <span className="absolute inset-0 animate-ping rounded-full bg-[#3585ff]/20" />
                              <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#eef4ff] text-[#3585ff]">
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                  <circle cx="12" cy="10" r="3" />
                                </svg>
                              </span>
                            </span>
                            <div className="flex min-w-0 flex-col">
                              <p className="text-[13px] font-medium text-[#0f1728]">Locatie bepalen…</p>
                              <p className="text-[11px] text-[#6b7280]">We zoeken praktijken dichtbij jou.</p>
                            </div>
                          </div>
                        )}
                        {geoError && !geoLoading && (
                          <div className="flex items-start gap-3 px-4 py-4">
                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fef2f2] text-[#dc2626]">
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 8v4M12 16h.01" />
                              </svg>
                            </span>
                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                              <p className="text-[13px] font-medium text-[#0f1728]">{geoError}</p>
                              {geoError.toLowerCase().includes("geweigerd") && (
                                <p className="text-[11.5px] leading-relaxed text-[#6b7280]">
                                  Klik op het 🔒 slotje naast de URL → <span className="font-medium text-[#0f1728]">Sitevoorkeuren</span> → <span className="font-medium text-[#0f1728]">Locatie</span> → <span className="font-medium text-[#0f1728]">Toestaan</span>. Of zoek hierboven op praktijknaam.
                                </p>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setGeoError(null);
                                  setShowDropdown(false);
                                }}
                                className="mt-1 self-start text-[11.5px] font-medium text-[#3585ff] hover:text-[#1d5fd9]"
                              >
                                Sluiten
                              </button>
                            </div>
                          </div>
                        )}
                        {showNearbyHeader && !geoLoading && (
                          <div className="flex items-center justify-between gap-3 border-b border-black/[0.05] bg-[#f8fafc] px-4 py-3">
                            <div className="flex min-w-0 items-center gap-2.5">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[#3585ff]">
                                <svg className="h-[14px] w-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                  <circle cx="12" cy="10" r="3" />
                                </svg>
                              </span>
                              <div className="min-w-0">
                                <p className="text-[12.5px] font-semibold text-[#0f1728]">
                                  Is dit jouw huisarts?
                                </p>
                                <p className="text-[11px] text-[#6b7280]">
                                  {nearby?.length} {nearby?.length === 1 ? "praktijk" : "praktijken"} dichtbij — klik om te kiezen
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setNearby(null);
                                setShowDropdown(false);
                              }}
                              aria-label="Sluiten"
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#6b7280] transition-colors hover:bg-black/[0.05] hover:text-[#0f1728]"
                            >
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
                                <path d="M6 6l12 12M18 6L6 18" />
                              </svg>
                            </button>
                          </div>
                        )}
                        {dropdownList.length > 0 && !geoLoading && (
                          <ul className="max-h-[360px] divide-y divide-black/[0.04] overflow-y-auto">
                            {dropdownList.map((p) => (
                              <li key={p.id}>
                                <button
                                  type="button"
                                  onClick={() => pickPraktijk(p)}
                                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f5f7fb]"
                                >
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eef4ff] text-[#3585ff]">
                                    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                      <circle cx="12" cy="10" r="3" />
                                    </svg>
                                  </span>
                                  <span className="flex min-w-0 flex-1 flex-col">
                                    <span className="truncate text-[14px] font-medium text-[#0f1728]">
                                      {p.naam}
                                    </span>
                                    <span className="truncate text-[12px] text-[#6b7280]">
                                      {p.straat}, {p.postcode} {p.plaats}
                                    </span>
                                  </span>
                                  {typeof p.afstandKm === "number" && (
                                    <span className="shrink-0 rounded-full bg-[#eef4ff] px-2 py-0.5 text-[11px] font-semibold text-[#3585ff]">
                                      {p.afstandKm < 1
                                        ? `${Math.round(p.afstandKm * 1000)} m`
                                        : `${p.afstandKm.toFixed(1)} km`}
                                    </span>
                                  )}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                        {!geoLoading && !geoError && dropdownList.length === 0 && query.trim().length >= 1 && (
                          <div className="px-4 py-3 text-[13px] text-[#6b7280]">
                            Geen praktijken gevonden voor &ldquo;{query}&rdquo;.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mx-auto mt-6 flex items-center gap-4 lg:mx-0">
                  <div className="flex -space-x-2.5">
                    <div className="h-10 w-10 rounded-full border-[2.5px] border-white bg-[url('https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80')] bg-cover bg-center shadow-[0_2px_8px_rgba(15,23,40,0.08)]" />
                    <div className="h-10 w-10 rounded-full border-[2.5px] border-white bg-[url('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80')] bg-cover bg-center shadow-[0_2px_8px_rgba(15,23,40,0.08)]" />
                    <div className="h-10 w-10 rounded-full border-[2.5px] border-white bg-[url('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80')] bg-cover bg-center shadow-[0_2px_8px_rgba(15,23,40,0.08)]" />
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-[2.5px] border-white bg-gradient-to-br from-[#3585ff] to-[#5b9fff] text-[11px] font-semibold text-white shadow-[0_2px_8px_rgba(53,133,255,0.25)]">
                      10k+
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-0.5">
                    <div className="flex items-center gap-0.5 text-[#fbbf24]">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                        </svg>
                      ))}
                      <span className="ml-1.5 text-[12px] font-semibold text-white">4.9</span>
                    </div>
                    <p className="text-[12px] text-white/75">
                      Vertrouwd door <span className="font-semibold text-white">10.000+</span> patiënten
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Zo werkt het */}
      <section className="bg-white py-20 sm:py-28 md:py-32">
        <div className="mx-auto w-full max-w-[1400px] px-4 text-center sm:px-6 lg:px-10">
          <h2 className="mx-auto mb-16 max-w-3xl text-3xl font-semibold leading-[1.1] tracking-[-0.02em] text-gray-900 sm:mb-20 sm:text-4xl md:text-[2.75rem] lg:mb-24">
            In 3 stappen <span className="text-[#7ab0ff]">uw waarnemer vinden.</span>
          </h2>

          <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-10 lg:gap-14">
            {steps.map((step) => (
              <div key={step.n} className="flex h-full flex-col items-center">
                <div className="mb-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#f5f5f4] sm:h-16 sm:w-16">
                  {step.icon}
                </div>
                <h3 className="mb-3 text-xl font-semibold text-gray-900 sm:text-2xl">
                  {step.title}
                </h3>
                <p className="max-w-xs text-[15px] leading-relaxed text-gray-500 sm:text-base">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Regio's */}
      <section className="bg-white py-20 sm:py-28 md:py-32">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">
            {/* Links: headline */}
            <div className="lg:sticky lg:top-32 lg:self-start">
              <h2 className="text-3xl font-semibold leading-[1.1] tracking-[-0.02em] text-gray-900 sm:text-4xl md:text-[2.75rem]">
                Beschikbaar in <span className="text-[#7ab0ff]">uw regio.</span>
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-gray-500 sm:text-lg">
                {allePraktijken.length} deelnemende huisartsenpraktijken in {beschikbareSteden.length} {beschikbareSteden.length === 1 ? "stad" : "steden"}. Kies uw stad om direct alle praktijken te zien.
              </p>
            </div>

            {/* Rechts: stedenlijst */}
            <ul className="flex flex-col">
              {beschikbareSteden.map((stad, i) => (
                <li
                  key={stad}
                  className={i !== 0 ? "border-t border-gray-100" : ""}
                >
                  <button
                    type="button"
                    onClick={() => pickStad(stad)}
                    className="group flex w-full items-center gap-5 py-6 text-left transition-colors sm:gap-6 sm:py-7"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[#3585ff] transition-colors group-hover:bg-[#3585ff] group-hover:text-white">
                      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </span>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 transition-colors group-hover:text-[#3585ff] sm:text-xl">
                        {stad}
                      </h3>
                      <p className="mt-1 text-[14px] text-gray-500">
                        {praktijkCountPerStad[stad]} deelnemende praktijken
                      </p>
                    </div>
                    <svg
                      className="h-5 w-5 shrink-0 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-[#3585ff]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#000000] text-white">
        <div>
          <div className="mx-auto w-full max-w-[1400px] px-4 pt-14 sm:px-6 sm:pt-16 lg:px-10">
            <div className="grid grid-cols-1 gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-16">
              {/* Brand */}
              <div>
                <a href="/" className="inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo.png"
                    alt="Wieismijnwaarnemer"
                    className="h-9 w-auto sm:h-10"
                    style={{ filter: "brightness(0) invert(1)" }}
                  />
                </a>
                <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-white/70">
                  Vind snel welke huisartspraktijk waarneemt wanneer uw eigen huisarts afwezig is.
                </p>
              </div>

              {/* Voor patiënten */}
              <div>
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-white/50">
                  Voor patiënten
                </h3>
                <ul className="mt-4 space-y-3">
                  <li>
                    <a href="/over-ons" className="text-[15px] text-white/85 transition-colors hover:text-white">Over ons</a>
                  </li>
                  <li>
                    <a href="/contact" className="text-[15px] text-white/85 transition-colors hover:text-white">Contact</a>
                  </li>
                  <li>
                    <a href="/regios" className="text-[15px] text-white/85 transition-colors hover:text-white">Regio&apos;s</a>
                  </li>
                  <li>
                    <a href="/helpcentrum" className="text-[15px] text-white/85 transition-colors hover:text-white">Hulpcentrum</a>
                  </li>
                </ul>
              </div>

              {/* Voor huisartspraktijken */}
              <div>
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-white/50">
                  Voor huisartspraktijken
                </h3>
                <ul className="mt-4 space-y-3">
                  <li>
                    <a
                      href="/aanmelden"
                      className="inline-flex items-center gap-2 text-[15px] font-semibold text-white transition-colors hover:text-white/90"
                    >
                      Praktijk aanmelden
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M13 5l7 7-7 7" />
                      </svg>
                    </a>
                  </li>
                  <li>
                    <a href="/voor-praktijken" className="text-[15px] text-white/85 transition-colors hover:text-white">Voor praktijken</a>
                  </li>
                  <li>
                    <a href="/portaal" className="text-[15px] text-white/85 transition-colors hover:text-white">Praktijkpagina beheren</a>
                  </li>
                </ul>
              </div>
            </div>

            <hr className="m-0 border-white/15" />

            <div className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-2xl text-[12px] leading-relaxed text-white/55">
                Let op: controleer bij twijfel altijd rechtstreeks bij uw huisartsenpraktijk of de waarnemer. Bij spoed belt u <span className="text-white/80">112</span> of de <span className="text-white/80">huisartsenpost</span> in uw regio.
              </p>
              <p className="shrink-0 text-[12px] text-white/40">
                © 2026 Wieismijnwaarnemer
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
