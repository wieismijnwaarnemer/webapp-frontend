// GET /api/practice-status?date=YYYY-MM-DD
//
// Voorbeeld endpoint die voor één datum de status van een praktijk teruggeeft.
// In productie komen `weeklySchedule` en `specialDays` uit de database op basis
// van een `?praktijkId=...` query — hier staan ze hardcoded als demo.

import { NextResponse } from "next/server";
import {
  getPracticeStatus,
  type SpecialDay,
  type WeeklyScheduleDay,
} from "@/lib/availability";

const DEMO_WEEKLY_SCHEDULE: WeeklyScheduleDay[] = [
  { day: 1, open: "08:00", close: "17:00", closed: false }, // maandag
  { day: 2, open: "08:00", close: "17:00", closed: false }, // dinsdag
  { day: 3, open: "08:00", close: "13:00", closed: false }, // woensdag
  { day: 4, open: "08:00", close: "17:00", closed: false }, // donderdag
  { day: 5, open: "08:00", close: "17:00", closed: false }, // vrijdag
  { day: 6, open: "", close: "", closed: true }, // zaterdag
  { day: 0, open: "", close: "", closed: true }, // zondag
];

const DEMO_SPECIAL_DAYS: SpecialDay[] = [
  { date: "2026-05-14", closed: true, note: "Vakantie" },
];

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date || !DATE_REGEX.test(date)) {
    return NextResponse.json(
      {
        error:
          "Ongeldige of ontbrekende 'date' parameter. Verwacht YYYY-MM-DD.",
      },
      { status: 400 }
    );
  }

  const status = getPracticeStatus({
    date,
    weeklySchedule: DEMO_WEEKLY_SCHEDULE,
    specialDays: DEMO_SPECIAL_DAYS,
  });

  return NextResponse.json({ date, ...status });
}
