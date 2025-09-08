import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  console.error("[purge-parents-students] Missing env SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
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
    const admin = createClient(supabaseUrl!, serviceRoleKey!);

    // Parse body
    const raw = await req.text();
    let body: any = {};
    try { body = raw ? JSON.parse(raw) : {}; } catch (_) { body = {}; }

    let targetMadrassahId: string | null = body?.madrassah_id ?? null;
    const purgeAllRequested = Boolean(body?.purge_all === true);
    const deleteParents = body?.delete_parents === false ? false : true;
    const deleteStudents = body?.delete_students === false ? false : true;

    // Try to resolve madrassah from caller's profile if not provided
    let callerRole: string | null = null;
    if (anonKey) {
      try {
        const callerAuth = req.headers.get("Authorization") || "";
        if (callerAuth) {
          const caller = createClient(supabaseUrl!, anonKey, { global: { headers: { Authorization: callerAuth } } });
          const { data: me } = await caller.auth.getUser();
          const callerId = me.user?.id;
          if (callerId) {
            const { data: profile } = await admin
              .from("profiles")
              .select("madrassah_id, role")
              .eq("id", callerId)
              .maybeSingle();
            if (profile?.madrassah_id) targetMadrassahId = profile.madrassah_id as string;
            if (profile?.role) callerRole = String(profile.role);
          }
        }
      } catch (_) { /* ignore */ }
    }

    // Security: only admins may invoke this purge
    if (callerRole !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine scope: purge all ONLY if explicitly requested
    const scopeAll = purgeAllRequested === true;
    if (!scopeAll && !targetMadrassahId) {
      return new Response(JSON.stringify({ error: "madrassah_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch target parents and students
    const parentIdSet = new Set<string>();
    const studentIdSet = new Set<string>();

    // Parents
    if (deleteParents) {
      if (scopeAll) {
        const { data: parents } = await admin.from("parents").select("id");
        (parents || []).forEach((p: { id: string }) => parentIdSet.add(p.id));
      } else {
        const { data: parents } = await admin.from("parents").select("id").eq("madrassah_id", targetMadrassahId);
        (parents || []).forEach((p: { id: string }) => parentIdSet.add(p.id));
      }
    }

    // Students
    if (deleteStudents) {
      if (scopeAll) {
        const { data: students } = await admin.from("students").select("id");
        (students || []).forEach((s: { id: string }) => studentIdSet.add(s.id));
      } else {
        const { data: students } = await admin.from("students").select("id").eq("madrassah_id", targetMadrassahId);
        (students || []).forEach((s: { id: string }) => studentIdSet.add(s.id));
      }
    }

    const parentIds = Array.from(parentIdSet);
    const studentIds = Array.from(studentIdSet);

    // Also gather student names for cleanup of name-based join tables
    const studentNames: string[] = [];
    try {
      if (studentIds.length > 0) {
        const { data: studs } = await admin
          .from("students")
          .select("name")
          .in("id", studentIds);
        (studs || []).forEach((s: { name: string }) => {
          if (s?.name) studentNames.push(s.name);
        });
      } else if (scopeAll) {
        const { data: studs } = await admin
          .from("students")
          .select("name");
        (studs || []).forEach((s: { name: string }) => {
          if (s?.name) studentNames.push(s.name);
        });
      }
    } catch (_) { /* ignore */ }

    // Delete links first
    try {
      if (deleteStudents && studentIds.length > 0) {
        await admin.from("parent_children").delete().in("student_id", studentIds);
      }
      if (deleteParents && parentIds.length > 0) {
        await admin.from("parent_children").delete().in("parent_id", parentIds);
      }
    } catch (_) { /* ignore */ }

    // Delete dependent student data first to satisfy FKs (only if deleting students)
    if (deleteStudents) {
      try { if (studentIds.length > 0) await admin.from("attendance").delete().in("student_id", studentIds); else if (scopeAll) await admin.from("attendance").delete().neq("id", ""); } catch (_) {}
      try { if (studentIds.length > 0) await admin.from("progress").delete().in("student_id", studentIds); else if (scopeAll) await admin.from("progress").delete().neq("id", ""); } catch (_) {}
      try { if (studentIds.length > 0) await admin.from("juz_revisions").delete().in("student_id", studentIds); else if (scopeAll) await admin.from("juz_revisions").delete().neq("id", ""); } catch (_) {}
      try { if (studentIds.length > 0) await admin.from("juz_mastery").delete().in("student_id", studentIds); else if (scopeAll) await admin.from("juz_mastery").delete().neq("id", ""); } catch (_) {}
      try { if (studentIds.length > 0) await admin.from("parent_comments").delete().in("student_id", studentIds); else if (scopeAll) await admin.from("parent_comments").delete().neq("id", ""); } catch (_) {}
      try { if (studentIds.length > 0) await admin.from("student_dhor_summaries").delete().in("student_id", studentIds); else if (scopeAll) await admin.from("student_dhor_summaries").delete().neq("id", ""); } catch (_) {}
      // Custom tables (if present in schema)
      try { if (studentIds.length > 0) await admin.from("difficult_ayahs").delete().in("student_id", studentIds); else if (scopeAll) await admin.from("difficult_ayahs").delete().neq("id", ""); } catch (_) {}
      try { if (studentIds.length > 0) await admin.from("revision_schedule").delete().in("student_id", studentIds); else if (scopeAll) await admin.from("revision_schedule").delete().neq("id", ""); } catch (_) {}
      try { if (studentIds.length > 0) await admin.from("student_assignments").delete().in("student_id", studentIds); else if (scopeAll) await admin.from("student_assignments").delete().neq("id", ""); } catch (_) {}
      try { if (studentIds.length > 0) await admin.from("teacher_assignment_submissions").delete().in("student_id", studentIds); else if (scopeAll) await admin.from("teacher_assignment_submissions").delete().neq("id", ""); } catch (_) {}
      // Name-based join table cleanup
      try { if (studentNames.length > 0) await admin.from("students_teachers").delete().in("student_name", studentNames); else if (scopeAll) await admin.from("students_teachers").delete().neq("id", ""); } catch (_) {}
    }

    // Delete parents table rows
    let parentsDeleted = 0;
    try {
      if (deleteParents) {
        if (parentIds.length > 0) {
          const { count } = await admin.from("parents").delete({ count: "exact" }).in("id", parentIds);
          parentsDeleted = count ?? parentsDeleted;
        } else if (scopeAll) {
          const { count } = await admin.from("parents").delete({ count: "exact" }).neq("id", "");
          parentsDeleted = count ?? parentsDeleted;
        }
      }
    } catch (_) { /* ignore */ }

    // Delete parent profiles
    try {
      if (deleteParents) {
        if (parentIds.length > 0) {
          await admin.from("profiles").delete().in("id", parentIds);
        }
        if (!scopeAll && targetMadrassahId) {
          await admin.from("profiles").delete().eq("role", "parent").eq("madrassah_id", targetMadrassahId);
        } else if (scopeAll) {
          await admin.from("profiles").delete().eq("role", "parent");
        }
      }
    } catch (_) { /* ignore */ }

    // Delete students
    let studentsDeleted = 0;
    try {
      if (deleteStudents) {
        if (studentIds.length > 0) {
          const { count } = await admin.from("students").delete({ count: "exact" }).in("id", studentIds);
          studentsDeleted = count ?? studentsDeleted;
        } else if (scopeAll) {
          const { count } = await admin.from("students").delete({ count: "exact" }).neq("id", "");
          studentsDeleted = count ?? studentsDeleted;
        }
      }
    } catch (_) { /* ignore */ }

    // Delete Auth users for parents
    let authDeleted = 0;
    try {
      if (deleteParents) {
        for (const pid of parentIds) {
          try {
            await admin.auth.admin.deleteUser(pid);
            authDeleted++;
          } catch (_) { /* ignore */ }
        }
      }
    } catch (_) { /* ignore */ }

    return new Response(
      JSON.stringify({
        ok: true,
        scope: scopeAll ? "all" : { madrassah_id: targetMadrassahId },
        parentsDeleted,
        studentsDeleted,
        authDeleted,
        options: { deleteParents, deleteStudents },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    try { console.error("[purge-parents-students] error:", (error as Error)?.message || String(error)); } catch (_) {}
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});


