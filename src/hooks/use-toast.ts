
// Re-export the toast components from the UI library
import { type ToastActionElement, ToastProps } from "@/components/ui/toast";
import { useToast as useToastOriginal } from "@/components/ui/use-toast";
import { toast as toastOriginal } from "@/components/ui/use-toast";

// Re-export the hooks
export const useToast = useToastOriginal;
export const toast = toastOriginal;

// Also re-export the types if needed
export type { ToastActionElement, ToastProps };
