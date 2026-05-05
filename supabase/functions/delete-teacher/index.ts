import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { corsHeaders } from "../create-admin/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("API_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  Deno.env.get("SERVICE_KEY");
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || serviceRoleKey;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    if (!userId || typeof userId !== "string") {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseAuth = createClient(supabaseUrl!, anonKey!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: caller } = await supabaseAuth.auth.getUser();
    if (!caller?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: profile } = await supabaseAuth
      .from("profiles")
      .select("role")
      .eq("id", caller.user.id)
      .maybeSingle();
    if (!profile || profile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl!, serviceRoleKey!);

    // ── 1. Remove teacher from classes.teacher_ids arrays ──────────
    try {
      const { data: classes } = await admin
        .from("classes")
        .select("id, teacher_ids")
        .contains("teacher_ids", [userId]);
      if (classes && classes.length > 0) {
        for (const cls of classes) {
          const newIds = (cls.teacher_ids || []).filter((id: string) => id !== userId);
          await admin.from("classes").update({ teacher_ids: newIds }).eq("id", cls.id);
        }
      }
    } catch (_e) { /* ignore */ }

    // ── 2. Remove teacher from classes.current_teacher_id ──────────
    try {
      await admin.from("classes").update({ current_teacher_id: null }).eq("current_teacher_id", userId);
    } catch (_e) { /* ignore */ }

    // ── 3. Clean up students_teachers ──────────────────────────────
    try {
      await admin.from("students_teachers").delete().eq("teacher_id", userId);
    } catch (_e) { /* ignore */ }

    // ── 4. Delete progress entries by this teacher ──────────────────
    try {
      await admin.from("progress").delete().eq("teacher_id", userId);
    } catch (_e) { /* ignore */ }

    // ── 5. Delete messages sent/received ───────────────────────────
    try {
      await admin.from("communications").delete().or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
    } catch (_e) { /* ignore */ }

    // ── 6. Delete teacher tasks ─────────────────────────────────────
    try {
      await admin.from("teacher_tasks").delete().eq("teacher_id", userId);
    } catch (_e) { /* ignore */ }

    // ── 7. Delete absence requests ──────────────────────────────────
    try {
      await admin.from("absence_requests").delete().eq("teacher_id", userId);
    } catch (_e) { /* ignore */ }

    // ── 8. Delete announcements ─────────────────────────────────────
    try {
      await admin.from("announcements").delete().eq("teacher_id", userId);
    } catch (_e) { /* ignore */ }

    // ── 9. Delete attendance records taken by this teacher ──────────
    try {
      await admin.from("attendance").delete().eq("teacher_id", userId);
    } catch (_e) { /* ignore */ }

    // ── 10. Delete the profile row ──────────────────────────────────
    const { error: profileDelErr } = await admin
      .from("profiles")
      .delete()
      .eq("id", userId);
    if (profileDelErr) {
      console.error("Profile delete error:", profileDelErr);
      return new Response(
        JSON.stringify({ error: `Failed to delete profile: ${profileDelErr.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 11. Delete the auth user ────────────────────────────────────
    const { error: authErr } = await admin.auth.admin.deleteUser(userId);
    if (authErr && !authErr.message.includes("not found")) {
      console.error("Auth delete error:", authErr);
      // Profile is already gone — don't fail the whole request
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
