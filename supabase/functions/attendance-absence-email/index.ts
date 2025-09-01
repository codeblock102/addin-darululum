// @ts-nocheck
// =================================================================================
// STEP 1: INITIALIZATION & CONFIGURATION
// =================================================================================
// Edge function: Send attendance status notifications (present/absent/late/not marked)
// Runs every 5 minutes via pg_cron; also invokable manually by admins/teachers

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

// --- Environment Variables ---
// These must be set as secrets in your Supabase project settings.
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");

// --- Debug Logs for Environment Variables ---
// These logs help verify if the function is loading the secrets correctly.
// Check your Supabase function logs to see the output.
console.log("--- Edge Function Start ---");
console.log(`RESEND_API_KEY is set: ${!!RESEND_API_KEY}`);
console.log(`RESEND_FROM_EMAIL is set: ${!!FROM_EMAIL}`);
console.log("-------------------------");

// --- Constants & Clients ---
const DEFAULT_ORG_LOGO_URL = "https://depsfpodwaprzxffdcks.supabase.co/storage/v1/object/public/dum-logo/dum-logo.png";
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

// --- Type Definitions ---
type SettingRow = {
  madrassah_id: string;
  enabled: boolean;
  cutoff_time: string; // HH:MM 24h
  timezone: string; // IANA
  last_sent_date: string | null; // YYYY-MM-DD
};

// =================================================================================
// STEP 2: UTILITY FUNCTIONS
// =================================================================================

// Formats a Date object into "YYYY-MM-DD" in a specific timezone.
function formatLocalYmd(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "00";
  const d = parts.find((p) => p.type === "day")?.value ?? "00";
  return `${y}-${m}-${d}`;
}

