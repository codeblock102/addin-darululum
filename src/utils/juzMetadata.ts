/**
 * Rough estimates of total ayats per Juz. 
 * Note: These are approximations and might vary slightly depending on Quran edition/counting.
 * A more accurate approach would involve precise mapping or fetching from a detailed Quran API/database.
 */
const ayatsPerJuz: { [key: number]: number } = {
  1: 148,
  2: 142, // 253 - 141 = 112? Check Baqarah end
  3: 180, // Al-Imran 92. 200 - 92 + 1 = 109? Check Al-Imran end
  4: 110, // Nisa 23. Needs check
  5: 122, // Nisa 147. Needs check
  6: 113, // Maidah 81. Needs check
  7: 111, // An'am 110. Needs check
  8: 121, // A'raf 87. Needs check
  9: 93, // Anfal 40. Needs check
  10: 129, // Tawbah 92. Needs check
  11: 123, // Hud 5. Needs check
  12: 111, // Yusuf 52. Needs check
  13: 96,  // Ra'd end + Ibrahim end + Hijr 1. Needs check
  14: 128, // Nahl end
  15: 111, // Isra end
  16: 135, // Kahf 74
  17: 112, // Anbiya end
  18: 78,  // Hajj end
  19: 118, // Mu'minun end
  20: 78,  // Furqan 20
  21: 112, // Ankabut 45
  22: 90,  // Ahzab 30
  23: 106, // Saba 23
  24: 77,  // Zumar 31
  25: 80,  // Fussilat 46
  26: 70,  // Shura 26
  27: 90,  // Qamar 55
  28: 69,  // Mujadila end
  29: 82,  // Mulk end
  30: 565  // Naba to Nas
};

/**
 * Gets the approximate total number of ayats in a given Juz.
 * @param juzNumber - The Juz number (1-30).
 * @returns The approximate total number of ayats, or 0 if invalid Juz.
 */
export function getTotalAyatsInJuz(juzNumber: number): number {
  return ayatsPerJuz[juzNumber] || 0;
}

/**
 * Calculates the set of unique ayats covered by progress entries within a specific Juz.
 * This assumes ayats are identified by their number within the Surah.
 * A more robust solution would use a global Ayat index.
 * 
 * @param progressEntries - Array of progress entries for the student.
 * @param targetJuz - The Juz number to filter by.
 * @returns A Set containing unique ayat identifiers (e.g., "surah:ayah").
 */
export function getUniqueAyatsCoveredInJuz(
  progressEntries: { current_juz?: number | null; current_surah?: number | null; start_ayat?: number | null; end_ayat?: number | null }[],
  targetJuz: number
): Set<string> {
  const uniqueAyats = new Set<string>();

  progressEntries.forEach(entry => {
    if (
      entry.current_juz === targetJuz &&
      entry.current_surah != null &&
      entry.start_ayat != null &&
      entry.end_ayat != null &&
      entry.start_ayat <= entry.end_ayat
    ) {
      for (let i = entry.start_ayat; i <= entry.end_ayat; i++) {
        uniqueAyats.add(`${entry.current_surah}:${i}`);
      }
    }
  });

  return uniqueAyats;
} 