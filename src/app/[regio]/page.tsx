import { notFound } from "next/navigation";
import Link from "next/link";
import {
  regios,
  getPracticesByRegio,
  getActiveSchedule,
} from "@/lib/mock-data";

export function generateStaticParams() {
  return regios.map((r) => ({ regio: r.slug }));
}

export default function RegioPage({ params }: { params: { regio: string } }) {
  const regio = regios.find((r) => r.slug === params.regio);
  if (!regio) return notFound();

  const practices = getPracticesByRegio(regio.slug);

  return (
    <div className="min-h-screen bg-[#f7fbff]">
      <div className="border-b border-[#e6ebf3] bg-white px-6 py-5">
        <div className="mx-auto max-w-3xl">
          <Link href="/" className="text-[15px] font-medium text-[#3585ff]">
            ← Terug naar zoeken
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-[36px] font-semibold tracking-[-0.04em] text-[#0a0c10]">
          Huisartsen in {regio.naam}
        </h1>
        <p className="mt-2 text-[17px] text-[#4c5361]">
          {practices.length} praktijken in {regio.naam}, {regio.provincie}
        </p>

        <div className="mt-8 space-y-3">
          {practices.map((practice) => {
            const schedule = getActiveSchedule(practice.id);

            return (
              <div
                key={practice.id}
                className="rounded-xl border border-[#e6ebf3] bg-white p-5 transition hover:border-[#d7e7ff]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-[18px] font-semibold text-[#101114]">
                      {practice.naam}
                    </h2>
                    <p className="mt-1 text-[15px] text-[#4c5361]">
                      {practice.huisarts} &middot; {practice.adres}, {practice.postcode}
                    </p>
                    <p className="text-[14px] text-[#9aa5b4]">{practice.telefoon}</p>
                  </div>
                  {schedule ? (
                    <span className="shrink-0 rounded-lg bg-amber-50 px-3 py-1.5 text-[13px] font-semibold text-amber-700">
                      Waarnemer actief
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-lg bg-green-50 px-3 py-1.5 text-[13px] font-semibold text-green-700">
                      Aanwezig
                    </span>
                  )}
                </div>

                {schedule && (
                  <div className="mt-3 rounded-lg bg-amber-50 px-4 py-3">
                    <p className="text-[14px] text-amber-800">
                      <span className="font-semibold">Waargenomen door:</span>{" "}
                      {schedule.waarnemerNaam} ({schedule.waarnemerPraktijk})
                    </p>
                    <p className="mt-0.5 text-[13px] text-amber-600">
                      {schedule.datumVan} t/m {schedule.datumTot}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
