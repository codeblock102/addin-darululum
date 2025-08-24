// Edge function: Send absence notifications to guardians after attendance cutoff
// Runs every 5 minutes via pg_cron; also invokable manually by admins

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

type SettingRow = {
  madrassah_id: string;
  enabled: boolean;
  cutoff_time: string; // HH:MM 24h
  timezone: string; // IANA
  last_sent_date: string | null; // YYYY-MM-DD
};

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

function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(":").map((n) => parseInt(n, 10));
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
}

function htmlEscape(str: string): string {
  return str.replace(/[&<>\"]/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  }[c] as string));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let triggerSource = "manual";
    let timestamp = new Date().toISOString();
    let explicitMadrassahId: string | null = null;
    let force: boolean = false;
    try {
      const bodyText = await req.text();
      if (bodyText) {
        const parsed = JSON.parse(bodyText);
        triggerSource = parsed.source || triggerSource;
        timestamp = parsed.timestamp || timestamp;
        explicitMadrassahId = parsed.madrassah_id || null;
        force = Boolean(parsed.force);
      }
    } catch (_) {
      // ignore
    }

    if (!RESEND_API_KEY || !RESEND_FROM_EMAIL || !resend) {
      return new Response(JSON.stringify({ error: "Email sender not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
        },
      },
    );

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    // Resolve madrassah scope for manual invocations
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

    // Determine which settings to process
    let settingsToProcess: SettingRow[] = [];
    if (invokingMadrassahId) {
      const { data, error } = await supabaseService
        .from("attendance_settings")
        .select("madrassah_id, enabled, cutoff_time, timezone, last_sent_date")
        .eq("madrassah_id", invokingMadrassahId)
        .maybeSingle();
      if (error) throw error;
      if (data) settingsToProcess = [data as SettingRow];
    } else {
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

    for (const setting of settingsToProcess) {
      if (!setting.enabled) continue;

      const now = new Date();
      const localYmd = formatLocalYmd(now, setting.timezone);
      const localHm = formatLocalHm(now, setting.timezone);
      const cutoffMins = hmToMinutes(setting.cutoff_time);
      const nowMins = hmToMinutes(localHm);

      // Only send once per local day per madrassah
      if (!force) {
        if (setting.last_sent_date === localYmd) {
          continue;
        }
        if (nowMins < cutoffMins) {
          continue;
        }
      }

      // Fetch students for this madrassah
      const { data: students, error: studentsErr } = await supabaseService
        .from("students")
        .select("id, name, guardian_email, guardian_name, status, madrassah_id")
        .eq("madrassah_id", setting.madrassah_id);
      if (studentsErr) throw studentsErr;

      const activeStudents = (students || []).filter((s: any) => (s.status || 'active') === 'active');
      if (activeStudents.length === 0) {
        // Update last_sent_date to avoid retrying needlessly
        await supabaseService
          .from("attendance_settings")
          .update({ last_sent_date: localYmd })
          .eq("madrassah_id", setting.madrassah_id);
        continue;
      }

      const studentIds = activeStudents.map((s: any) => s.id);

      // Fetch present attendance for local date
      const { data: attendanceRows, error: attendanceErr } = await supabaseService
        .from("attendance")
        .select("student_id, status")
        .eq("date", localYmd)
        .in("student_id", studentIds);
      if (attendanceErr) throw attendanceErr;

      const presentSet = new Set(
        (attendanceRows || [])
          .filter((r: any) => (r.status || '').toLowerCase() === 'present')
          .map((r: any) => r.student_id),
      );

      const absentees = activeStudents.filter((s: any) => !presentSet.has(s.id));

      let emailsSent = 0;
      let emailsSkipped = 0;

      for (const student of absentees) {
        // Build recipient emails from multiple sources and de-duplicate
        const recipientSet = new Set<string>();
        const addEmail = (email: string | null | undefined) => {
          if (!email) return;
          const trimmed = String(email).trim().toLowerCase();
          if (trimmed && /.+@.+\..+/.test(trimmed)) recipientSet.add(trimmed);
        };

        // 1) Student's guardian email
        addEmail(student.guardian_email);

        // 2) parents table (array mapping)
        try {
          const { data: parentRows, error: parentsErr } = await supabaseService
            .from("parents")
            .select("email, student_ids")
            .contains("student_ids", [student.id]);
          if (parentsErr) {
            console.log("parents query error for student", student.id, parentsErr);
          } else {
            for (const p of (parentRows || [])) addEmail(p?.email);
          }
        } catch (e) {
          console.log("parents query exception for student", student.id, e);
        }

        // 3) parent_children → parent_teachers (new link)
        try {
          const { data: pcRows, error: pcErr } = await supabaseService
            .from("parent_children")
            .select("parent_id")
            .eq("student_id", student.id);
          if (!pcErr && pcRows && pcRows.length > 0) {
            const parentIds = Array.from(new Set(pcRows.map((r: any) => r.parent_id))); 
            if (parentIds.length > 0) {
              const { data: ptRows, error: ptErr } = await supabaseService
                .from("parent_teachers")
                .select("email")
                .in("id", parentIds);
              if (!ptErr && ptRows) {
                for (const p of ptRows) addEmail(p?.email);
              }
            }
          }
        } catch (e) {
          console.log("parent_teachers join exception for student", student.id, e);
        }

        // 4) Legacy parent_children → profiles (older deployments)
        try {
          const { data: pcRows2, error: pcErr2 } = await supabaseService
            .from("parent_children")
            .select("parent_id")
            .eq("student_id", student.id);
          if (!pcErr2 && pcRows2 && pcRows2.length > 0) {
            const parentIds2 = Array.from(new Set(pcRows2.map((r: any) => r.parent_id)));
            if (parentIds2.length > 0) {
              const { data: profRows, error: profErr } = await supabaseService
                .from("profiles")
                .select("email, role")
                .in("id", parentIds2);
              if (!profErr && profRows) {
                for (const p of profRows) {
                  if ((p as any)?.role === 'parent') addEmail((p as any)?.email);
                }
              }
            }
          }
        } catch (e) {
          console.log("profiles join exception for student", student.id, e);
        }

        if (recipientSet.size === 0) {
          emailsSkipped++;
          continue;
        }

        // Deduplicate: ensure not already sent for this student/date
        try {
          const { error: insertErr } = await supabaseService
            .from("attendance_absence_notifications")
            .insert({
              madrassah_id: setting.madrassah_id,
              student_id: student.id,
              date: localYmd,
            });
          if (insertErr && !String(insertErr.message).includes("duplicate key")) {
            // Some other error; skip sending for this student
            emailsSkipped++;
            continue;
          }
        } catch (_) {
          emailsSkipped++;
          continue;
        }

        const subject = `Absence Notice: ${student.name} not marked present (${localYmd})`;
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
    <div class="header"><h2>Absence Notification</h2></div>
    <div class="content">
      <p>Assalamu alaikum ${htmlEscape(student.guardian_name || '')},</p>
      <p>This is to inform you that <strong>${htmlEscape(student.name)}</strong> has not been marked <strong>present</strong> for ${localYmd} by the attendance cutoff time (${setting.cutoff_time} ${htmlEscape(setting.timezone)}).</p>
      <p>If your child is attending late or there is an excused absence, please contact the office.</p>
      <p class="muted">This email was generated automatically by the madrassah attendance system.</p>
    </div>
  </div>
</body></html>`;

        let successfulForStudent = 0;
        for (const toEmail of Array.from(recipientSet)) {
          try {
            await resend.emails.send({
              from: RESEND_FROM_EMAIL!,
              to: toEmail,
              subject,
              html,
            });
            successfulForStudent++;
            emailsSent++;
          } catch (e: any) {
            const msg = String(e?.message || "");
            const is429 = msg.includes("429") || (e?.statusCode === 429);
            if (is429) {
              await sleep(1500);
              try {
                await resend.emails.send({ from: RESEND_FROM_EMAIL!, to: toEmail, subject, html });
                successfulForStudent++;
                emailsSent++;
                continue;
              } catch (_) {}
            }
            emailsSkipped++;
          }
        }

        // If none of the emails for this student succeeded, roll back dedupe row so we can retry later
        if (successfulForStudent === 0) {
          await supabaseService
            .from("attendance_absence_notifications")
            .delete()
            .eq("student_id", student.id)
            .eq("date", localYmd);
        }
      }

      // Update last_sent_date so we do not run again today for this madrassah
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

    // Log completion
    try {
      await supabaseService
        .from("email_logs")
        .insert({
          trigger_source: triggerSource,
          triggered_at: timestamp,
          status: 'completed',
          emails_sent: totalEmailsSent,
          emails_skipped: totalEmailsSkipped,
          message: `Absence emails: sent ${totalEmailsSent}, skipped ${totalEmailsSkipped}`,
        });
    } catch (_) {
      // ignore
    }

    return new Response(
      JSON.stringify({ message: "Absence check completed", triggerSource, timestamp, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error: any) {
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

    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});


