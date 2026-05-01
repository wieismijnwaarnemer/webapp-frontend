"use client";

import { useState } from "react";
import SiteNavbar from "@/components/SiteNavbar";
import SiteFooter from "@/components/SiteFooter";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const canSubmit =
    name.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(email) &&
    message.trim().length >= 10 &&
    !submitting;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSent(true);
    }, 700);
  };

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
              Contact
            </p>
            <h1 className="mt-4 text-[34px] font-semibold leading-[1.1] tracking-[-0.025em] text-gray-900 sm:text-[44px] md:text-[52px]">
              We helpen u <span className="text-[#7ab0ff]">graag.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-gray-500 sm:text-[18px]">
              Heeft u een vraag, opmerking of wilt u een fout melden? Kies
              hieronder de situatie die op u van toepassing is.
            </p>
          </div>
        </section>

        {/* Twee kolommen: formulier + praktijken */}
        <section className="pb-16 sm:pb-20 lg:pb-24">
          <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.25fr_1fr] lg:gap-8">
              {/* Voor patiënten — formulier */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,40,0.04)] sm:p-8">
                <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#3585ff]">
                  Voor patiënten
                </p>
                <h2 className="mt-2 text-[22px] font-semibold leading-[1.2] tracking-[-0.015em] text-gray-900 sm:text-[26px]">
                  Iets melden of corrigeren?
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-gray-500 sm:text-[16px]">
                  Staat uw huisartsenpraktijk er niet bij, of klopt de
                  informatie niet? Laat het ons weten — we zorgen dat het
                  zo snel mogelijk wordt bijgewerkt.
                </p>

                {!sent ? (
                  <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                      <label
                        htmlFor="naam"
                        className="mb-2 block text-[13px] font-medium text-gray-900"
                      >
                        Naam
                      </label>
                      <input
                        id="naam"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Uw naam"
                        autoComplete="name"
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-[#3585ff] focus:shadow-[0_0_0_3px_rgba(53,133,255,0.1)] sm:text-[16px]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="mb-2 block text-[13px] font-medium text-gray-900"
                      >
                        E-mailadres
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="naam@voorbeeld.nl"
                        autoComplete="email"
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-[#3585ff] focus:shadow-[0_0_0_3px_rgba(53,133,255,0.1)] sm:text-[16px]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="bericht"
                        className="mb-2 block text-[13px] font-medium text-gray-900"
                      >
                        Bericht
                      </label>
                      <textarea
                        id="bericht"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Welke praktijk gaat het om en wat wilt u doorgeven?"
                        rows={5}
                        className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-[#3585ff] focus:shadow-[0_0_0_3px_rgba(53,133,255,0.1)] sm:text-[16px]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1d1d1b] px-5 py-3.5 text-[14px] font-semibold text-white transition-colors hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100 sm:text-[15px]"
                    >
                      {submitting ? "Versturen…" : "Verstuur bericht"}
                      {!submitting && (
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
                      )}
                    </button>
                    <p className="text-[12px] leading-relaxed text-gray-400">
                      We gebruiken uw gegevens alleen om te reageren op uw
                      bericht.
                    </p>
                  </form>
                ) : (
                  <div className="mt-6 rounded-xl border border-green-100 bg-green-50 p-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
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
                        <p className="text-[15px] font-semibold text-green-900">
                          Bedankt — uw bericht is verstuurd.
                        </p>
                        <p className="mt-0.5 text-[13px] text-green-800/80">
                          We nemen zo snel mogelijk contact met u op.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Voor praktijken */}
              <aside className="flex flex-col gap-4">
                <div className="rounded-2xl border border-gray-100 bg-[#f7f9fc] p-6 sm:p-8">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#3585ff]">
                    Voor praktijken
                  </p>
                  <h2 className="mt-2 text-[22px] font-semibold leading-[1.2] tracking-[-0.015em] text-gray-900 sm:text-[24px]">
                    Aanmelden of wijzigen?
                  </h2>
                  <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
                    Wilt u uw praktijk aanmelden of uw gegevens wijzigen?
                    Ga naar de aanmeldpagina of stuur ons een e-mail.
                  </p>

                  <div className="mt-5 space-y-2">
                    <a
                      href="/aanmelden"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1d1d1b] px-5 py-3.5 text-[14px] font-semibold text-white transition-colors hover:brightness-125 sm:text-[15px]"
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
                    <a
                      href="mailto:praktijken@wieismijnwaarnemer.nl"
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-3.5 text-[12px] font-medium text-gray-900 transition-colors hover:bg-gray-50 sm:px-5 sm:text-[14px]"
                    >
                      <svg
                        className="h-4 w-4 shrink-0 text-gray-500"
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
                      <span className="min-w-0 truncate">
                        praktijken@wieismijnwaarnemer.nl
                      </span>
                    </a>
                  </div>
                </div>

                <div className="rounded-2xl border border-red-100 bg-red-50 p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500 text-white">
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-[14px] font-semibold text-red-900">
                        Bij spoed
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-red-900/80">
                        Bel altijd <span className="font-semibold">112</span>{" "}
                        of de regionale huisartsenpost. Wij zijn geen
                        medische instantie en kunnen geen medisch advies
                        geven.
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>

            {/* Slotzin */}
            <p className="mx-auto mt-12 max-w-2xl text-center text-[14px] leading-relaxed text-gray-500 sm:mt-16 sm:text-[15px]">
              We breiden ons netwerk actief uit. Elke nieuwe praktijk helpt
              mee aan beter bereik voor patiënten in uw regio.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
