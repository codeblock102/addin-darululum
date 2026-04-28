// @ts-nocheck
// =================================================================================
// Edge Function: send-assignment-overdue
// Runs daily via pg_cron. Notifies parents of overdue assignments.
// Queries teacher_assignments where due_date < today and status is not graded/cancelled.
//
// Request body: {} (no body required — queries DB directly)
// =================================================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@daralulummontreal.com";
const APP_URL = Deno.env.get("APP_URL") || "https://app.daralulummontreal.com";
const LOGO_URL =
  Deno.env.get("LOGO_URL") ||
  "https://depsfpodwaprzxffdcks.supabase.co/storage/v1/object/public/dum-logo/dum-logo.png";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Fetch all overdue assignments (due_date < today, not graded or cancelled)
    const { data: overdueAssignments, error: aErr } = await supabase
      .from("teacher_assignments")
      .select("id, title, description, due_date, student_ids, class_ids")
      .lt("due_date", today)
      .neq("status", "graded")
      .neq("status", "cancelled");

    if (aErr) throw aErr;

    if (!overdueAssignments || overdueAssignments.length === 0) {
      return new Response(
        JSON.stringify({ message: "No overdue assignments found.", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const resend = new Resend(RESEND_API_KEY);
    let totalSent = 0;
    const errors: string[] = [];

    for (const assignment of overdueAssignments) {
      // Resolve student IDs (direct or via classes)
      let studentIds: string[] = assignment.student_ids ?? [];
      if (studentIds.length === 0 && assignment.class_ids?.length > 0) {
        const { data: classes } = await supabase
          .from("classes")
          .select("current_students")
          .in("id", assignment.class_ids);
        studentIds = (classes ?? [])
          .flatMap((c) => c.current_students ?? [])
          .filter((id, i, arr) => id && arr.indexOf(id) === i);
      }

      if (studentIds.length === 0) continue;

      // Fetch student names
      const { data: studentsData } = await supabase
        .from("students")
        .select("id, name")
        .in("id", studentIds);

      const studentNameMap = new Map<string, string>(
        (studentsData ?? []).map((s) => [s.id, s.name]),
      );

      const dueDateStr = assignment.due_date
        ? new Date(assignment.due_date).toLocaleDateString("en-CA", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "Unknown date";

      for (const studentId of studentIds) {
        const studentName = studentNameMap.get(studentId) || "Your child";

        // Find parents linked to this student via parents table
        const { data: parents } = await supabase
          .from("parents")
          .select("id")
          .contains("student_ids", [studentId]);

        const parentIds = (parents ?? []).map((p) => p.id);
        if (parentIds.length === 0) continue;

        const { data: parentProfiles } = await supabase
          .from("profiles")
          .select("id, email, name")
          .in("id", parentIds)
          .eq("role", "parent");

        const validParents = (parentProfiles ?? []).filter((p) => p.email);

        for (const parent of validParents) {
          // De-duplication: skip if already notified today for this assignment + parent combo
          try {
            const { data: existing } = await supabase
              .from("notifications")
              .select("id")
              .eq("assignment_id", assignment.id)
              .eq("recipient_id", parent.id)
              .eq("date", today)
              .maybeSingle();

            if (existing) continue; // Already notified today
          } catch (_) {
            // If notifications table doesn't exist or query fails, proceed anyway
          }

          const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f5f6fa;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6fa;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#7c2d12 0%,#9a3412 55%,#c2410c 100%);padding:28px 32px;">
            <img src="${LOGO_URL}" alt="DUM Logo" height="36" style="display:block;margin-bottom:14px;" />
            <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">Assignment Overdue</p>
            <p style="margin:4px 0 0;font-size:13px;color:#fed7aa;">Dār Al-Ulūm Montréal</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 16px;font-size:15px;color:#374151;">
              Dear ${parent.name || "Parent"},
            </p>
            <p style="margin:0 0 16px;font-size:15px;color:#374151;">
              This is a reminder that <strong>${studentName}</strong> has an overdue assignment.
              Please encourage your child to complete this assignment.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;overflow:hidden;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0 0 4px;font-size:13px;color:#c2410c;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Overdue Assignment</p>
                  <p style="margin:0;font-size:18px;font-weight:700;color:#1f2937;">${assignment.title}</p>
                  ${assignment.description ? `<p style="margin:8px 0 0;font-size:14px;color:#4b5563;">${assignment.description}</p>` : ""}
                  <p style="margin:10px 0 0;font-size:14px;color:#374151;">
                    <strong>Student:</strong> ${studentName}
                  </p>
                  <div style="margin-top:10px;display:flex;align-items:center;gap:8px;">
                    <span style="font-size:13px;color:#c2410c;font-weight:600;">Was due:</span>
                    <span style="font-size:13px;color:#1f2937;">${dueDateStr}</span>
                  </div>
                </td>
              </tr>
            </table>
            <div style="margin-top:20px;">
              <a href="${APP_URL}/parent/academics" style="display:inline-block;background:#ea580c;color:#fff;font-weight:600;font-size:13px;padding:10px 22px;border-radius:8px;text-decoration:none;">
                View in Parent Portal
              </a>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">Dār Al-Ulūm Montréal · Automated notification</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

          const { error: emailErr } = await resend.emails.send({
            from: FROM_EMAIL,
            to: parent.email,
            subject: `Assignment Overdue: ${assignment.title}`,
            html,
          });

          if (emailErr) {
            errors.push(`${parent.email} (assignment ${assignment.id}): ${JSON.stringify(emailErr)}`);
          } else {
            totalSent++;
            // Log notification to prevent duplicate sends today
            try {
              await supabase
                .from("notifications")
                .insert({
                  assignment_id: assignment.id,
                  recipient_id: parent.id,
                  date: today,
                  type: "overdue",
                });
            } catch (_) {
              // Non-fatal: ignore if notifications table doesn't exist
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        assignments_processed: overdueAssignments.length,
        sent: totalSent,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
