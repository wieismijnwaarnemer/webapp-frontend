export default function WieIsMijnWaarnemerHomepage() {
  const services = [
    {
      title: "Direct waarnemer vinden",
      text: "Zoek eenvoudig op praktijknaam, postcode of plaats en zie direct welke huisarts vandaag waarneemt.",
      icon: "🔎",
    },
    {
      title: "Actuele praktijkstatus",
      text: "Bekijk meteen of jouw huisartsenpraktijk open, gesloten of tijdelijk afwezig is.",
      icon: "🕒",
    },
    {
      title: "Regionale dekking",
      text: "Per stad of regio een helder overzicht van deelnemende praktijken en hun waarnemingsregeling.",
      icon: "📍",
    },
    {
      title: "Voor huisartspraktijken",
      text: "Praktijken beheren hun waarnemers, afwezigheid en rooster in een eenvoudig dashboard.",
      icon: "🏥",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f6fb] text-[#2f2389]">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 lg:px-10 lg:py-6">
        <div className="text-[28px] font-semibold tracking-[-0.04em] text-black lg:text-[36px]">
          Wieismijnwaarnemer
        </div>

        <nav className="hidden items-center gap-10 lg:flex">
          <a href="#" className="text-[13px] font-semibold text-black">Home</a>
          <a href="#" className="text-[13px] font-medium text-[#5b5b5b]">Over ons</a>
          <a href="#" className="text-[13px] font-medium text-[#5b5b5b]">Voor praktijken</a>
          <a href="#" className="text-[13px] font-medium text-[#5b5b5b]">Regio&apos;s</a>
        </nav>

        <a href="/aanmelden" className="rounded-full bg-black px-6 py-3 text-[14px] font-medium text-white shadow-sm">
          Praktijk aanmelden
        </a>
      </header>

      <main>
        {/* Hero */}
        <section className="px-6 pt-4 lg:px-10 lg:pt-5">
          <div className="relative overflow-hidden rounded-[26px] bg-[linear-gradient(135deg,#f4d9dd_0%,#f7eceb_55%,#ecd5f8_100%)] px-8 lg:px-12">
            {/* Decoratieve cirkels */}
            <div className="absolute inset-0 opacity-40">
              <div className="absolute right-[-120px] top-8 h-[500px] w-[500px] rounded-full border border-white/50" />
              <div className="absolute right-[80px] top-[70px] h-[360px] w-[360px] rounded-full border border-white/40" />
              <div className="absolute right-[180px] top-[120px] h-[240px] w-[240px] rounded-full border border-white/35" />
            </div>

            <div className="relative grid w-full items-center gap-8 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-14">
              {/* Linker kolom */}
              <div className="flex flex-col justify-center">
                <h1 className="max-w-[520px] text-[38px] font-semibold leading-[1.08] tracking-[-0.04em] text-[#0a0c10] sm:text-[48px] lg:text-[56px]">
                  Vind snel jouw waarnemer met{" "}
                  <span className="text-[#3585ff]">direct inzicht</span>
                </h1>

                <p className="mt-5 max-w-[420px] text-[15px] leading-7 text-[#4c5361] lg:text-[16px]">
                  Op Wieismijnwaarnemer zie je direct welke praktijk waarneemt
                  wanneer jouw eigen huisarts afwezig, gesloten of niet bereikbaar is.
                </p>

                <div className="mt-7 flex max-w-[520px] flex-col gap-3 sm:flex-row">
                  <div className="relative flex flex-1 items-center rounded-full border border-[#d7e7ff] bg-white px-5 py-3.5 shadow-[0_4px_16px_rgba(53,133,255,0.06)] focus-within:border-[#3585ff] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-4 w-4 flex-shrink-0 text-[#3585ff]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Zoek op praktijknaam of postcode..."
                      className="flex-1 bg-transparent text-[14px] text-[#101114] placeholder:text-[#9aa5b4] outline-none"
                    />
                  </div>
                  <button className="inline-flex w-full items-center justify-center rounded-full bg-black px-6 py-3.5 text-[14px] font-medium text-white shadow-sm transition hover:bg-[#222] sm:w-auto whitespace-nowrap">
                    Zoek waarnemer
                  </button>
                </div>

                {/* Trusted by patiënten */}
                <div className="mt-8 flex items-center gap-4">
                  <div className="flex -space-x-3">
                    <div className="h-10 w-10 rounded-full border-[2.5px] border-white bg-[url('https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80')] bg-cover bg-center" />
                    <div className="h-10 w-10 rounded-full border-[2.5px] border-white bg-[url('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80')] bg-cover bg-center" />
                    <div className="h-10 w-10 rounded-full border-[2.5px] border-white bg-[url('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80')] bg-cover bg-center" />
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-[2.5px] border-white bg-[#272727] text-[11px] font-semibold text-white">
                      10k+
                    </div>
                  </div>
                  <div className="text-[12px] leading-4 text-[#2d2a29]">
                    <span className="font-semibold">Vertrouwd door patiënten</span>
                    <br />
                    voor uitzonderlijke zorg
                  </div>
                </div>
              </div>

              {/* Rechter kolom — afbeelding */}
              <div className="relative hidden items-end justify-center lg:flex">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=900&q=80"
                  alt="Arts"
                  className="relative z-10 h-[420px] w-auto object-contain"
                />

                {/* Floating tags */}
                <div className="absolute bottom-16 right-4 z-20 grid w-[280px] gap-2">
                  <div className="flex gap-2">
                    <div className="rounded-full border border-white/70 bg-white/35 px-3.5 py-1.5 text-[11px] text-[#444] backdrop-blur">
                      Huisartsenpraktijk
                    </div>
                    <div className="rounded-full border border-white/70 bg-white/35 px-3.5 py-1.5 text-[11px] text-[#444] backdrop-blur">
                      Waarneming
                    </div>
                    <div className="rounded-full border border-white/70 bg-white/35 px-3.5 py-1.5 text-[11px] text-[#444] backdrop-blur">
                      Spoedlijn
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <div className="rounded-full border border-white/70 bg-white/35 px-3.5 py-1.5 text-[11px] text-[#444] backdrop-blur">
                      Actuele status
                    </div>
                    <div className="rounded-full border border-white/70 bg-white/35 px-3.5 py-1.5 text-[11px] text-[#444] backdrop-blur">
                      Regio&apos;s
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Hoe het werkt */}
        <section className="bg-white px-6 py-20 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[1100px]">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[14px] font-semibold uppercase tracking-[0.15em] text-[#3585ff]">Hoe het werkt</p>
              <h2 className="mt-3 text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-[#0a0c10] sm:text-[48px]">
                Eén platform voor de hele huisartsketen
              </h2>
              <p className="mt-4 text-[18px] leading-8 text-[#4c5361]">
                Van zoeken tot waarneming — alles op één plek, voor patiënten én praktijken.
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((service, i) => (
                <div
                  key={service.title}
                  className="rounded-2xl border border-[#e6ebf3] bg-[#f7fbff] p-6 transition hover:border-[#3585ff]/30 hover:shadow-[0_8px_24px_rgba(53,133,255,0.08)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-[#e6ebf3] text-2xl shadow-sm">
                    {service.icon}
                  </div>
                  <h3 className="mt-5 text-[19px] font-semibold text-[#0a0c10]">{service.title}</h3>
                  <p className="mt-2 text-[15px] leading-6 text-[#4c5361]">{service.text}</p>
                  <div className="mt-4 text-[14px] font-semibold text-[#3585ff]">
                    Stap {i + 1} →
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
