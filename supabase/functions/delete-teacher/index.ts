import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { corsHeaders } from "../create-admin/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("API_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_KEY");
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || serviceRoleKey;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing environment variables: SUPABASE_URL/API_URL or SUPABASE_SERVICE_ROLE_KEY/SERVICE_KEY");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { userId } = await req.json();

    if (!userId || typeof userId !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid userId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is an admin using the bearer token
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Client with caller's auth to check role
    const supabaseAuth = createClient(supabaseUrl!, anonKey!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: caller, error: callerErr } = await supabaseAuth.auth.getUser();
    if (callerErr || !caller?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: profile, error: profileErr } = await supabaseAuth
      .from("profiles")
      .select("role")
      .eq("id", caller.user.id)
      .maybeSingle();
    if (profileErr || !profile || profile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl!, serviceRoleKey!);

    // 1) Best-effort cleanup of teacher-linked rows that may not have strict FKs
    try {
      // Remove teacher from students_teachers mapping (if exists)
      await admin.from("students_teachers").delete().eq("teacher_id", userId);
    } catch (_cleanupErr) {
      // ignore cleanup errors
    }

    try {
      // Delete progress entries authored by this teacher (teacher_id or contributor_id)
      // Note: This removes history as requested; adjust to SET NULL if needed.
      await admin.from("progress").delete().or(`teacher_id.eq.${userId},contributor_id.eq.${userId}`);
    } catch (_cleanupErr2) {
      // ignore cleanup errors
    }

    // 2) Delete the teacher's profile (will cascade to dependent tables with FK ON DELETE CASCADE)
    const { error: profileDelErr } = await admin.from("profiles").delete().eq("id", userId);
    if (profileDelErr) {
      console.error("Error deleting teacher profile:", profileDelErr);
      return new Response(JSON.stringify({ error: `Failed to delete profile: ${profileDelErr.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3) Delete the auth user (ignore not found)
    const { error: authErr } = await admin.auth.admin.deleteUser(userId);
    if (authErr && authErr.message !== "User not found") {
      console.error("Error deleting auth user:", authErr);
      return new Response(JSON.stringify({ error: authErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ message: "Teacher deleted" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unhandled error in delete-teacher:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});


