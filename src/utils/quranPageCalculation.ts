/**
 * Calculates the number of pages based on the number of ayats
 * @param quranFormat - The Quran format ("13" or "15" pages)
 * @param startAyah - The starting ayah number
 * @param endAyah - The ending ayah number
 * @returns The number of pages between the ayats (can be a decimal)
 */
export const calculatePages = (
  quranFormat: "13" | "15",
  startAyah: number,
  endAyah: number
): number => {
  // Calculate total number of ayats
  const totalAyats = endAyah - startAyah + 1;
  
  // Global average ayats per page based on total pages provided by user:
  // 15-line Mushaf: 6236 ayats / 616 pages = ~10.12 ayats/page
  // 13-line Mushaf: 6236 ayats / 848 pages = ~7.35 ayats/page
  const ayatsPerPage = quranFormat === "13" ? 7.35 : 8;
  
  // Calculate pages needed (allow decimals)
  const pages = totalAyats / ayatsPerPage;
  
  // Round to 2 decimal places
  return parseFloat(pages.toFixed(2));
}; 