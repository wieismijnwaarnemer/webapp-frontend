// Praktijk-status checker op basis van weekrooster, special days (vakanties,
// eigen sluitingen) en Nederlandse feestdagen.
//
// Voorrangsregels voor een gegeven datum:
//   1. special days overschrijven alles (eigen vrije dagen / vakanties)
//   2. Nederlandse feestdagen
//   3. normale weekrooster
//
// Geen externe dependencies.

import { getDutchHolidays, type Holiday } from "./holidays";

// --- Types ---

/**
 * Eén rij in het weekrooster. `day` volgt JS-conventie (0 = zondag, 1 = maandag,
 * ..., 6 = zaterdag) zodat `new Date().getDay()` direct matcht.
 */
export interface WeeklyScheduleDay {
  day: number; // 0 = zondag, 1 = maandag, ..., 6 = zaterdag
  open: string; // "HH:MM"
  close: string; // "HH:MM"
  closed: boolean;
}

/**
 * Een uitzondering op het weekrooster voor één specifieke datum — bv. een
 * vakantie, studiedag of eigen vrije dag die niet op een feestdag valt.
 */
export interface SpecialDay {
  date: string; // YYYY-MM-DD
  closed: boolean;
  note?: string;
}

export type PracticeStatusReason =
  | "open"
  | "closed"
  | "holiday"
  | "manual_override";

export interface PracticeStatus {
  isOpen: boolean;
  reason: PracticeStatusReason;
  holidayName?: string;
  note?: string;
  hours?: { open: string; close: string };
}

export interface GetPracticeStatusInput {
  date: string; // YYYY-MM-DD
  weeklySchedule: WeeklyScheduleDay[];
  specialDays?: SpecialDay[];
  /**
   * Optioneel. Als niet gegeven, worden de NL-feestdagen voor het jaar van
   * `date` automatisch berekend via `getDutchHolidays`.
   */
  holidays?: Holiday[];
}

// --- Voorbeelden (ter referentie — niet geëxporteerd) ---
//
// const WEEKLY_SCHEDULE_EXAMPLE: WeeklyScheduleDay[] = [
//   { day: 1, open: "08:00", close: "17:00", closed: false }, // maandag
//   { day: 2, open: "08:00", close: "17:00", closed: false }, // dinsdag
//   { day: 3, open: "08:00", close: "13:00", closed: false }, // woensdag
//   { day: 4, open: "08:00", close: "17:00", closed: false }, // donderdag
//   { day: 5, open: "08:00", close: "17:00", closed: false }, // vrijdag
//   { day: 6, open: "", close: "", closed: true },            // zaterdag
//   { day: 0, open: "", close: "", closed: true },            // zondag
// ];
//
// const SPECIAL_DAYS_EXAMPLE: SpecialDay[] = [
//   { date: "2026-05-14", closed: true, note: "Vakantie" },
//   { date: "2026-08-03", closed: true, note: "Studiedag" },
// ];

// --- Helpers ---

function isoToWeekday(date: string): number {
  // Parse als UTC om tijdszone-drift te voorkomen.
  const d = new Date(date + "T00:00:00Z");
  return d.getUTCDay();
}

// --- Main ---

export function getPracticeStatus({
  date,
  weeklySchedule,
  specialDays = [],
  holidays,
}: GetPracticeStatusInput): PracticeStatus {
  // 1. Special days overrulen alles.
  const special = specialDays.find((s) => s.date === date);
  if (special) {
    return {
      isOpen: !special.closed,
      reason: "manual_override",
      note: special.note,
    };
  }

  // 2. Nederlandse feestdagen.
  const year = parseInt(date.slice(0, 4), 10);
  const holidayList =
    holidays ?? (Number.isNaN(year) ? [] : getDutchHolidays(year));
  const holiday = holidayList.find((h) => h.date === date);
  if (holiday) {
    return {
      isOpen: false,
      reason: "holiday",
      holidayName: holiday.name,
    };
  }

  // 3. Fallback: normaal weekrooster.
  const weekday = isoToWeekday(date);
  const schedule = weeklySchedule.find((s) => s.day === weekday);
  if (!schedule || schedule.closed) {
    return { isOpen: false, reason: "closed" };
  }
  return {
    isOpen: true,
    reason: "open",
    hours: { open: schedule.open, close: schedule.close },
  };
}
