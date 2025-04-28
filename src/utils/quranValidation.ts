
interface SurahData {
  surah: number;
  ayahs: number;
}

// Surah data with number of ayahs
const surahData: SurahData[] = [
  { surah: 1, ayahs: 7 },
  { surah: 2, ayahs: 286 },
  { surah: 3, ayahs: 200 },
  { surah: 4, ayahs: 176 },
  { surah: 5, ayahs: 120 },
  { surah: 6, ayahs: 165 },
  { surah: 7, ayahs: 206 },
  { surah: 8, ayahs: 75 },
  { surah: 9, ayahs: 129 },
  { surah: 10, ayahs: 109 },
  { surah: 11, ayahs: 123 },
  { surah: 12, ayahs: 111 },
  { surah: 13, ayahs: 43 },
  { surah: 14, ayahs: 52 },
  { surah: 15, ayahs: 99 },
  { surah: 16, ayahs: 128 },
  { surah: 17, ayahs: 111 },
  { surah: 18, ayahs: 110 },
  { surah: 19, ayahs: 98 },
  { surah: 20, ayahs: 135 },
  { surah: 21, ayahs: 112 },
  { surah: 22, ayahs: 78 },
  { surah: 23, ayahs: 118 },
  { surah: 24, ayahs: 64 },
  { surah: 25, ayahs: 77 },
  { surah: 26, ayahs: 227 },
  { surah: 27, ayahs: 93 },
  { surah: 28, ayahs: 88 },
  { surah: 29, ayahs: 69 },
  { surah: 30, ayahs: 60 },
  { surah: 31, ayahs: 34 },
  { surah: 32, ayahs: 30 },
  { surah: 33, ayahs: 73 },
  { surah: 34, ayahs: 54 },
  { surah: 35, ayahs: 45 },
  { surah: 36, ayahs: 83 },
  { surah: 37, ayahs: 182 },
  { surah: 38, ayahs: 88 },
  { surah: 39, ayahs: 75 },
  { surah: 40, ayahs: 85 },
  { surah: 41, ayahs: 54 },
  { surah: 42, ayahs: 53 },
  { surah: 43, ayahs: 89 },
  { surah: 44, ayahs: 59 },
  { surah: 45, ayahs: 37 },
  { surah: 46, ayahs: 35 },
  { surah: 47, ayahs: 38 },
  { surah: 48, ayahs: 29 },
  { surah: 49, ayahs: 18 },
  { surah: 50, ayahs: 45 },
  { surah: 51, ayahs: 60 },
  { surah: 52, ayahs: 49 },
  { surah: 53, ayahs: 62 },
  { surah: 54, ayahs: 55 },
  { surah: 55, ayahs: 78 },
  { surah: 56, ayahs: 96 },
  { surah: 57, ayahs: 29 },
  { surah: 58, ayahs: 22 },
  { surah: 59, ayahs: 24 },
  { surah: 60, ayahs: 13 },
  { surah: 61, ayahs: 14 },
  { surah: 62, ayahs: 11 },
  { surah: 63, ayahs: 11 },
  { surah: 64, ayahs: 18 },
  { surah: 65, ayahs: 12 },
  { surah: 66, ayahs: 12 },
  { surah: 67, ayahs: 30 },
  { surah: 68, ayahs: 52 },
  { surah: 69, ayahs: 52 },
  { surah: 70, ayahs: 44 },
  { surah: 71, ayahs: 28 },
  { surah: 72, ayahs: 28 },
  { surah: 73, ayahs: 20 },
  { surah: 74, ayahs: 56 },
  { surah: 75, ayahs: 40 },
  { surah: 76, ayahs: 31 },
  { surah: 77, ayahs: 50 },
  { surah: 78, ayahs: 40 },
  { surah: 79, ayahs: 46 },
  { surah: 80, ayahs: 42 },
  { surah: 81, ayahs: 29 },
  { surah: 82, ayahs: 19 },
  { surah: 83, ayahs: 36 },
  { surah: 84, ayahs: 25 },
  { surah: 85, ayahs: 22 },
  { surah: 86, ayahs: 17 },
  { surah: 87, ayahs: 19 },
  { surah: 88, ayahs: 26 },
  { surah: 89, ayahs: 30 },
  { surah: 90, ayahs: 20 },
  { surah: 91, ayahs: 15 },
  { surah: 92, ayahs: 21 },
  { surah: 93, ayahs: 11 },
  { surah: 94, ayahs: 8 },
  { surah: 95, ayahs: 8 },
  { surah: 96, ayahs: 19 },
  { surah: 97, ayahs: 5 },
  { surah: 98, ayahs: 8 },
  { surah: 99, ayahs: 8 },
  { surah: 100, ayahs: 11 },
  { surah: 101, ayahs: 11 },
  { surah: 102, ayahs: 8 },
  { surah: 103, ayahs: 3 },
  { surah: 104, ayahs: 9 },
  { surah: 105, ayahs: 5 },
  { surah: 106, ayahs: 4 },
  { surah: 107, ayahs: 7 },
  { surah: 108, ayahs: 3 },
  { surah: 109, ayahs: 6 },
  { surah: 110, ayahs: 3 },
  { surah: 111, ayahs: 5 },
  { surah: 112, ayahs: 4 },
  { surah: 113, ayahs: 5 },
  { surah: 114, ayahs: 6 }
];

