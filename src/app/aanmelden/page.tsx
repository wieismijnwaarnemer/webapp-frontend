"use client";

import { useEffect, useState } from "react";
import {
  zoekPraktijken,
  getPractice,
  getSuggestedPartners,
  practices as allPractices,
} from "@/lib/mock-data";
import type { Practice } from "@/lib/mock-data";

const DAYS = [
  "Maandag",
  "Dinsdag",
  "Woensdag",
  "Donderdag",
  "Vrijdag",
  "Zaterdag",
  "Zondag",
] as const;

const FEESTDAGEN = [
  { naam: "Nieuwjaarsdag", datum: "1 januari" },
  { naam: "Koningsdag", datum: "27 april" },
  { naam: "Bevrijdingsdag", datum: "5 mei" },
  { naam: "Hemelvaartsdag", datum: "14 mei" },
  { naam: "Eerste Pinksterdag", datum: "25 mei" },
  { naam: "Tweede Pinksterdag", datum: "26 mei" },
  { naam: "Eerste Kerstdag", datum: "25 december" },
  { naam: "Tweede Kerstdag", datum: "26 december" },
];

interface DaySchedule {
  open: boolean;
  van: string;
  tot: string;
}

const DEFAULT_SCHEDULE: Record<string, DaySchedule> = {
  Maandag: { open: true, van: "08:00", tot: "17:00" },
  Dinsdag: { open: true, van: "08:00", tot: "17:00" },
  Woensdag: { open: true, van: "08:00", tot: "13:00" },
  Donderdag: { open: true, van: "08:00", tot: "17:00" },
  Vrijdag: { open: true, van: "08:00", tot: "17:00" },
  Zaterdag: { open: false, van: "", tot: "" },
  Zondag: { open: false, van: "", tot: "" },
};

const STEP_LABELS = [
  "Praktijk",
  "Verificatie",
  "Waarnemers",
  "Openingstijden",
  "Klaar",
];

