
// Import from shadcn directly instead of our own file
import { useToast as useToastOriginal, toast as toastOriginal } from "@/components/ui/toast";

// Export the hooks with our own names
export const useToast = useToastOriginal;
export const toast = toastOriginal;