/**
 * Validates if a given surah number is valid
 * @param surah - Surah number to validate
 * @returns Boolean indicating if the surah number is valid
 */
export const isValidSurah = (surah: number): boolean => {
  return surah >= 1 && surah <= 114;
};

/**
 * Gets the total number of ayahs in a given surah
 * @param surah - Surah number
 * @returns Number of ayahs or 0 if invalid surah
 */
export const getTotalAyahsInSurah = (surah: number): number => {
  const surahInfo = surahData.find(s => s.surah === surah);
  return surahInfo ? surahInfo.ayahs : 0;
};

/**
 * Validates if an ayah number is valid for a given surah
 * @param surah - Surah number
 * @param ayah - Ayah number to validate
 * @returns Boolean indicating if the ayah number is valid for the surah
 */
export const isValidAyah = (surah: number, ayah: number): boolean => {
  const totalAyahs = getTotalAyahsInSurah(surah);
  return ayah >= 1 && ayah <= totalAyahs;
};

/**
 * Validates a range of ayahs within a surah
 * @param surah - Surah number
 * @param startAyah - Starting ayah number
 * @param endAyah - Ending ayah number
 * @returns Object with validation result and error message if invalid
 */
export const validateAyahRange = (
  surah: number,
  startAyah: number,
  endAyah: number
): { isValid: boolean; errorMessage?: string } => {
  if (!isValidSurah(surah)) {
    return {
      isValid: false,
      errorMessage: `Invalid Surah number. Must be between 1 and 114.`
    };
  }

  const totalAyahs = getTotalAyahsInSurah(surah);

  if (!isValidAyah(surah, startAyah)) {
    return {
      isValid: false,
      errorMessage: `Invalid starting Ayah. Surah ${surah} has ${totalAyahs} ayahs.`
    };
  }

  if (!isValidAyah(surah, endAyah)) {
    return {
      isValid: false,
      errorMessage: `Invalid ending Ayah. Surah ${surah} has ${totalAyahs} ayahs.`
    };
  }

  if (startAyah > endAyah) {
    return {
      isValid: false,
      errorMessage: `Starting Ayah cannot be greater than ending Ayah.`
    };
  }

  return { isValid: true };
};

/**
 * Get the name of a surah by its number
 * @param surahNumber - Number of the surah
 * @returns Object with surah number and total ayahs
 */
export const getSurahData = (surahNumber: number): SurahData | undefined => {
  return surahData.find(surah => surah.surah === surahNumber);
};