export default function AanmeldenPage() {
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState("");
  const [selectedPractice, setSelectedPractice] = useState<Practice | null>(null);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [partnerQuery, setPartnerQuery] = useState("");
  const [weekSchedule, setWeekSchedule] = useState<Record<string, DaySchedule>>({
    ...DEFAULT_SCHEDULE,
  });
  const [selectedFeestdagen, setSelectedFeestdagen] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step]);

  const results = zoekPraktijken(query);
  const partners = selectedPractice
    ? getSuggestedPartners(selectedPractice.id)
    : [];

  const claimPractice = (p: Practice) => {
    setSelectedPractice(p);
    setQuery(p.naam);
    setStep(1);
  };

  const toggleDayOpen = (day: string) => {
    setWeekSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        open: !prev[day].open,
        van: prev[day].open ? "" : "08:00",
        tot: prev[day].open ? "" : "17:00",
      },
    }));
  };

  const updateDayTime = (day: string, field: "van" | "tot", value: string) => {
    setWeekSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const toggleFeestdag = (naam: string) => {
    setSelectedFeestdagen((prev) =>
      prev.includes(naam) ? prev.filter((f) => f !== naam) : [...prev, naam]
    );
  };

  const selectAllFeestdagen = () => {
    setSelectedFeestdagen(FEESTDAGEN.map((f) => f.naam));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
          <div className="flex h-[68px] items-center justify-between lg:h-[76px]">
            <a className="flex shrink-0 items-center" href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Wieismijnwaarnemer"
                className="h-10 w-auto sm:h-12"
              />
            </a>
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 transition-colors hover:text-gray-900 sm:text-[14px]"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              Afsluiten
            </a>
          </div>
        </div>
      </header>

      {/* Progress bar — zelfde breedte als navbar-content */}
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-5 sm:px-6 sm:pt-6 lg:px-10 lg:pt-7">
        <div className="flex items-center gap-2 sm:gap-3">
          {STEP_LABELS.map((label, i) => {
            const isDone = step > i;
            const isActive = step === i;
            return (
              <div key={label} className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="h-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isDone || isActive ? "bg-[#3585ff]" : "bg-transparent"
                    }`}
                    style={{ width: isDone || isActive ? "100%" : "0%" }}
                  />
                </div>
                <span
                  className={`hidden truncate text-[15px] font-medium sm:block sm:text-base ${
                    isActive
                      ? "text-gray-900"
                      : isDone
                        ? "text-[#3585ff]"
                        : "text-gray-400"
                  }`}
                >
                  {i + 1}. {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto w-full max-w-[1400px] px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16 lg:px-10 lg:pb-16 lg:pt-20">
        <div className="mx-auto w-full max-w-xl">

          {/* Stap 1 — Claim je praktijk */}
          {step === 0 && (
            <div>
              <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-gray-900 sm:text-[32px] md:text-[36px]">
                Claim <span className="text-[#7ab0ff]">uw praktijk.</span>
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-500 sm:text-base">
                Zoek uw huisartsenpraktijk en claim deze in 30 seconden.
              </p>

              <div className="relative mt-8">
                <div className="flex items-center rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,40,0.04)] transition-all focus-within:border-[#3585ff] focus-within:shadow-[0_6px_20px_-8px_rgba(53,133,255,0.25)] sm:px-5 sm:py-4">
                  <svg
                    className="mr-3 h-5 w-5 shrink-0 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setSelectedPractice(null);
                    }}
                    placeholder="Zoek uw praktijk (bijv. De Gors Purmerend)"
                    className="w-full bg-transparent text-[15px] text-gray-900 placeholder:text-gray-400 outline-none sm:text-[16px]"
                    autoFocus
                  />
                </div>

                {!selectedPractice && results.length > 0 && (
                  <ul className="mt-2 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_12px_32px_-12px_rgba(15,23,40,0.15)]">
                    {results.map((p) => (
                      <li key={p.id} className="border-b border-gray-50 last:border-0">
                        <button
                          type="button"
                          onClick={() => claimPractice(p)}
                          className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 sm:gap-4 sm:px-5 sm:py-4"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef4ff] text-[#3585ff]">
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
                            <div className="truncate text-[15px] font-semibold text-gray-900">
                              {p.naam}
                            </div>
                            <div className="truncate text-[13px] text-gray-500">
                              {p.adres}, {p.postcode}
                            </div>
                          </div>
                          <svg
                            className="h-4 w-4 shrink-0 text-gray-300"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M9 6l6 6-6 6" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {!selectedPractice && query.length >= 2 && results.length === 0 && (
                  <div className="mt-2 rounded-2xl border border-gray-100 bg-white px-5 py-4 text-[14px] text-gray-500">
                    Geen praktijk gevonden. Neem contact op zodat we u kunnen toevoegen.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stap 2 — Verificatie */}
          {step === 1 && (
            <div>
              <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-gray-900 sm:text-[32px] md:text-[36px]">
                Verifieer <span className="text-[#7ab0ff]">uw e-mail.</span>
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-500 sm:text-base">
                We sturen een code naar uw praktijk-e-mail om uw claim te bevestigen.
              </p>

              {/* Geselecteerde praktijk */}
              <div className="mt-8 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 sm:gap-4 sm:px-5">
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
                  <div className="truncate text-[14px] font-semibold text-gray-900">
                    {selectedPractice?.naam}
                  </div>
                  <div className="truncate text-[12px] text-gray-500">
                    {selectedPractice?.adres}
                  </div>
                </div>
              </div>

              {!otpSent && (
                <div className="mt-6">
                  <label className="mb-2 block text-[13px] font-medium text-gray-900">
                    E-mailadres
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="info@uwpraktijk.nl"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-[#3585ff] focus:shadow-[0_0_0_3px_rgba(53,133,255,0.1)] sm:text-[16px]"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setOtpSent(true)}
                    disabled={!email || !email.includes("@")}
                    className="mt-5 w-full rounded-xl bg-[#1d1d1b] px-5 py-3.5 text-[14px] font-semibold text-white transition-colors hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100 sm:text-[15px]"
                  >
                    Stuur verificatiecode
                  </button>
                </div>
              )}

              {otpSent && (
                <div className="mt-6">
                  <div className="rounded-xl border border-[#eef4ff] bg-[#f6faff] px-4 py-3 text-[13px] text-[#3585ff]">
                    Code verstuurd naar{" "}
                    <span className="font-semibold">{email}</span>
                  </div>

                  {!otpVerified && (
                    <>
                      <label className="mb-3 mt-6 block text-[13px] font-medium text-gray-900">
                        Voer de 6-cijferige code in
                      </label>
                      <div className="flex justify-between gap-1.5 sm:gap-2.5">
                        {otp.map((digit, i) => (
                          <input
                            key={i}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            autoFocus={i === 0}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              const newOtp = [...otp];
                              newOtp[i] = val;
                              setOtp(newOtp);
                              setOtpError(false);
                              if (val && i < 5) {
                                const next = e.target
                                  .nextElementSibling as HTMLInputElement | null;
                                next?.focus();
                              }
                              if (val && i === 5) {
                                const code = [...newOtp].join("");
                                if (code === "111111") {
                                  setOtpVerified(true);
                                } else {
                                  setOtpError(true);
                                }
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Backspace" && !otp[i] && i > 0) {
                                const prev = (e.target as HTMLInputElement)
                                  .previousElementSibling as HTMLInputElement | null;
                                prev?.focus();
                              }
                            }}
                            className={`h-12 w-full min-w-0 max-w-[52px] rounded-xl border-2 bg-white text-center text-[20px] font-semibold text-gray-900 outline-none transition-all sm:h-14 sm:max-w-[56px] sm:text-[22px] ${
                              otpError
                                ? "border-red-400 focus:border-red-500"
                                : "border-gray-200 focus:border-[#3585ff] focus:shadow-[0_0_0_3px_rgba(53,133,255,0.1)]"
                            }`}
                          />
                        ))}
                      </div>
                      {otpError && (
                        <p className="mt-3 text-center text-[13px] font-medium text-red-500">
                          Onjuiste code. Probeer opnieuw.
                        </p>
                      )}
                      <p className="mt-3 text-center text-[12px] text-gray-400">
                        Demo: gebruik code{" "}
                        <span className="font-mono font-semibold text-gray-900">
                          111111
                        </span>
                      </p>
                    </>
                  )}

                  {otpVerified && (
                    <>
                      <div className="mt-4 flex items-center gap-3 rounded-xl border border-green-100 bg-green-50 px-4 py-3.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
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
                        <span className="text-[14px] font-semibold text-green-800">
                          E-mail geverifieerd
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="mt-5 w-full rounded-xl bg-[#1d1d1b] px-5 py-3.5 text-[14px] font-semibold text-white transition-colors hover:brightness-125 sm:text-[15px]"
                      >
                        Ga verder
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Stap 3 — Waarnemers */}
          {step === 2 && (
            <div>
              <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-gray-900 sm:text-[32px] md:text-[36px]">
                Wie neemt <span className="text-[#7ab0ff]">waar voor u?</span>
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-500 sm:text-base">
                Selecteer de praktijken die voor u waarnemen bij afwezigheid.
              </p>

              {/* Suggested partners */}
              <div className="mt-8 space-y-2">
                <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                  Praktijken in uw buurt
                </p>
                {partners.map((p) => {
                  const isSelected = selectedPartners.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        setSelectedPartners((prev) =>
                          isSelected
                            ? prev.filter((id) => id !== p.id)
                            : [...prev, p.id]
                        )
                      }
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all sm:gap-4 sm:px-5 ${
                        isSelected
                          ? "border-[#3585ff] bg-[#f6faff]"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                          isSelected
                            ? "border-[#3585ff] bg-[#3585ff]"
                            : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="h-3 w-3 text-white"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={3.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14px] font-semibold text-gray-900 sm:text-[15px]">
                          {p.naam}
                        </div>
                        <div className="truncate text-[12px] text-gray-500 sm:text-[13px]">
                          {p.adres} · {p.telefoon}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Andere praktijk zoeken */}
              <div className="mt-6">
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                  Andere praktijk toevoegen
                </p>
                <div className="flex items-center rounded-xl border border-gray-200 bg-white px-4 py-3 transition-all focus-within:border-[#3585ff] focus-within:shadow-[0_0_0_3px_rgba(53,133,255,0.1)]">
                  <svg
                    className="mr-2.5 h-4 w-4 shrink-0 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={partnerQuery}
                    onChange={(e) => setPartnerQuery(e.target.value)}
                    placeholder="Zoek op naam of postcode"
                    className="w-full bg-transparent text-[14px] text-gray-900 placeholder:text-gray-400 outline-none sm:text-[15px]"
                  />
                </div>

                {partnerQuery.length >= 2 &&
                  (() => {
                    const searchResults = allPractices.filter(
                      (p) =>
                        p.id !== selectedPractice?.id &&
                        !partners.some((sp) => sp.id === p.id) &&
                        (p.naam
                          .toLowerCase()
                          .includes(partnerQuery.toLowerCase()) ||
                          p.postcode
                            .toLowerCase()
                            .replace(/\s/g, "")
                            .includes(
                              partnerQuery.toLowerCase().replace(/\s/g, "")
                            ))
                    );
                    if (searchResults.length === 0) {
                      return (
                        <div className="mt-2 rounded-xl border border-gray-100 bg-white px-4 py-3 text-[13px] text-gray-500">
                          Geen praktijken gevonden voor &ldquo;{partnerQuery}&rdquo;
                        </div>
                      );
                    }
                    return (
                      <div className="mt-2 space-y-1.5">
                        {searchResults.slice(0, 5).map((p) => {
                          const isSelected = selectedPartners.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedPartners((prev) =>
                                  isSelected
                                    ? prev.filter((id) => id !== p.id)
                                    : [...prev, p.id]
                                );
                                setPartnerQuery("");
                              }}
                              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                                isSelected
                                  ? "border-[#3585ff] bg-[#f6faff]"
                                  : "border-gray-200 bg-white hover:border-gray-300"
                              }`}
                            >
                              <span
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                                  isSelected
                                    ? "border-[#3585ff] bg-[#3585ff]"
                                    : "border-gray-300"
                                }`}
                              >
                                {isSelected && (
                                  <svg
                                    className="h-3 w-3 text-white"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={3.5}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M20 6L9 17l-5-5" />
                                  </svg>
                                )}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-[14px] font-semibold text-gray-900">
                                  {p.naam}
                                </div>
                                <div className="truncate text-[12px] text-gray-500">
                                  {p.adres}, {p.postcode}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
              </div>

              {/* Volgorde */}
              {selectedPartners.length > 0 && (
                <div className="mt-8">
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                    Volgorde van waarneming
                  </p>
                  <p className="mb-3 text-[13px] text-gray-500">
                    De eerste in de lijst wordt als standaard getoond.
                  </p>
                  <div className="space-y-2">
                    {selectedPartners.map((id, index) => {
                      const p = getPractice(id);
                      if (!p) return null;
                      const isFirst = index === 0;
                      const isLast = index === selectedPartners.length - 1;
                      return (
                        <div
                          key={id}
                          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3 sm:px-4"
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12px] font-semibold ${
                              isFirst
                                ? "bg-[#3585ff] text-white"
                                : "bg-[#eef4ff] text-[#3585ff]"
                            }`}
                          >
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[14px] font-semibold text-gray-900">
                              {p.naam}
                            </div>
                            <div className="truncate text-[12px] text-gray-500">
                              {p.adres}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-0.5">
                            <button
                              type="button"
                              aria-label="Omhoog"
                              onClick={() => {
                                if (isFirst) return;
                                setSelectedPartners((prev) => {
                                  const arr = [...prev];
                                  [arr[index - 1], arr[index]] = [
                                    arr[index],
                                    arr[index - 1],
                                  ];
                                  return arr;
                                });
                              }}
                              disabled={isFirst}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                              <svg
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2.4}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              aria-label="Omlaag"
                              onClick={() => {
                                if (isLast) return;
                                setSelectedPartners((prev) => {
                                  const arr = [...prev];
                                  [arr[index], arr[index + 1]] = [
                                    arr[index + 1],
                                    arr[index],
                                  ];
                                  return arr;
                                });
                              }}
                              disabled={isLast}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                              <svg
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2.4}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              aria-label="Verwijderen"
                              onClick={() =>
                                setSelectedPartners((prev) =>
                                  prev.filter((pid) => pid !== id)
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                            >
                              <svg
                                className="h-3.5 w-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2.4}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M6 6l12 12M18 6L6 18" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-10 flex flex-col-reverse gap-2.5 sm:flex-row sm:gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-[14px] font-medium text-gray-600 transition-colors hover:bg-gray-50 sm:w-auto"
                >
                  Terug
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={selectedPartners.length === 0}
                  className="w-full rounded-xl bg-[#1d1d1b] px-5 py-3.5 text-[14px] font-semibold text-white transition-colors hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100 sm:flex-1 sm:text-[15px]"
                >
                  Volgende
                </button>
              </div>
            </div>
          )}

          {/* Stap 4 — Openingstijden */}
          {step === 3 && (
            <div>
              <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-gray-900 sm:text-[32px] md:text-[36px]">
                Uw <span className="text-[#7ab0ff]">openingstijden.</span>
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-500 sm:text-base">
                We hebben standaard tijden ingevuld. Pas aan wat anders is.
              </p>

              {/* Weekrooster */}
              <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white">
                {DAYS.map((day, i) => {
                  const schedule = weekSchedule[day];
                  return (
                    <div
                      key={day}
                      className={`flex flex-wrap items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5 ${
                        i < DAYS.length - 1 ? "border-b border-gray-100" : ""
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleDayOpen(day)}
                        aria-label={`${day} ${schedule.open ? "sluiten" : "openen"}`}
                        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                          schedule.open ? "bg-[#3585ff]" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                            schedule.open ? "translate-x-[22px]" : "translate-x-0.5"
                          }`}
                        />
                      </button>

                      <span
                        className={`w-20 text-[13px] font-semibold sm:w-24 sm:text-[14px] ${
                          schedule.open ? "text-gray-900" : "text-gray-400"
                        }`}
                      >
                        {day}
                      </span>

                      {schedule.open ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={schedule.van}
                            onChange={(e) => updateDayTime(day, "van", e.target.value)}
                            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[13px] text-gray-900 outline-none transition-colors focus:border-[#3585ff]"
                          />
                          <span className="text-[13px] text-gray-400">—</span>
                          <input
                            type="time"
                            value={schedule.tot}
                            onChange={(e) => updateDayTime(day, "tot", e.target.value)}
                            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[13px] text-gray-900 outline-none transition-colors focus:border-[#3585ff]"
                          />
                        </div>
                      ) : (
                        <span className="text-[13px] text-gray-400">Gesloten</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Feestdagen */}
              <div className="mt-8">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                    Feestdagen (gesloten)
                  </p>
                  <button
                    type="button"
                    onClick={selectAllFeestdagen}
                    className="text-[12px] font-semibold text-[#3585ff] transition-colors hover:text-[#1d5fd9]"
                  >
                    Alle selecteren
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {FEESTDAGEN.map((feestdag) => {
                    const isSelected = selectedFeestdagen.includes(feestdag.naam);
                    return (
                      <button
                        key={feestdag.naam}
                        type="button"
                        onClick={() => toggleFeestdag(feestdag.naam)}
                        className={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-all ${
                          isSelected
                            ? "border-[#3585ff] bg-[#f6faff]"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${
                            isSelected
                              ? "border-[#3585ff] bg-[#3585ff]"
                              : "border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <svg
                              className="h-2.5 w-2.5 text-white"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={4}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-semibold text-gray-900">
                            {feestdag.naam}
                          </div>
                          <div className="truncate text-[11px] text-gray-400">
                            {feestdag.datum}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CSV upload */}
              <label className="mt-6 flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-4 transition-colors hover:border-[#3585ff] hover:bg-[#f6faff] sm:px-5 sm:py-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#3585ff] shadow-sm sm:h-12 sm:w-12">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6M12 18v-6M9 15l3-3 3 3" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-gray-900">
                    Heeft u al een rooster? Upload het hier
                  </div>
                  <div className="mt-0.5 text-[12px] text-gray-500">
                    CSV of Excel — we vullen de tijden automatisch in
                  </div>
                </div>
                <input type="file" accept=".csv,.xlsx" className="hidden" />
              </label>

              <div className="mt-10 flex flex-col-reverse gap-2.5 sm:flex-row sm:gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-[14px] font-medium text-gray-600 transition-colors hover:bg-gray-50 sm:w-auto"
                >
                  Terug
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="w-full rounded-xl bg-[#1d1d1b] px-5 py-3.5 text-[14px] font-semibold text-white transition-colors hover:brightness-125 sm:flex-1 sm:text-[15px]"
                >
                  Publiceer mijn praktijk
                </button>
              </div>
            </div>
          )}

          {/* Stap 5 — Klaar */}
          {step === 4 && selectedPractice && (
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600 sm:h-16 sm:w-16">
                <svg
                  className="h-7 w-7 sm:h-8 sm:w-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h1 className="mt-6 text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-gray-900 sm:text-[32px] md:text-[36px]">
                U staat <span className="text-[#7ab0ff]">live.</span>
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-500 sm:text-base">
                Patiënten kunnen nu direct zien wie er waarneemt bij{" "}
                <span className="font-semibold text-gray-900">
                  {selectedPractice.naam}
                </span>
                .
              </p>

              {/* Preview */}
              <div className="mt-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_8px_24px_-12px_rgba(15,23,40,0.1)]">
                <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                    Zo zien patiënten het
                  </p>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="text-[12px] font-medium text-gray-400">
                    Uw praktijk
                  </div>
                  <div className="mt-1 text-[18px] font-semibold text-gray-900 sm:text-[20px]">
                    {selectedPractice.naam}
                  </div>
                  <div className="mt-0.5 text-[13px] text-gray-500">
                    {selectedPractice.adres}, {selectedPractice.postcode}
                  </div>

                  {selectedPartners.length > 0 && (
                    <div className="mt-5 space-y-2">
                      <p className="text-[12px] font-medium text-gray-400">
                        Waarnemers
                      </p>
                      {selectedPartners.map((id, index) => {
                        const p = getPractice(id);
                        if (!p) return null;
                        return (
                          <div
                            key={id}
                            className="flex items-start gap-3 rounded-xl border border-[#eef4ff] bg-[#f6faff] px-4 py-3"
                          >
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold ${
                                index === 0
                                  ? "bg-[#3585ff] text-white"
                                  : "bg-white text-[#3585ff]"
                              }`}
                            >
                              {index + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[14px] font-semibold text-gray-900">
                                {p.naam}
                              </div>
                              <div className="truncate text-[12px] text-gray-500">
                                {p.adres} · {p.telefoon}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-5">
                    <p className="mb-2 text-[12px] font-medium text-gray-400">
                      Openingstijden
                    </p>
                    <div className="space-y-1">
                      {DAYS.map((day) => {
                        const s = weekSchedule[day];
                        return (
                          <div
                            key={day}
                            className="flex items-center justify-between text-[13px]"
                          >
                            <span className="text-gray-500">{day}</span>
                            <span
                              className={
                                s.open
                                  ? "font-medium text-gray-900"
                                  : "text-gray-400"
                              }
                            >
                              {s.open ? `${s.van} — ${s.tot}` : "Gesloten"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {selectedFeestdagen.length > 0 && (
                      <div className="mt-3 border-t border-gray-100 pt-3 text-[12px] text-gray-400">
                        + {selectedFeestdagen.length} feestdag
                        {selectedFeestdagen.length !== 1 ? "en" : ""} gesloten
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <a
                href="/"
                className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-[#1d1d1b] px-5 py-3.5 text-[14px] font-semibold text-white transition-colors hover:brightness-125 sm:w-auto sm:text-[15px]"
              >
                Bekijk mijn praktijk op de site
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
