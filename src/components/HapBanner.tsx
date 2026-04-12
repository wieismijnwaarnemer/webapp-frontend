"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * HAP regions: each entry has a name, phone number, and a bounding box
 * (lat/lng min/max) that roughly covers the service area.
 * When the user's location falls inside a box, we show that HAP number.
 * Boxes are intentionally generous — overlaps are resolved by picking
 * the nearest center.
 */
interface HapRegion {
  name: string;
  phone: string;
  lat: number; // center
  lng: number;
  // bounding box
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}

const HAP_REGIONS: HapRegion[] = [
  // Friesland
  { name: "Dokterswacht Friesland", phone: "085 082 0820", lat: 53.2, lng: 5.8, latMin: 52.85, latMax: 53.5, lngMin: 5.0, lngMax: 6.3 },
  // Groningen (stad + regio)
  { name: "Doktersdienst Groningen", phone: "0900 9229", lat: 53.22, lng: 6.57, latMin: 53.0, latMax: 53.55, lngMin: 6.3, lngMax: 7.25 },
  // Groningen - Leek/DokNoord
  { name: "DokNoord Leek", phone: "088 330 1330", lat: 53.16, lng: 6.38, latMin: 53.05, latMax: 53.25, lngMin: 6.25, lngMax: 6.5 },
  // Drenthe
  { name: "Dokter Drenthe", phone: "088 050 4030", lat: 52.85, lng: 6.6, latMin: 52.55, latMax: 53.1, lngMin: 6.2, lngMax: 7.1 },
  // Overijssel - Zwolle/Hardenberg (Medrie)
  { name: "Medrie Zwolle", phone: "085 079 1879", lat: 52.52, lng: 6.1, latMin: 52.35, latMax: 52.75, lngMin: 5.8, lngMax: 6.7 },
  // Overijssel - Almelo
  { name: "HAP Almelo", phone: "088 588 0588", lat: 52.36, lng: 6.66, latMin: 52.25, latMax: 52.5, lngMin: 6.5, lngMax: 6.85 },
  // Flevoland (Medrie)
  { name: "Spoedpost Flevoland", phone: "085 079 1879", lat: 52.37, lng: 5.47, latMin: 52.15, latMax: 52.65, lngMin: 5.2, lngMax: 5.75 },
  // Gelderland - Nijmegen
  { name: "HAP Nijmegen", phone: "024 352 3579", lat: 51.84, lng: 5.87, latMin: 51.7, latMax: 51.95, lngMin: 5.6, lngMax: 6.1 },
  // Gelderland - Tiel
  { name: "HAP Gelders Rivierenland", phone: "085 580 1100", lat: 51.89, lng: 5.43, latMin: 51.8, latMax: 51.98, lngMin: 5.15, lngMax: 5.65 },
  // Utrecht - Leidsche Rijn/Maarssen/Woerden
  { name: "HAP Noordwest-Utrecht", phone: "088 130 9620", lat: 52.1, lng: 5.05, latMin: 52.0, latMax: 52.2, lngMin: 4.85, lngMax: 5.2 },
  // Noord-Holland - Amsterdam
  { name: "HAP Amsterdam", phone: "088 003 0600", lat: 52.37, lng: 4.9, latMin: 52.28, latMax: 52.44, lngMin: 4.75, lngMax: 5.05 },
  // Noord-Holland - Zaandam
  { name: "HAP Zaanstreek", phone: "075 653 3000", lat: 52.44, lng: 4.83, latMin: 52.42, latMax: 52.52, lngMin: 4.72, lngMax: 4.92 },
  // Noord-Holland - Purmerend
  { name: "Spoedpost Waterland", phone: "0299 313 233", lat: 52.51, lng: 4.96, latMin: 52.45, latMax: 52.58, lngMin: 4.88, lngMax: 5.1 },
  // Zuid-Holland - Rotterdam
  { name: "HAP Rijnmond", phone: "010 290 9888", lat: 51.92, lng: 4.48, latMin: 51.82, latMax: 52.0, lngMin: 4.2, lngMax: 4.65 },
  // Zuid-Holland - Den Haag
  { name: "Hadoks Acute Zorg", phone: "070 346 9669", lat: 52.07, lng: 4.3, latMin: 51.98, latMax: 52.15, lngMin: 4.15, lngMax: 4.45 },
  // Zuid-Holland - Leiden
  { name: "HAP De Limes", phone: "088 427 4700", lat: 52.16, lng: 4.49, latMin: 52.1, latMax: 52.25, lngMin: 4.35, lngMax: 4.6 },
  // Zuid-Holland - Dordrecht
  { name: "HAP Drechtsteden", phone: "078 202 0020", lat: 51.81, lng: 4.67, latMin: 51.73, latMax: 51.88, lngMin: 4.5, lngMax: 4.85 },
  // Noord-Brabant - Eindhoven/Helmond
  { name: "HAP Oost-Brabant", phone: "088 876 5151", lat: 51.44, lng: 5.48, latMin: 51.3, latMax: 51.55, lngMin: 5.25, lngMax: 5.75 },
  // Noord-Brabant - Den Bosch/Uden
  { name: "HAP Oost-Brabant Noord", phone: "088 876 5050", lat: 51.7, lng: 5.3, latMin: 51.55, latMax: 51.82, lngMin: 5.1, lngMax: 5.65 },
  // Limburg - Venlo/Venray
  { name: "HAP Noord-Limburg", phone: "0900 8818", lat: 51.37, lng: 6.17, latMin: 51.2, latMax: 51.55, lngMin: 5.9, lngMax: 6.35 },
  // Limburg - Roermond
  { name: "HAP Midden-Limburg Roermond", phone: "0475 771 771", lat: 51.19, lng: 5.99, latMin: 51.1, latMax: 51.3, lngMin: 5.8, lngMax: 6.2 },
  // Limburg - Weert
  { name: "HAP Midden-Limburg Weert", phone: "0495 677 677", lat: 51.25, lng: 5.71, latMin: 51.15, latMax: 51.35, lngMin: 5.5, lngMax: 5.85 },
  // Limburg - Heerlen
  { name: "HAP Oost-Zuid-Limburg", phone: "045 577 8844", lat: 50.89, lng: 5.98, latMin: 50.8, latMax: 51.0, lngMin: 5.8, lngMax: 6.15 },
  // Limburg - Maastricht
  { name: "HAP Maastricht", phone: "043 750 0123", lat: 50.85, lng: 5.69, latMin: 50.75, latMax: 50.95, lngMin: 5.5, lngMax: 5.85 },
  // Zeeland - Middelburg
  { name: "HAP Walcheren", phone: "088 022 8135", lat: 51.5, lng: 3.61, latMin: 51.4, latMax: 51.58, lngMin: 3.4, lngMax: 3.8 },
  // Zeeland - Goes
  { name: "HAP De Bevelanden", phone: "088 022 8125", lat: 51.5, lng: 3.89, latMin: 51.38, latMax: 51.58, lngMin: 3.75, lngMax: 4.1 },
  // Zeeland - Zierikzee
  { name: "HAP Schouwen-Duiveland", phone: "088 022 8145", lat: 51.65, lng: 3.92, latMin: 51.55, latMax: 51.75, lngMin: 3.7, lngMax: 4.1 },
  // Zeeland - Terneuzen
  { name: "HAP Zeeuws-Vlaanderen", phone: "0115 643 000", lat: 51.34, lng: 3.83, latMin: 51.2, latMax: 51.45, lngMin: 3.35, lngMax: 4.2 },
];

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

