export const getInitials = (name: string | undefined): string => {
  if (!name) return "U";
  const parts = name.split("@")[0].split(".");
  if (parts.length > 1) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

/**
 * Extracts a readable error message from an error object
 * @param error - The error object (could be Error, string, or any other type)
 * @param fallbackMessage - Default message if error cannot be parsed
 * @returns A readable error message string
 */
export const getErrorMessage = (error: unknown, fallbackMessage = "An unexpected error occurred"): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === "string") {
    return error;
  }
  
  // Handle Supabase errors which might have a message property
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  
  // Handle errors that might have a details property (common in Supabase)
  if (error && typeof error === "object" && "details" in error) {
    return String((error as { details: unknown }).details);
  }
  
  return fallbackMessage;
};
