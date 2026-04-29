// @ts-nocheck
// =================================================================================
// Edge Function: send-assignment-notification
// Called by the teacher portal when an assignment is created or has an upcoming deadline.
// Sends a notification email to parents of the assigned students.
//
// Request body:
//   { assignment_id: string, type: "new" | "reminder" }
// =================================================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") ||
  "noreply@daralulummontreal.com";
const APP_URL = Deno.env.get("APP_URL") || "https://app.daralulummontreal.com";
const LOGO_URL = Deno.env.get("LOGO_URL") ||
  "https://depsfpodwaprzxffdcks.supabase.co/storage/v1/object/public/dum-logo/dum-logo.png";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

    const body = await req.json();
    const { assignment_id, type = "new" } = body;

    if (!assignment_id) {
      return new Response(JSON.stringify({ error: "assignment_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the assignment
    const { data: assignment, error: aErr } = await supabase
      .from("teacher_assignments")
      .select(
        "id, title, description, due_date, teacher_id, student_ids, class_ids",
      )
      .eq("id", assignment_id)
      .single();

    if (aErr || !assignment) {
      return new Response(JSON.stringify({ error: "Assignment not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch teacher name
    const { data: teacher } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", assignment.teacher_id)
      .single();

    const teacherName = teacher?.name ?? "Your teacher";

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

    if (studentIds.length === 0) {
      return new Response(
        JSON.stringify({ message: "No students assigned — skipped." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Find parent emails for these students (via parent_children or parents table)
    const { data: parentLinks } = await supabase
      .from("parent_children")
      .select("parent_id, student_id")
      .in("student_id", studentIds);

    if (!parentLinks || parentLinks.length === 0) {
      return new Response(
        JSON.stringify({ message: "No parents linked — skipped." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const parentIds = [...new Set(parentLinks.map((l) => l.parent_id))];
    const { data: parentProfiles } = await supabase
      .from("profiles")
      .select("id, email, name")
      .in("id", parentIds);

    const parents = (parentProfiles ?? []).filter((p) => p.email);
    if (parents.length === 0) {
      return new Response(
        JSON.stringify({ message: "No parent emails found — skipped." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const resend = new Resend(RESEND_API_KEY);
    const isNew = type === "new";
    const dueDateStr = assignment.due_date
      ? new Date(assignment.due_date).toLocaleDateString("en-CA", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      : null;

    const subjectLine = isNew
      ? `📚 New assignment: ${assignment.title}`
      : `⏰ Assignment due soon: ${assignment.title}`;

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
          <td style="background:linear-gradient(135deg,#052e16 0%,#14532d 55%,#166534 100%);padding:28px 32px;">
            <img src="${LOGO_URL}" alt="DUM Logo" height="36" style="display:block;margin-bottom:14px;" />
            <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">
              ${isNew ? "New Assignment" : "Assignment Due Soon"}
            </p>
            <p style="margin:4px 0 0;font-size:13px;color:#86efac;">Dār Al-Ulūm Montréal</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 16px;font-size:15px;color:#374151;">
              ${
      isNew
        ? `Your child has been given a new assignment by <strong>${teacherName}</strong>.`
        : `A reminder that your child has an assignment due soon from <strong>${teacherName}</strong>.`
    }
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;overflow:hidden;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0 0 4px;font-size:13px;color:#166534;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Assignment</p>
                  <p style="margin:0;font-size:18px;font-weight:700;color:#1f2937;">${assignment.title}</p>
                  ${
      assignment.description
        ? `<p style="margin:8px 0 0;font-size:14px;color:#4b5563;">${assignment.description}</p>`
        : ""
    }
                  ${
      dueDateStr
        ? `
                  <div style="margin-top:12px;display:flex;align-items:center;gap:8px;">
                    <span style="font-size:13px;color:#92400e;font-weight:600;">Due:</span>
                    <span style="font-size:13px;color:#1f2937;">${dueDateStr}</span>
                  </div>`
        : ""
    }
                </td>
              </tr>
            </table>
            <p style="margin:20px 0 0;font-size:13px;color:#6b7280;">
              You can view the full assignment details and track your child's progress in the parent portal.
            </p>
            <div style="margin-top:20px;">
              <a href="${APP_URL}/parent/academics" style="display:inline-block;background:#15803d;color:#fff;font-weight:600;font-size:13px;padding:10px 22px;border-radius:8px;text-decoration:none;">
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

    let sent = 0;
    const errors: string[] = [];

    for (const parent of parents) {
      const { error: emailErr } = await resend.emails.send({
        from: FROM_EMAIL,
        to: parent.email,
        subject: subjectLine,
        html,
      });
      if (emailErr) {
        errors.push(`${parent.email}: ${JSON.stringify(emailErr)}`);
      } else {
        sent++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
