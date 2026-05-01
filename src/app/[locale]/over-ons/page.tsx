import SiteNavbar from "@/components/SiteNavbar";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "Over ons | Wieismijnwaarnemer",
  description:
    "Wieismijnwaarnemer helpt patiënten in Nederland snel en eenvoudig te vinden welke huisarts waarneemt wanneer hun eigen praktijk gesloten is.",
};

export default function OverOnsPage() {
  return (
    <>
      <SiteNavbar />

      <main
        className="bg-white"
        style={{ paddingTop: "calc(var(--hap-banner-h, 0px) + 76px)" }}
      >
        {/* Hero */}
        <section className="mx-auto w-full max-w-[1400px] px-4 pb-14 pt-14 sm:px-6 sm:pb-16 sm:pt-20 lg:px-10 lg:pb-20 lg:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#3585ff]">
              Over ons
            </p>
            <h1 className="mt-4 text-[34px] font-semibold leading-[1.1] tracking-[-0.025em] text-gray-900 sm:text-[44px] md:text-[52px]">
              Snel weten wie er{" "}
              <span className="text-[#7ab0ff]">vandaag waarneemt.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-gray-500 sm:text-[18px]">
              Wieismijnwaarnemer helpt patiënten in Nederland snel en
              eenvoudig te vinden welke huisarts waarneemt wanneer hun eigen
              praktijk gesloten is.
            </p>
          </div>
        </section>

        {/* Inhoud */}
        <section className="pb-16 sm:pb-20 lg:pb-24">
          <div className="mx-auto w-full max-w-[760px] px-4 sm:px-6 lg:px-0">
            {/* Ons verhaal */}
            <div>
              <h2 className="text-[26px] font-semibold leading-[1.2] tracking-[-0.02em] text-gray-900 sm:text-[30px]">
                Ons verhaal
              </h2>
              <div className="mt-5 space-y-5 text-[16px] leading-relaxed text-gray-600 sm:text-[17px]">
                <p>
                  Iedereen kent het moment: u bent niet lekker, u belt uw
                  huisarts, en de praktijk is gesloten. Wie neemt dan waar?
                  Die vraag was vroeger onnodig moeilijk te beantwoorden.
                </p>
                <p>
                  Wieismijnwaarnemer is opgericht om daar verandering in te
                  brengen. Wij bouwen aan een landelijke, altijd actuele
                  database van waarnemende huisartsen — zodat patiënten
                  binnen seconden weten waar ze terecht kunnen.
                </p>
                <p>
                  Wij werken samen met huisartsenpraktijken door heel
                  Nederland om hun waarneeminformatie actueel en
                  toegankelijk te houden. Gratis voor patiënten, eenvoudig
                  voor praktijken.
                </p>
              </div>
            </div>

            {/* Onze missie */}
            <div className="mt-14 sm:mt-16">
              <h2 className="text-[26px] font-semibold leading-[1.2] tracking-[-0.02em] text-gray-900 sm:text-[30px]">
                Onze missie
              </h2>
              <p className="mt-5 text-[16px] leading-relaxed text-gray-600 sm:text-[17px]">
                Transparantie in de Nederlandse huisartsenzorg. Elke patiënt
                verdient direct antwoord op de vraag: wie helpt mij vandaag?
              </p>
            </div>

            {/* Groei */}
            <div className="mt-14 sm:mt-16">
              <h2 className="text-[26px] font-semibold leading-[1.2] tracking-[-0.02em] text-gray-900 sm:text-[30px]">
                Groei
              </h2>
              <div className="mt-5 space-y-5 text-[16px] leading-relaxed text-gray-600 sm:text-[17px]">
                <p>
                  We groeien snel. Elke week sluiten nieuwe praktijken en
                  regio&apos;s aan bij ons netwerk. Ons doel: een volledig
                  landelijk overzicht voor elke patiënt in Nederland.
                </p>
                <p>
                  Staat uw regio er nog niet bij?{" "}
                  <a
                    href="/aanmelden"
                    className="font-semibold text-[#3585ff] underline-offset-4 hover:underline"
                  >
                    Meld uw praktijk aan
                  </a>{" "}
                  en help mee aan een compleet landelijk overzicht.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