function findNearestHap(lat: number, lng: number): HapRegion | null {
  // First try: find regions whose bounding box contains the user
  const candidates = HAP_REGIONS.filter(
    (r) => lat >= r.latMin && lat <= r.latMax && lng >= r.lngMin && lng <= r.lngMax
  );

  if (candidates.length === 1) return candidates[0];

  // Multiple matches or none: pick nearest by center distance
  const pool = candidates.length > 0 ? candidates : HAP_REGIONS;
  let best: HapRegion | null = null;
  let bestDist = Infinity;
  for (const r of pool) {
    const d = haversineKm({ lat, lng }, { lat: r.lat, lng: r.lng });
    if (d < bestDist) {
      bestDist = d;
      best = r;
    }
  }

  // If no bounding box matched, only return if within 50km
  if (candidates.length === 0 && bestDist > 50) return null;
  return best;
}

export default function HapBanner() {
  const t = useTranslations("hapBanner");
  const [dismissed, setDismissed] = useState(true); // hidden by default until we detect
  const [hap, setHap] = useState<HapRegion | null>(null);
  const [detecting, setDetecting] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  // Sync banner height to CSS custom property so page content can offset correctly
  useEffect(() => {
    const el = bannerRef.current;
    if (!el) {
      document.documentElement.style.setProperty("--hap-banner-h", "0px");
      return;
    }
    const sync = () => {
      const h = dismissed ? 0 : el.offsetHeight;
      document.documentElement.style.setProperty("--hap-banner-h", `${h}px`);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => { ro.disconnect(); document.documentElement.style.setProperty("--hap-banner-h", "0px"); };
  }, [dismissed]);

  useEffect(() => {
    // Check if user already dismissed this session
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("hapBannerDismissed") === "1") {
      return;
    }
    setDismissed(false);

    // Auto-detect location silently (only if permission already granted)
    if (!navigator.geolocation || !("permissions" in navigator)) return;

    // Try to detect location — works if permission is already granted
    // or if the user allows it when prompted via the search bar
    const tryDetect = () => {
      setDetecting(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const nearest = findNearestHap(pos.coords.latitude, pos.coords.longitude);
          setHap(nearest);
          setDetecting(false);
        },
        () => setDetecting(false),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300_000 }
      );
    };

    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((status) => {
        if (status.state === "granted") {
          tryDetect();
        }
        // Listen for permission change (user grants via location prompt elsewhere)
        status.addEventListener("change", () => {
          if (status.state === "granted" && !hap) {
            tryDetect();
          }
        });
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    setDismissed(true);
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("hapBannerDismissed", "1");
    }
  };

  if (dismissed) return null;

  return (
    <div ref={bannerRef} className="bg-[#1d1d1b] text-white">
      <div className="mx-auto flex w-full max-w-[1400px] items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-10">
        {/* Phone icon */}
        <span className="hidden shrink-0 sm:flex h-6 w-6 items-center justify-center">
          <svg
            className="h-4 w-4 text-[#7ab0ff]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
          </svg>
        </span>

        {/* Text */}
        <p className="min-w-0 flex-1 text-[12px] leading-relaxed text-white/90 sm:text-[13px]">
          {t("message")}{" "}
          {detecting && (
            <span className="inline-flex items-center gap-1 text-white/50">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white/50" />
              {t("detecting")}
            </span>
          )}
          {hap && (
            <>
              <a
                href={`tel:${hap.phone.replace(/\s/g, "")}`}
                className="inline-flex items-center gap-1 font-semibold text-[#7ab0ff] underline decoration-[#7ab0ff]/30 underline-offset-2 transition-colors hover:text-white hover:decoration-white/50"
              >
                {hap.name}: {hap.phone}
              </a>
            </>
          )}
          {!hap && !detecting && (
            <span className="font-medium text-white/70">
              {t("generic")}
            </span>
          )}
          <span className="text-white/40"> · </span>
          <span className="text-white/60">{t("emergency")}</span>
        </p>

        {/* Dismiss */}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Sluiten"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