// Formats a Date object into "HH:MM" (24h) in a specific timezone.
function formatLocalHm(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hh = parts.find((p) => p.type === "hour")?.value ?? "00";
  const mm = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hh}:${mm}`;
}

// Converts a "HH:MM" string to total minutes from midnight.
function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(":").map((n) => parseInt(n, 10));
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
}

// Escapes HTML characters in a string to prevent XSS.
function htmlEscape(str: string): string {
  return str.replace(/[&<>\"]/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  }[c] as string));
}

// Simple async sleep/delay function.
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =================================================================================
// STEP 3: MAIN SERVER LOGIC
// =================================================================================

serve(async (req: Request) => {
  // --- Handle CORS Preflight Request ---
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // --- Handle Health Check Request ---
  if (req.method === "GET") {
    try { console.log("[attendance-absence-email] GET health"); } catch (_) {}
    return new Response(JSON.stringify({ ok: true, service: "attendance-absence-email" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // =================================================================================
    // STEP 4: PARSE INCOMING REQUEST & DETERMINE SCOPE
    // =================================================================================
    let triggerSource = "manual";
    let timestamp = new Date().toISOString();
    let explicitMadrassahId: string | null = null;
    let explicitStudentIds: string[] | null = null;
    let explicitDate: string | null = null; // YYYY-MM-DD
    let explicitClassId: string | null = null; // optional specific class scope
    let force: boolean = false;
    let preview: boolean = false; // if true, return recipients without sending

    try {
      const bodyText = await req.text();
      if (bodyText) {
        const parsed = JSON.parse(bodyText);
        triggerSource = parsed.source || triggerSource;
        timestamp = parsed.timestamp || timestamp;
        explicitMadrassahId = parsed.madrassah_id || null;
        explicitStudentIds = Array.isArray(parsed.student_ids) ? parsed.student_ids : null;
        explicitClassId = typeof parsed.class_id === 'string' ? parsed.class_id : null;
        const maybeDate = typeof parsed.date === 'string' ? String(parsed.date).trim() : '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(maybeDate)) {
          explicitDate = maybeDate;
        }
        force = Boolean(parsed.force);
        preview = Boolean(parsed.preview);
      }
    } catch (_) {
      // Ignore parsing errors; proceed with defaults.
    }

    // --- Validate Inputs ---
    const isUuid = (s: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s);
    if (explicitClassId && !isUuid(explicitClassId)) {
      explicitClassId = null;
    }
    if (explicitStudentIds && explicitStudentIds.length > 0) {
      explicitStudentIds = explicitStudentIds.filter((id: any) => typeof id === 'string' && isUuid(id));
      if (explicitStudentIds.length === 0) {
        explicitStudentIds = null;
      }
    }

    // --- Check Email Configuration ---
    let emailSendingEnabled = Boolean(RESEND_API_KEY && FROM_EMAIL && resend);
    let emailConfigMessage = "Email service configured correctly.";

    if (!RESEND_API_KEY && !FROM_EMAIL) {
        emailConfigMessage = "RESEND_API_KEY and RESEND_FROM_EMAIL secrets are not set.";
    } else if (!RESEND_API_KEY) {
        emailConfigMessage = "RESEND_API_KEY secret is not set.";
    } else if (!FROM_EMAIL) {
        emailConfigMessage = "RESEND_FROM_EMAIL secret is not set.";
    }

    // --- Initialize Supabase Clients ---
    // Service role client for admin-level operations.
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // User-scoped client to respect RLS, using the Authorization header from the request.
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    // --- Resolve Invoking User's Madrassah (for Admin-triggered manual runs) ---
    let invokingMadrassahId: string | null = explicitMadrassahId;
    if (!invokingMadrassahId) {
      const { data: userData } = await supabaseUser.auth.getUser();
      const userId = userData?.user?.id;
      if (userId) {
        const { data: profile } = await supabaseService
          .from("profiles")
          .select("madrassah_id, role")
          .eq("id", userId)
          .maybeSingle();
        invokingMadrassahId = (profile?.madrassah_id as string) || null;
      }
    }

    // =================================================================================
    // STEP 5: TEACHER-SCOPED EXECUTION
    // This block runs if `student_ids` are provided, typically from a teacher's manual trigger.
    // It bypasses the automated settings and processes only the specified students.
    // =================================================================================
    if (explicitStudentIds && explicitStudentIds.length > 0) {
      const effectiveYmd = explicitDate || formatLocalYmd(new Date(), "UTC");

      // --- Authorization Check for Teacher+Class Scope ---
      // If a class_id is provided, ensure the invoking teacher is assigned to that class.
      if (explicitClassId) {
        try {
          const { data: userData } = await supabaseUser.auth.getUser();
          const userId = userData?.user?.id || '';
          const { data: cls, error: clsErr } = await supabaseService
            .from("classes")
            .select("id, current_students, teacher_ids")
            .eq("id", explicitClassId)
            .maybeSingle();
          if (clsErr) throw clsErr;
          const teacherIds = Array.isArray((cls as any)?.teacher_ids) ? (cls as any).teacher_ids : [];
          if (userId && teacherIds.length > 0 && !teacherIds.includes(userId)) {
            return new Response(JSON.stringify({ error: "not_authorized_for_class" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
        } catch (_) {
          // If the class check fails, proceed without narrowing. Don't error the whole run.
        }
      }

      // --- Fetch Student and Attendance Data ---
      const { data: students, error: studentsErr } = await supabaseService
        .from("students")
        .select("id, name, guardian_email, guardian_name, status, madrassah_id")
        .in("id", explicitStudentIds);
      if (studentsErr) throw studentsErr;

      const activeStudents = (students || []).filter((s: any) => (s.status || 'active') === 'active');
      const studentIds = activeStudents.map((s: any) => s.id);

      // If no active students, exit early.
      if (studentIds.length === 0) {
        const emptyPreview = preview ? { preview: true, recipients: {} } : {};
        return new Response(JSON.stringify({ ok: true, scope: "teacher", date: effectiveYmd, emails_sent: 0, emails_skipped: 0, ...emptyPreview }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: attendanceRows, error: attendanceErr } = await supabaseService
        .from("attendance")
        .select("student_id, status")
        .eq("date", effectiveYmd)
        .in("student_id", studentIds);
      if (attendanceErr) throw attendanceErr;

      const statusByStudent = new Map<string, string>();
      for (const row of (attendanceRows || [])) {
        const st = String((row as any)?.status || '').toLowerCase();
        if ((row as any)?.student_id) statusByStudent.set((row as any).student_id, st);
      }

      let emailsSent = 0;
      let emailsSkipped = 0;
      const previewRecipients: Record<string, string[]> = {};

      // --- Process Each Student ---
      for (const student of activeStudents) {
        const status = statusByStudent.get(student.id) || 'not marked';

        // --- STEP 5a: GATHER RECIPIENTS ---
        // Collect unique, valid email addresses from multiple tables.
        const recipientSet = new Set<string>();
        const addEmail = (email: string | null | undefined) => {
          if (!email) return;
          const trimmed = String(email).trim().toLowerCase();
          if (trimmed && /.+@.+\..+/.test(trimmed)) {
            console.log(`[DEBUG] Adding email: ${trimmed} for student ${student.id}`);
            recipientSet.add(trimmed);
          }
        };

        // Source 1: Direct guardian_email from students table
        console.log(`[DEBUG] Checking source 1 (students.guardian_email) for student ${student.id}`);
        addEmail(student.guardian_email);

        // Source 2: `parents` table where student_ids array contains the student's ID
        try {
          console.log(`[DEBUG] Checking source 2 (parents table) for student ${student.id}`);
          const { data: parentRows, error: parentsError } = await supabaseService
            .from("parents")
            .select("email, student_ids")
            .contains("student_ids", [student.id]);
          
          if (parentsError) {
            console.error(`[DEBUG] Error querying parents table for student ${student.id}:`, parentsError.message);
          } else {
            console.log(`[DEBUG] Found ${parentRows?.length || 0} rows in 'parents' table for student ${student.id}.`);
            for (const p of (parentRows || [])) addEmail(p?.email);
          }
        } catch (e) {
          console.error(`[DEBUG] Exception in parents table query for student ${student.id}:`, (e as Error).message);
        }

        // Source 3: `parent_children` -> `parent_teachers` join
        try {
          console.log(`[DEBUG] Checking source 3 (parent_children -> parent_teachers) for student ${student.id}`);
          const { data: pcRows, error: pcError } = await supabaseService
            .from("parent_children")
            .select("parent_id")
            .eq("student_id", student.id);

          if (pcError) {
             console.error(`[DEBUG] Error querying parent_children for student ${student.id}:`, pcError.message);
          } else if (pcRows && pcRows.length > 0) {
            const parentIds = Array.from(new Set(pcRows.map((r: any) => r.parent_id)));
            console.log(`[DEBUG] Found parent_ids from parent_children: ${parentIds.join(', ')}`);
            if (parentIds.length > 0) {
              const { data: ptRows, error: ptError } = await supabaseService
                .from("parent_teachers")
                .select("email")
                .in("id", parentIds);
              
              if (ptError) {
                console.error(`[DEBUG] Error querying parent_teachers for parent_ids ${parentIds.join(', ')}:`, ptError.message);
              } else {
                 console.log(`[DEBUG] Found ${ptRows?.length || 0} rows in 'parent_teachers' table.`);
                 for (const p of (ptRows || [])) addEmail(p?.email);
              }
            }
          } else {
            console.log(`[DEBUG] No rows found in 'parent_children' for student ${student.id}.`);
          }
        } catch (e) {
             console.error(`[DEBUG] Exception in parent_teachers join for student ${student.id}:`, (e as Error).message);
        }

        // Source 4: Legacy `parent_children` -> `profiles` join
        try {
          console.log(`[DEBUG] Checking source 4 (parent_children -> profiles) for student ${student.id}`);
           const { data: pcRows2, error: pcError2 } = await supabaseService
            .from("parent_children")
            .select("parent_id")
            .eq("student_id", student.id);

          if (pcError2) {
            console.error(`[DEBUG] Error querying parent_children (legacy) for student ${student.id}:`, pcError2.message);
          } else if (pcRows2 && pcRows2.length > 0) {
            const parentIds2 = Array.from(new Set(pcRows2.map((r: any) => r.parent_id)));
             console.log(`[DEBUG] Found parent_ids from parent_children (legacy): ${parentIds2.join(', ')}`);
            if (parentIds2.length > 0) {
              const { data: profRows, error: profError } = await supabaseService
                .from("profiles")
                .select("email, role")
                .in("id", parentIds2);
              
              if(profError) {
                  console.error(`[DEBUG] Error querying profiles for parent_ids ${parentIds2.join(', ')}:`, profError.message);
              } else {
                console.log(`[DEBUG] Found ${profRows?.length || 0} rows in 'profiles' table.`);
                for (const p of (profRows || [])) {
                  if ((p as any)?.role === 'parent') addEmail((p as any)?.email);
                }
              }
            }
          } else {
             console.log(`[DEBUG] No rows found in 'parent_children' (legacy) for student ${student.id}.`);
          }
        } catch (e) {
          console.error(`[DEBUG] Exception in profiles join for student ${student.id}:`, (e as Error).message);
        }

        const recipients = Array.from(recipientSet);

        // --- STEP 5b: PREVIEW OR SEND ---
        // If in preview mode, just collect recipients and continue.
        if (preview) {
          previewRecipients[student.id] = recipients;
          continue;
        }

        if (recipients.length === 0) { emailsSkipped++; continue; }

        // If email sending is disabled, skip but count it.
        if (!emailSendingEnabled) {
          emailsSkipped += recipients.length;
          continue;
        }

        // Send the email.
        try {
          await resend!.emails.send({
            from: FROM_EMAIL!,
            to: recipients,
            subject: `Attendance Status - ${student.name} (${effectiveYmd})`,
            html: `<p>${student.name} was marked <strong>${status}</strong> on ${effectiveYmd}.</p>`,
          });
          emailsSent += recipients.length;
        } catch {
          emailsSkipped += recipients.length;
        }
      }

      // --- STEP 5c: RETURN RESPONSE ---
      if (preview) {
        return new Response(JSON.stringify({ ok: true, scope: "teacher", date: effectiveYmd, preview: true, email_sending_enabled: emailSendingEnabled, email_config_message: emailConfigMessage, recipients: previewRecipients }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ ok: true, scope: "teacher", date: effectiveYmd, email_sending_enabled: emailSendingEnabled, email_config_message: emailConfigMessage, emails_sent: emailsSent, emails_skipped: emailsSkipped }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // =================================================================================
    // STEP 6: MADRASSAH-SCOPED (AUTOMATED) EXECUTION
    // This block runs for scheduled triggers or manual admin triggers without `student_ids`.
    // It iterates through all madrassahs with notification settings enabled.
    // =================================================================================

    // --- Fetch Madrassah Settings to Process ---
    let settingsToProcess: SettingRow[] = [];
    if (invokingMadrassahId) {
      // If triggered for a specific madrassah.
      const { data, error } = await supabaseService
        .from("attendance_settings")
        .select("madrassah_id, enabled, cutoff_time, timezone, last_sent_date")
        .eq("madrassah_id", invokingMadrassahId)
        .maybeSingle();
      if (error) throw error;
      if (data) settingsToProcess = [data as SettingRow];
    } else {
      // If a global scheduled run, fetch all enabled settings.
      const { data, error } = await supabaseService
        .from("attendance_settings")
        .select("madrassah_id, enabled, cutoff_time, timezone, last_sent_date")
        .eq("enabled", true);
      if (error) throw error;
      settingsToProcess = (data || []) as SettingRow[];
    }

    let totalEmailsSent = 0;
    let totalEmailsSkipped = 0;
    const results: any[] = [];

    // --- Process Each Madrassah ---
    for (const setting of settingsToProcess) {
      if (!setting.enabled) continue;

      // --- STEP 6a: CHECK TIMING & DE-DUPLICATION ---
      // Check if it's past the cutoff time in the madrassah's local timezone.
      // Also, ensure we haven't already sent for this madrassah today.
      const now = new Date();
      const localYmd = formatLocalYmd(now, setting.timezone);
      const localHm = formatLocalHm(now, setting.timezone);
      const cutoffMins = hmToMinutes(setting.cutoff_time);
      const nowMins = hmToMinutes(localHm);

      if (!force) { // `force` flag bypasses these checks.
        if (setting.last_sent_date === localYmd) {
          continue; // Already sent today.
        }
        if (nowMins < cutoffMins) {
          continue; // Not yet cutoff time.
        }
      }

      // --- STEP 6b: FETCH STUDENTS AND ATTENDANCE ---
      const { data: students, error: studentsErr } = await supabaseService
        .from("students")
        .select("id, name, guardian_email, guardian_name, status, madrassah_id")
        .eq("madrassah_id", setting.madrassah_id);
      if (studentsErr) throw studentsErr;

      const activeStudents = (students || []).filter((s: any) => (s.status || 'active') === 'active');
      if (activeStudents.length === 0) {
        // No students, update `last_sent_date` to prevent retries today and skip.
        await supabaseService
          .from("attendance_settings")
          .update({ last_sent_date: localYmd })
          .eq("madrassah_id", setting.madrassah_id);
        continue;
      }

      const studentIds = activeStudents.map((s: any) => s.id);

      const { data: attendanceRows, error: attendanceErr } = await supabaseService
        .from("attendance")
        .select("student_id, status")
        .eq("date", localYmd)
        .in("student_id", studentIds);
      if (attendanceErr) throw attendanceErr;

      const statusByStudent = new Map<string, string>();
      for (const row of (attendanceRows || [])) {
        const st = String((row as any)?.status || '').toLowerCase();
        if ((row as any)?.student_id) statusByStudent.set((row as any).student_id, st);
      }

      let emailsSent = 0;
      let emailsSkipped = 0;

      // --- STEP 6c: PROCESS EACH STUDENT ---
      for (const student of activeStudents) {
        const status = statusByStudent.get(student.id) || 'not marked';

        // --- Gather Recipients (same logic as teacher-scoped run) ---
        const recipientSet = new Set<string>();
        const addEmail = (email: string | null | undefined) => {
          if (!email) return;
          const trimmed = String(email).trim().toLowerCase();
          if (trimmed && /.+@.+\..+/.test(trimmed)) recipientSet.add(trimmed);
        };
        addEmail(student.guardian_email);
        try {
          const { data: parentRows } = await supabaseService.from("parents").select("email, student_ids").contains("student_ids", [student.id]);
          for (const p of (parentRows || [])) addEmail(p?.email);
        } catch (e) {}
        try {
          const { data: pcRows } = await supabaseService.from("parent_children").select("parent_id").eq("student_id", student.id);
          if (pcRows && pcRows.length > 0) {
            const parentIds = Array.from(new Set(pcRows.map((r: any) => r.parent_id)));
            if (parentIds.length > 0) {
              const { data: ptRows } = await supabaseService.from("parent_teachers").select("email").in("id", parentIds);
              for (const p of (ptRows || [])) addEmail(p?.email);
            }
          }
        } catch (e) {}
        try {
          const { data: pcRows2 } = await supabaseService.from("parent_children").select("parent_id").eq("student_id", student.id);
          if (pcRows2 && pcRows2.length > 0) {
            const parentIds2 = Array.from(new Set(pcRows2.map((r: any) => r.parent_id)));
            if (parentIds2.length > 0) {
              const { data: profRows } = await supabaseService.from("profiles").select("email, role").in("id", parentIds2);
              for (const p of (profRows || [])) {
                if ((p as any)?.role === 'parent') addEmail((p as any)?.email);
              }
            }
          }
        } catch (e) {}

        if (recipientSet.size === 0) {
          emailsSkipped++;
          continue;
        }

        // --- Check Notification Log to Prevent Duplicate Sends ---
        // This is a second layer of de-duplication at the student/date level.
        try {
          const { error: insertErr } = await supabaseService
            .from("attendance_absence_notifications")
            .insert({
              madrassah_id: setting.madrassah_id,
              student_id: student.id,
              date: localYmd,
            });
          if (insertErr) {
            // If it's a duplicate key error, we've already sent/logged this, so we skip.
            // Any other error means we should skip to be safe.
            emailsSkipped++;
            continue;
          }
        } catch (_) {
          emailsSkipped++;
          continue;
        }

        // --- STEP 6d: COMPOSE AND SEND EMAIL ---
        const subject = `Attendance Status: ${student.name} (${localYmd})`;
        const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
body{font-family:Arial,Helvetica,sans-serif;background:#f6f7f9;margin:0;padding:0}
.card{max-width:640px;margin:24px auto;background:#fff;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.05);overflow:hidden}
.header{background:#0f766e;color:#fff;padding:16px 20px}
.content{padding:20px;color:#111827}
.muted{color:#6b7280;font-size:12px;margin-top:16px}
</style></head>
<body>
  <div class="card">
    <div class="header"><h2>Attendance Status</h2></div>
    <div class="content">
      <p>Assalamu alaikum ${htmlEscape(student.guardian_name || '')},</p>
      <p>This is to inform you that <strong>${htmlEscape(student.name)}</strong> was marked <strong>${htmlEscape(status)}</strong> on ${localYmd}.</p>
      <p>If your child is late or excused, please coordinate with the office as needed.</p>
      <div style=\"text-align:center;margin-top:16px;\">
        <img src=\"${Deno.env.get('ORG_LOGO_URL') || DEFAULT_ORG_LOGO_URL}\" alt=\"Dār Al-Ulūm Montréal\" style=\"max-width:180px;height:auto;\"/>
      </div>
      <p class="muted">This email was generated automatically by the madrassah attendance system.</p>
    </div>
  </div>
</body></html>`;

        let successfulForStudent = 0;
        for (const toEmail of Array.from(recipientSet)) {
          try {
            await resend.emails.send({
              from: FROM_EMAIL!,
              to: toEmail,
              subject,
              html,
            });
            successfulForStudent++;
            emailsSent++;
          } catch (e: any) {
            // Basic rate-limiting retry for Resend.
            const msg = String(e?.message || "");
            const is429 = msg.includes("429") || (e?.statusCode === 429);
            if (is429) {
              await sleep(1500);
              try {
                await resend.emails.send({ from: FROM_EMAIL!, to: toEmail, subject, html });
                successfulForStudent++;
                emailsSent++;
                continue;
              } catch (_) {}
            }
            emailsSkipped++;
          }
        }

        // If all sends for this student failed, roll back the notification log entry
        // so a future run can retry.
        if (successfulForStudent === 0) {
          await supabaseService
            .from("attendance_absence_notifications")
            .delete()
            .eq("student_id", student.id)
            .eq("date", localYmd);
        }
      }

      // --- STEP 6e: FINALIZE MADRASSAH RUN ---
      // Update the `last_sent_date` to prevent re-running today.
      if (!force) {
        await supabaseService
          .from("attendance_settings")
          .update({ last_sent_date: localYmd })
          .eq("madrassah_id", setting.madrassah_id);
      }

      totalEmailsSent += emailsSent;
      totalEmailsSkipped += emailsSkipped;
      results.push({ madrassah_id: setting.madrassah_id, emailsSent, emailsSkipped, date: localYmd });
    }

    // =================================================================================
    // STEP 7: LOGGING & FINAL RESPONSE
    // =================================================================================
    try {
      await supabaseService
        .from("email_logs")
        .insert({
          trigger_source: triggerSource,
          triggered_at: timestamp,
          status: 'completed',
          emails_sent: totalEmailsSent,
          emails_skipped: totalEmailsSkipped,
          message: `Attendance emails: sent ${totalEmailsSent}, skipped ${totalEmailsSkipped}`,
        });
    } catch (_) {
      // Ignore logging errors.
    }

    return new Response(
      JSON.stringify({ message: "Attendance email run completed", triggerSource, timestamp, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );

  // =================================================================================
  // STEP 8: GLOBAL ERROR HANDLING
  // =================================================================================
  } catch (error: any) {
    // Attempt to log the error to the database.
    try {
      const supabaseService = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` } } },
      );
      await supabaseService.from("email_logs").insert({
        trigger_source: 'unknown',
        triggered_at: new Date().toISOString(),
        status: 'error',
        message: error?.message || 'unknown error in attendance-absence-email'
      });
    } catch (_) {}

    // Return a generic 500 error response.
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});


