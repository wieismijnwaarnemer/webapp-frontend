import Link from "next/link";
import SiteNavbar from "@/components/SiteNavbar";
import SiteFooter from "@/components/SiteFooter";
import { praktijken } from "@/data/praktijken";

export const metadata = {
  title: "Regio's | Wieismijnwaarnemer",
  description:
    "Bekijk in welke regio's Wieismijnwaarnemer al actief is. We breiden continu uit door heel Nederland.",
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function RegiosPage() {
  const counts: Record<string, number> = {};
  for (const p of praktijken) {
    counts[p.stad] = (counts[p.stad] ?? 0) + 1;
  }
  const steden = Object.keys(counts).sort((a, b) => a.localeCompare(b, "nl"));
  const totaalPraktijken = praktijken.length;

  return (
    <>
      <SiteNavbar />

      <main
        className="bg-white"
        style={{ paddingTop: "calc(var(--hap-banner-h, 0px) + 76px)" }}
      >
        {/* Hero */}
        <section className="mx-auto w-full max-w-[1400px] px-4 pb-12 pt-14 sm:px-6 sm:pb-14 sm:pt-20 lg:px-10 lg:pb-16 lg:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#3585ff]">
              Regio&apos;s
            </p>
            <h1 className="mt-4 text-[34px] font-semibold leading-[1.1] tracking-[-0.025em] text-gray-900 sm:text-[44px] md:text-[52px]">
              Waar u ons{" "}
              <span className="text-[#7ab0ff]">vindt.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-gray-500 sm:text-[18px]">
              {totaalPraktijken} deelnemende praktijken in {steden.length}{" "}
              steden. Kies uw plaats om de waarnemers te zien.
            </p>
          </div>
        </section>

        {/* Steden grid */}
        <section className="pb-16 sm:pb-20 lg:pb-24">
          <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-10">
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
              {steden.map((stad) => (
                <li key={stad}>
                  <Link
                    href={`/${slugify(stad)}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 transition-all hover:border-[#3585ff] hover:bg-[#f6faff] sm:px-5 sm:py-3.5"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <svg
                        className="h-3.5 w-3.5 shrink-0 text-[#3585ff]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span className="truncate text-[14px] font-medium text-gray-900 sm:text-[15px]">
                        {stad}
                      </span>
                    </span>
                    <span className="shrink-0 text-[12px] font-medium text-gray-400 sm:text-[13px]">
                      {counts[stad]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Groei CTA */}
        <section className="bg-[#f7f9fc]">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#3585ff]">
                We groeien
              </p>
              <h2 className="mt-3 text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-gray-900 sm:text-[34px]">
                Binnenkort in{" "}
                <span className="text-[#7ab0ff]">heel Nederland.</span>
              </h2>
              <p className="mx-auto mt-5 text-[16px] leading-relaxed text-gray-600 sm:text-[17px]">
                Wieismijnwaarnemer breidt continu uit. Binnenkort beschikbaar
                in meer regio&apos;s door heel Nederland.
              </p>
              <p className="mx-auto mt-3 text-[16px] leading-relaxed text-gray-600 sm:text-[17px]">
                Staat uw stad er nog niet bij? Meld uw praktijk aan — dan
                voegen we uw regio als eerste toe.
              </p>

              <div className="mt-8">
                <a
                  href="/aanmelden"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1d1d1b] px-6 py-3.5 text-[14px] font-semibold text-white transition-colors hover:brightness-125 sm:text-[15px]"
                >
                  Praktijk aanmelden
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
