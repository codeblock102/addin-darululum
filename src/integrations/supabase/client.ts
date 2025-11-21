import { typedClient } from "./client-typed.ts";

// Backwards-compatible constants for edge function calls
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
export const SUPABASE_PUBLISHABLE_KEY = import.meta.env
  .VITE_SUPABASE_ANON_KEY as string;

// Export our typed client as the main supabase client
export const supabase = typedClient;
