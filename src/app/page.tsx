"use client";

import { useEffect, useState } from "react";

export default function WieIsMijnWaarnemerHomepage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="fixed left-0 right-0 top-0 z-50">
        <nav
          className={`transition-all duration-300 ${
            scrolled
              ? "bg-white/70 backdrop-blur-2xl"
              : "bg-transparent"
          }`}
        >
          <div className="px-2 sm:px-3">
            <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
              <div className="flex h-[72px] items-center justify-between lg:h-[80px]">
              <a className="flex shrink-0 items-center" href="/">
                <span className="text-[20px] font-semibold tracking-[-0.03em] text-[#1d1d1b] sm:text-[22px]">
                  Wieismijnwaarnemer
                </span>
              </a>

              <div className="hidden items-center gap-1 lg:flex">
                <a href="#" className="px-4 py-2 text-[15px] font-medium text-[#1d1d1b] transition-colors duration-200 hover:text-[#1d1d1b]/60">Home</a>
                <a href="#" className="px-4 py-2 text-[15px] font-medium text-[#1d1d1b] transition-colors duration-200 hover:text-[#1d1d1b]/60">Over ons</a>
                <a href="#" className="px-4 py-2 text-[15px] font-medium text-[#1d1d1b] transition-colors duration-200 hover:text-[#1d1d1b]/60">Voor praktijken</a>
                <a href="#" className="px-4 py-2 text-[15px] font-medium text-[#1d1d1b] transition-colors duration-200 hover:text-[#1d1d1b]/60">Regio&apos;s</a>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative hidden lg:block">
                  <button className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-black/5">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 rounded-full">
                      <g clipPath="url(#currentFlag)">
                        <rect width="16" height="16" fill="white" />
                        <rect x="16" width="5.333" height="16" transform="rotate(90 16 0)" fill="#AE1C28" />
                        <rect x="16" y="5.334" width="5.333" height="16" transform="rotate(90 16 5.334)" fill="#fff" />
                        <rect x="16" y="10.667" width="5.333" height="16" transform="rotate(90 16 10.667)" fill="#21468B" />
                      </g>
                      <defs>
                        <clipPath id="currentFlag">
                          <rect width="16" height="16" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                    <span className="text-[13px] font-normal uppercase text-[#1d1d1b]">nl</span>
                    <svg width="9" height="6" viewBox="0 0 9 6" fill="none" className="transition-transform duration-200">
                      <path d="M8.1 1.61L4.78 5.03a.75.75 0 0 1-1.06 0L.4 1.61a.5.5 0 0 1 .35-.86h7a.5.5 0 0 1 .35.86z" fill="#1D1D1B" />
                    </svg>
                  </button>
                </div>

                <a
                  href="/aanmelden"
                  className="hidden items-center justify-center rounded-lg bg-[#1d1d1b] px-5 py-3 text-[14px] font-normal text-white transition-colors duration-200 hover:bg-[#1d1d1b]/85 lg:inline-flex"
                >
                  Praktijk aanmelden
                </a>

                <button className="relative flex h-10 w-10 items-center justify-center lg:hidden" aria-label="Menu" aria-expanded="false">
                  <div className="flex h-5 w-5 flex-col items-center justify-center">
                    <span className="block h-[1.5px] w-5 -translate-y-[3px] bg-[#1d1d1b] transition-all duration-300" />
                    <span className="block h-[1.5px] w-5 translate-y-[3px] bg-[#1d1d1b] transition-all duration-300" />
                  </div>
                </button>
              </div>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="px-2 pb-2 pt-[72px] sm:px-3 sm:pb-3 sm:pt-[76px] lg:pt-[80px]">
        <div className="relative mx-auto flex min-h-[calc(100vh-80px-1.5rem)] w-full max-w-[1600px] flex-col overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#f0eafc_0%,#f5f0ff_40%,#eee8fb_100%)] lg:rounded-[2.5rem]">
          {/* Decoratieve cirkels */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-20 -top-20 h-[400px] w-[400px] rounded-full bg-[#e4d4fb]/40" />
            <div className="absolute -bottom-32 -right-20 h-[500px] w-[500px] rounded-full bg-[#d8ccf6]/30" />
            <div className="absolute left-[40%] top-[20%] h-[300px] w-[300px] rounded-full bg-[#ede3ff]/50" />
            <div className="absolute bottom-[15%] left-[15%] h-[200px] w-[200px] rounded-full bg-[#f3eaff]/60" />
          </div>

          <div className="relative mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-32 md:pt-36 lg:px-10 lg:py-0">
            <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
              {/* Content */}
              <div className="flex flex-col text-center lg:text-left">
                <div className="inline-flex w-fit items-center gap-2.5 self-center rounded-full bg-white/60 py-1.5 pl-1.5 pr-4 shadow-[0_1px_2px_rgba(15,23,40,0.04),0_8px_24px_-8px_rgba(15,23,40,0.08)] ring-1 ring-black/[0.04] backdrop-blur-md lg:self-start">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#3585ff] to-[#5b9fff] text-white shadow-[0_2px_6px_rgba(53,133,255,0.35)]">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="text-[12.5px] font-medium tracking-tight text-[#1d1d1b]">
                    Het waarnemer-platform van Nederland
                  </span>
                </div>

                <h1 className="mt-6 text-[1.75rem] font-semibold leading-tight tracking-[-0.035em] text-[#0f1728] sm:text-[2rem] md:text-3xl lg:text-4xl xl:text-5xl">
                  Vind snel jouw waarnemer met{" "}
                  <span className="text-[#3585ff]">direct inzicht</span>
                </h1>

                <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#4b5563] sm:mt-6 sm:text-lg lg:mx-0">
                  Zie direct welke praktijk waarneemt wanneer jouw eigen huisarts
                  afwezig, gesloten of niet bereikbaar is.
                </p>

                <div className="mx-auto mt-8 w-full max-w-[760px] lg:mx-0">
                  <div className="flex items-center gap-2 rounded-2xl border border-white/80 bg-white p-2 shadow-[0_12px_40px_-8px_rgba(15,23,40,0.18)] ring-1 ring-black/5 transition-all focus-within:shadow-[0_16px_50px_-8px_rgba(53,133,255,0.25)] focus-within:ring-[#3585ff]/30">
                    <div className="flex flex-1 items-center pl-3">
                      <svg className="mr-3 h-5 w-5 shrink-0 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Postcode of praktijknaam..."
                        className="w-full bg-transparent py-3 text-[15px] text-[#0f1728] placeholder:text-[#9ca3af] outline-none"
                      />
                    </div>
                    <button className="shrink-0 rounded-xl bg-[#1d1d1b] px-6 py-3.5 text-[14px] font-medium text-white transition-colors duration-200 hover:bg-[#1d1d1b]/85">
                      Zoek waarnemer
                    </button>
                  </div>
                </div>

                <div className="mx-auto mt-10 flex items-center gap-4 lg:mx-0">
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

              {/* Image — alleen mobile/tablet (in flow) */}
              <div className="relative flex items-center justify-center px-4 sm:px-6 lg:hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/banner.png"
                  alt="Wieismijnwaarnemer"
                  className="block max-h-[55vh] w-auto object-contain"
                  loading="eager"
                />
              </div>
            </div>
          </div>

          {/* Image — desktop, absolute t.o.v. de card, bottom aligned */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/banner.png"
            alt="Wieismijnwaarnemer"
            className="pointer-events-none absolute bottom-0 right-[5%] z-10 hidden h-auto max-h-[calc(100%-6rem)] w-auto object-contain lg:block xl:right-[8%]"
            loading="eager"
          />
        </div>
      </section>

      {/* Hoe het werkt */}
      <section className="bg-white px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#3585ff]">
              Hoe het werkt
            </p>
            <h2 className="mt-3 text-[32px] font-semibold leading-[1.1] tracking-[-0.035em] text-[#0f1728] sm:text-[40px]">
              Eén platform voor de hele huisartsketen
            </h2>
            <p className="mt-4 text-[16px] leading-7 text-[#4b5563]">
              Van zoeken tot waarneming — alles op één plek, voor patiënten én
              praktijken.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service, i) => (
              <div
                key={service.title}
                className="rounded-2xl border border-[#f0f0f0] bg-[#fafafa] p-6 transition-all hover:border-[#e0e0e0] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                  {service.icon}
                </div>
                <h3 className="mt-4 text-[16px] font-semibold text-[#0f1728]">
                  {service.title}
                </h3>
                <p className="mt-2 text-[14px] leading-6 text-[#6b7280]">
                  {service.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
