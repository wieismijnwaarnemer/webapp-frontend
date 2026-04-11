import Link from "next/link";
import { notFound } from "next/navigation";
import {
  allePraktijken,
  getPraktijkDetails,
  type DayKey,
  type PraktijkDetails,
  type WeekSchedule,
} from "@/data/praktijk-extras";
import SiteNavbar from "@/components/SiteNavbar";
import SiteFooter from "@/components/SiteFooter";
import PraktijkStatusBadge from "@/components/PraktijkStatusBadge";

const DAY_LABELS: Record<DayKey, string> = {
  ma: "Maandag",
  di: "Dinsdag",
  wo: "Woensdag",
  do: "Donderdag",
  vr: "Vrijdag",
  za: "Zaterdag",
  zo: "Zondag",
};
const DAY_SHORT: Record<DayKey, string> = {
  ma: "Ma",
  di: "Di",
  wo: "Wo",
  do: "Do",
  vr: "Vr",
  za: "Za",
  zo: "Zo",
};
const DAY_ORDER: DayKey[] = ["ma", "di", "wo", "do", "vr", "za", "zo"];

function CompactWeekStrip({ schedule }: { schedule: WeekSchedule }) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {DAY_ORDER.map((d) => {
        const h = schedule[d];
        const closed = h === null || h === undefined;
        return (
          <div
            key={d}
            className={`flex flex-col items-center gap-0.5 rounded-lg px-1 py-2 ${
              closed ? "bg-gray-50" : "bg-[#f0faf4]"
            }`}
          >
            <span
              className={`text-[10px] font-semibold uppercase tracking-wide ${
                closed ? "text-gray-400" : "text-[#1f8c4e]"
              }`}
            >
              {DAY_SHORT[d]}
            </span>
            <span
              className={`text-[9.5px] tabular-nums leading-tight ${
                closed ? "text-gray-300" : "font-medium text-gray-700"
              }`}
            >
              {closed ? "—" : h!.van}
            </span>
            <span
              className={`text-[9.5px] tabular-nums leading-tight ${
                closed ? "text-gray-300" : "font-medium text-gray-700"
              }`}
            >
              {closed ? "" : h!.tot}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function WeekScheduleView({
  schedule,
  accent = "neutral",
}: {
  schedule: WeekSchedule;
  accent?: "neutral" | "green";
}) {
  const bar =
    accent === "green"
      ? "bg-[#1f8c4e]"
      : "bg-gray-300";
  return (
    <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-gray-100 sm:grid-cols-2">
      {DAY_ORDER.map((d) => {
        const hours = schedule[d];
        const closed = hours === null || hours === undefined;
        return (
          <div
            key={d}
            className="flex items-center justify-between gap-3 bg-white px-4 py-2.5"
          >
            <dt className="flex items-center gap-2 text-[12.5px] font-medium text-gray-700">
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  closed ? "bg-gray-300" : bar
                }`}
              />
              {DAY_LABELS[d]}
            </dt>
            <dd
              className={`text-[12.5px] tabular-nums ${
                closed ? "text-gray-400" : "font-semibold text-gray-900"
              }`}
            >
              {closed ? "Gesloten" : `${hours!.van} – ${hours!.tot}`}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

export function generateStaticParams() {
  return allePraktijken.map((p) => ({ id: p.id }));
}

function mapsDirectionsUrl(p: PraktijkDetails) {
  return `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&destination_place_id=${encodeURIComponent(
    `${p.naam} ${p.straat} ${p.postcode} ${p.plaats}`
  )}`;
}

function cleanTel(tel?: string) {
  if (!tel || tel === "-") return null;
  return tel.replace(/\s/g, "");
}

function PraktijkLogo({
  praktijk,
  className,
  iconClassName,
}: {
  praktijk: PraktijkDetails;
  className: string;
  iconClassName: string;
}) {
  if (praktijk.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={praktijk.logo}
        alt={`${praktijk.naam} logo`}
        className={`${className} object-cover`}
      />
    );
  }
  return (
    <div
      className={`${className} flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100`}
    >
      <svg
        className={iconClassName}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 22V12h6v10" />
      </svg>
    </div>
  );
}

export default async function PraktijkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const praktijk = getPraktijkDetails(id);
  if (!praktijk) notFound();

  const waarnemers: PraktijkDetails[] = (praktijk.waarnemers ?? [])
    .map((wid) => getPraktijkDetails(wid))
    .filter((p): p is PraktijkDetails => Boolean(p));

  const eersteWaarnemer = waarnemers[0];
  const reserves = waarnemers.slice(1);
  const praktijkTel = cleanTel(praktijk.telefoon);

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <SiteNavbar />

      <main className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-[96px] sm:px-6 sm:pb-20 sm:pt-[112px] lg:px-10 lg:pt-[120px]">
        {/* Terug naar zoeken */}
        <Link
          href="/"
          className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-[12.5px] font-medium text-gray-700 shadow-[0_1px_2px_rgba(15,23,40,0.04)] transition-all hover:-translate-x-0.5 hover:border-gray-300 hover:bg-gray-50 sm:mb-6 sm:text-[13px]"
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Terug naar zoeken
        </Link>

        {/* Praktijk hoofd-card */}
        <section className="relative overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-[0_8px_32px_-8px_rgba(15,23,40,0.1)]">
          {/* Subtiele gradient header */}
          <div className="relative h-28 bg-[linear-gradient(135deg,#eef4ff_0%,#f7faff_45%,#fef4f1_100%)] sm:h-32">
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.35]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 18% 30%, #3585ff15, transparent 55%), radial-gradient(circle at 82% 70%, #1f8c4e12, transparent 55%)",
              }}
            />
            <div className="absolute right-5 top-5 rounded-full bg-white/90 shadow-[0_2px_8px_rgba(15,23,40,0.08)] backdrop-blur-sm sm:right-7 sm:top-7">
              {praktijk.weekSchedule ? (
                <PraktijkStatusBadge schedule={praktijk.weekSchedule} />
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-gray-500">
                  <span className="h-2 w-2 rounded-full bg-gray-400" />
                  Openingstijden onbekend
                </span>
              )}
            </div>
          </div>

          {/* Content — logo drijft over de gradient */}
          <div className="relative px-6 pb-7 sm:px-8 sm:pb-8">
            <div className="-mt-14 flex flex-col gap-5 sm:-mt-16 sm:flex-row sm:items-end sm:gap-6">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-[0_8px_24px_-6px_rgba(15,23,40,0.15)] sm:h-28 sm:w-28">
                <PraktijkLogo
                  praktijk={praktijk}
                  className="h-full w-full"
                  iconClassName="h-10 w-10 text-gray-300"
                />
              </div>
              <div className="min-w-0 flex-1 sm:pb-2">
                <h1 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-gray-900 sm:text-[30px]">
                  {praktijk.naam}
                </h1>
                <p className="mt-1.5 flex items-start gap-1.5 text-[14px] leading-snug text-gray-500 sm:text-[15px]">
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {praktijk.straat}, {praktijk.postcode} {praktijk.plaats}
                </p>
              </div>
            </div>

            {/* Contact tags */}
            <div className="mt-5 flex flex-wrap gap-2">
              {praktijkTel && (
                <a
                  href={`tel:${praktijkTel}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
                >
                  <svg
                    className="h-3.5 w-3.5 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
                  </svg>
                  {praktijk.telefoon}
                </a>
              )}
              {praktijk.email && praktijk.email !== "-" && (
                <a
                  href={`mailto:${praktijk.email}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
                >
                  <svg
                    className="h-3.5 w-3.5 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <path d="M22 6l-10 7L2 6" />
                  </svg>
                  {praktijk.email}
                </a>
              )}
              {praktijk.website && (
                <a
                  href={praktijk.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
                >
                  <svg
                    className="h-3.5 w-3.5 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  Website
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Waarnemers */}
        {waarnemers.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-black/[0.06] bg-white p-6 text-center text-[14px] text-gray-500 sm:mt-10">
            Deze praktijk heeft (nog) geen waarnemers opgegeven.
          </section>
        ) : (
          <>
            {/* Eerstvolgende waarnemer — prominent hero */}
            <section className="mt-10 sm:mt-12">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1f8c4e] text-white shadow-[0_4px_12px_-2px_rgba(31,140,78,0.4)]">
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#1f8c4e]">
                    Eerstvolgende waarnemer
                  </p>
                  <p className="text-[12px] text-gray-500">
                    Ga nu direct naar deze praktijk.
                  </p>
                </div>
              </div>

              {(() => {
                const w = eersteWaarnemer;
                const telClean = cleanTel(w.telefoon);
                const mapsUrl = mapsDirectionsUrl(w);
                return (
                  <div className="relative overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-[0_8px_32px_-8px_rgba(15,23,40,0.1)]">
                    {/* Subtiele groene gradient header — zelfde stijl als hoofd-card */}
                    <div className="relative h-28 bg-[linear-gradient(135deg,#e8f7ee_0%,#f5fbf7_45%,#eef4ff_100%)] sm:h-32">
                      <div
                        aria-hidden
                        className="absolute inset-0 opacity-[0.35]"
                        style={{
                          backgroundImage:
                            "radial-gradient(circle at 18% 30%, #1f8c4e18, transparent 55%), radial-gradient(circle at 82% 70%, #3585ff12, transparent 55%)",
                        }}
                      />
                      {w.weekSchedule && (
                        <div className="absolute right-5 top-5 rounded-full bg-white/90 shadow-[0_2px_8px_rgba(15,23,40,0.08)] backdrop-blur-sm sm:right-7 sm:top-7">
                          <PraktijkStatusBadge schedule={w.weekSchedule} />
                        </div>
                      )}
                    </div>

                    {/* Content — logo drijft over gradient */}
                    <div className="relative px-6 pb-7 sm:px-8 sm:pb-8">
                      <div className="-mt-14 flex flex-col gap-5 sm:-mt-16 sm:flex-row sm:items-end sm:gap-6">
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-[0_8px_24px_-6px_rgba(15,23,40,0.15)] sm:h-28 sm:w-28">
                          <PraktijkLogo
                            praktijk={w}
                            className="h-full w-full"
                            iconClassName="h-10 w-10 text-gray-300"
                          />
                        </div>
                        <div className="min-w-0 flex-1 sm:pb-2">
                          <h3 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-gray-900 sm:text-[30px]">
                            {w.naam}
                          </h3>
                          <p className="mt-1.5 flex items-start gap-1.5 text-[14px] leading-snug text-gray-500 sm:text-[15px]">
                            <svg
                              className="mt-0.5 h-4 w-4 shrink-0 text-gray-400"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            {w.straat}, {w.postcode} {w.plaats}
                          </p>
                        </div>
                      </div>

                      {/* Contact tags */}
                      {(telClean || (w.email && w.email !== "-") || w.website) && (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {telClean && (
                            <a
                              href={`tel:${telClean}`}
                              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
                            >
                              <svg
                                className="h-3.5 w-3.5 text-gray-400"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
                              </svg>
                              {w.telefoon}
                            </a>
                          )}
                          {w.email && w.email !== "-" && (
                            <a
                              href={`mailto:${w.email}`}
                              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
                            >
                              <svg
                                className="h-3.5 w-3.5 text-gray-400"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <path d="M22 6l-10 7L2 6" />
                              </svg>
                              {w.email}
                            </a>
                          )}
                          {w.website && (
                            <a
                              href={w.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
                            >
                              <svg
                                className="h-3.5 w-3.5 text-gray-400"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                              </svg>
                              Website
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {w.weekSchedule && (
                      <div className="border-t border-gray-100 px-6 py-6 sm:px-8">
                        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-500">
                          Openingstijden
                        </p>
                        <WeekScheduleView
                          schedule={w.weekSchedule}
                          accent="green"
                        />
                      </div>
                    )}

                    {/* Primaire acties */}
                    <div className="flex flex-col gap-2 border-t border-gray-100 bg-[#fafbfc] p-4 sm:flex-row sm:gap-3 sm:p-5">
                      {telClean && (
                        <a
                          href={`tel:${telClean}`}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1f8c4e] px-5 py-3.5 text-[14px] font-semibold text-white transition-all hover:bg-[#176f3d] hover:shadow-[0_8px_20px_-6px_rgba(31,140,78,0.5)]"
                        >
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
                          </svg>
                          Bel {w.telefoon}
                        </a>
                      )}
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-[14px] font-semibold text-gray-800 transition-all hover:border-gray-300 hover:bg-gray-50"
                      >
                        <svg
                          className="h-4 w-4 text-[#3585ff]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polygon points="3 11 22 2 13 21 11 13 3 11" />
                        </svg>
                        Route via Google Maps
                      </a>
                    </div>
                  </div>
                );
              })()}
            </section>

            {/* Reserves */}
            {reserves.length > 0 && (
              <section className="mt-12 sm:mt-14">
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-gray-900 sm:text-[17px]">
                      Ook gesloten? Probeer dan:
                    </h2>
                    <p className="mt-1 text-[13px] text-gray-500">
                      Reserve-waarnemers in volgorde van voorkeur.
                    </p>
                  </div>
                </div>

                <div className="-mx-4 overflow-x-auto px-4 pb-3 pt-2 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10 [scrollbar-width:thin]">
                  <ol className="flex snap-x snap-mandatory items-start gap-4">
                    {reserves.map((w, i) => {
                      const rank = i + 2;
                      const telClean = cleanTel(w.telefoon);
                      const mapsUrl = mapsDirectionsUrl(w);
                      return (
                        <li
                          key={w.id}
                          className="group flex shrink-0 snap-start basis-[85%] flex-col self-start overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_3px_rgba(15,23,40,0.03)] transition-all hover:border-gray-200 hover:shadow-[0_12px_32px_-12px_rgba(15,23,40,0.12)] sm:basis-[calc((100%-1rem)/2)] xl:basis-[calc((100%-2rem)/3)]"
                        >
                          {/* Rank label strip */}
                          <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-[#fafbfc] px-5 py-2.5 sm:px-6">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                              Reserve {rank - 1}
                            </span>
                            {w.weekSchedule && (
                              <PraktijkStatusBadge
                                schedule={w.weekSchedule}
                                size="sm"
                              />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 p-5 sm:p-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <p className="text-[16px] font-semibold leading-tight tracking-[-0.01em] text-gray-900 sm:text-[17px]">
                                  {w.naam}
                                </p>
                                {w.email && w.email !== "-" && (
                                  <a
                                    href={`mailto:${w.email}`}
                                    className="mt-1.5 inline-flex items-center gap-1.5 truncate text-[12.5px] text-gray-500 transition-colors hover:text-[#3585ff]"
                                  >
                                    <svg
                                      className="h-3 w-3 shrink-0 text-gray-400"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth={2}
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                      <path d="M22 6l-10 7L2 6" />
                                    </svg>
                                    <span className="truncate">{w.email}</span>
                                  </a>
                                )}
                              </div>
                              <p className="flex shrink-0 items-start gap-1.5 text-right text-[12px] leading-snug text-gray-500">
                                <svg
                                  className="mt-0.5 h-3 w-3 shrink-0 text-gray-400"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                  <circle cx="12" cy="10" r="3" />
                                </svg>
                                <span>
                                  {w.straat}
                                  <br />
                                  {w.postcode} {w.plaats}
                                </span>
                              </p>
                            </div>

                            {/* Acties */}
                            <div className="mt-5 flex gap-2">
                              {telClean && (
                                <a
                                  href={`tel:${telClean}`}
                                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[12.5px] font-semibold text-gray-700 transition-all hover:border-[#1f8c4e] hover:bg-[#1f8c4e] hover:text-white"
                                >
                                  <svg
                                    className="h-3.5 w-3.5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2.2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
                                  </svg>
                                  Bel
                                </a>
                              )}
                              <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[12.5px] font-semibold text-gray-700 transition-all hover:border-[#3585ff] hover:bg-[#3585ff] hover:text-white"
                              >
                                <svg
                                  className="h-3.5 w-3.5"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2.2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polygon points="3 11 22 2 13 21 11 13 3 11" />
                                </svg>
                                Route
                              </a>
                            </div>
                          </div>

                          {w.weekSchedule && (
                            <div className="border-t border-gray-100 bg-[#fafbfc] px-5 py-4 sm:px-6">
                              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                                Deze week
                              </p>
                              <CompactWeekStrip schedule={w.weekSchedule} />
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </section>
            )}
          </>
        )}

        {/* Spoed-alert */}
        <section className="mt-10 sm:mt-14">
          <div className="overflow-hidden rounded-2xl border border-[#dc2626]/15 bg-white shadow-[0_1px_3px_rgba(15,23,40,0.04)]">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
              <div className="flex items-center gap-4 sm:flex-1">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fef2f2] text-[#dc2626]">
                  <svg
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-gray-900 sm:text-[16px]">
                    Spoed? Bel direct <span className="text-[#dc2626]">112</span>
                  </p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-gray-500">
                    Buiten kantooruren belt u de huisartsenpost in uw regio.
                  </p>
                </div>
              </div>
              <a
                href="tel:112"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#dc2626] px-5 py-3 text-[14px] font-semibold text-white transition-all hover:bg-[#b91c1c] hover:shadow-[0_8px_20px_-6px_rgba(220,38,38,0.5)]"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
                </svg>
                Bel 112
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
