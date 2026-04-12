import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { praktijken } from "@/data/praktijken";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const steden = Array.from(new Set(praktijken.map((p) => p.stad))).sort(
  (a, b) => a.localeCompare(b, "nl")
);

export function generateStaticParams() {
  return steden.map((stad) => ({ regio: slugify(stad) }));
}

export default async function RegioPage({
  params,
}: {
  params: Promise<{ regio: string; locale: string }>;
}) {
  const { regio } = await params;
  const t = await getTranslations("regio");
  const tHome = await getTranslations("home");

  const stad = steden.find((s) => slugify(s) === regio);
  if (!stad) return notFound();

  const lijst = praktijken.filter((p) => p.stad === stad);

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6 lg:px-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#3585ff] hover:underline"
          >
            {t("backToSearch")}
          </Link>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 lg:px-10">
        <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-gray-900 sm:text-[32px] md:text-[36px]">
          {t("title")} <span className="text-[#7ab0ff]">{stad}.</span>
        </h1>
        <p className="mt-3 text-[15px] text-gray-500 sm:text-base">
          {t("count", {
            count: lijst.length,
            label:
              lijst.length === 1
                ? tHome("practiceSingular")
                : tHome("practicePlural"),
          })}
        </p>

        <ul className="mt-10 divide-y divide-gray-100 border-y border-gray-100">
          {lijst.map((p) => (
            <li key={p.id} className="flex items-start gap-4 py-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eef4ff] text-[#3585ff]">
                <svg
                  className="h-[18px] w-[18px]"
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
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[16px] font-semibold text-gray-900 sm:text-[17px]">
                  {p.naam}
                </h2>
                <p className="mt-0.5 text-[13px] text-gray-500 sm:text-[14px]">
                  {p.straat}, {p.postcode} {p.plaats}
                </p>
                {(p.telefoon || p.openingstijden) && (
                  <p className="mt-1 text-[12px] text-gray-400 sm:text-[13px]">
                    {p.telefoon}
                    {p.telefoon && p.openingstijden ? " · " : ""}
                    {p.openingstijden}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
