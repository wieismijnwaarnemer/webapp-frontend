"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { DayKey, WeekSchedule } from "@/data/praktijk-extras";

const DAY_ORDER: DayKey[] = ["ma", "di", "wo", "do", "vr", "za", "zo"];

// JavaScript getDay(): 0 = zondag, 1 = maandag, ..., 6 = zaterdag
function jsDayToKey(d: number): DayKey {
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

  const todayIndex = DAY_ORDER.indexOf(todayKey);
  for (let i = 0; i < 7; i++) {
    const key = DAY_ORDER[(todayIndex + i) % 7];
    const h = schedule[key];
    if (!h) continue;
    if (i === 0) {
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
  const t = useTranslations("praktijk");
  const tDays = useTranslations("days");
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const paddingClass = size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-[12px]";
  const dotClass = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";

  if (!now) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-gray-100 font-semibold text-gray-500 ${paddingClass}`}
      >
        <span className={`rounded-full bg-gray-300 ${dotClass}`} />
        {t("statusLoading")}
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
        {t("openNow", { time: status.tot })}
      </span>
    );
  }

  if (status.nextDay) {
    const label = status.isToday
      ? t("closedUntilToday", { time: status.nextVan })
      : t("closedUntilDay", {
          day: tDays(`${status.nextDay}Lower`),
          time: status.nextVan,
        });
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-[#fef2f2] font-semibold text-[#dc2626] ${paddingClass}`}
      >
        <span className={`rounded-full bg-[#dc2626] ${dotClass}`} />
        {label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-gray-100 font-semibold text-gray-500 ${paddingClass}`}
    >
      <span className={`rounded-full bg-gray-400 ${dotClass}`} />
      {t("unknownHours")}
    </span>
  );
}
