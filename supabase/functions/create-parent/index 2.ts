import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { Resend } from "https://esm.sh/resend@3.2.0";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing env: API_URL or SERVICE_KEY");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Enforce POST; return a clear error for other methods
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Safely read and parse JSON body
    const contentType = (req.headers.get("content-type") || "").toLowerCase();
    let rawBody = "";
    try {
      rawBody = await req.text();
    } catch (e) {
      console.error("[create-parent] failed to read request body:", (e as Error)?.message || String(e));
    }
    if (!rawBody || rawBody.trim() === "") {
      return new Response(JSON.stringify({ error: "Empty request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let payload: any; // Using any here to accommodate dynamic fields from clients
    try {
      // Accept JSON only; if not JSON content-type, still try to parse as JSON
      payload = JSON.parse(rawBody);
    } catch (e) {
      console.error("[create-parent] invalid JSON:", (e as Error)?.message || String(e));
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, password, name, madrassah_id: client_madrassah_id, phone, address, student_ids } = payload || {};
    const normalizedEmail = String(email || "").replace(/\s+/g, "").trim().toLowerCase();

    try {
      console.log("[create-parent] invoked", {
        email: normalizedEmail,
        hasPassword: Boolean(password),
        hasName: Boolean(name),
        providedMadrassah: Boolean(client_madrassah_id),
        studentCount: Array.isArray(student_ids) ? student_ids.length : 0,
        contentType,
      });
    } catch (_e) { /* best-effort logging */ }

    if (!email || !name) {
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
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
      if (authHeader && anonKey) {
        const caller = createClient(supabaseUrl!, anonKey, {
          global: { headers: { Authorization: authHeader } },
        });
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
    let createdNewUser = false;
    let reusedAuthUser = false;
    let reusedParentByEmail = false;
    const defaultPassword = password || Deno.env.get("PARENT_DEFAULT_PASSWORD") || "Parent123!";

    // Prefer reusing existing parent by parents.email
    let existingParentRow: { id: string; student_ids: string[] | null } | null = null;
    try {
      const { data: row } = await admin
        .from("parents")
        .select("id, student_ids")
        .ilike("email", normalizedEmail)
        .maybeSingle();
      if (row?.id) existingParentRow = row as any;
    } catch (_) {}

    if (existingParentRow?.id) {
      userId = existingParentRow.id;
      reusedParentByEmail = true;
    } else {
      // Try to find an existing auth user by email
      try {
        const { data: list } = await admin.auth.admin.listUsers();
        const found = list?.users?.find((u: any) => (String(u.email || "").replace(/\s+/g, "").toLowerCase()) === normalizedEmail);
        if (found) {
          userId = found.id;
          reusedAuthUser = true;
        }
      } catch (_) {}

      // If not found, create a new auth user
      if (!userId) {
        const { data: authData, error: authError } = await admin.auth.admin.createUser({
          email: normalizedEmail,
          password: defaultPassword,
          email_confirm: true,
          user_metadata: { role: "parent", name, madrassah_id: resolved_madrassah_id, username: normalizedEmail },
        });
        if (authError || !authData?.user) {
          console.error("[create-parent] admin.createUser failed:", authError?.message);
          return new Response(JSON.stringify({ error: authError?.message || "Failed to create user" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        userId = authData.user.id;
        createdNewUser = true;
      }
    }

    // Check if a parents row exists already for this user id (for reporting)
    let parentRowExisted = false;
    try {
      if (userId) {
        const { data: preParent } = await admin
          .from("parents")
          .select("id")
          .eq("id", userId)
          .maybeSingle();
        parentRowExisted = Boolean(preParent?.id);
      }
    } catch (_) {}

    // Merge existing student_ids if parent already exists
    let mergedStudentIds: string[] = Array.isArray(student_ids) ? student_ids : [];
    try {
      if (existingParentRow?.student_ids && Array.isArray(existingParentRow.student_ids)) {
        const set = new Set<string>([...existingParentRow.student_ids, ...mergedStudentIds]);
        mergedStudentIds = Array.from(set);
      } else {
        const { data: existingParent } = await admin
          .from("parents")
          .select("student_ids")
          .eq("id", userId!)
          .maybeSingle();
        if (existingParent?.student_ids && Array.isArray(existingParent.student_ids)) {
          const set = new Set<string>([...existingParent.student_ids, ...mergedStudentIds]);
          mergedStudentIds = Array.from(set);
        }
      }
    } catch (_) {}

    // Upsert into consolidated parents table
    const { error: upsertError } = await admin
      .from("parents")
      .upsert({
        id: userId!,
        name,
        email: normalizedEmail,
        madrassah_id: resolved_madrassah_id ?? null,
        phone: phone ?? null,
        address: address ?? null,
        student_ids: mergedStudentIds,
      });
    if (upsertError) {
      console.error("[create-parent] upsert parents error:", upsertError.message);
      if (createdNewUser) {
        try { await admin.auth.admin.deleteUser(userId!); } catch (_) {}
      }
      return new Response(JSON.stringify({ error: upsertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optionally fetch student names for email content
    let studentNames: string[] = [];
    try {
      const ids = Array.isArray(student_ids) ? student_ids : [];
      if (ids.length > 0) {
        const { data: studs } = await admin
          .from("students")
          .select("name")
          .in("id", ids);
        studentNames = (studs || []).map((s: any) => String(s?.name || "student")).filter(Boolean);
      }
    } catch (_) {}

    // Send notification email to the guardian
    try {
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");
      const APP_URL = Deno.env.get("APP_URL") || "https://app.daralulummontreal.com/";
      if (RESEND_API_KEY && RESEND_FROM_EMAIL) {
        const resend = new Resend(RESEND_API_KEY);
        const list = studentNames.length > 0 ? studentNames.join(", ") : "your student";
        const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;">
          <h2>Welcome to Dār Al-Ulūm Montréal Parent Portal</h2>
          <p>An account has been created and linked to <strong>${list}</strong>.</p>
          <p>Login with:</p>
          <ul>
            <li>Username (email): <strong>${email}</strong></li>
            <li>Temporary password: <strong>${defaultPassword}</strong></li>
          </ul>
          <div style="margin:24px 0;text-align:center;">
            <a href="${APP_URL}" style="display:inline-block;padding:12px 24px;background-color:#0f766e;color:#ffffff;text-decoration:none;font-weight:600;border-radius:6px;" target="_blank" rel="noopener noreferrer">
              Open Parent Portal
            </a>
            <p style="font-size:12px;color:#6b7280;margin-top:8px;">
              Or copy this link: <a href="${APP_URL}" style="color:#0f766e;text-decoration:none;" target="_blank" rel="noopener noreferrer">${APP_URL}</a>
            </p>
          </div>
        </body></html>`;
        await resend.emails.send({ from: RESEND_FROM_EMAIL, to: normalizedEmail, subject: "Your Parent Portal Account", html });
      }
    } catch (_) {}

    // No need for a separate link table; student_ids are stored on parents

    try {
      console.log("[create-parent] success", { userId, email: normalizedEmail, linkedStudents: mergedStudentIds.length });
    } catch (_e) {}

    const parentRowCreated = !parentRowExisted;
    const parentRowUpdated = parentRowExisted;

    return new Response(JSON.stringify({
      user: { id: userId },
      email: normalizedEmail,
      credentials: { username: normalizedEmail, password: defaultPassword },
      metrics: {
        parentRowCreated,
        parentRowUpdated,
        createdNewAuthUser: createdNewUser,
        reusedAuthUser,
        reusedParentByEmail,
      },
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    try {
      console.error("[create-parent] unhandled error:", (error as Error)?.message || String(error));
    } catch (_e) {}
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});


