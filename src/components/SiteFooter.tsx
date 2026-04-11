export default function SiteFooter() {
  return (
    <footer className="bg-[#000000] text-white">
      <div>
        <div className="mx-auto w-full max-w-[1400px] px-4 pt-14 sm:px-6 sm:pt-16 lg:px-10">
          <div className="grid grid-cols-1 gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-16">
            {/* Brand */}
            <div>
              <a href="/" className="inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="Wieismijnwaarnemer"
                  className="h-9 w-auto sm:h-10"
                  style={{ filter: "brightness(0) invert(1)" }}
                />
              </a>
              <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-white/70">
                Vind snel welke huisartspraktijk waarneemt wanneer uw eigen
                huisarts afwezig is.
              </p>
            </div>

            {/* Voor patiënten */}
            <div>
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-white/50">
                Voor patiënten
              </h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <a
                    href="/over-ons"
                    className="text-[15px] text-white/85 transition-colors hover:text-white"
                  >
                    Over ons
                  </a>
                </li>
                <li>
                  <a
                    href="/contact"
                    className="text-[15px] text-white/85 transition-colors hover:text-white"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="/regios"
                    className="text-[15px] text-white/85 transition-colors hover:text-white"
                  >
                    Regio&apos;s
                  </a>
                </li>
                <li>
                  <a
                    href="/helpcentrum"
                    className="text-[15px] text-white/85 transition-colors hover:text-white"
                  >
                    Hulpcentrum
                  </a>
                </li>
              </ul>
            </div>

            {/* Voor huisartspraktijken */}
            <div>
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-white/50">
                Voor huisartspraktijken
              </h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <a
                    href="/aanmelden"
                    className="inline-flex items-center gap-2 text-[15px] font-semibold text-white transition-colors hover:text-white/90"
                  >
                    Praktijk aanmelden
                    <svg
                      className="h-3.5 w-3.5"
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
                </li>
                <li>
                  <a
                    href="/voor-praktijken"
                    className="text-[15px] text-white/85 transition-colors hover:text-white"
                  >
                    Voor praktijken
                  </a>
                </li>
                <li>
                  <a
                    href="/portaal"
                    className="text-[15px] text-white/85 transition-colors hover:text-white"
                  >
                    Praktijkpagina beheren
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <hr className="m-0 border-white/15" />

          <div className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-[12px] leading-relaxed text-white/55">
              Let op: controleer bij twijfel altijd rechtstreeks bij uw
              huisartsenpraktijk of de waarnemer. Bij spoed belt u{" "}
              <span className="text-white/80">112</span> of de{" "}
              <span className="text-white/80">huisartsenpost</span> in uw regio.
            </p>
            <p className="shrink-0 text-[12px] text-white/40">
              © 2026 Wieismijnwaarnemer
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
