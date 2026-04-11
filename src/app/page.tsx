"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { praktijken, type Praktijk } from "@/data/praktijken";

type PraktijkHit = Praktijk & { afstandKm?: number };

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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
const MAX_NEARBY_KM = 15;
// Als de geolocation-accuracy slechter is dan dit, vertrouwen we het niet.
const MIN_ACCURACY_M = 10_000;

export default function WieIsMijnWaarnemerHomepage() {
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [nearby, setNearby] = useState<PraktijkHit[] | null>(null);
  const [locationPromptOpen, setLocationPromptOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
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
    const q = normalize(query.trim());
    if (q.length < 2) return [];
    return praktijken
      .filter((p) => {
        const hay = normalize(
          `${p.naam} ${p.straat} ${p.postcode} ${p.plaats} ${p.stad}`
        );
        return hay.includes(q);
      })
      .slice(0, 6);
  }, [query]);

  useEffect(() => {
    const closeAll = () => {
      setShowDropdown(false);
      setNearby(null);
      setGeoError(null);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        closeAll();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAll();
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
        const sorted = praktijken
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

  const pickPraktijk = (p: Praktijk) => {
    setQuery(p.naam);
    setShowDropdown(false);
    setNearby(null);
  };

  const beschikbareSteden = useMemo(() => {
    const set = new Set<string>();
    for (const p of praktijken) set.add(p.stad);
    return Array.from(set).sort((a, b) => a.localeCompare(b, "nl"));
  }, []);

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
  const dropdownOpen =
    showDropdown &&
    (dropdownList.length > 0 || geoError !== null || geoLoading);

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
          <div className="relative w-full max-w-md origin-center animate-[popupIn_240ms_cubic-bezier(0.16,1,0.3,1)] rounded-2xl bg-white p-6 shadow-[0_24px_60px_-12px_rgba(15,23,40,0.35)] sm:p-8">
            <button
              type="button"
              onClick={dismissLocationPrompt}
              aria-label="Sluiten"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#9ca3af] transition-colors hover:bg-black/[0.05] hover:text-[#0f1728]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            <div className="flex flex-col items-center text-center">
              <span className="relative flex h-14 w-14 items-center justify-center">
                <span className="absolute inset-0 animate-ping rounded-full bg-[#3585ff]/20" />
                <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#eef4ff] text-[#3585ff]">
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
              </span>

              <h2
                id="location-prompt-title"
                className="mt-5 text-[19px] font-semibold leading-snug text-[#0f1728] sm:text-[20px]"
              >
                Praktijken bij u in de buurt
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[#6b7280] sm:text-[14.5px]">
                Mogen we uw locatie gebruiken om direct de dichtstbijzijnde huisartsenpraktijken te tonen? Uw locatie wordt niet opgeslagen.
              </p>

              <div className="mt-6 flex w-full flex-col-reverse gap-2 sm:flex-row sm:gap-3">
                <button
                  type="button"
                  onClick={dismissLocationPrompt}
                  className="w-full rounded-full border border-[#e5e7eb] bg-white px-5 py-3 text-[14px] font-medium text-[#4b5563] transition-colors hover:bg-[#f5f7fb] hover:text-[#0f1728]"
                >
                  Nee, bedankt
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLocationPromptOpen(false);
                    handleLocate();
                  }}
                  className="w-full rounded-full bg-[#0f1728] px-5 py-3 text-[14px] font-semibold text-white transition-colors hover:brightness-125"
                >
                  Ja, gebruik locatie
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <header className="fixed left-0 right-0 top-0 z-50">
        <nav
          className={`relative transition-colors duration-300 ease-out ${
            scrolled ? "bg-white" : "bg-transparent"
          }`}
        >
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 h-px bg-black/[0.08] transition-opacity duration-300 ${
              scrolled ? "opacity-100" : "opacity-0"
            }`}
          />
          <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
            <div className="flex h-[68px] items-center justify-between lg:h-[76px]">
              <a className="flex shrink-0 items-center" href="/">
                <span className="text-[19px] font-semibold tracking-[-0.03em] text-[#1d1d1b] sm:text-[22px]">
                  Wieismijnwaarnemer
                </span>
              </a>

              <a
                href="/aanmelden"
                className="inline-flex items-center justify-center rounded-lg bg-[#1d1d1b] px-4 py-2.5 text-[13px] font-medium text-white transition-colors duration-200 hover:bg-[#1d1d1b]/85 sm:px-5 sm:py-3 sm:text-[14px]"
              >
                Voor praktijken
              </a>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="px-2 pb-2 pt-[72px] sm:px-3 sm:pb-3 sm:pt-[76px] lg:pt-[80px]">
        <div className="relative mx-auto flex min-h-[calc(100vh-80px-1.5rem)] w-full max-w-[1600px] flex-col rounded-3xl bg-[linear-gradient(135deg,#f0eafc_0%,#f5f0ff_40%,#eee8fb_100%)] lg:rounded-[2.5rem]">
          {/* Geclipte visuele laag: decor + banner afbeelding */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl lg:rounded-[2.5rem]">
            <div className="absolute -left-20 -top-20 h-[400px] w-[400px] rounded-full bg-[#e4d4fb]/40" />
            <div className="absolute -bottom-32 -right-20 h-[500px] w-[500px] rounded-full bg-[#d8ccf6]/30" />
            <div className="absolute left-[40%] top-[20%] h-[300px] w-[300px] rounded-full bg-[#ede3ff]/50" />
            <div className="absolute bottom-[15%] left-[15%] h-[200px] w-[200px] rounded-full bg-[#f3eaff]/60" />

            <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 justify-center lg:left-auto lg:right-[5%] lg:translate-x-0 xl:right-[8%]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/banner.png"
                alt="Wieismijnwaarnemer"
                className="block h-auto max-h-[42vh] w-auto object-contain sm:max-h-[44vh] lg:max-h-[calc(100vh-12rem)]"
                loading="eager"
              />
            </div>
          </div>

          <div className="relative mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center px-4 pb-[48vh] pt-28 sm:px-6 sm:pb-[50vh] sm:pt-32 md:pt-36 lg:px-10 lg:py-0 lg:pb-0">
            <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
              {/* Content */}
              <div className="flex flex-col text-center lg:text-left">
                <h1 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] text-[#0f1728] sm:text-[2.4rem] md:text-[2.75rem] lg:text-[3rem] xl:text-[3.4rem]">
                  Is uw huisarts gesloten?
                  <br />
                  <span className="text-[#3585ff]">Vind hier direct uw waarnemer.</span>
                </h1>

                <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#4b5563] sm:mt-6 sm:text-lg lg:mx-0">
                  Zoek uw huisartsenpraktijk en zie direct welke arts vandaag waarneemt.
                </p>

                <div className="mx-auto mt-8 w-full max-w-[760px] lg:mx-0">
                  <div ref={searchRef} className="relative">
                    <div className="flex flex-col gap-2 rounded-2xl border border-white/80 bg-white p-2 shadow-[0_12px_40px_-8px_rgba(15,23,40,0.18)] ring-1 ring-black/5 transition-all focus-within:shadow-[0_16px_50px_-8px_rgba(53,133,255,0.25)] focus-within:ring-[#3585ff]/30 lg:flex-row lg:items-center">
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
                          placeholder="Zoek uw huisartsenpraktijk (bijv. De Gors Purmerend)"
                          className="w-full bg-transparent py-3 pr-2 text-[15px] text-[#0f1728] placeholder:text-[#9ca3af] outline-none"
                        />
                      </div>
                      <button className="w-full shrink-0 rounded-xl bg-[#1d1d1b] px-6 py-3.5 text-[14px] font-medium text-white transition-colors duration-200 hover:bg-[#1d1d1b]/85 lg:w-auto">
                        Zoek
                      </button>
                    </div>


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
                        {!geoLoading && !geoError && dropdownList.length === 0 && query.trim().length >= 2 && (
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
                      <span className="ml-1.5 text-[12px] font-semibold text-[#0f1728]">4.9</span>
                    </div>
                    <p className="text-[12px] text-[#6b7280]">
                      Vertrouwd door <span className="font-semibold text-[#0f1728]">10.000+</span> patiënten
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Zo werkt het */}
      <section className="bg-white px-4 py-20 sm:px-6 sm:py-28 md:py-32 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900 sm:text-3xl md:text-4xl">
            In 3 stappen uw waarnemer vinden
          </h2>
          <p className="mx-auto mb-16 max-w-xl text-base text-gray-500 sm:mb-20 sm:text-lg">
            Geen gedoe, geen gebel. Binnen dertig seconden ziet u waar u vandaag terechtkunt.
          </p>

          <ol className="grid grid-cols-1 gap-10 border-t border-gray-100 pt-10 text-left sm:grid-cols-3 sm:gap-8 sm:pt-12">
            {[
              { n: "1", title: "Zoek op naam", text: "Typ de naam van uw huisartsenpraktijk of gebruik uw locatie." },
              { n: "2", title: "Zie de waarnemer", text: "Direct duidelijk welke praktijk vandaag waarneemt." },
              { n: "3", title: "Bel of bezoek", text: "U heeft meteen het juiste adres en telefoonnummer." },
            ].map((step) => (
              <li key={step.n}>
                <p className="mb-3 text-sm font-semibold text-gray-400">
                  {step.n.padStart(2, "0")}
                </p>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 sm:text-xl">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 sm:text-base">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Regio's */}
      <section className="bg-white px-4 py-20 sm:px-6 sm:py-28 md:py-32 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900 sm:text-3xl md:text-4xl">
            Beschikbaar in deze regio&apos;s
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-base text-gray-500 sm:text-lg">
            Klik op uw stad om direct alle deelnemende huisartsenpraktijken te zien.
          </p>

          <div className="mb-16 flex flex-wrap items-center justify-center gap-2.5 sm:mb-20">
            {beschikbareSteden.map((stad) => (
              <button
                key={stad}
                type="button"
                onClick={() => pickStad(stad)}
                className="group inline-flex items-center gap-2 rounded-full bg-[#0f1728] px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:brightness-110 sm:text-[15px]"
              >
                {stad}
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                  <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
                  </svg>
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6 border-t border-gray-100 pt-10 sm:gap-8 sm:pt-12">
            <div className="text-center">
              <p className="mb-1 text-2xl font-medium text-gray-900 sm:text-3xl md:text-4xl">
                {praktijken.length}+
              </p>
              <p className="text-xs text-gray-400 sm:text-sm">
                Deelnemende praktijken
              </p>
            </div>
            <div className="text-center">
              <p className="mb-1 text-2xl font-medium text-gray-900 sm:text-3xl md:text-4xl">
                {beschikbareSteden.length}
              </p>
              <p className="text-xs text-gray-400 sm:text-sm">
                Steden en regio&apos;s
              </p>
            </div>
            <div className="text-center">
              <p className="mb-1 text-2xl font-medium text-gray-900 sm:text-3xl md:text-4xl">
                100%
              </p>
              <p className="text-xs text-gray-400 sm:text-sm">
                Gratis te gebruiken
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#000000] text-white">
        <div className="px-4 sm:px-6">
          <div className="mx-auto max-w-[1320px] pt-14 sm:pt-16">
            <div className="grid grid-cols-1 gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-16">
              {/* Brand */}
              <div>
                <a href="/" className="text-[20px] font-semibold tracking-[-0.02em] text-white">
                  Wieismijnwaarnemer
                </a>
                <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-white/70">
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
                    <a href="/account" className="text-[15px] text-white/85 transition-colors hover:text-white">Account aanmaken</a>
                  </li>
                  <li>
                    <a href="/voor-praktijken" className="text-[15px] text-white/85 transition-colors hover:text-white">Voor praktijken</a>
                  </li>
                  <li>
                    <a href="/praktijkpaginas" className="text-[15px] text-white/85 transition-colors hover:text-white">Praktijkpagina beheren</a>
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
