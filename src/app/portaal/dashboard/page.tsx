"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { zoekPraktijken, type Praktijk } from "@/lib/praktijk-search";
import { praktijken as allPraktijken } from "@/data/praktijken";
import { getDutchHolidays, formatHolidayDate } from "@/lib/holidays";

type NavKey = "waarnemers" | "openingstijden" | "praktijk";

const navItems: { key: NavKey; label: string; icon: React.ReactNode }[] = [
  {
    key: "waarnemers",
    label: "Waarnemers",
    icon: (
      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: "openingstijden",
    label: "Openingstijden & afwezigheid",
    icon: (
      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    key: "praktijk",
    label: "Mijn praktijk",
    icon: (
      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 22V12h6v10" />
      </svg>
    ),
  },
];

const DAYS = [
  "Maandag",
  "Dinsdag",
  "Woensdag",
  "Donderdag",
  "Vrijdag",
  "Zaterdag",
  "Zondag",
] as const;

// Feestdagen worden dynamisch per jaar berekend via getDutchHolidays().
// Zie src/lib/holidays.ts voor het Meeus/Jones/Butcher Pasen-algoritme.

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

// Initiële waarnemers — eerste 3 Purmerend praktijken uit de echte database
const INITIAL_WAARNEMER_IDS: string[] = allPraktijken
  .filter((p) => p.stad === "Purmerend")
  .slice(0, 3)
  .map((p) => p.id);

interface VrijeDag {
  id: string;
  date: string; // YYYY-MM-DD
  reden: string;
  waarnemerId?: string;
  fullDay: boolean;
  van?: string;
  tot?: string;
}

const NL_MONTH_LOOKUP: Record<string, number> = {
  jan: 0, januari: 0,
  feb: 1, februari: 1,
  mrt: 2, maart: 2,
  apr: 3, april: 3,
  mei: 4,
  jun: 5, juni: 5,
  jul: 6, juli: 6,
  aug: 7, augustus: 7,
  sep: 8, sept: 8, september: 8,
  okt: 9, oktober: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

// Extract alle datums uit vrije tekst (CSV, OCR, PDF text, etc.)
function extractDatesFromText(text: string): string[] {
  const seen = new Set<string>();
  const currentYear = new Date().getFullYear();
  let m: RegExpExecArray | null;

  // YYYY-MM-DD
  const isoRe = /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g;
  while ((m = isoRe.exec(text)) !== null) {
    seen.add(
      `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`
    );
  }

  // DD-MM-YYYY | DD/MM/YYYY | DD.MM.YYYY
  const euRe = /\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/g;
  while ((m = euRe.exec(text)) !== null) {
    const day = parseInt(m[1], 10);
    const mon = parseInt(m[2], 10);
    if (day < 1 || day > 31 || mon < 1 || mon > 12) continue;
    seen.add(
      `${m[3]}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    );
  }

  // "25 december 2025", "25 dec", etc.
  const txtRe =
    /\b(\d{1,2})\s+([a-zA-ZéÉ]{3,10})\.?\s*(\d{4})?\b/g;
  while ((m = txtRe.exec(text)) !== null) {
    const day = parseInt(m[1], 10);
    const monthKey = m[2].toLowerCase();
    const month = NL_MONTH_LOOKUP[monthKey];
    if (month === undefined || day < 1 || day > 31) continue;
    const year = m[3] ? parseInt(m[3], 10) : currentYear;
    seen.add(
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    );
  }

  return Array.from(seen).sort();
}

function parseCsvPreview(text: string, maxRows = 6): string[][] {
  const rows: string[][] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    rows.push(line.split(/[,;\t]/).map((c) => c.trim()));
    if (rows.length >= maxRows) break;
  }
  return rows;
}

export default function CrmDashboardPage() {
  const [active, setActive] = useState<NavKey>("waarnemers");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Praktijk info (editable)
  const [praktijkNaam, setPraktijkNaam] = useState("Huisartsenpraktijk De Gors");
  const [praktijkAdres, setPraktijkAdres] = useState("Dorpsstraat 12");
  const [praktijkPostcode, setPraktijkPostcode] = useState("1441 AB");
  const [praktijkPlaats, setPraktijkPlaats] = useState("Purmerend");
  const [praktijkTelefoon, setPraktijkTelefoon] = useState("0299-987654");
  const [praktijkEmail, setPraktijkEmail] = useState("info@degors.nl");
  const [praktijkWebsite, setPraktijkWebsite] = useState("https://www.degors.nl");
  const [praktijkLogo, setPraktijkLogo] = useState<string | null>(null);

  // Dokters
  interface Dokter {
    id: string;
    voornaam: string;
    achternaam: string;
    telefoon: string;
    email: string;
  }
  const [dokters, setDokters] = useState<Dokter[]>([]);
  const [dokterModalOpen, setDokterModalOpen] = useState(false);
  const [editingDokterId, setEditingDokterId] = useState<string | null>(null);
  const [dokterDraft, setDokterDraft] = useState<Partial<Dokter>>({});

  const openAddDokterModal = () => {
    setEditingDokterId(null);
    setDokterDraft({});
    setDokterModalOpen(true);
  };
  const openEditDokterModal = (d: Dokter) => {
    setEditingDokterId(d.id);
    setDokterDraft({ ...d });
    setDokterModalOpen(true);
  };
  const closeDokterModal = () => {
    setDokterModalOpen(false);
    setEditingDokterId(null);
    setDokterDraft({});
  };
  const saveDokter = () => {
    const voornaam = (dokterDraft.voornaam ?? "").trim();
    const achternaam = (dokterDraft.achternaam ?? "").trim();
    if (!voornaam && !achternaam) return;
    if (editingDokterId) {
      setDokters((prev) =>
        prev.map((d) =>
          d.id === editingDokterId
            ? {
                ...d,
                voornaam,
                achternaam,
                telefoon: (dokterDraft.telefoon ?? "").trim(),
                email: (dokterDraft.email ?? "").trim(),
              }
            : d
        )
      );
    } else {
      setDokters((prev) => [
        ...prev,
        {
          id: `d-${Date.now()}`,
          voornaam,
          achternaam,
          telefoon: (dokterDraft.telefoon ?? "").trim(),
          email: (dokterDraft.email ?? "").trim(),
        },
      ]);
    }
    closeDokterModal();
  };
  const removeDokter = (id: string) =>
    setDokters((prev) => prev.filter((d) => d.id !== id));

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPraktijkLogo(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Openingstijden
  const [weekSchedule, setWeekSchedule] = useState<Record<string, DaySchedule>>({
    ...DEFAULT_SCHEDULE,
  });

  // Feestdagen voor huidig jaar + volgend jaar (zodat kerst→nieuwjaar over de
  // jaargrens heen blijven verschijnen).
  const currentFeestdagenYear = new Date().getFullYear();
  const feestdagenList = useMemo(
    () => [
      ...getDutchHolidays(currentFeestdagenYear),
      ...getDutchHolidays(currentFeestdagenYear + 1),
    ],
    [currentFeestdagenYear]
  );

  // Sluitingsdagen — opgeslagen als ISO-datums (YYYY-MM-DD) zodat elke
  // feestdag per jaar apart aan/uit kan.
  const [selectedFeestdagen, setSelectedFeestdagen] = useState<string[]>(() => {
    const y = new Date().getFullYear();
    return [
      `${y}-01-01`, // Nieuwjaarsdag
      `${y}-12-25`, // Eerste Kerstdag
      `${y}-12-26`, // Tweede Kerstdag
    ];
  });
  // Extra vrije dagen (overrides op weekrooster + feestdagen)
  const [vrijeDagen, setVrijeDagen] = useState<VrijeDag[]>([]);
  const [vrijeDagModalOpen, setVrijeDagModalOpen] = useState(false);
  const [editingVrijeDagId, setEditingVrijeDagId] = useState<string | null>(null);
  const [vrijeDagDraft, setVrijeDagDraft] = useState<Partial<VrijeDag>>({});
  const [showNextYearFeestdagen, setShowNextYearFeestdagen] = useState(false);

  // Rooster upload
  const [roosterFile, setRoosterFile] = useState<{
    name: string;
    type: "csv" | "image" | "pdf" | "other";
    dataUrl?: string;
    pdfUrl?: string;
    csvPreview?: string[][];
    processing?: boolean;
  } | null>(null);
  const [roosterImportSummary, setRoosterImportSummary] = useState<{
    datesAdded: number;
    feestdagenMatched: number;
  } | null>(null);
  const [roosterError, setRoosterError] = useState<string | null>(null);

  // Opslaan feedback + dirty-state detectie
  const [saveToastOpen, setSaveToastOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const savedSnapshotRef = useRef<string | null>(null);
  const saveToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Welkomstmodal + onboarding-tour (vanuit /aanmelden met ?welcome=1)
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [onboardingHighlight, setOnboardingHighlight] = useState<
    "rooster" | "feestdagen" | "extra" | null
  >(null);
  const vrijeDagenSectionRef = useRef<HTMLElement | null>(null);
  const roosterBlockRef = useRef<HTMLDivElement | null>(null);
  const feestdagenBlockRef = useRef<HTMLDivElement | null>(null);
  const extraBlockRef = useRef<HTMLDivElement | null>(null);
  const onboardingTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("welcome") === "1") {
      setWelcomeOpen(true);
      // URL opschonen zodat refresh de modal niet opnieuw triggert
      const url = new URL(window.location.href);
      url.searchParams.delete("welcome");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  useEffect(() => {
    const timers = onboardingTimersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  const scrollIntoCenter = (el: HTMLElement | null) => {
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const closeWelcomeAndStartTour = () => {
    setWelcomeOpen(false);
    setActive("openingstijden");
    setTimeout(() => {
      setOnboardingHighlight("rooster");
      scrollIntoCenter(roosterBlockRef.current);
    }, 100);
  };

  const nextOnboardingStep = () => {
    if (onboardingHighlight === "rooster") {
      setOnboardingHighlight("feestdagen");
      setTimeout(
        () => scrollIntoCenter(feestdagenBlockRef.current),
        50
      );
    } else if (onboardingHighlight === "feestdagen") {
      setOnboardingHighlight("extra");
      setTimeout(() => scrollIntoCenter(extraBlockRef.current), 50);
    } else if (onboardingHighlight === "extra") {
      setOnboardingHighlight(null);
      setTimeout(() => {
        vrijeDagenSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 50);
    }
  };

  const skipOnboarding = () => {
    setOnboardingHighlight(null);
    setTimeout(() => {
      vrijeDagenSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const ONBOARDING_STEPS = {
    rooster: {
      index: 1,
      body: "Importeer uw rooster met alle dagen waarop uw praktijk dicht is.",
      last: false,
    },
    feestdagen: {
      index: 2,
      body: "Of selecteer de feestdagen handmatig waarop u gesloten bent.",
      last: false,
    },
    extra: {
      index: 3,
      body: "Voeg hier uw eigen vrije dagen handmatig toe.",
      last: true,
    },
  } as const;
  useEffect(() => {
    return () => {
      if (saveToastTimer.current) clearTimeout(saveToastTimer.current);
    };
  }, []);

  // Waarnemers — alleen IDs, info komt live uit de echte database
  const [waarnemerIds, setWaarnemerIds] = useState<string[]>(INITIAL_WAARNEMER_IDS);
  // Lokale overrides op database-velden (bv. eigen telefoonnummer)
  const [waarnemerOverrides, setWaarnemerOverrides] = useState<
    Record<string, Partial<Praktijk>>
  >({});

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addQuery, setAddQuery] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<"replace" | "fields">("replace");
  const [editQuery, setEditQuery] = useState("");
  const [editDraft, setEditDraft] = useState<Partial<Praktijk>>({});

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const waarnemers = useMemo(
    () =>
      waarnemerIds
        .map((id) => {
          const base = allPraktijken.find((p) => p.id === id);
          if (!base) return undefined;
          return { ...base, ...waarnemerOverrides[id] };
        })
        .filter((p): p is Praktijk => p !== undefined),
    [waarnemerIds, waarnemerOverrides]
  );

  const addResults = useMemo(
    () =>
      zoekPraktijken(addQuery, 6).filter((p) => !waarnemerIds.includes(p.id)),
    [addQuery, waarnemerIds]
  );

  const editReplaceResults = useMemo(
    () =>
      zoekPraktijken(editQuery, 6).filter(
        (p) => !waarnemerIds.includes(p.id) || p.id === editingId
      ),
    [editQuery, waarnemerIds, editingId]
  );

  const editingWaarnemer = editingId
    ? waarnemers.find((w) => w.id === editingId)
    : null;
  const deletingWaarnemer = deletingId
    ? waarnemers.find((w) => w.id === deletingId)
    : null;

  // Escape + backdrop close voor modals
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (addModalOpen) closeAddModal();
      if (editingId) closeEditModal();
      if (deletingId) closeDeleteModal();
      if (dokterModalOpen) closeDokterModal();
      if (vrijeDagModalOpen) closeVrijeDagModal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addModalOpen, editingId, deletingId, dokterModalOpen, vrijeDagModalOpen]);

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

  const toggleFeestdag = (date: string) => {
    setSelectedFeestdagen((prev) =>
      prev.includes(date) ? prev.filter((f) => f !== date) : [...prev, date]
    );
  };

  // Vrije dag modal
  const openAddVrijeDagModal = () => {
    setEditingVrijeDagId(null);
    setVrijeDagDraft({ fullDay: true, van: "08:00", tot: "17:00" });
    setVrijeDagModalOpen(true);
  };
  const openEditVrijeDagModal = (v: VrijeDag) => {
    setEditingVrijeDagId(v.id);
    setVrijeDagDraft({ ...v });
    setVrijeDagModalOpen(true);
  };
  const closeVrijeDagModal = () => {
    setVrijeDagModalOpen(false);
    setEditingVrijeDagId(null);
    setVrijeDagDraft({});
  };
  const saveVrijeDag = () => {
    if (!vrijeDagDraft.date) return;
    if (editingVrijeDagId) {
      setVrijeDagen((prev) =>
        prev
          .map((v) =>
            v.id === editingVrijeDagId
              ? ({ ...v, ...vrijeDagDraft } as VrijeDag)
              : v
          )
          .sort((a, b) => a.date.localeCompare(b.date))
      );
    } else {
      const nieuw: VrijeDag = {
        id: `vd-${Date.now()}`,
        date: vrijeDagDraft.date,
        reden: (vrijeDagDraft.reden ?? "").trim(),
        waarnemerId: vrijeDagDraft.waarnemerId || undefined,
        fullDay: vrijeDagDraft.fullDay ?? true,
        van: vrijeDagDraft.fullDay ? undefined : vrijeDagDraft.van,
        tot: vrijeDagDraft.fullDay ? undefined : vrijeDagDraft.tot,
      };
      setVrijeDagen((prev) =>
        [...prev, nieuw].sort((a, b) => a.date.localeCompare(b.date))
      );
    }
    closeVrijeDagModal();
  };
  const removeVrijeDag = (id: string) =>
    setVrijeDagen((prev) => prev.filter((v) => v.id !== id));

  const applyExtractedDates = (text: string) => {
    const dates = extractDatesFromText(text);
    const matchedFeestDates: string[] = [];
    const newVrije: VrijeDag[] = [];
    setVrijeDagen((prev) => {
      const existingDates = new Set(prev.map((v) => v.date));
      for (const iso of dates) {
        const match = feestdagenList.find((f) => f.date === iso);
        if (match) {
          matchedFeestDates.push(match.date);
        } else if (!existingDates.has(iso)) {
          newVrije.push({
            id: `vd-${Date.now()}-${iso}`,
            date: iso,
            reden: "Geïmporteerd uit rooster",
            fullDay: true,
          });
          existingDates.add(iso);
        }
      }
      return [...prev, ...newVrije].sort((a, b) =>
        a.date.localeCompare(b.date)
      );
    });
    setSelectedFeestdagen((prev) =>
      Array.from(new Set([...prev, ...matchedFeestDates]))
    );
    setRoosterImportSummary({
      datesAdded: newVrije.length,
      feestdagenMatched: new Set(matchedFeestDates).size,
    });
  };

  const handleRoosterUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRoosterImportSummary(null);
    setRoosterError(null);

    const lower = file.name.toLowerCase();
    const isCsv =
      lower.endsWith(".csv") ||
      file.type === "text/csv" ||
      file.type === "application/vnd.ms-excel";
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf" || lower.endsWith(".pdf");

    // ==== CSV ====
    if (isCsv) {
      try {
        const text = await file.text();
        setRoosterFile({
          name: file.name,
          type: "csv",
          csvPreview: parseCsvPreview(text),
        });
        applyExtractedDates(text);
      } catch {
        setRoosterError("Kon CSV niet lezen.");
      }
      return;
    }

    // ==== Afbeelding → Tesseract.js OCR ====
    if (isImage) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      setRoosterFile({
        name: file.name,
        type: "image",
        dataUrl,
        processing: true,
      });
      try {
        const Tesseract = await import("tesseract.js");
        const result = await Tesseract.recognize(file, "nld");
        applyExtractedDates(result.data.text);
      } catch (err) {
        console.error(err);
        setRoosterError(
          "Afbeelding kon niet worden gelezen. Voeg datums handmatig toe."
        );
      } finally {
        setRoosterFile((prev) =>
          prev ? { ...prev, processing: false } : prev
        );
      }
      return;
    }

    // ==== PDF → pdfjs tekst-extractie ====
    if (isPdf) {
      const pdfUrl = URL.createObjectURL(file);
      setRoosterFile({
        name: file.name,
        type: "pdf",
        pdfUrl,
        processing: true,
      });
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText +=
            content.items
              .map((item) =>
                "str" in item && typeof item.str === "string" ? item.str : ""
              )
              .join(" ") + "\n";
        }
        if (fullText.trim().length < 5) {
          setRoosterError(
            "Deze PDF bevat geen leesbare tekst (mogelijk een gescande afbeelding). Voeg datums handmatig toe."
          );
        } else {
          applyExtractedDates(fullText);
        }
      } catch (err) {
        console.error(err);
        setRoosterError(
          "PDF kon niet worden gelezen. Voeg datums handmatig toe."
        );
      } finally {
        setRoosterFile((prev) =>
          prev ? { ...prev, processing: false } : prev
        );
      }
      return;
    }

    setRoosterFile({ name: file.name, type: "other" });
  };

  const clearRoosterFile = () => {
    if (roosterFile?.pdfUrl) URL.revokeObjectURL(roosterFile.pdfUrl);
    setRoosterFile(null);
    setRoosterImportSummary(null);
    setRoosterError(null);
  };

  const [recentlyMovedWaarnemerId, setRecentlyMovedWaarnemerId] = useState<
    string | null
  >(null);
  const movedHighlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  useEffect(() => {
    const timer = movedHighlightTimerRef;
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const moveWaarnemer = (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= waarnemerIds.length) return;
    const movedId = waarnemerIds[index];
    setWaarnemerIds((prev) => {
      const arr = [...prev];
      [arr[index], arr[next]] = [arr[next], arr[index]];
      return arr;
    });
    setRecentlyMovedWaarnemerId(movedId);
    if (movedHighlightTimerRef.current) {
      clearTimeout(movedHighlightTimerRef.current);
    }
    movedHighlightTimerRef.current = setTimeout(() => {
      setRecentlyMovedWaarnemerId(null);
    }, 1200);
    // Scroll de verplaatste kaart in beeld in de horizontale lijst
    setTimeout(() => {
      const el = document.querySelector<HTMLLIElement>(
        `[data-waarnemer-id="${movedId}"]`
      );
      el?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }, 50);
  };

  // Add modal
  const openAddModal = () => {
    setAddQuery("");
    setAddModalOpen(true);
  };
  const closeAddModal = () => {
    setAddModalOpen(false);
    setAddQuery("");
  };
  const selectAddResult = (p: Praktijk) => {
    setWaarnemerIds((prev) => (prev.includes(p.id) ? prev : [...prev, p.id]));
    closeAddModal();
  };

  // Edit modal
  const openEditModal = (id: string) => {
    setEditingId(id);
    setEditMode("replace");
    setEditQuery("");
    const current = waarnemers.find((w) => w.id === id);
    setEditDraft(current ? { ...current } : {});
  };
  const closeEditModal = () => {
    setEditingId(null);
    setEditQuery("");
    setEditDraft({});
    setEditMode("replace");
  };
  const replaceWaarnemer = (newPraktijk: Praktijk) => {
    if (!editingId) return;
    setWaarnemerIds((prev) =>
      prev.map((id) => (id === editingId ? newPraktijk.id : id))
    );
    setWaarnemerOverrides((prev) => {
      const next = { ...prev };
      delete next[editingId];
      return next;
    });
    closeEditModal();
  };
  const saveEditFields = () => {
    if (!editingId) return;
    setWaarnemerOverrides((prev) => ({
      ...prev,
      [editingId]: { ...editDraft },
    }));
    closeEditModal();
  };

  // Delete modal
  const openDeleteModal = (id: string) => setDeletingId(id);
  const closeDeleteModal = () => setDeletingId(null);
  const confirmDelete = () => {
    if (deletingId) {
      setWaarnemerIds((prev) => prev.filter((wid) => wid !== deletingId));
      setWaarnemerOverrides((prev) => {
        const next = { ...prev };
        delete next[deletingId];
        return next;
      });
    }
    closeDeleteModal();
  };

  // Snapshot van alle editable state. Wordt vergeleken met savedSnapshotRef
  // om te bepalen of er niet-opgeslagen wijzigingen zijn.
  const stateSnapshot = useMemo(
    () =>
      JSON.stringify({
        praktijkNaam,
        praktijkAdres,
        praktijkPostcode,
        praktijkPlaats,
        praktijkTelefoon,
        praktijkEmail,
        praktijkWebsite,
        praktijkLogo,
        dokters,
        waarnemerIds,
        waarnemerOverrides,
        weekSchedule,
        selectedFeestdagen,
        vrijeDagen,
      }),
    [
      praktijkNaam,
      praktijkAdres,
      praktijkPostcode,
      praktijkPlaats,
      praktijkTelefoon,
      praktijkEmail,
      praktijkWebsite,
      praktijkLogo,
      dokters,
      waarnemerIds,
      waarnemerOverrides,
      weekSchedule,
      selectedFeestdagen,
      vrijeDagen,
    ]
  );

  useEffect(() => {
    if (savedSnapshotRef.current === null) {
      savedSnapshotRef.current = stateSnapshot;
      return;
    }
    setIsDirty(stateSnapshot !== savedSnapshotRef.current);
  }, [stateSnapshot]);

  const handleSave = () => {
    savedSnapshotRef.current = stateSnapshot;
    setIsDirty(false);
    if (saveToastTimer.current) clearTimeout(saveToastTimer.current);
    setSaveToastOpen(true);
    saveToastTimer.current = setTimeout(() => setSaveToastOpen(false), 2500);
  };

  const handleDiscard = () => {
    // Placeholder: een echte revert vereist het herstellen van alle state
    // uit de snapshot. Voor nu sluiten we alleen de dirty-indicator,
    // zodat de gebruiker niet per ongeluk in een lock-in zit.
    savedSnapshotRef.current = stateSnapshot;
    setIsDirty(false);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-black/[0.06] bg-white transition-transform lg:translate-x-0 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[68px] items-center gap-2 border-b border-black/[0.06] px-6">
          <Link href="/" className="inline-flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Wieismijnwaarnemer" className="h-8 w-auto" />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
            Menu
          </p>
          <ul className="flex flex-col gap-0.5">
            {navItems.map((item) => {
              const isActive = active === item.key;
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => {
                      setActive(item.key);
                      setMobileNavOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14px] font-medium transition-colors ${
                      isActive
                        ? "bg-[#eef4ff] text-[#3585ff]"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-black/[0.06] p-3">
          <Link
            href="/portaal"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Uitloggen
          </Link>
        </div>
      </aside>

      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Main */}
      <div className="lg:pl-[260px]">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-black/[0.06] bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden"
              aria-label="Menu"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-[18px] font-semibold tracking-[-0.01em] text-gray-900 sm:text-[20px]">
                {active === "waarnemers"
                  ? "Waarnemers"
                  : active === "openingstijden"
                    ? "Openingstijden & afwezigheid"
                    : "Mijn praktijk"}
              </h1>
              <p className="hidden text-[13px] text-gray-500 sm:block">
                {active === "waarnemers"
                  ? "Beheer wie uw praktijk waarneemt."
                  : active === "openingstijden"
                    ? "Weekrooster, feestdagen en vrije dagen."
                    : "Logo, dokters en praktijkgegevens."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-50">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#3585ff] to-[#5b9fff] text-white">
                <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <path d="M9 22V12h6v10" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <p className="text-[13px] font-semibold text-gray-900 leading-tight">
                  {praktijkNaam}
                </p>
                <p className="text-[11px] text-gray-500 leading-tight">
                  Praktijkportaal
                </p>
              </div>
            </div>
          </div>
        </header>

        <main
          className={`px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 ${
            isDirty ? "pb-28 sm:pb-32" : ""
          }`}
        >
          {active === "waarnemers" && (
            <div className="space-y-6">
              {/* Waarnemers */}
              <section>
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-gray-900 sm:text-[20px]">
                      Waarnemers
                    </h2>
                    <p className="mt-1 text-[13px] text-gray-500">
                      De eerste kaart wordt als standaard waarnemer getoond. Versleep met de pijltjes.
                    </p>
                  </div>
                </div>

                <div className="-mx-4 overflow-x-auto px-4 pb-4 pt-3 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10 [scrollbar-width:thin]">
                  <ul className="flex gap-4 sm:gap-5">
                    {waarnemers.map((w, index) => {
                      const isFirst = index === 0;
                      const isLast = index === waarnemers.length - 1;
                      return (
                        <li
                          key={w.id}
                          data-waarnemer-id={w.id}
                          className={`group relative flex aspect-square w-[300px] shrink-0 flex-col rounded-2xl border bg-white p-6 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-12px_rgba(15,23,40,0.18)] sm:w-[320px] sm:p-7 ${
                            recentlyMovedWaarnemerId === w.id
                              ? "scale-[1.03] border-[#3585ff] shadow-[0_0_0_4px_rgba(53,133,255,0.18),0_24px_48px_-16px_rgba(53,133,255,0.45)]"
                              : "border-black/[0.06] shadow-[0_1px_3px_rgba(15,23,40,0.04)]"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold ${
                                isFirst
                                  ? "bg-[#3585ff] text-white shadow-[0_4px_12px_-2px_rgba(53,133,255,0.4)]"
                                  : "bg-[#eef4ff] text-[#3585ff]"
                              }`}
                            >
                              {index + 1}
                            </span>
                            {isFirst && (
                              <span className="rounded-full bg-[#3585ff]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#3585ff]">
                                Standaard
                              </span>
                            )}
                          </div>

                          <div className="mt-5 flex-1 overflow-hidden">
                            <p className="line-clamp-2 text-[17px] font-semibold leading-snug tracking-[-0.01em] text-gray-900">
                              {w.naam}
                            </p>
                            <p className="mt-2.5 text-[13.5px] leading-relaxed text-gray-500">
                              {w.straat}
                              <br />
                              {w.postcode} {w.plaats}
                            </p>
                            {w.telefoon && (
                              <p className="mt-2.5 flex items-center gap-1.5 truncate text-[13px] font-medium text-gray-700">
                                <svg className="h-3.5 w-3.5 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
                                </svg>
                                {w.telefoon}
                              </p>
                            )}
                          </div>

                          <div className="mt-5 flex items-center justify-between border-t border-black/[0.05] pt-4">
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                aria-label="Naar links"
                                onClick={() => moveWaarnemer(index, -1)}
                                disabled={isFirst}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent"
                              >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M15 18l-6-6 6-6" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                aria-label="Naar rechts"
                                onClick={() => moveWaarnemer(index, 1)}
                                disabled={isLast}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent"
                              >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M9 18l6-6-6-6" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                aria-label="Bewerken"
                                onClick={() => openEditModal(w.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
                              >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                aria-label="Verwijderen"
                                onClick={() => openDeleteModal(w.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                              >
                                <svg className="h-[15px] w-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 6h18" />
                                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                  <path d="M10 11v6M14 11v6" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}

                    {/* Toevoegen-card */}
                    <li className="shrink-0">
                      <button
                        type="button"
                        onClick={openAddModal}
                        className="group flex aspect-square w-[300px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 bg-white/40 text-gray-500 transition-all hover:-translate-y-0.5 hover:border-[#3585ff] hover:bg-[#f6faff] hover:text-[#3585ff] sm:w-[320px]"
                      >
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors group-hover:bg-[#3585ff] group-hover:text-white">
                          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        </span>
                        <span className="text-[14px] font-semibold">
                          Waarnemer toevoegen
                        </span>
                      </button>
                    </li>
                  </ul>
                </div>
              </section>
            </div>
          )}

          {active === "openingstijden" && (
            <div className="space-y-6">
              {/* Openingstijden */}
              <section className="rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_3px_rgba(15,23,40,0.03)]">
                <div className="border-b border-black/[0.05] px-5 py-4 sm:px-6">
                  <h2 className="text-[15px] font-semibold text-gray-900">
                    Openingstijden
                  </h2>
                  <p className="text-[12px] text-gray-500">
                    Uw normale weekrooster. Voeg per dag optioneel een pauze toe.
                  </p>
                </div>
                <div>
                  {DAYS.map((day, i) => {
                    const schedule = weekSchedule[day];
                    const hasPauze =
                      schedule.pauzeVan !== undefined &&
                      schedule.pauzeTot !== undefined;
                    return (
                      <div
                        key={day}
                        className={`px-5 py-3 sm:px-6 ${
                          i < DAYS.length - 1
                            ? "border-b border-black/[0.04]"
                            : ""
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
                            <span className="text-[13px] text-gray-400">
                              Gesloten
                            </span>
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
              </section>

              {/* Vrije dagen */}
              <section
                ref={vrijeDagenSectionRef}
                className="scroll-mt-24 rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_3px_rgba(15,23,40,0.03)]"
              >
                <div className="border-b border-black/[0.05] px-5 py-4 sm:px-6">
                  <h2 className="text-[15px] font-semibold text-gray-900">
                    Vrije dagen
                  </h2>
                  <p className="text-[12px] text-gray-500">
                    Feestdagen en eigen vrije dagen waarop een waarnemer
                    overneemt.
                  </p>
                </div>

                <div className="space-y-8 p-5 sm:p-6">
                  {/* Blok 1 — Rooster importeren (prominent, bovenaan) */}
                  <div ref={roosterBlockRef} className="relative">
                    <div
                      aria-hidden
                      className={`pointer-events-none absolute -inset-8 rounded-[40px] bg-[#3585ff] blur-3xl transition-opacity duration-700 ${
                        onboardingHighlight === "rooster"
                          ? "opacity-[0.18]"
                          : "opacity-0"
                      }`}
                    />
                    <div className="relative mb-3">
                      <h3 className="text-[13px] font-semibold text-gray-900">
                        Rooster importeren
                      </h3>
                      <p className="text-[12px] text-gray-500">
                        Upload uw rooster met vrije dagen en feestdagen. Wij
                        vullen alles automatisch in.
                      </p>
                    </div>

                    {!roosterFile ? (
                      <label className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-5 transition-colors hover:border-[#3585ff] hover:bg-[#f6faff] sm:px-5">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-[#3585ff] shadow-sm">
                          <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                          </svg>
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[14px] font-semibold text-gray-900">
                            Upload uw rooster
                          </div>
                          <div className="mt-0.5 text-[12px] leading-relaxed text-gray-500">
                            CSV, Excel, PDF of afbeelding. Datums worden
                            automatisch toegevoegd en feestdagen aangevinkt.
                          </div>
                        </div>
                        <input
                          type="file"
                          accept=".csv,.xlsx,.xls,.pdf,image/*"
                          onChange={handleRoosterUpload}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="rounded-xl border border-gray-200 bg-white">
                        <div className="flex items-start gap-3 border-b border-gray-100 px-4 py-3 sm:px-5">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eef4ff] text-[#3585ff]">
                            {roosterFile.type === "image" ? (
                              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="9" cy="9" r="2" />
                                <path d="M21 15l-5-5L5 21" />
                              </svg>
                            ) : roosterFile.type === "pdf" ? (
                              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <path d="M14 2v6h6" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <path d="M8 8h8M8 12h8M8 16h5" />
                              </svg>
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14px] font-semibold text-gray-900">
                              {roosterFile.name}
                            </p>
                            {roosterFile.processing ? (
                              <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-gray-500">
                                <svg className="h-3 w-3 animate-spin text-[#3585ff]" viewBox="0 0 24 24" fill="none">
                                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                                  <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                                {roosterFile.type === "image"
                                  ? "Afbeelding wordt gelezen…"
                                  : roosterFile.type === "pdf"
                                    ? "PDF wordt gelezen…"
                                    : "Bezig…"}
                              </p>
                            ) : roosterError ? (
                              <p className="mt-0.5 text-[12px] text-red-500">
                                {roosterError}
                              </p>
                            ) : roosterImportSummary ? (
                              <p className="mt-0.5 text-[12px] text-[#3585ff]">
                                {roosterImportSummary.datesAdded} datum
                                {roosterImportSummary.datesAdded !== 1 ? "s" : ""}{" "}
                                toegevoegd
                                {roosterImportSummary.feestdagenMatched > 0 &&
                                  ` · ${roosterImportSummary.feestdagenMatched} feestdag${
                                    roosterImportSummary.feestdagenMatched !== 1 ? "en" : ""
                                  } aangevinkt`}
                              </p>
                            ) : (
                              <p className="mt-0.5 text-[12px] text-gray-500">
                                Bestand geüpload.
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={clearRoosterFile}
                            aria-label="Verwijder bestand"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
                          >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
                              <path d="M6 6l12 12M18 6L6 18" />
                            </svg>
                          </button>
                        </div>
                        <div className="p-4 sm:p-5">
                          {roosterFile.type === "image" && roosterFile.dataUrl && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={roosterFile.dataUrl}
                              alt={roosterFile.name}
                              className="max-h-[320px] w-full rounded-lg border border-gray-100 object-contain"
                            />
                          )}
                          {roosterFile.type === "pdf" && roosterFile.pdfUrl && (
                            <iframe
                              src={roosterFile.pdfUrl}
                              title={roosterFile.name}
                              className="h-[360px] w-full rounded-lg border border-gray-100"
                            />
                          )}
                          {roosterFile.type === "csv" && roosterFile.csvPreview && (
                            <div className="overflow-x-auto rounded-lg border border-gray-100">
                              <table className="w-full text-left text-[12px]">
                                <tbody>
                                  {roosterFile.csvPreview.map((row, i) => (
                                    <tr
                                      key={i}
                                      className={
                                        i === 0
                                          ? "bg-gray-50 font-semibold text-gray-900"
                                          : "border-t border-gray-100 text-gray-600"
                                      }
                                    >
                                      {row.map((cell, j) => (
                                        <td key={j} className="px-3 py-1.5">
                                          {cell || (
                                            <span className="text-gray-300">—</span>
                                          )}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Divider — of ga handmatig verder */}
                  <div className="relative flex items-center py-1">
                    <div className="h-px flex-1 bg-gray-100" />
                    <span className="px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                      Of ga handmatig verder
                    </span>
                    <div className="h-px flex-1 bg-gray-100" />
                  </div>

                  {/* Blok 2 — Feestdagen */}
                  <div ref={feestdagenBlockRef} className="relative">
                    <div
                      aria-hidden
                      className={`pointer-events-none absolute -inset-8 rounded-[40px] bg-[#3585ff] blur-3xl transition-opacity duration-700 ${
                        onboardingHighlight === "feestdagen"
                          ? "opacity-[0.18]"
                          : "opacity-0"
                      }`}
                    />
                    <div className="relative mb-3">
                      <h3 className="text-[13px] font-semibold text-gray-900">
                        Feestdagen
                      </h3>
                      <p className="text-[12px] text-gray-500">
                        Kies op welke feestdagen uw praktijk gesloten is.
                      </p>
                    </div>

                    {[currentFeestdagenYear, currentFeestdagenYear + 1].map(
                      (year, yearIdx) => {
                        if (yearIdx === 1 && !showNextYearFeestdagen) return null;
                        const yearFeestdagen = feestdagenList.filter((f) =>
                          f.date.startsWith(String(year))
                        );
                        return (
                          <div key={year} className={yearIdx > 0 ? "mt-5" : ""}>
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                              {year}
                            </p>
                            <ul className="overflow-hidden rounded-lg border border-gray-100">
                              {yearFeestdagen.map((f, i) => {
                                const selected = selectedFeestdagen.includes(
                                  f.date
                                );
                                return (
                                  <li
                                    key={f.date}
                                    className={
                                      i < yearFeestdagen.length - 1
                                        ? "border-b border-gray-100"
                                        : ""
                                    }
                                  >
                                    <button
                                      type="button"
                                      onClick={() => toggleFeestdag(f.date)}
                                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                        selected
                                          ? "bg-[#f6faff]"
                                          : "bg-white hover:bg-gray-50"
                                      }`}
                                    >
                                      <span
                                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${
                                          selected
                                            ? "border-[#3585ff] bg-[#3585ff]"
                                            : "border-gray-300"
                                        }`}
                                      >
                                        {selected && (
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
                                      <span
                                        className={`flex-1 text-[13px] ${
                                          selected
                                            ? "font-semibold text-gray-900"
                                            : "text-gray-700"
                                        }`}
                                      >
                                        {f.name}
                                      </span>
                                      <span className="text-[12px] text-gray-400">
                                        {formatHolidayDate(f.date)}
                                      </span>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        );
                      }
                    )}

                    <button
                      type="button"
                      onClick={() => setShowNextYearFeestdagen((v) => !v)}
                      className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-[#3585ff] transition-colors hover:text-[#1d5fd9]"
                    >
                      <svg
                        className={`h-3 w-3 transition-transform ${
                          showNextYearFeestdagen ? "rotate-45" : ""
                        }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.6}
                        strokeLinecap="round"
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      {showNextYearFeestdagen
                        ? `Verberg ${currentFeestdagenYear + 1}`
                        : `Toon ${currentFeestdagenYear + 1}`}
                    </button>
                  </div>

                  {/* Blok 3 — Extra vrije dagen */}
                  <div ref={extraBlockRef} className="relative">
                    <div
                      aria-hidden
                      className={`pointer-events-none absolute -inset-8 rounded-[40px] bg-[#3585ff] blur-3xl transition-opacity duration-700 ${
                        onboardingHighlight === "extra"
                          ? "opacity-[0.18]"
                          : "opacity-0"
                      }`}
                    />
                    <div className="relative mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-[13px] font-semibold text-gray-900">
                          Extra vrije dagen
                        </h3>
                        <p className="text-[12px] text-gray-500">
                          Vakanties, studiedagen en andere sluitingen.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={openAddVrijeDagModal}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#1d1d1b] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:brightness-125 sm:px-3.5 sm:py-2"
                      >
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
                        Vrije dag toevoegen
                      </button>
                    </div>

                    {vrijeDagen.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-[13px] text-gray-500">
                        Nog geen extra vrije dagen. Klik op{" "}
                        <span className="font-semibold text-gray-900">
                          Vrije dag toevoegen
                        </span>
                        .
                      </div>
                    ) : (
                      <ul className="overflow-hidden rounded-lg border border-gray-100">
                        {vrijeDagen.map((v, i) => {
                          const waarnemer = v.waarnemerId
                            ? waarnemers.find((w) => w.id === v.waarnemerId)
                            : undefined;
                          return (
                            <li
                              key={v.id}
                              className={
                                i < vrijeDagen.length - 1
                                  ? "border-b border-gray-100"
                                  : ""
                              }
                            >
                              <div className="flex items-start gap-3 px-4 py-3 sm:gap-4">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eef4ff] text-[#3585ff]">
                                  <svg
                                    className="h-[15px] w-[15px]"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2.2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <rect x="3" y="4" width="18" height="18" rx="2" />
                                    <path d="M16 2v4M8 2v4M3 10h18" />
                                  </svg>
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[14px] font-semibold text-gray-900">
                                    {formatHolidayDate(v.date)}
                                  </p>
                                  <p className="mt-0.5 text-[12px] text-gray-500">
                                    {v.reden || "Geen reden opgegeven"}
                                    {!v.fullDay && v.van && v.tot && (
                                      <> · {v.van}–{v.tot}</>
                                    )}
                                    {waarnemer && (
                                      <> · Waarnemer: {waarnemer.naam}</>
                                    )}
                                  </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-0.5">
                                  <button
                                    type="button"
                                    aria-label="Bewerken"
                                    onClick={() => openEditVrijeDagModal(v)}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
                                  >
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    aria-label="Verwijderen"
                                    onClick={() => removeVrijeDag(v.id)}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                  >
                                    <svg className="h-[15px] w-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M3 6h18" />
                                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                      <path d="M10 11v6M14 11v6" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                </div>
              </section>

            </div>
          )}

          {active === "praktijk" && (
            <div className="space-y-6">
              {/* Logo */}
              <section className="rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_3px_rgba(15,23,40,0.03)]">
                <div className="border-b border-black/[0.05] px-5 py-4 sm:px-6">
                  <h2 className="text-[15px] font-semibold text-gray-900">
                    Logo
                  </h2>
                  <p className="text-[12px] text-gray-500">
                    Wordt bovenaan uw praktijkpagina getoond.
                  </p>
                </div>
                <div className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                    {praktijkLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={praktijkLogo}
                        alt="Praktijk logo"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <svg
                        className="h-8 w-8 text-gray-300"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#1d1d1b] px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:brightness-125">
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                      </svg>
                      {praktijkLogo ? "Vervangen" : "Uploaden"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    {praktijkLogo && (
                      <button
                        type="button"
                        onClick={() => setPraktijkLogo(null)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                      >
                        Verwijderen
                      </button>
                    )}
                  </div>
                </div>
              </section>

              {/* Dokters */}
              <section className="rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_3px_rgba(15,23,40,0.03)]">
                <div className="flex items-center justify-between gap-4 border-b border-black/[0.05] px-5 py-4 sm:px-6">
                  <div>
                    <h2 className="text-[15px] font-semibold text-gray-900">
                      Dokters
                    </h2>
                    <p className="text-[12px] text-gray-500">
                      De huisartsen die aan uw praktijk verbonden zijn.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openAddDokterModal}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#1d1d1b] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:brightness-125 sm:px-3.5 sm:py-2"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Toevoegen
                  </button>
                </div>

                {dokters.length === 0 ? (
                  <div className="px-5 py-6 text-center text-[13px] text-gray-500 sm:px-6">
                    Nog geen dokters. Klik op{" "}
                    <span className="font-semibold">Toevoegen</span>.
                  </div>
                ) : (
                  <ul className="divide-y divide-black/[0.04]">
                    {dokters.map((d) => {
                      const initialen = `${(d.voornaam[0] ?? "").toUpperCase()}${(
                        d.achternaam[0] ?? ""
                      ).toUpperCase()}`;
                      return (
                        <li key={d.id} className="px-5 py-4 sm:px-6">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3585ff] to-[#5b9fff] text-[12px] font-semibold text-white">
                              {initialen || "D"}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[14px] font-semibold text-gray-900">
                                {[d.voornaam, d.achternaam]
                                  .filter(Boolean)
                                  .join(" ") || "—"}
                              </p>
                              {(d.telefoon || d.email) && (
                                <p className="truncate text-[12px] text-gray-500">
                                  {[d.telefoon, d.email]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-0.5">
                              <button
                                type="button"
                                aria-label="Bewerken"
                                onClick={() => openEditDokterModal(d)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
                              >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                aria-label="Verwijderen"
                                onClick={() => removeDokter(d.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                              >
                                <svg className="h-[15px] w-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 6h18" />
                                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                  <path d="M10 11v6M14 11v6" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* Praktijk gegevens */}
              <section className="rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_3px_rgba(15,23,40,0.03)]">
                <div className="border-b border-black/[0.05] px-5 py-4 sm:px-6">
                  <h2 className="text-[15px] font-semibold text-gray-900">
                    Praktijk gegevens
                  </h2>
                  <p className="text-[12px] text-gray-500">
                    Deze informatie is zichtbaar voor patiënten.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
                  <div className="sm:col-span-2">
                    <Field
                      label="Praktijknaam"
                      value={praktijkNaam}
                      onChange={setPraktijkNaam}
                    />
                  </div>
                  <Field
                    label="Adres"
                    value={praktijkAdres}
                    onChange={setPraktijkAdres}
                  />
                  <Field
                    label="Postcode"
                    value={praktijkPostcode}
                    onChange={setPraktijkPostcode}
                  />
                  <Field
                    label="Plaats"
                    value={praktijkPlaats}
                    onChange={setPraktijkPlaats}
                  />
                  <Field
                    label="Telefoonnummer"
                    value={praktijkTelefoon}
                    onChange={setPraktijkTelefoon}
                  />
                  <Field
                    label="E-mail"
                    value={praktijkEmail}
                    onChange={setPraktijkEmail}
                  />
                  <Field
                    label="Website"
                    value={praktijkWebsite}
                    onChange={setPraktijkWebsite}
                  />
                </div>
              </section>

            </div>
          )}
        </main>
      </div>

      {/* Welkom-modal (eerste bezoek vanuit aanmelden) */}
      {welcomeOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-[fadeIn_200ms_ease-out]"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeWelcomeAndStartTour}
          />
          <div className="relative w-full max-w-[460px] origin-center animate-[popupIn_240ms_cubic-bezier(0.16,1,0.3,1)] rounded-2xl bg-white p-7 shadow-[0_24px_60px_-12px_rgba(15,23,40,0.35)] sm:p-8">
            <div className="flex flex-col items-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
                <svg
                  className="h-7 w-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
              <h2 className="mt-5 text-[20px] font-semibold leading-snug text-gray-900 sm:text-[22px]">
                Welkom! Uw praktijk staat live.
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-gray-500 sm:text-[14.5px]">
                Nog één laatste dingetje: voeg de dagen toe waarop uw praktijk
                dicht is, zodat patiënten meteen de juiste waarnemer zien.
              </p>

              <button
                type="button"
                onClick={closeWelcomeAndStartTour}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1d1d1b] px-5 py-3.5 text-[14px] font-semibold text-white transition-colors hover:brightness-125"
              >
                Oké, verder
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
        </div>
      )}

      {/* Onboarding coach-mark */}
      {onboardingHighlight && (() => {
        const step = ONBOARDING_STEPS[onboardingHighlight];
        return (
          <div className="fixed bottom-6 left-4 right-4 z-[95] flex justify-center sm:left-auto sm:right-6 sm:justify-end">
            <div className="w-full max-w-[380px] rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_24px_60px_-12px_rgba(15,23,40,0.35)] animate-[popupIn_220ms_ease-out]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3585ff]">
                Stap {step.index} van 3
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-gray-900">
                {step.body}
              </p>
              <div className="mt-5 flex items-center justify-end gap-2">
                {!step.last && (
                  <button
                    type="button"
                    onClick={skipOnboarding}
                    className="rounded-lg px-3 py-2 text-[12.5px] font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                  >
                    Overslaan
                  </button>
                )}
                <button
                  type="button"
                  onClick={nextOnboardingStep}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1d1d1b] px-4 py-2 text-[12.5px] font-semibold text-white transition-colors hover:brightness-125"
                >
                  {step.last ? "Klaar" : "Verder"}
                  {!step.last && (
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
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Sticky save bar — alleen zichtbaar bij wijzigingen */}
      {isDirty && (
        <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-30 flex justify-center px-4 pb-4 lg:left-[260px] lg:pb-5">
          <div className="pointer-events-auto flex w-full max-w-[680px] items-center justify-between gap-3 rounded-2xl border border-black/[0.06] bg-white/95 px-4 py-3 shadow-[0_12px_32px_-8px_rgba(15,23,40,0.25)] backdrop-blur-md sm:px-5 animate-[popupIn_200ms_ease-out]">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              </span>
              <p className="text-[13px] font-medium text-gray-900">
                Niet-opgeslagen wijzigingen
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={handleDiscard}
                className="rounded-lg px-3 py-2 text-[12.5px] font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                Negeren
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1d1d1b] px-4 py-2 text-[12.5px] font-semibold text-white transition-colors hover:brightness-125"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <path d="M17 21v-8H7v8M7 3v5h8" />
                </svg>
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save success toast */}
      {saveToastOpen && (
        <div className="fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 animate-[popupIn_200ms_ease-out]">
          <div className="flex items-center gap-3 rounded-full bg-[#0f1728] px-5 py-3 text-[13px] font-medium text-white shadow-[0_12px_32px_-8px_rgba(15,23,40,0.35)]">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
              <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </span>
            Wijzigingen opgeslagen
          </div>
        </div>
      )}

      {/* Add waarnemer modal */}
      {addModalOpen && (
        <Modal onClose={closeAddModal} title="Waarnemer toevoegen" subtitle="Zoek een huisartsenpraktijk en voeg deze toe aan uw waarnemers.">
          <div className="flex items-center rounded-xl border border-gray-200 bg-white px-4 py-3 transition-all focus-within:border-[#3585ff] focus-within:shadow-[0_0_0_3px_rgba(53,133,255,0.1)]">
            <svg className="mr-2.5 h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={addQuery}
              onChange={(e) => setAddQuery(e.target.value)}
              placeholder="Zoek op naam, straat of plaats"
              className="w-full bg-transparent text-[14px] text-gray-900 placeholder:text-gray-400 outline-none sm:text-[15px]"
              autoFocus
            />
          </div>

          <div className="mt-3 max-h-[360px] overflow-y-auto">
            {addQuery.length < 2 ? (
              <p className="px-1 py-4 text-center text-[13px] text-gray-400">
                Typ minimaal 2 tekens om te zoeken.
              </p>
            ) : addResults.length === 0 ? (
              <p className="px-1 py-4 text-center text-[13px] text-gray-500">
                Geen praktijken gevonden.
              </p>
            ) : (
              <ul className="divide-y divide-gray-50 overflow-hidden rounded-xl border border-gray-100">
                {addResults.map((p) => (
                  <PraktijkResultRow key={p.id} p={p} onClick={() => selectAddResult(p)} />
                ))}
              </ul>
            )}
          </div>
        </Modal>
      )}

      {/* Edit waarnemer modal */}
      {editingId && editingWaarnemer && (
        <Modal
          onClose={closeEditModal}
          title="Waarnemer bewerken"
          subtitle={editingWaarnemer.naam}
        >
          {/* Tabs */}
          <div className="mb-5 flex gap-1 rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setEditMode("replace")}
              className={`flex-1 rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                editMode === "replace"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Andere praktijk
            </button>
            <button
              type="button"
              onClick={() => setEditMode("fields")}
              className={`flex-1 rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                editMode === "fields"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Gegevens wijzigen
            </button>
          </div>

          {editMode === "replace" && (
            <>
              <div className="flex items-center rounded-xl border border-gray-200 bg-white px-4 py-3 transition-all focus-within:border-[#3585ff] focus-within:shadow-[0_0_0_3px_rgba(53,133,255,0.1)]">
                <svg className="mr-2.5 h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={editQuery}
                  onChange={(e) => setEditQuery(e.target.value)}
                  placeholder="Zoek een andere praktijk"
                  className="w-full bg-transparent text-[14px] text-gray-900 placeholder:text-gray-400 outline-none sm:text-[15px]"
                  autoFocus
                />
              </div>
              <div className="mt-3 max-h-[280px] overflow-y-auto">
                {editQuery.length < 2 ? (
                  <p className="px-1 py-4 text-center text-[13px] text-gray-400">
                    Typ minimaal 2 tekens om te zoeken.
                  </p>
                ) : editReplaceResults.length === 0 ? (
                  <p className="px-1 py-4 text-center text-[13px] text-gray-500">
                    Geen praktijken gevonden.
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-50 overflow-hidden rounded-xl border border-gray-100">
                    {editReplaceResults.map((p) => (
                      <PraktijkResultRow
                        key={p.id}
                        p={p}
                        onClick={() => replaceWaarnemer(p)}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          {editMode === "fields" && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field
                    label="Praktijknaam"
                    value={editDraft.naam ?? ""}
                    onChange={(v) => setEditDraft((d) => ({ ...d, naam: v }))}
                  />
                </div>
                <Field
                  label="Straat"
                  value={editDraft.straat ?? ""}
                  onChange={(v) => setEditDraft((d) => ({ ...d, straat: v }))}
                />
                <Field
                  label="Postcode"
                  value={editDraft.postcode ?? ""}
                  onChange={(v) => setEditDraft((d) => ({ ...d, postcode: v }))}
                />
                <Field
                  label="Plaats"
                  value={editDraft.plaats ?? ""}
                  onChange={(v) => setEditDraft((d) => ({ ...d, plaats: v }))}
                />
                <Field
                  label="Telefoon"
                  value={editDraft.telefoon ?? ""}
                  onChange={(v) => setEditDraft((d) => ({ ...d, telefoon: v }))}
                />
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-[13px] font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                >
                  Annuleren
                </button>
                <button
                  type="button"
                  onClick={saveEditFields}
                  className="rounded-lg bg-[#1d1d1b] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:brightness-125"
                >
                  Opslaan
                </button>
              </div>
            </>
          )}
        </Modal>
      )}

      {/* Vrije dag add/edit modal */}
      {vrijeDagModalOpen && (
        <Modal
          onClose={closeVrijeDagModal}
          title={editingVrijeDagId ? "Vrije dag bewerken" : "Vrije dag toevoegen"}
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-gray-600">
                Datum
              </label>
              <input
                type="date"
                value={vrijeDagDraft.date ?? ""}
                onChange={(e) =>
                  setVrijeDagDraft((d) => ({ ...d, date: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-[14px] text-gray-900 outline-none transition-colors focus:border-[#3585ff] focus:shadow-[0_0_0_3px_rgba(53,133,255,0.1)]"
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-gray-600">
                Reden
              </label>
              <input
                type="text"
                value={vrijeDagDraft.reden ?? ""}
                onChange={(e) =>
                  setVrijeDagDraft((d) => ({ ...d, reden: e.target.value }))
                }
                placeholder="bv. Vakantie, Studiedag, Congres…"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-[#3585ff] focus:shadow-[0_0_0_3px_rgba(53,133,255,0.1)]"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5">
              <div>
                <p className="text-[13px] font-medium text-gray-900">
                  Hele dag gesloten
                </p>
                <p className="text-[11px] text-gray-500">
                  Uit: afwijkende openingstijden instellen
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={vrijeDagDraft.fullDay ?? true}
                onClick={() =>
                  setVrijeDagDraft((d) => ({
                    ...d,
                    fullDay: !(d.fullDay ?? true),
                  }))
                }
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  (vrijeDagDraft.fullDay ?? true)
                    ? "bg-[#3585ff]"
                    : "bg-gray-200"
                }`}
              >
                <span
                  className={`absolute top-0.5 block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    (vrijeDagDraft.fullDay ?? true)
                      ? "translate-x-[22px]"
                      : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {!(vrijeDagDraft.fullDay ?? true) && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-gray-600">
                    Van
                  </label>
                  <input
                    type="time"
                    value={vrijeDagDraft.van ?? ""}
                    onChange={(e) =>
                      setVrijeDagDraft((d) => ({ ...d, van: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-[14px] text-gray-900 outline-none transition-colors focus:border-[#3585ff]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-gray-600">
                    Tot
                  </label>
                  <input
                    type="time"
                    value={vrijeDagDraft.tot ?? ""}
                    onChange={(e) =>
                      setVrijeDagDraft((d) => ({ ...d, tot: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-[14px] text-gray-900 outline-none transition-colors focus:border-[#3585ff]"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={closeVrijeDagModal}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-[13px] font-semibold text-gray-600 transition-colors hover:bg-gray-50"
            >
              Annuleren
            </button>
            <button
              type="button"
              onClick={saveVrijeDag}
              disabled={!vrijeDagDraft.date}
              className="rounded-lg bg-[#1d1d1b] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
            >
              Opslaan
            </button>
          </div>
        </Modal>
      )}

      {/* Dokter add/edit modal */}
      {dokterModalOpen && (
        <Modal
          onClose={closeDokterModal}
          title={editingDokterId ? "Dokter bewerken" : "Dokter toevoegen"}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              label="Voornaam"
              value={dokterDraft.voornaam ?? ""}
              onChange={(v) => setDokterDraft((d) => ({ ...d, voornaam: v }))}
            />
            <Field
              label="Achternaam"
              value={dokterDraft.achternaam ?? ""}
              onChange={(v) => setDokterDraft((d) => ({ ...d, achternaam: v }))}
            />
            <Field
              label="Telefoon (optioneel)"
              value={dokterDraft.telefoon ?? ""}
              onChange={(v) => setDokterDraft((d) => ({ ...d, telefoon: v }))}
            />
            <Field
              label="E-mail (optioneel)"
              value={dokterDraft.email ?? ""}
              onChange={(v) => setDokterDraft((d) => ({ ...d, email: v }))}
            />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={closeDokterModal}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-[13px] font-semibold text-gray-600 transition-colors hover:bg-gray-50"
            >
              Annuleren
            </button>
            <button
              type="button"
              onClick={saveDokter}
              disabled={
                !(dokterDraft.voornaam ?? "").trim() &&
                !(dokterDraft.achternaam ?? "").trim()
              }
              className="rounded-lg bg-[#1d1d1b] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
            >
              Opslaan
            </button>
          </div>
        </Modal>
      )}

      {/* Delete waarnemer modal */}
      {deletingId && deletingWaarnemer && (
        <Modal onClose={closeDeleteModal} title="Waarnemer verwijderen">
          <p className="text-[14px] leading-relaxed text-gray-600">
            Weet u zeker dat u{" "}
            <span className="font-semibold text-gray-900">
              {deletingWaarnemer.naam}
            </span>{" "}
            wilt verwijderen uit uw waarnemers?
          </p>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeDeleteModal}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-gray-600 transition-colors hover:bg-gray-50"
            >
              Nee
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="rounded-lg bg-red-500 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:brightness-110"
            >
              Ja, verwijderen
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-[fadeIn_180ms_ease-out]"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[480px] origin-center animate-[popupIn_200ms_cubic-bezier(0.16,1,0.3,1)] rounded-2xl bg-white shadow-[0_24px_60px_-12px_rgba(15,23,40,0.35)]">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h3 className="text-[16px] font-semibold text-gray-900">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 truncate text-[12.5px] text-gray-500">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Sluiten"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

function PraktijkResultRow({
  p,
  onClick,
}: {
  p: Praktijk;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eef4ff] text-[#3585ff]">
          <svg className="h-[16px] w-[16px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-gray-900">
            {p.naam}
          </div>
          <div className="truncate text-[12px] text-gray-500">
            {p.straat}, {p.postcode} {p.plaats}
          </div>
        </div>
        <svg className="h-4 w-4 shrink-0 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
    </li>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-medium text-gray-600">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-[14px] text-gray-900 outline-none transition-colors focus:border-[#3585ff] focus:shadow-[0_0_0_3px_rgba(53,133,255,0.1)]"
      />
    </div>
  );
}
