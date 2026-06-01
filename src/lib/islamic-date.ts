/**
 * Islamic (Hijri) date + waqt (prayer time window) utilities.
 *
 * No network calls. Hijri conversion uses Intl.DateTimeFormat with the
 * `islamic-umalqura` calendar where available, falling back to `islamic`
 * and finally to a simple arithmetic conversion.
 *
 * Waqt is approximated by local clock hour — sufficient for greeting
 * salutations and ambient UI, NOT for actual prayer-time accuracy.
 */

export type Waqt =
  | "fajr"
  | "shuruq"
  | "duha"
  | "zuhr"
  | "asr"
  | "maghrib"
  | "isha";

export interface HijriDate {
  day: number;
  month: string;
  monthAr: string;
  year: number;
  formatted: string;
}

const HIJRI_MONTHS_EN = [
  "Muḥarram",
  "Ṣafar",
  "Rabīʿ al-Awwal",
  "Rabīʿ al-Thānī",
  "Jumādā al-Ūlā",
  "Jumādā al-Thāniyah",
  "Rajab",
  "Shaʿbān",
  "Ramaḍān",
  "Shawwāl",
  "Dhū al-Qaʿdah",
  "Dhū al-Ḥijjah",
];

const HIJRI_MONTHS_AR = [
  "مُحَرَّم",
  "صَفَر",
  "رَبِيع الأَوَّل",
  "رَبِيع الثَّانِي",
  "جُمَادَى الأُولَى",
  "جُمَادَى الثَّانِيَة",
  "رَجَب",
  "شَعْبَان",
  "رَمَضَان",
  "شَوَّال",
  "ذُو القَعْدَة",
  "ذُو الحِجَّة",
];

/**
 * Try Intl.DateTimeFormat with a given Hijri calendar identifier.
 * Returns null on failure (older runtimes, missing ICU data, etc.).
 */
function formatHijriParts(
  date: Date,
  calendar: "islamic-umalqura" | "islamic",
): { day: number; monthIndex: number; year: number } | null {
  try {
    const fmt = new Intl.DateTimeFormat(`en-u-ca-${calendar}`, {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
    const parts = fmt.formatToParts(date);
    let day = NaN;
    let monthIndex = NaN;
    let year = NaN;
    for (const part of parts) {
      if (part.type === "day") day = Number(part.value);
      else if (part.type === "month") monthIndex = Number(part.value) - 1;
      else if (part.type === "year") year = Number(part.value);
    }
    if (
      Number.isFinite(day) &&
      Number.isFinite(monthIndex) &&
      Number.isFinite(year) &&
      monthIndex >= 0 &&
      monthIndex < 12
    ) {
      return { day, monthIndex, year };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fallback Hijri conversion (Kuwaiti algorithm, integer math).
 * Accurate to ±1 day for most dates — good enough as a last resort.
 */
function fallbackHijri(date: Date): {
  day: number;
  monthIndex: number;
  year: number;
} {
  // Julian Day Number from Gregorian.
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();

  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  const jdn =
    d +
    Math.floor((153 * mm + 2) / 5) +
    365 * yy +
    Math.floor(yy / 4) -
    Math.floor(yy / 100) +
    Math.floor(yy / 400) -
    32045;

  // JDN → Islamic (tabular).
  const l = jdn - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
    Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 =
    l2 -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const month = Math.floor((24 * l3) / 709);
  const day = l3 - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;

  const monthIndex = Math.min(Math.max(month - 1, 0), 11);
  return { day, monthIndex, year };
}

export function getHijriDate(date: Date): HijriDate {
  const parts =
    formatHijriParts(date, "islamic-umalqura") ??
    formatHijriParts(date, "islamic") ??
    fallbackHijri(date);

  const monthEn = HIJRI_MONTHS_EN[parts.monthIndex] ?? "";
  const monthAr = HIJRI_MONTHS_AR[parts.monthIndex] ?? "";

  return {
    day: parts.day,
    month: monthEn,
    monthAr,
    year: parts.year,
    formatted: `${parts.day} ${monthEn} ${parts.year} AH`,
  };
}

export function getWaqt(date: Date): Waqt {
  const hour = date.getHours();
  if (hour >= 4 && hour < 6) return "fajr";
  if (hour >= 6 && hour < 7) return "shuruq";
  if (hour >= 7 && hour < 12) return "duha";
  if (hour >= 12 && hour < 15) return "zuhr";
  if (hour >= 15 && hour < 18) return "asr";
  if (hour >= 18 && hour < 20) return "maghrib";
  return "isha";
}

export const WAQT_LABEL: Record<Waqt, string> = {
  fajr: "Fajr",
  shuruq: "morning",
  duha: "morning",
  zuhr: "Ẓuhr",
  asr: "ʿAṣr",
  maghrib: "Maghrib",
  isha: "ʿIshāʾ",
};
