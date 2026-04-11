import { praktijken as autoPraktijken, type Praktijk } from "./praktijken";

export type DayKey = "ma" | "di" | "wo" | "do" | "vr" | "za" | "zo";

export type DayHours = { van: string; tot: string } | null; // null = gesloten

export type WeekSchedule = Partial<Record<DayKey, DayHours>>;

export type PraktijkDetails = Praktijk & {
  logo?: string;
  website?: string;
  waarnemers?: string[]; // ids naar andere praktijken
  weekSchedule?: WeekSchedule;
};

// Standaard werkweek voor demo-praktijken — eenvoudig te variëren.
const standaardWeek: WeekSchedule = {
  ma: { van: "08:00", tot: "17:00" },
  di: { van: "08:00", tot: "17:00" },
  wo: { van: "08:00", tot: "17:00" },
  do: { van: "08:00", tot: "17:00" },
  vr: { van: "08:00", tot: "17:00" },
  za: null,
  zo: null,
};

// Handmatig toegevoegde demo-praktijken (niet in de auto-gegenereerde CSV).
// Deze worden samen met de auto-lijst gebruikt door alle searches en detailpagina's.
const demoPraktijken: PraktijkDetails[] = [
  {
    id: "huisartspraktijk-milad-amsterdam",
    naam: "Huisartspraktijk Milad",
    straat: "Keizersgracht 212",
    postcode: "1016 DX",
    plaats: "Amsterdam",
    stad: "Amsterdam",
    telefoon: "020-5551234",
    email: "info@huisartspraktijk-milad.nl",
    website: "https://huisartspraktijk-milad.nl",
    openingstijden: "Ma–Vr 08:00–17:00",
    google:
      "https://www.google.com/maps/search/?api=1&query=Keizersgracht+212+Amsterdam",
    lat: 52.369,
    lng: 4.886,
    logo: "https://api.dicebear.com/7.x/initials/svg?seed=Milad&backgroundColor=3585ff&textColor=ffffff&fontWeight=700",
    waarnemers: [
      "huisartspraktijk-de-linde-amsterdam",
      "medisch-centrum-zuid-amsterdam",
      "huisarts-janssen-amsterdam",
    ],
    weekSchedule: standaardWeek,
  },
  {
    id: "huisartspraktijk-de-linde-amsterdam",
    naam: "Huisartsenpraktijk De Linde",
    straat: "Prinsengracht 402",
    postcode: "1016 JB",
    plaats: "Amsterdam",
    stad: "Amsterdam",
    telefoon: "020-5557788",
    email: "contact@delinde-amsterdam.nl",
    website: "https://delinde-amsterdam.nl",
    openingstijden: "Ma–Vr 08:00–17:00",
    google:
      "https://www.google.com/maps/search/?api=1&query=Prinsengracht+402+Amsterdam",
    lat: 52.365,
    lng: 4.884,
    weekSchedule: {
      ma: { van: "08:00", tot: "17:00" },
      di: { van: "08:00", tot: "17:00" },
      wo: { van: "08:00", tot: "13:00" },
      do: { van: "08:00", tot: "17:00" },
      vr: { van: "08:00", tot: "17:00" },
      za: null,
      zo: null,
    },
  },
  {
    id: "medisch-centrum-zuid-amsterdam",
    naam: "Medisch Centrum Zuid",
    straat: "Van Baerlestraat 48",
    postcode: "1071 BA",
    plaats: "Amsterdam",
    stad: "Amsterdam",
    telefoon: "020-5552020",
    email: "info@mczuid.nl",
    website: "https://mczuid.nl",
    openingstijden: "Ma–Vr 08:00–18:00",
    google:
      "https://www.google.com/maps/search/?api=1&query=Van+Baerlestraat+48+Amsterdam",
    lat: 52.356,
    lng: 4.879,
    weekSchedule: {
      ma: { van: "08:00", tot: "18:00" },
      di: { van: "08:00", tot: "18:00" },
      wo: { van: "08:00", tot: "18:00" },
      do: { van: "08:00", tot: "20:00" },
      vr: { van: "08:00", tot: "17:00" },
      za: { van: "09:00", tot: "12:00" },
      zo: null,
    },
  },
  {
    id: "huisarts-janssen-amsterdam",
    naam: "Huisarts Janssen",
    straat: "Ceintuurbaan 120",
    postcode: "1072 GA",
    plaats: "Amsterdam",
    stad: "Amsterdam",
    telefoon: "020-5554411",
    email: "praktijk@huisarts-janssen.nl",
    openingstijden: "Ma–Vr 08:30–16:30",
    google:
      "https://www.google.com/maps/search/?api=1&query=Ceintuurbaan+120+Amsterdam",
    lat: 52.354,
    lng: 4.89,
    weekSchedule: {
      ma: { van: "08:30", tot: "16:30" },
      di: { van: "08:30", tot: "16:30" },
      wo: null,
      do: { van: "08:30", tot: "16:30" },
      vr: { van: "08:30", tot: "13:00" },
      za: null,
      zo: null,
    },
  },
];

const demoById = new Map(demoPraktijken.map((p) => [p.id, p]));

export const allePraktijken: PraktijkDetails[] = [
  ...demoPraktijken,
  ...autoPraktijken.filter((p) => !demoById.has(p.id)),
];

export function getPraktijkDetails(id: string): PraktijkDetails | undefined {
  return allePraktijken.find((p) => p.id === id);
}
