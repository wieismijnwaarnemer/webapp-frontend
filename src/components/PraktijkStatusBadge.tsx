"use client";

import { useEffect, useState } from "react";
import type { DayKey, WeekSchedule } from "@/data/praktijk-extras";

const DAY_ORDER: DayKey[] = ["ma", "di", "wo", "do", "vr", "za", "zo"];
const DAY_LABEL: Record<DayKey, string> = {
  ma: "maandag",
  di: "dinsdag",
  wo: "woensdag",
  do: "donderdag",
  vr: "vrijdag",
  za: "zaterdag",
  zo: "zondag",
};

// JavaScript getDay(): 0 = zondag, 1 = maandag, ..., 6 = zaterdag
function jsDayToKey(d: number): DayKey {
  // Shift zo dat maandag index 0 krijgt om met DAY_ORDER overeen te komen.
  return DAY_ORDER[(d + 6) % 7];
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

type Status =
  | { open: true; tot: string }
  | { open: false; nextDay: DayKey; nextVan: string; isToday: boolean }
  | { open: false; nextDay: null };

function computeStatus(schedule: WeekSchedule, now: Date): Status {
  const todayKey = jsDayToKey(now.getDay());
  const minutesNow = now.getHours() * 60 + now.getMinutes();

  const today = schedule[todayKey];
  if (today && minutesNow >= toMinutes(today.van) && minutesNow < toMinutes(today.tot)) {
    return { open: true, tot: today.tot };
  }

  // Eerstvolgende dag zoeken (inclusief later vandaag).
  const todayIndex = DAY_ORDER.indexOf(todayKey);
  for (let i = 0; i < 7; i++) {
    const key = DAY_ORDER[(todayIndex + i) % 7];
    const h = schedule[key];
    if (!h) continue;
    if (i === 0) {
      // Vandaag nog — alleen als we nu nog vóór openingstijd zitten.
      if (minutesNow < toMinutes(h.van)) {
        return { open: false, nextDay: key, nextVan: h.van, isToday: true };
      }
      continue;
    }
    return { open: false, nextDay: key, nextVan: h.van, isToday: false };
  }
  return { open: false, nextDay: null };
}

export default function PraktijkStatusBadge({
  schedule,
  size = "md",
}: {
  schedule: WeekSchedule;
  size?: "sm" | "md";
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const paddingClass = size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-[12px]";
  const dotClass = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";

  if (!now) {
    // Server-render fallback: neutrale pil zonder live-status (voorkomt hydration mismatch).
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-gray-100 font-semibold text-gray-500 ${paddingClass}`}
      >
        <span className={`rounded-full bg-gray-300 ${dotClass}`} />
        Status laden…
      </span>
    );
  }

  const status = computeStatus(schedule, now);

  if (status.open) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-[#1f8c4e]/10 font-semibold text-[#1f8c4e] ${paddingClass}`}
      >
        <span className="relative flex">
          <span className={`absolute inline-flex animate-ping rounded-full bg-[#1f8c4e]/60 ${dotClass}`} />
          <span className={`relative inline-flex rounded-full bg-[#1f8c4e] ${dotClass}`} />
        </span>
        Open — nu tot {status.tot}
      </span>
    );
  }

  if (status.nextDay) {
    const label = status.isToday
      ? `vanaf ${status.nextVan} vandaag`
      : `${DAY_LABEL[status.nextDay]} ${status.nextVan}`;
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-[#fef2f2] font-semibold text-[#dc2626] ${paddingClass}`}
      >
        <span className={`rounded-full bg-[#dc2626] ${dotClass}`} />
        Gesloten — {label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-gray-100 font-semibold text-gray-500 ${paddingClass}`}
    >
      <span className={`rounded-full bg-gray-400 ${dotClass}`} />
      Openingstijden onbekend
    </span>
  );
}
