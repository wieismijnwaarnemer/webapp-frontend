import SiteNavbar from "@/components/SiteNavbar";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "Hulpcentrum | Wieismijnwaarnemer",
  description:
    "Antwoorden op de meestgestelde vragen over Wieismijnwaarnemer — voor patiënten en huisartsenpraktijken.",
};

const faqs: { vraag: string; antwoord: React.ReactNode }[] = [
  {
    vraag: "Hoe vind ik mijn waarnemer?",
    antwoord:
      "Typ de naam van uw huisartsenpraktijk in de zoekbalk op de homepage. U ziet direct welke praktijk vandaag waarneemt, inclusief adres en telefoonnummer.",
  },
  {
    vraag: "Mijn praktijk staat er niet bij. Wat nu?",
    antwoord: (
      <>
        We zijn continu bezig met uitbreiden. Staat uw praktijk er nog niet
        bij?{" "}
        <a
          href="/contact"
          className="font-semibold text-[#3585ff] underline-offset-4 hover:underline"
        >
          Neem contact op
        </a>{" "}
        of{" "}
        <a
          href="/aanmelden"
          className="font-semibold text-[#3585ff] underline-offset-4 hover:underline"
        >
          meld uw praktijk direct aan
        </a>
        . In de tussentijd kunt u de huisartsenpost in uw regio bellen.
      </>
    ),
  },
  {
    vraag: "Is de informatie altijd actueel?",
    antwoord:
      "Ja, de waarneeminformatie wordt automatisch bijgehouden via onze koppeling met de deelnemende praktijken. Bij twijfel kunt u altijd direct contact opnemen met de praktijk.",
  },
  {
    vraag: "Hoe kan mijn praktijk zich aanmelden?",
    antwoord: (
      <>
        Ga naar de{" "}
        <a
          href="/aanmelden"
          className="font-semibold text-[#3585ff] underline-offset-4 hover:underline"
        >
          aanmeldpagina
        </a>{" "}
        en vul het formulier in. Aansluiting is gratis en het kost uw
        praktijk minimale tijd.
      </>
    ),
  },
  {
    vraag: "Komt mijn regio er ook bij?",
    antwoord:
      "We breiden elke week uit naar nieuwe steden en regio's. Meldt u uw praktijk aan, dan zorgen we dat uw regio zo snel mogelijk wordt toegevoegd.",
  },
  {
    vraag: "Wat doe ik bij spoed?",
    antwoord: (
      <>
        Bij spoed belt u altijd <span className="font-semibold">112</span>.
        Voor dringende maar niet-levensbedreigende klachten kunt u de
        huisartsenpost in uw regio bellen.
      </>
    ),
  },
  {
    vraag: "Is dit platform gratis voor patiënten?",
    antwoord:
      "Ja, Wieismijnwaarnemer is volledig gratis voor patiënten. U heeft geen account nodig.",
  },
];

export default function HelpcentrumPage() {
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
              Hulpcentrum
            </p>
            <h1 className="mt-4 text-[34px] font-semibold leading-[1.1] tracking-[-0.025em] text-gray-900 sm:text-[44px] md:text-[52px]">
              Veelgestelde{" "}
              <span className="text-[#7ab0ff]">vragen.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-gray-500 sm:text-[18px]">
              Een kort overzicht van de meestgestelde vragen over
              Wieismijnwaarnemer.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="pb-16 sm:pb-20 lg:pb-24">
          <div className="mx-auto w-full max-w-[760px] px-4 sm:px-6 lg:px-0">
            <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white">
              {faqs.map(({ vraag, antwoord }) => (
                <li key={vraag}>
                  <details className="group">
                    <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-5 text-left transition-colors hover:bg-gray-50 sm:px-6 sm:py-6 [&::-webkit-details-marker]:hidden">
                      <span className="text-[16px] font-semibold text-gray-900 sm:text-[17px]">
                        {vraag}
                      </span>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[#3585ff] transition-transform duration-200 group-open:rotate-45">
                        <svg
                          className="h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.6}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </span>
                    </summary>
                    <div className="px-5 pb-5 pt-0 text-[15px] leading-relaxed text-gray-600 sm:px-6 sm:pb-6 sm:text-[16px]">
                      {antwoord}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#f7f9fc]">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-[24px] font-semibold leading-[1.2] tracking-[-0.02em] text-gray-900 sm:text-[28px]">
                Staat uw vraag er niet bij?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-gray-600 sm:text-[16px]">
                We helpen u graag verder. Stuur ons een bericht en we
                reageren zo snel mogelijk.
              </p>
              <div className="mt-7">
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1d1d1b] px-6 py-3.5 text-[14px] font-semibold text-white transition-colors hover:brightness-125 sm:text-[15px]"
                >
                  Naar contact
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
