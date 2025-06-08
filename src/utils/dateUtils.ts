import {
  addDays,
  addWeeks,
  endOfWeek,
  format,
  isValid,
  parseISO,
  startOfWeek,
  subDays,
  subWeeks,
} from "date-fns";

export function formatDate(
  date: Date | string,
  formatStr: string = "yyyy-MM-dd",
): string {
  const parsedDate = typeof date === "string" ? parseISO(date) : date;

  if (!isValid(parsedDate)) {
    console.error("Invalid date provided to formatDate:", date);
    return "";
  }

  return format(parsedDate, formatStr);
}

export function getStartOfWeek(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 0 }); // 0 means Sunday
}

export function getEndOfWeek(date: Date): Date {
  return endOfWeek(date, { weekStartsOn: 0 }); // 0 means Sunday
}

export function getStartOfWeekISO(date: Date): string {
  return formatDate(getStartOfWeek(date));
}

export function getEndOfWeekISO(date: Date): string {
  return formatDate(getEndOfWeek(date));
}

export { addDays, addWeeks, subDays, subWeeks };

export function getDatesBetween(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

export function isToday(date: Date | string): boolean {
  const today = new Date();
  const compareDate = typeof date === "string" ? parseISO(date) : date;

  return (
    compareDate.getDate() === today.getDate() &&
    compareDate.getMonth() === today.getMonth() &&
    compareDate.getFullYear() === today.getFullYear()
  );
}

export function getWeekDates(date: Date): Date[] {
  const start = getStartOfWeek(date);
  return getDatesBetween(start, getEndOfWeek(date));
}

export function getWeekDatesISO(date: Date): string[] {
  return getWeekDates(date).map((d) => formatDate(d));
}

export function getDayName(
  date: Date | string,
  abbreviated: boolean = false,
): string {
  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  return format(parsedDate, abbreviated ? "EEE" : "EEEE");
}

export function getMonthName(
  date: Date | string,
  abbreviated: boolean = false,
): string {
  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  return format(parsedDate, abbreviated ? "MMM" : "MMMM");
}
