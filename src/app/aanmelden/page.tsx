"use client";

import { useState } from "react";
import {
  zoekPraktijken,
  getPractice,
  getSuggestedPartners,
  practices as allPractices,
} from "@/lib/mock-data";
import type { Practice } from "@/lib/mock-data";

const DAYS = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"] as const;

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

export default function AanmeldenPage() {
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState("");
  const [selectedPractice, setSelectedPractice] = useState<Practice | null>(null);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [partnerQuery, setPartnerQuery] = useState("");
  const [weekSchedule, setWeekSchedule] = useState<Record<string, DaySchedule>>({ ...DEFAULT_SCHEDULE });
  const [selectedFeestdagen, setSelectedFeestdagen] = useState<string[]>([]);

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
      [day]: { ...prev[day], open: !prev[day].open, van: prev[day].open ? "" : "08:00", tot: prev[day].open ? "" : "17:00" },
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
    <div className="min-h-screen bg-[#f7fbff]">
      {/* Simpele header */}
      <div className="border-b border-[#e6ebf3] bg-white px-6 py-5">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <a href="/" className="text-[20px] font-semibold tracking-[-0.03em] text-[#101114]">
            Wieismijnwaarnemer
          </a>
          <div className="flex items-center gap-2 text-sm text-[#9aa5b4]">
            {[1, 2, 3, 4].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${step >= i ? "bg-[#3585ff] text-white" : "bg-[#e6ebf3] text-[#9aa5b4]"}`}>{s}</span>
                {i < 3 && <div className={`h-0.5 w-5 ${step > i ? "bg-[#3585ff]" : "bg-[#e6ebf3]"}`} />}
              </div>
            ))}
            <div className={`h-0.5 w-5 ${step >= 4 ? "bg-[#3585ff]" : "bg-[#e6ebf3]"}`} />
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${step >= 4 ? "bg-[#3585ff] text-white" : "bg-[#e6ebf3] text-[#9aa5b4]"}`}>✓</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-6 py-16">
        {/* Stap 1 — Claim je praktijk */}
        {step === 0 && (
          <div>
            <h1 className="text-[32px] font-semibold tracking-[-0.04em] text-[#0a0c10]">
              Claim je praktijk
            </h1>
            <p className="mt-2 text-[17px] leading-7 text-[#4c5361]">
              Zoek je praktijk en claim deze in 30 seconden.
            </p>

            <div className="relative mt-8">
              <div className="flex items-center rounded-2xl border border-[#d7e7ff] bg-white px-5 py-4 shadow-[0_4px_16px_rgba(53,133,255,0.06)] focus-within:border-[#3585ff] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5 text-[#3585ff]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedPractice(null);
                  }}
                  placeholder="Begin te typen... bijv. Balk, Landauer"
                  className="flex-1 bg-transparent text-[17px] text-[#101114] placeholder:text-[#9aa5b4] outline-none"
                  autoFocus
                />
              </div>

              {!selectedPractice && results.length > 0 && (
                <ul className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-[#e6ebf3] bg-white shadow-[0_8px_24px_rgba(53,133,255,0.08)]">
                  {results.map((p) => (
                    <li key={p.id}>
                      <button
                        onClick={() => claimPractice(p)}
                        className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-[#f7fbff] border-b border-[#f0f4f8] last:border-0"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef5ff] text-lg">
                          🏥
                        </div>
                        <div>
                          <div className="text-[16px] font-semibold text-[#101114]">{p.naam}</div>
                          <div className="text-[14px] text-[#4c5361]">{p.adres}, {p.postcode}</div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {!selectedPractice && query.length >= 2 && results.length === 0 && (
                <div className="mt-2 rounded-xl border border-[#e6ebf3] bg-white px-5 py-4 text-[15px] text-[#4c5361]">
                  Geen praktijk gevonden. Neem contact op zodat we je kunnen toevoegen.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stap 2 — Verificatie */}
        {step === 1 && (
          <div>
            <h1 className="text-[32px] font-semibold tracking-[-0.04em] text-[#0a0c10]">
              Verifieer je email
            </h1>
            <p className="mt-2 text-[17px] leading-7 text-[#4c5361]">
              We sturen een code naar je praktijk-email.
            </p>

            {/* Geselecteerde praktijk */}
            <div className="mt-6 flex items-center gap-4 rounded-xl border border-[#e6ebf3] bg-white px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef5ff] text-lg">🏥</div>
              <div>
                <div className="text-[16px] font-semibold text-[#101114]">{selectedPractice?.naam}</div>
                <div className="text-[14px] text-[#4c5361]">{selectedPractice?.adres}</div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-[15px] font-medium text-[#0a0c10] mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info@uwpraktijk.nl"
                  className="w-full rounded-xl border border-[#d7e7ff] bg-white px-5 py-3.5 text-[16px] text-[#101114] placeholder:text-[#9aa5b4] outline-none focus:border-[#3585ff] transition-colors"
                  autoFocus
                />
              </div>

              {!otpSent && (
                <button
                  onClick={() => setOtpSent(true)}
                  disabled={!email || !email.includes("@")}
                  className="w-full rounded-xl bg-[#3585ff] py-4 text-[17px] font-semibold text-white shadow-[0_10px_25px_rgba(53,133,255,0.25)] transition hover:translate-y-[-1px] disabled:opacity-40 disabled:hover:translate-y-0"
                >
                  Stuur verificatiecode →
                </button>
              )}

              {otpSent && (
                <div>
                  <div className="rounded-xl bg-[#eef5ff] px-4 py-3 text-[14px] text-[#3585ff]">
                    Code verstuurd naar <span className="font-semibold">{email}</span>
                  </div>

                  <label className="mt-4 block text-[15px] font-medium text-[#0a0c10] mb-3">Voer de 6-cijferige code in</label>
                  <div className="flex justify-center gap-2.5">
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
                          if (val && i < 5) {
                            const next = e.target.nextElementSibling as HTMLInputElement | null;
                            next?.focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !otp[i] && i > 0) {
                            const prev = (e.target as HTMLInputElement).previousElementSibling as HTMLInputElement | null;
                            prev?.focus();
                          }
                        }}
                        className="h-14 w-12 rounded-xl border-2 border-[#e6ebf3] bg-white text-center text-[22px] font-semibold text-[#101114] outline-none transition-colors focus:border-[#3585ff] focus:shadow-[0_0_0_3px_rgba(53,133,255,0.1)]"
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-center text-[13px] text-[#9aa5b4]">
                    Demo: vul willekeurige cijfers in
                  </p>

                  <button
                    onClick={() => setStep(2)}
                    disabled={otp.filter((d) => d).length < 6}
                    className="mt-6 w-full rounded-xl bg-[#3585ff] py-4 text-[17px] font-semibold text-white shadow-[0_10px_25px_rgba(53,133,255,0.25)] transition hover:translate-y-[-1px] disabled:opacity-40 disabled:hover:translate-y-0"
                  >
                    Verifieer →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stap 3 — Twee vragen */}
        {step === 2 && (
          <div>
            <h1 className="text-[32px] font-semibold tracking-[-0.04em] text-[#0a0c10]">
              Bijna klaar
            </h1>
            <p className="mt-2 text-[17px] leading-7 text-[#4c5361]">
              Nog twee snelle vragen, dan sta je live.
            </p>

            <div className="mt-8 space-y-8">
              {/* Vraag 1 — Waarnemers */}
              <div>
                <label className="block text-[16px] font-semibold text-[#0a0c10] mb-1">
                  Wie neemt meestal waar voor jullie?
                </label>
                <p className="text-[14px] text-[#4c5361] mb-3">
                  We hebben praktijken in je buurt gevonden. Selecteer er een of meerdere.
                </p>

                {/* Suggested partners */}
                <div className="space-y-2">
                  {partners.map((p) => {
                    const isSelected = selectedPartners.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() =>
                          setSelectedPartners((prev) =>
                            isSelected ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                          )
                        }
                        className={`flex w-full items-center gap-4 rounded-xl border px-5 py-4 text-left transition ${
                          isSelected
                            ? "border-[#3585ff] bg-[#f0f7ff] shadow-[0_0_0_1px_#3585ff]"
                            : "border-[#e6ebf3] bg-white hover:border-[#d7e7ff]"
                        }`}
                      >
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                          isSelected ? "border-[#3585ff] bg-[#3585ff]" : "border-[#d0d5dd]"
                        }`}>
                          {isSelected && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="text-[15px] font-semibold text-[#101114]">{p.naam}</div>
                          <div className="text-[13px] text-[#4c5361]">{p.adres} &middot; {p.telefoon}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Zoek andere praktijken */}
                <div className="mt-4 rounded-xl border border-dashed border-[#d7e7ff] bg-[#f7fbff] p-4">
                  <p className="text-[14px] font-medium text-[#4c5361] mb-3">
                    Staat je waarnemer er niet bij? Zoek hieronder:
                  </p>
                  <div className="relative">
                    <div className="flex items-center rounded-lg border border-[#e6ebf3] bg-white px-4 py-3 focus-within:border-[#3585ff] transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4 text-[#9aa5b4]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        value={partnerQuery}
                        onChange={(e) => setPartnerQuery(e.target.value)}
                        placeholder="Zoek op naam of postcode..."
                        className="flex-1 bg-transparent text-[14px] text-[#101114] placeholder:text-[#9aa5b4] outline-none"
                      />
                    </div>

                    {partnerQuery.length >= 2 && (() => {
                      const searchResults = allPractices.filter(
                        (p) =>
                          p.id !== selectedPractice?.id &&
                          !partners.some((sp) => sp.id === p.id) &&
                          (p.naam.toLowerCase().includes(partnerQuery.toLowerCase()) ||
                           p.postcode.toLowerCase().replace(/\s/g, "").includes(partnerQuery.toLowerCase().replace(/\s/g, "")))
                      );
                      if (searchResults.length === 0) return (
                        <div className="mt-2 rounded-lg bg-white px-4 py-3 text-[13px] text-[#9aa5b4]">
                          Geen praktijken gevonden
                        </div>
                      );
                      return (
                        <div className="mt-2 space-y-1.5">
                          {searchResults.map((p) => {
                            const isSelected = selectedPartners.includes(p.id);
                            return (
                              <button
                                key={p.id}
                                onClick={() => {
                                  setSelectedPartners((prev) =>
                                    isSelected ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                                  );
                                  setPartnerQuery("");
                                }}
                                className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition ${
                                  isSelected
                                    ? "border-[#3585ff] bg-[#f0f7ff]"
                                    : "border-[#e6ebf3] bg-white hover:border-[#d7e7ff]"
                                }`}
                              >
                                <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                  isSelected ? "border-[#3585ff] bg-[#3585ff]" : "border-[#d0d5dd]"
                                }`}>
                                  {isSelected && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <div>
                                  <div className="text-[14px] font-semibold text-[#101114]">{p.naam}</div>
                                  <div className="text-[12px] text-[#4c5361]">{p.adres}, {p.postcode}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                </div>
              </div>

              {/* Volgorde waarnemers */}
              {selectedPartners.length > 0 && (
                <div className="mt-6">
                  <label className="block text-[16px] font-semibold text-[#0a0c10] mb-1">
                    Volgorde van waarneming
                  </label>
                  <p className="text-[14px] text-[#4c5361] mb-3">
                    Sleep of gebruik de pijltjes om de volgorde te bepalen.
                  </p>

                  <div className="space-y-2">
                    {selectedPartners.map((id, index) => {
                      const p = getPractice(id);
                      if (!p) return null;
                      return (
                        <div
                          key={id}
                          className="flex items-center gap-3 rounded-xl border border-[#e6ebf3] bg-white px-4 py-3"
                        >
                          {/* Rank badge */}
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold ${
                            index === 0
                              ? "bg-[#3585ff] text-white"
                              : index === 1
                                ? "bg-[#eef5ff] text-[#3585ff]"
                                : "bg-[#f0f4f8] text-[#9aa5b4]"
                          }`}>
                            {index + 1}e
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-semibold text-[#101114] truncate">{p.naam}</div>
                            <div className="text-[12px] text-[#9aa5b4]">{p.adres}</div>
                          </div>

                          {/* Move buttons */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => {
                                if (index === 0) return;
                                setSelectedPartners((prev) => {
                                  const arr = [...prev];
                                  [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
                                  return arr;
                                });
                              }}
                              disabled={index === 0}
                              className="flex h-6 w-6 items-center justify-center rounded text-[#9aa5b4] hover:bg-[#f0f4f8] hover:text-[#101114] disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                if (index === selectedPartners.length - 1) return;
                                setSelectedPartners((prev) => {
                                  const arr = [...prev];
                                  [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
                                  return arr;
                                });
                              }}
                              disabled={index === selectedPartners.length - 1}
                              className="flex h-6 w-6 items-center justify-center rounded text-[#9aa5b4] hover:bg-[#f0f4f8] hover:text-[#101114] disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>

                          {/* Remove */}
                          <button
                            onClick={() => setSelectedPartners((prev) => prev.filter((pid) => pid !== id))}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9aa5b4] hover:bg-red-50 hover:text-red-500"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-10 flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="rounded-xl border border-[#e6ebf3] bg-white px-6 py-4 text-[15px] font-medium text-[#4c5361] transition hover:border-[#d7e7ff]"
              >
                ← Terug
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={selectedPartners.length === 0}
                className="flex-1 rounded-xl bg-[#3585ff] py-4 text-[17px] font-semibold text-white shadow-[0_10px_25px_rgba(53,133,255,0.25)] transition hover:translate-y-[-1px] disabled:opacity-40 disabled:hover:translate-y-0"
              >
                Volgende →
              </button>
            </div>
          </div>
        )}

        {/* Stap 4 — Openingstijden */}
        {step === 3 && (
          <div>
            <h1 className="text-[32px] font-semibold tracking-[-0.04em] text-[#0a0c10]">
              Openingstijden
            </h1>
            <p className="mt-2 text-[17px] leading-7 text-[#4c5361]">
              We hebben standaard tijden ingevuld. Pas aan wat anders is.
            </p>

            {/* Weekrooster */}
            <div className="mt-8 rounded-xl border border-[#e6ebf3] bg-white overflow-hidden">
              {DAYS.map((day, i) => {
                const schedule = weekSchedule[day];
                return (
                  <div
                    key={day}
                    className={`flex items-center gap-3 px-4 py-3 ${
                      i < DAYS.length - 1 ? "border-b border-[#f0f4f8]" : ""
                    }`}
                  >
                    <button
                      onClick={() => toggleDayOpen(day)}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                        schedule.open ? "bg-[#3585ff]" : "bg-[#e6ebf3]"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          schedule.open ? "translate-x-[22px]" : "translate-x-0.5"
                        }`}
                      />
                    </button>

                    <span className={`w-24 text-[14px] font-medium ${
                      schedule.open ? "text-[#101114]" : "text-[#9aa5b4]"
                    }`}>
                      {day}
                    </span>

                    {schedule.open ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={schedule.van}
                          onChange={(e) => updateDayTime(day, "van", e.target.value)}
                          className="rounded-lg border border-[#e6ebf3] px-2.5 py-1.5 text-[13px] text-[#101114] outline-none focus:border-[#3585ff]"
                        />
                        <span className="text-[13px] text-[#9aa5b4]">—</span>
                        <input
                          type="time"
                          value={schedule.tot}
                          onChange={(e) => updateDayTime(day, "tot", e.target.value)}
                          className="rounded-lg border border-[#e6ebf3] px-2.5 py-1.5 text-[13px] text-[#101114] outline-none focus:border-[#3585ff]"
                        />
                      </div>
                    ) : (
                      <span className="text-[13px] text-[#9aa5b4]">Gesloten</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Feestdagen */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[15px] font-semibold text-[#0a0c10]">
                  Feestdagen (gesloten)
                </label>
                <button
                  onClick={selectAllFeestdagen}
                  className="text-[13px] font-medium text-[#3585ff] hover:underline"
                >
                  Alle selecteren
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {FEESTDAGEN.map((feestdag) => {
                  const isSelected = selectedFeestdagen.includes(feestdag.naam);
                  return (
                    <button
                      key={feestdag.naam}
                      onClick={() => toggleFeestdag(feestdag.naam)}
                      className={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left transition ${
                        isSelected
                          ? "border-[#3585ff] bg-[#f0f7ff]"
                          : "border-[#e6ebf3] bg-white hover:border-[#d7e7ff]"
                      }`}
                    >
                      <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        isSelected ? "border-[#3585ff] bg-[#3585ff]" : "border-[#d0d5dd]"
                      }`}>
                        {isSelected && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-[#101114]">{feestdag.naam}</div>
                        <div className="text-[11px] text-[#9aa5b4]">{feestdag.datum}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CSV upload */}
            <div className="mt-6">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-[#d7e7ff] bg-[#f7fbff] px-4 py-3 transition hover:border-[#3585ff]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#3585ff]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-[13px] text-[#4c5361]">
                  Of <span className="font-medium text-[#3585ff]">upload een rooster</span> (CSV/Excel)
                </span>
                <input type="file" accept=".csv,.xlsx" className="hidden" />
              </label>
            </div>

            <div className="mt-10 flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="rounded-xl border border-[#e6ebf3] bg-white px-6 py-4 text-[15px] font-medium text-[#4c5361] transition hover:border-[#d7e7ff]"
              >
                ← Terug
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 rounded-xl bg-[#3585ff] py-4 text-[17px] font-semibold text-white shadow-[0_10px_25px_rgba(53,133,255,0.25)] transition hover:translate-y-[-1px]"
              >
                Publiceer mijn praktijk →
              </button>
            </div>
          </div>
        )}

        {/* Stap 5 — Done */}
        {step === 4 && selectedPractice && (
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#e8f5e9] text-4xl">
              ✅
            </div>

            <h1 className="mt-6 text-[36px] font-semibold tracking-[-0.04em] text-[#0a0c10]">
              Je staat live!
            </h1>
            <p className="mt-2 text-[17px] leading-7 text-[#4c5361]">
              Patiënten kunnen nu zien wie er waarneemt bij {selectedPractice.naam}.
            </p>

            {/* Preview */}
            <div className="mt-10 rounded-2xl border border-[#e6ebf3] bg-white p-6 text-left shadow-[0_8px_24px_rgba(53,133,255,0.06)]">
              <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#3585ff]">
                Preview — zo zien patiënten het
              </p>

              <div className="mt-4 rounded-xl bg-[#f7fbff] p-5">
                <div className="text-[14px] font-medium text-[#4c5361]">Jouw praktijk</div>
                <div className="mt-1 text-[20px] font-semibold text-[#101114]">{selectedPractice.naam}</div>
                <div className="mt-1 text-[15px] text-[#4c5361]">{selectedPractice.adres}, {selectedPractice.postcode}</div>
              </div>

              {selectedPartners.length > 0 && (
                <div className="mt-3 space-y-2">
                  {selectedPartners.map((id) => {
                    const p = getPractice(id);
                    if (!p) return null;
                    return (
                      <div key={id} className="rounded-xl border-2 border-[#3585ff]/20 bg-[#f0f7ff] p-5">
                        <div className="text-[14px] font-medium text-[#3585ff]">Waarnemer</div>
                        <div className="mt-1 text-[20px] font-semibold text-[#101114]">{p.naam}</div>
                        <div className="mt-1 text-[15px] text-[#4c5361]">{p.adres} &middot; {p.telefoon}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-3 rounded-xl bg-[#f7fbff] p-5">
                <div className="text-[14px] font-medium text-[#4c5361]">Openingstijden</div>
                <div className="mt-2 space-y-1">
                  {DAYS.map((day) => {
                    const s = weekSchedule[day];
                    return (
                      <div key={day} className="flex justify-between text-[14px]">
                        <span className="text-[#4c5361]">{day}</span>
                        <span className={s.open ? "font-medium text-[#101114]" : "text-[#9aa5b4]"}>
                          {s.open ? `${s.van} — ${s.tot}` : "Gesloten"}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {selectedFeestdagen.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#e6ebf3]">
                    <div className="text-[13px] text-[#9aa5b4]">
                      + {selectedFeestdagen.length} feestdag{selectedFeestdagen.length !== 1 ? "en" : ""} gesloten
                    </div>
                  </div>
                )}
              </div>
            </div>

            <a
              href="/"
              className="mt-8 inline-block rounded-xl bg-[#3585ff] px-8 py-4 text-[17px] font-semibold text-white shadow-[0_10px_25px_rgba(53,133,255,0.25)] transition hover:translate-y-[-1px]"
            >
              Bekijk je praktijk op de site →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
