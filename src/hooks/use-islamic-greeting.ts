import { useEffect, useMemo, useState } from "react";

import { WAQT_LABEL, getHijriDate, getWaqt } from "@/lib/islamic-date";

export interface IslamicGreeting {
  /** e.g. "As-salāmu ʿalaykum, Yusuf" */
  salutation: string;
  /** e.g. "Sunday, May 31" */
  gregorian: string;
  /** e.g. "20 Dhū al-Qaʿdah 1447 AH" */
  hijri: string;
  /** Human-readable current waqt window, e.g. "Ẓuhr", "morning" */
  waqt: string;
}

/**
 * Live greeting for madrasah dashboards.
 *
 * Updates once per minute so the gregorian/hijri/waqt labels stay correct
 * across day/prayer-window boundaries during long-lived sessions.
 */
export default function useIslamicGreeting(name?: string): IslamicGreeting {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);
    return () => {
      window.clearInterval(id);
    };
  }, []);

  return useMemo<IslamicGreeting>(() => {
    const firstName = name?.trim().split(/\s+/)[0];
    const salutation = firstName
      ? `As-salāmu ʿalaykum, ${firstName}`
      : "As-salāmu ʿalaykum";

    const gregorian = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(now);

    const hijri = getHijriDate(now).formatted;
    const waqt = WAQT_LABEL[getWaqt(now)];

    return { salutation, gregorian, hijri, waqt };
  }, [now, name]);
}
