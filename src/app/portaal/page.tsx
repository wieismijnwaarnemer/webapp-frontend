"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PortaalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [wachtwoord, setWachtwoord] = useState("");
  const [showPw, setShowPw] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/portaal/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-4 sm:px-6 lg:px-10">
        {/* Top bar */}
        <header className="flex items-center justify-between py-6">
          <Link href="/" className="inline-flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Wieismijnwaarnemer" className="h-8 w-auto sm:h-9" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 transition-colors hover:text-gray-900"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Terug naar site
          </Link>
        </header>

        {/* Card */}
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[440px]">
            <div className="mb-8 text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-3 py-1 text-[12px] font-semibold text-[#3585ff]">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Praktijkportaal
              </span>
              <h1 className="mt-5 text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-gray-900 sm:text-[32px]">
                Welkom terug
              </h1>
              <p className="mt-2 text-[15px] text-gray-500">
                Log in om uw praktijkpagina te beheren.
              </p>
            </div>

            <div className="rounded-2xl border border-black/[0.06] bg-white p-7 shadow-[0_8px_30px_rgba(15,23,40,0.05)] sm:p-8">
              <form onSubmit={onSubmit} className="flex flex-col gap-5">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-gray-700">
                    E-mailadres
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="naam@praktijk.nl"
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3.5 text-[14px] text-gray-900 placeholder:text-gray-400 transition-colors focus:border-[#3585ff] focus:outline-none focus:ring-4 focus:ring-[#3585ff]/10"
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="wachtwoord" className="block text-[13px] font-medium text-gray-700">
                      Wachtwoord
                    </label>
                    <a href="#" className="text-[12px] font-medium text-[#3585ff] hover:underline">
                      Vergeten?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      id="wachtwoord"
                      type={showPw ? "text" : "password"}
                      required
                      value={wachtwoord}
                      onChange={(e) => setWachtwoord(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3.5 pr-11 text-[14px] text-gray-900 placeholder:text-gray-400 transition-colors focus:border-[#3585ff] focus:outline-none focus:ring-4 focus:ring-[#3585ff]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      aria-label={showPw ? "Verberg wachtwoord" : "Toon wachtwoord"}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
                    >
                      {showPw ? (
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a19.5 19.5 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a19.5 19.5 0 0 1-2.16 3.19" />
                          <path d="M1 1l22 22" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-[13px] text-gray-600">
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-[#3585ff] focus:ring-[#3585ff]" />
                  Ingelogd blijven
                </label>

                <button
                  type="submit"
                  className="mt-1 inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#3585ff] text-[14px] font-semibold text-white transition-colors hover:bg-[#2775f0]"
                >
                  Inloggen
                </button>
              </form>
            </div>

            <p className="mt-6 text-center text-[13px] text-gray-500">
              Nog geen praktijk-account?{" "}
              <Link href="/aanmelden" className="font-semibold text-[#3585ff] hover:underline">
                Meld uw praktijk aan
              </Link>
            </p>
          </div>
        </main>

        <footer className="py-6 text-center text-[12px] text-gray-400">
          © 2026 Wieismijnwaarnemer — Praktijkportaal
        </footer>
      </div>
    </div>
  );
}
