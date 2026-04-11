"use client";

import { useEffect, useState } from "react";
import {
  zoekPraktijken,
  getPraktijk,
  getNearestPraktijken,
  type Praktijk,
} from "@/lib/praktijk-search";
import { praktijken as allPractices } from "@/data/praktijken";

const DAYS = [
  "Maandag",
  "Dinsdag",
  "Woensdag",
  "Donderdag",
  "Vrijdag",
  "Zaterdag",
  "Zondag",
] as const;

interface DaySchedule {
  open: boolean;
  van: string;
  tot: string;
  pauzeVan?: string;
  pauzeTot?: string;
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
  "Wachtwoord",
  "Klaar",
];

export default function AanmeldenPage() {
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState("");
  const [selectedPractice, setSelectedPractice] = useState<Praktijk | null>(null);
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
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step]);

  const results = zoekPraktijken(query);
  const partners = selectedPractice
    ? getNearestPraktijken(selectedPractice.id, 4)
    : [];

  const claimPractice = (p: Praktijk) => {
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

  const updateDayTime = (
    day: string,
    field: "van" | "tot" | "pauzeVan" | "pauzeTot",
    value: string
  ) => {
    setWeekSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const addPauze = (day: string) => {
    setWeekSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], pauzeVan: "12:00", pauzeTot: "13:00" },
    }));
  };

  const removePauze = (day: string) => {
    setWeekSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], pauzeVan: undefined, pauzeTot: undefined },
    }));
  };

  const passwordScore = (() => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return Math.min(score, 4);
  })();

  const passwordStrengthLabel = password.length === 0
    ? ""
    : passwordScore <= 1
      ? "Zwak"
      : passwordScore === 2
        ? "Redelijk"
        : passwordScore === 3
          ? "Goed"
          : "Sterk";

  const passwordStrengthColor =
    passwordScore <= 1
      ? "bg-red-400"
      : passwordScore === 2
        ? "bg-orange-400"
        : passwordScore === 3
          ? "bg-yellow-400"
          : "bg-green-500";

  const passwordsMatch =
    password.length > 0 && password === passwordConfirm;
  const canSubmitPassword = password.length >= 8 && passwordsMatch;

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
            {step !== 5 && (
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
            )}
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
                              {p.straat}, {p.postcode} {p.plaats}
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
                    {selectedPractice?.straat}
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
                          {p.straat}, {p.plaats} · {p.telefoon}
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
                                  {p.straat}, {p.postcode} {p.plaats}
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
                      const p = getPraktijk(id);
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
                              {p.straat}
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

              <div className="sticky bottom-4 mt-10 flex flex-col-reverse gap-2.5 rounded-xl bg-white/90 p-2 backdrop-blur-sm shadow-[0_12px_32px_-8px_rgba(15,23,40,0.15)] sm:bottom-6 sm:flex-row sm:gap-3">
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
                  const hasPauze =
                    schedule.pauzeVan !== undefined &&
                    schedule.pauzeTot !== undefined;
                  return (
                    <div
                      key={day}
                      className={`px-4 py-3 sm:px-5 ${
                        i < DAYS.length - 1 ? "border-b border-gray-100" : ""
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
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
                              schedule.open
                                ? "translate-x-[22px]"
                                : "translate-x-0.5"
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
                          <>
                            <div className="flex items-center gap-2">
                              <input
                                type="time"
                                value={schedule.van}
                                onChange={(e) =>
                                  updateDayTime(day, "van", e.target.value)
                                }
                                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[13px] text-gray-900 outline-none transition-colors focus:border-[#3585ff]"
                              />
                              <span className="text-[13px] text-gray-400">—</span>
                              <input
                                type="time"
                                value={schedule.tot}
                                onChange={(e) =>
                                  updateDayTime(day, "tot", e.target.value)
                                }
                                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[13px] text-gray-900 outline-none transition-colors focus:border-[#3585ff]"
                              />
                            </div>
                            {!hasPauze && (
                              <button
                                type="button"
                                onClick={() => addPauze(day)}
                                className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-semibold text-[#3585ff] transition-colors hover:bg-[#eef4ff]"
                              >
                                <svg
                                  className="h-3 w-3"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2.6}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M12 5v14M5 12h14" />
                                </svg>
                                Pauze
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-[13px] text-gray-400">Gesloten</span>
                        )}
                      </div>

                      {schedule.open && hasPauze && (
                        <div className="ml-[44px] mt-2 flex flex-wrap items-center gap-2 sm:ml-[48px] sm:gap-3">
                          <span className="text-[12px] font-medium text-gray-500">
                            Pauze
                          </span>
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={schedule.pauzeVan ?? ""}
                              onChange={(e) =>
                                updateDayTime(day, "pauzeVan", e.target.value)
                              }
                              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[13px] text-gray-900 outline-none transition-colors focus:border-[#3585ff]"
                            />
                            <span className="text-[13px] text-gray-400">—</span>
                            <input
                              type="time"
                              value={schedule.pauzeTot ?? ""}
                              onChange={(e) =>
                                updateDayTime(day, "pauzeTot", e.target.value)
                              }
                              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[13px] text-gray-900 outline-none transition-colors focus:border-[#3585ff]"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removePauze(day)}
                            aria-label="Verwijder pauze"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
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
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="sticky bottom-4 mt-10 flex flex-col-reverse gap-2.5 rounded-xl bg-white/90 p-2 backdrop-blur-sm shadow-[0_12px_32px_-8px_rgba(15,23,40,0.15)] sm:bottom-6 sm:flex-row sm:gap-3">
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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1d1d1b] px-5 py-3.5 text-[14px] font-semibold text-white transition-colors hover:brightness-125 sm:flex-1 sm:text-[15px]"
                >
                  Volgende
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
                </button>
              </div>
            </div>
          )}

          {/* Stap 6 — Klaar */}
          {step === 5 && selectedPractice && (
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
                    {selectedPractice.straat}, {selectedPractice.postcode} {selectedPractice.plaats}
                  </div>

                  {selectedPartners.length > 0 && (
                    <div className="mt-5 space-y-2">
                      <p className="text-[12px] font-medium text-gray-400">
                        Waarnemers
                      </p>
                      {selectedPartners.map((id, index) => {
                        const p = getPraktijk(id);
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
                                {p.straat}, {p.plaats} · {p.telefoon}
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
                  </div>
                </div>
              </div>

              <div className="sticky bottom-4 mt-8 sm:bottom-6">
                <a
                  href="/portaal/dashboard?welcome=1"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1d1d1b] px-5 py-4 text-[14px] font-semibold text-white shadow-[0_12px_32px_-8px_rgba(15,23,40,0.3)] transition-colors hover:brightness-125 sm:text-[15px]"
                >
                  Ga naar portaal
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
          )}

          {/* Stap 5 — Wachtwoord instellen */}
          {step === 4 && (
            <div>
              <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-gray-900 sm:text-[32px] md:text-[36px]">
                Stel uw <span className="text-[#7ab0ff]">wachtwoord in.</span>
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-500 sm:text-base">
                Beveilig uw account met een wachtwoord zodat u uw praktijk kunt beheren.
              </p>

              <div className="mt-8 space-y-5">
                {/* Email (readonly context) */}
                {email && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 sm:px-5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                      E-mailadres
                    </div>
                    <div className="mt-1 truncate text-[14px] font-semibold text-gray-900">
                      {email}
                    </div>
                  </div>
                )}

                {/* Wachtwoord */}
                <div>
                  <label className="mb-2 block text-[13px] font-medium text-gray-900">
                    Wachtwoord
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimaal 8 tekens"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 pr-12 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-[#3585ff] focus:shadow-[0_0_0_3px_rgba(53,133,255,0.1)] sm:text-[16px]"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Verberg wachtwoord" : "Toon wachtwoord"}
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
                    >
                      {showPassword ? (
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <path d="M1 1l22 22" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Sterkte-balk */}
                  {password.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center gap-1.5">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              i < passwordScore ? passwordStrengthColor : "bg-gray-100"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[12px]">
                        <span className="text-gray-400">
                          Sterkte: <span className="font-medium text-gray-700">{passwordStrengthLabel}</span>
                        </span>
                        {password.length < 8 && (
                          <span className="text-gray-400">
                            Nog {8 - password.length} teken{8 - password.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Wachtwoord bevestigen */}
                <div>
                  <label className="mb-2 block text-[13px] font-medium text-gray-900">
                    Herhaal wachtwoord
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Vul uw wachtwoord nogmaals in"
                    className={`w-full rounded-xl border bg-white px-4 py-3.5 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:shadow-[0_0_0_3px_rgba(53,133,255,0.1)] sm:text-[16px] ${
                      passwordConfirm.length > 0 && !passwordsMatch
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 focus:border-[#3585ff]"
                    }`}
                  />
                  {passwordConfirm.length > 0 && !passwordsMatch && (
                    <p className="mt-2 text-[12px] font-medium text-red-500">
                      De wachtwoorden komen niet overeen.
                    </p>
                  )}
                  {passwordConfirm.length > 0 && passwordsMatch && (
                    <p className="mt-2 flex items-center gap-1 text-[12px] font-medium text-green-600">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      Wachtwoorden komen overeen
                    </p>
                  )}
                </div>
              </div>

              <div className="sticky bottom-4 mt-10 flex flex-col-reverse gap-2.5 rounded-xl bg-white/90 p-2 backdrop-blur-sm shadow-[0_12px_32px_-8px_rgba(15,23,40,0.15)] sm:bottom-6 sm:flex-row sm:gap-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-[14px] font-medium text-gray-600 transition-colors hover:bg-gray-50 sm:w-auto"
                >
                  Terug
                </button>
                <button
                  type="button"
                  onClick={() => canSubmitPassword && setStep(5)}
                  disabled={!canSubmitPassword}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1d1d1b] px-5 py-3.5 text-[14px] font-semibold text-white transition-colors hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100 sm:flex-1 sm:text-[15px]"
                >
                  Volgende
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
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
