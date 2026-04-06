// === Types ===

export interface Practice {
  id: string;
  naam: string;
  adres: string;
  postcode: string;
  regio: string;
  slug: string;
  telefoon: string;
  huisarts: string;
  isClaimed: boolean;
  suggestedPartners: string[]; // IDs van waarschijnlijke waarnemers
}

export interface Schedule {
  praktijkId: string;
  waarnemerNaam: string;
  waarnemerPraktijk: string;
  datumVan: string;
  datumTot: string;
}

// === Echte praktijken in Purmerend ===

export const practices: Practice[] = [
  {
    id: "1",
    naam: "Huisartsenpraktijk Overwhere",
    adres: "Suze Groenewegstraat 142",
    postcode: "1442 NM",
    regio: "purmerend",
    slug: "huisartsenpraktijk-overwhere",
    telefoon: "0299-424356",
    huisarts: "Dr. Overwhere",
    isClaimed: false,
    suggestedPartners: ["2", "3", "6"],
  },
  {
    id: "2",
    naam: "Huisartsenpraktijk Overlander",
    adres: "Overlanderstraat 463",
    postcode: "1445 CN",
    regio: "purmerend",
    slug: "huisartsenpraktijk-overlander",
    telefoon: "0299-640421",
    huisarts: "Dr. Overlander",
    isClaimed: false,
    suggestedPartners: ["1", "4", "5"],
  },
  {
    id: "3",
    naam: "Huisartspraktijk Balk",
    adres: "Leeuwerikplein 80",
    postcode: "1444 HZ",
    regio: "purmerend",
    slug: "huisartspraktijk-balk",
    telefoon: "0299-429370",
    huisarts: "Dr. Balk",
    isClaimed: false,
    suggestedPartners: ["1", "6", "8"],
  },
  {
    id: "4",
    naam: "Huisartsenpraktijk Versteegh & Homan",
    adres: "Melbournestraat 2d",
    postcode: "1448 NH",
    regio: "purmerend",
    slug: "huisartsenpraktijk-versteegh-homan",
    telefoon: "0299-673118",
    huisarts: "Dr. Versteegh",
    isClaimed: false,
    suggestedPartners: ["5", "2", "7"],
  },
  {
    id: "5",
    naam: "Huisartsenpraktijk Ten Veen",
    adres: "Melbournestraat 2d",
    postcode: "1448 NH",
    regio: "purmerend",
    slug: "huisartsenpraktijk-ten-veen",
    telefoon: "0299-415019",
    huisarts: "Dr. Ten Veen",
    isClaimed: false,
    suggestedPartners: ["4", "2", "7"],
  },
  {
    id: "6",
    naam: "Huisartsenpraktijk Nota & Swart",
    adres: "Whereplantsoen 7",
    postcode: "1441 AB",
    regio: "purmerend",
    slug: "huisartsenpraktijk-nota-swart",
    telefoon: "0299-472100",
    huisarts: "Dr. Nota",
    isClaimed: false,
    suggestedPartners: ["1", "3", "8"],
  },
  {
    id: "7",
    naam: "Huisartsenpraktijk Landauer",
    adres: "Landauerstraat 200",
    postcode: "1445 PX",
    regio: "purmerend",
    slug: "huisartsenpraktijk-landauer",
    telefoon: "0299-644011",
    huisarts: "Dr. Landauer",
    isClaimed: false,
    suggestedPartners: ["4", "5", "9"],
  },
  {
    id: "8",
    naam: "Huisartsenpraktijk Wheermolen",
    adres: "Boeierstraat 40",
    postcode: "1443 EN",
    regio: "purmerend",
    slug: "huisartsenpraktijk-wheermolen",
    telefoon: "0299-435758",
    huisarts: "Dr. Smit",
    isClaimed: false,
    suggestedPartners: ["3", "6", "1"],
  },
  {
    id: "9",
    naam: "Huisartsenpraktijk De Graeff",
    adres: "De Graeffweg 72",
    postcode: "1446 BK",
    regio: "purmerend",
    slug: "huisartsenpraktijk-de-graeff",
    telefoon: "0299-437200",
    huisarts: "Dr. de Graeff",
    isClaimed: false,
    suggestedPartners: ["7", "10", "4"],
  },
  {
    id: "10",
    naam: "Huisartsenpraktijk Merlijn & Van Doorn",
    adres: "Churchillhof 1",
    postcode: "1443 VW",
    regio: "purmerend",
    slug: "huisartsenpraktijk-merlijn-van-doorn",
    telefoon: "0299-424800",
    huisarts: "Dr. Merlijn",
    isClaimed: false,
    suggestedPartners: ["9", "8", "3"],
  },
];

// === Actieve waarnemingen ===

export const schedules: Schedule[] = [
  {
    praktijkId: "1",
    waarnemerNaam: "Dr. Overlander",
    waarnemerPraktijk: "Huisartsenpraktijk Overlander",
    datumVan: "2026-04-06",
    datumTot: "2026-04-10",
  },
];

// === Regio's ===

export const regios = [
  { slug: "purmerend", naam: "Purmerend", provincie: "Noord-Holland" },
];

// === Helpers ===

export function zoekPraktijken(query: string): Practice[] {
  if (query.length < 2) return [];
  const q = query.toLowerCase();
  return practices.filter(
    (p) =>
      p.naam.toLowerCase().includes(q) ||
      p.adres.toLowerCase().includes(q) ||
      p.postcode.toLowerCase().replace(/\s/g, "").includes(q.replace(/\s/g, ""))
  );
}

export function getPractice(id: string): Practice | undefined {
  return practices.find((p) => p.id === id);
}

export function getPracticesByRegio(regio: string): Practice[] {
  return practices.filter((p) => p.regio === regio);
}

export function getSuggestedPartners(practiceId: string): Practice[] {
  const practice = getPractice(practiceId);
  if (!practice) return [];
  return practice.suggestedPartners
    .map((id) => getPractice(id))
    .filter((p): p is Practice => p !== undefined);
}

export function getActiveSchedule(praktijkId: string): Schedule | undefined {
  const today = new Date().toISOString().split("T")[0];
  return schedules.find(
    (s) =>
      s.praktijkId === praktijkId && s.datumVan <= today && s.datumTot >= today
  );
}
