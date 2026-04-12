"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  allePraktijken,
  type PraktijkDetails,
} from "@/data/praktijk-extras";
import { zoekPraktijken } from "@/lib/praktijk-search";
import SiteNavbar from "@/components/SiteNavbar";
import SiteFooter from "@/components/SiteFooter";

type PraktijkHit = PraktijkDetails & { afstandKm?: number };

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
  const t = useTranslations("home");
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [nearby, setNearby] = useState<PraktijkHit[] | null>(null);
  const [locationPromptOpen, setLocationPromptOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

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
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeAll();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Load Mindd self-triage widget script
  useEffect(() => {
    const id = "mindd-embed-script";
    if (document.getElementById(id)) return;
    const script = document.createElement("script");
    script.id = id;
    script.src = "https://widget.mindd.se/embed.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleLocate = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoError(t("locationNotSupported"));
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
          setGeoError(t("locationInaccurate"));
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
          setGeoError(t("locationNone"));
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
            ? t("locationDenied")
            : t("locationFailed")
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
        title: t("step1Title"),
        text: t("step1Text"),
        icon: (
          <svg className="h-6 w-6 text-[#1d1d1b] sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
        ),
      },
      {
        n: 2,
        title: t("step2Title"),
        text: t("step2Text"),
        icon: (
          <svg className="h-6 w-6 text-[#1d1d1b] sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <path d="M8 12l3 3 5-6" />
          </svg>
        ),
      },
      {
        n: 3,
        title: t("step3Title"),
        text: t("step3Text"),
        icon: (
          <svg className="h-6 w-6 text-[#1d1d1b] sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
          </svg>
        ),
      },
    ],
    [t]
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
                {t("locationTitle")}
              </h2>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#6b7280]">
                {t("locationDesc")}
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
                {t("locationAllow")}
              </button>
              <button
                type="button"
                onClick={dismissLocationPrompt}
                className="w-full rounded-xl border border-gray-200 bg-white px-5 py-3 text-[14px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                {t("locationDeny")}
              </button>
            </div>
          </div>
        </div>
      )}

      <SiteNavbar transparent />

      {/* Hero */}
      <section
        className="px-2 pb-2 sm:px-3 sm:pb-3"
        style={{ paddingTop: "calc(var(--hap-banner-h, 0px) + 76px)" }}
      >
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
                  {t("heroTitle")}
                  <br />
                  <span className="text-[#7ab0ff]">{t("heroHighlight")}</span>
                </h1>

                <p
                  className="mx-auto mt-4 max-w-xl text-[17px] font-medium leading-relaxed text-white sm:mt-6 sm:text-[19px] lg:mx-0"
                  style={{ textShadow: "0 1px 12px rgba(15,23,40,0.55)" }}
                >
                  {t("heroSubtitle")}
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
                          placeholder={t("searchPlaceholder")}
                          className="w-full bg-transparent py-3 pr-2 text-[15px] text-[#0f1728] placeholder:text-[#9ca3af] outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full shrink-0 rounded-xl bg-[#1d1d1b] px-6 py-3.5 text-[14px] font-medium text-white transition-colors duration-200 hover:bg-[#1d1d1b]/85 lg:w-auto"
                      >
                        {t("searchButton")}
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
                              <p className="text-[13px] font-medium text-[#0f1728]">{t("locationLoading")}</p>
                              <p className="text-[11px] text-[#6b7280]">{t("locationLoadingSub")}</p>
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
                              {geoError === t("locationDenied") && (
                                <p className="text-[11.5px] leading-relaxed text-[#6b7280]">
                                  {t("locationDeniedHelp")} <span className="font-medium text-[#0f1728]">{t("sitePreferences")}</span> → <span className="font-medium text-[#0f1728]">{t("location")}</span> → <span className="font-medium text-[#0f1728]">{t("allow")}</span>. {t("searchSuffix")}
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
                                {t("close")}
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
                                  {t("nearbyTitle")}
                                </p>
                                <p className="text-[11px] text-[#6b7280]">
                                  {t("nearbyCount", { count: nearby?.length ?? 0, label: (nearby?.length ?? 0) === 1 ? t("practiceSingular") : t("practicePlural") })}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setNearby(null);
                                setShowDropdown(false);
                              }}
                              aria-label={t("close")}
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
                            {t("noResults", { query })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 lg:mx-0 lg:justify-start">
                  <span className="flex items-center gap-1.5 text-[13px] text-white/75">
                    <svg className="h-3.5 w-3.5 text-[#7ab0ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {t("usp1")}
                  </span>
                  <span className="flex items-center gap-1.5 text-[13px] text-white/75">
                    <svg className="h-3.5 w-3.5 text-[#7ab0ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {t("usp2")}
                  </span>
                  <span className="flex items-center gap-1.5 text-[13px] text-white/75">
                    <svg className="h-3.5 w-3.5 text-[#7ab0ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {t("usp3")}
                  </span>
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
            {t("stepsTitle")} <span className="text-[#7ab0ff]">{t("stepsHighlight")}</span>
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

      {/* Meer hulp nodig? — Thuisarts.nl + Moet ik naar de dokter? */}
      <section className="bg-white py-20 sm:py-28 md:py-32">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
          {/* Section header */}
          <div className="mx-auto mb-16 max-w-3xl text-center sm:mb-20 lg:mb-24">
            <h2 className="text-3xl font-semibold leading-[1.1] tracking-[-0.02em] text-gray-900 sm:text-4xl md:text-[2.75rem]">
              Meer hulp nodig bij uw <span className="text-[#7ab0ff]">klachten?</span>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-gray-500 sm:text-lg">
              Naast het vinden van uw waarnemer kunt u ook direct medisch advies krijgen of betrouwbare informatie opzoeken.
            </p>
          </div>

          {/* Two cards */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
            {/* Card 1: Moet ik naar de dokter? */}
            <div className="flex flex-col overflow-hidden rounded-2xl bg-[#7ab0ff] shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
              <div className="flex flex-1 flex-col p-8 sm:p-10">
                <h3 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                  Direct advies nodig?
                </h3>
                <p className="mt-3 text-base leading-relaxed text-gray-800/80">
                  Wilt u weten of contact met de huisarts nodig is? Beantwoord een aantal korte vragen en krijg direct advies.
                </p>

                <div className="mt-8 flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/10">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#1d1d1b"/></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Betrouwbaar</p>
                      <p className="text-sm text-gray-700/70">Samengesteld door specialisten en de Medical Board.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/10">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 00-1.02.24l-2.2 2.2a15.045 15.045 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1A11.36 11.36 0 018.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z" fill="#1d1d1b"/></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Wel of geen contact</p>
                      <p className="text-sm text-gray-700/70">Direct advies over welke zorg nodig is.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/10">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="#1d1d1b"/></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Binnen 1 minuut klaar</p>
                      <p className="text-sm text-gray-700/70">Snel en eenvoudig, zonder account.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-8">
                  <a
                    href="https://moetiknaardedokter.nl/?utm_source=widget&utm_medium=referral&utm_campaign=logo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 rounded-xl bg-white px-6 py-4 shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-all hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/MoetIkNaarDeDokter_RGB-300x64.png"
                      alt="Moet ik naar de dokter?"
                      className="h-10 w-auto sm:h-12"
                    />
                  </a>
                  <p className="mt-3 text-xs text-gray-700/60">Klik om naar Moet ik naar de dokter? te gaan</p>
                </div>
              </div>
            </div>

            {/* Card 2: Thuisarts.nl */}
            <div className="flex flex-col overflow-hidden rounded-2xl bg-[#1a3a4a] shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
              <div className="flex flex-1 flex-col p-8 sm:p-10">
                <h3 className="text-2xl font-semibold text-white sm:text-3xl">
                  Wilt u weten wat u zelf kunt doen?
                </h3>
                <p className="mt-3 text-base leading-relaxed text-white/70">
                  Thuisarts.nl geeft betrouwbare informatie over ziekte en gezondheid. Gemaakt door artsen, voor iedereen.
                </p>

                <div className="mt-8 flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="white"/></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Gemaakt door artsen</p>
                      <p className="text-sm text-white/60">Gecontroleerd door medische specialisten in Nederland.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="white"/></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Informatie over behandelingen</p>
                      <p className="text-sm text-white/60">Lees wat u kunt verwachten bij een bezoek aan de huisarts.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="white"/></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Altijd en overal beschikbaar</p>
                      <p className="text-sm text-white/60">24/7 gratis te raadplegen, ook via de app.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-8">
                  <a
                    href="https://www.thuisarts.nl/?utm_source=wieismijnwaarnemer&utm_medium=referral&utm_campaign=logo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 rounded-xl bg-white px-6 py-4 shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-all hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/thuisarts.png"
                      alt="Thuisarts.nl"
                      className="h-8 w-auto sm:h-10"
                    />
                  </a>
                  <p className="mt-3 text-xs text-white/40">Klik om naar Thuisarts.nl te gaan</p>
                </div>
              </div>
            </div>
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
                {t("regionsTitle")} <span className="text-[#7ab0ff]">{t("regionsHighlight")}</span>
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-gray-500 sm:text-lg">
                {t("regionsDescription", { count: allePraktijken.length, cities: beschikbareSteden.length, citiesLabel: beschikbareSteden.length === 1 ? t("citySingular") : t("cityPlural") })}
              </p>
            </div>

            {/* Rechts: stedenlijst (compact grid) */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {beschikbareSteden.map((stad) => (
                <button
                  key={stad}
                  type="button"
                  onClick={() => pickStad(stad)}
                  className="group flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[#eef4ff]"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[#3585ff] transition-colors group-hover:bg-[#3585ff] group-hover:text-white">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900 transition-colors group-hover:text-[#3585ff]">
                      {stad}
                    </p>
                    <p className="text-xs text-gray-400">
                      {t("practiceCount", { count: praktijkCountPerStad[stad], label: praktijkCountPerStad[stad] === 1 ? t("practiceSingular") : t("practicePlural") })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
