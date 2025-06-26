import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string, formatString = "PPP"): string {
  if (!dateString) return "N/A";
  try {
    const date = typeof dateString === "string"
      ? parseISO(dateString)
      : new Date(dateString);
    return format(date, formatString);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return "";
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}

export function getStatusColor(
  status: string,
  theme: "light" | "dark" = "light",
): string {
  const statusMap = {
    light: {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-blue-100 text-blue-800",
      failed: "bg-red-100 text-red-800",
    },
    dark: {
      active: "bg-green-500/20 text-green-400 border border-green-500/30",
      inactive: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
      pending: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
      completed: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
      failed: "bg-red-500/20 text-red-400 border border-red-500/30",
    },
  };

  return statusMap[theme][status.toLowerCase()] || statusMap[theme].inactive;
}
