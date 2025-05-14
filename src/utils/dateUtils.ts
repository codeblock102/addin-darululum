import { format, startOfWeek } from 'date-fns';

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