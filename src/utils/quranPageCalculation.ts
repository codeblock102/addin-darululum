/**
 * Calculate the estimated number of pages based on Quran format and ayah range
 * This is a simplified calculation and should be adjusted based on actual Quran layout
 */
export function calculatePages(
  quranFormat: "13" | "15",
  startAyah: number,
  endAyah: number,
): number {
  if (!startAyah || !endAyah || startAyah > endAyah) {
    return 0;
  }

  const ayahCount = endAyah - startAyah + 1;

  // Average ayahs per page based on format
  const avgAyahsPerPage = quranFormat === "13" ? 8 : 10;

  // Calculate estimated pages
  const estimatedPages = Math.ceil(ayahCount / avgAyahsPerPage);

  return estimatedPages;
}
