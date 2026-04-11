// Nederlandse feestdagen generator.
//
// Gebruikt het Meeus/Jones/Butcher Gregoriaans Pasen-algoritme om elk jaar de
// juiste datums te berekenen voor Pasen-afhankelijke feestdagen (Goede Vrijdag,
// Hemelvaart, Pinksteren). Vaste feestdagen (nieuwjaar, koningsdag, kerst) zijn
// rechtstreeks.
//
// Geen externe dependencies.

export interface Holiday {
  name: string;
  date: string; // YYYY-MM-DD
  isPublicHoliday: boolean;
}

// --- utils ---

function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Meeus/Jones/Butcher Gregoriaans Pasen-algoritme.
 * Geeft maand (3 = maart, 4 = april) en dag van 1e Paasdag.
 */
function computeEaster(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const L = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * L) / 451);
  const month = Math.floor((h + L - 7 * m + 114) / 31);
  const day = ((h + L - 7 * m + 114) % 31) + 1;
  return { month, day };
}

// --- public API ---

/**
 * Alle Nederlandse feestdagen voor een gegeven jaar.
 */
export function getDutchHolidays(year: number): Holiday[] {
  const easter = computeEaster(year);
  const easterIso = toIso(year, easter.month, easter.day);

  // Koningsdag: 27 april, tenzij die op zondag valt → dan 26 april.
  const aprilTwentySeven = new Date(`${year}-04-27T00:00:00Z`);
  const koningsdagIso =
    aprilTwentySeven.getUTCDay() === 0 ? toIso(year, 4, 26) : toIso(year, 4, 27);

  return [
    { name: "Nieuwjaarsdag", date: toIso(year, 1, 1), isPublicHoliday: true },
    { name: "Goede Vrijdag", date: addDays(easterIso, -2), isPublicHoliday: true },
    { name: "Eerste Paasdag", date: easterIso, isPublicHoliday: true },
    { name: "Tweede Paasdag", date: addDays(easterIso, 1), isPublicHoliday: true },
    { name: "Koningsdag", date: koningsdagIso, isPublicHoliday: true },
    { name: "Bevrijdingsdag", date: toIso(year, 5, 5), isPublicHoliday: true },
    { name: "Hemelvaartsdag", date: addDays(easterIso, 39), isPublicHoliday: true },
    { name: "Eerste Pinksterdag", date: addDays(easterIso, 49), isPublicHoliday: true },
    { name: "Tweede Pinksterdag", date: addDays(easterIso, 50), isPublicHoliday: true },
    { name: "Eerste Kerstdag", date: toIso(year, 12, 25), isPublicHoliday: true },
    { name: "Tweede Kerstdag", date: toIso(year, 12, 26), isPublicHoliday: true },
  ];
}

/**
 * Check of een datum (YYYY-MM-DD) een Nederlandse feestdag is.
 * Returnt de Holiday of null.
 */
export function isHoliday(date: string): Holiday | null {
  const match = date.match(/^(\d{4})-\d{2}-\d{2}$/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const holidays = getDutchHolidays(year);
  return holidays.find((h) => h.date === date) ?? null;
}

/**
 * Formatteer een ISO datum (YYYY-MM-DD) als Nederlandse long-form
 * ("25 december 2026"). Gebruikt expliciet Europe/Amsterdam zodat het
 * resultaat identiek is ongeacht de lokale tijdzone van de browser of server.
 */
export function formatHolidayDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const day = parseInt(m[3], 10);
  // Anker op UTC-middag → nooit risico op drift over dagsgrens bij DST.
  const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return d.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  });
}
