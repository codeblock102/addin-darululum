import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("API_URL");
const serviceRoleKey = Deno.env.get("SERVICE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing env: API_URL or SERVICE_KEY");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, password, name, madrassah_id: client_madrassah_id, phone, address, student_ids } = await req.json();

    if (!email || !password || !name) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl!, serviceRoleKey!);

    // Resolve madrassah_id from the caller's profile when possible (server-side enforcement)
    let resolved_madrassah_id: string | null = client_madrassah_id ?? null;
    try {
      const authHeader = req.headers.get("Authorization") || "";
      const token = authHeader.replace("Bearer ", "").trim();
      if (token && token !== serviceRoleKey) {
        const caller = createClient(supabaseUrl!, token);
        const { data: me } = await caller.auth.getUser();
        const callerId = me.user?.id;
        if (callerId) {
          const { data: profile } = await admin
            .from("profiles")
            .select("madrassah_id, role")
            .eq("id", callerId)
            .maybeSingle();
          if (profile?.madrassah_id) {
            resolved_madrassah_id = profile.madrassah_id as string;
          }
        }
      }
    } catch (_e) {
      // Non-fatal, fallback to client-provided
    }

    let userId: string | null = null;
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "parent", name, madrassah_id: resolved_madrassah_id },
    });

    if (authError || !authData?.user) {
      // If already registered, find user id
      const duplicate = typeof authError?.message === "string" && authError.message.toLowerCase().includes("already registered");
      if (duplicate) {
        const { data: list, error: listErr } = await admin.auth.admin.listUsers();
        if (listErr) {
          return new Response(JSON.stringify({ error: listErr.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const found = list.users?.find((u: any) => (u.email || "").toLowerCase() === (email || "").toLowerCase());
        if (!found) {
          return new Response(JSON.stringify({ error: authError?.message || "User exists but not found" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        userId = found.id;
      } else {
        return new Response(JSON.stringify({ error: authError?.message || "Failed to create user" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      userId = authData.user.id;
    }

    // Upsert into consolidated parents table
    const { error: upsertError } = await admin
      .from("parents")
      .upsert({
        id: userId!,
        name,
        email,
        madrassah_id: resolved_madrassah_id ?? null,
        phone: phone ?? null,
        address: address ?? null,
        student_ids: Array.isArray(student_ids) ? student_ids : [],
      });
    if (upsertError) {
      await admin.auth.admin.deleteUser(userId!);
      return new Response(JSON.stringify({ error: upsertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // No need for a separate link table; student_ids are stored on parents

    return new Response(JSON.stringify({ user: { id: userId } }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});


