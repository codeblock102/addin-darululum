import { format, startOfWeek, addDays } from 'date-fns';

/**
 * Gets the ISO date string (YYYY-MM-DD) for the start of the week (Sunday) for a given date.
 * @param date - The date object.
 * @returns The ISO date string for the start of the week.
 */
export function getStartOfWeekISO(date: Date): string {
  // Assuming the week starts on Sunday
  const weekStart = startOfWeek(date, { weekStartsOn: 0 }); 
  return format(weekStart, 'yyyy-MM-dd');
} 

/**
 * Gets an array of Date objects for each day of the week for a given date.
 * Assumes week starts on Sunday (index 0) for consistency with getStartOfWeekISO if used together,
 * but iterates to create a typical Mon-Sun or Sun-Sat sequence based on how startOfWeek is configured.
 * For this implementation, we'll use locale's default start of the week (often Monday for UI displays).
 * @param dateInWeek - A Date object falling within the desired week.
 * @returns An array of 7 Date objects for the week.
 */
export function getWeekDates(dateInWeek: Date): Date[] {
  // Get the start of the week. `startOfWeek` by default uses the locale.
  // For more control, specify `weekStartsOn`: 0 for Sunday, 1 for Monday, etc.
  // Let's use 0 (Sunday) to align with the existing getStartOfWeekISO, assuming UI will map day names correctly.
  const weekStart = startOfWeek(dateInWeek, { weekStartsOn: 0 }); 
  const weekDates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    weekDates.push(addDays(weekStart, i));
  }
  return weekDates;
} 