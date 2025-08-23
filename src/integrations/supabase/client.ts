import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types.ts";
import { typedClient } from "./client-typed.ts";

export const SUPABASE_URL = "https://depsfpodwaprzxffdcks.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlcHNmcG9kd2Fwcnp4ZmZkY2tzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkxNTM5NjAsImV4cCI6MjA1NDcyOTk2MH0.Ax6eLUm_0Dd-YU7fv8VcvstqphIQ61DDmbb6yrKT0mc";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Create the regular client for backward compatibility
const originalSupabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        "Content-Type": "application/json",
        "Accept": "*/*",
        "apikey": SUPABASE_PUBLISHABLE_KEY,
      },
    },
  },
);

// Export our typed client as the main supabase client
export const supabase = typedClient;

// Also export the original client if needed for specific cases
export const originalSupabaseClient = originalSupabase;
