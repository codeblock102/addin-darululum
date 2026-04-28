// @ts-nocheck
// =================================================================================
// Edge Function: send-late-arrival-alert
// Invoked by the frontend when a student is marked late.
// Sends a brief email to the teacher and/or admin notifying of the late arrival.
// =================================================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@daralulummontreal.com";
const APP_URL = Deno.env.get("APP_URL") || "https://app.daralulummontreal.com";
const LOGO_URL = Deno.env.get("LOGO_URL") ||
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

    const body = await req.json();
    const { student_id, attendance_id, date, time } = body;

    if (!student_id) {
      return new Response(JSON.stringify({ error: "student_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch student details
    const { data: student } = await supabase
      .from("students")
      .select("name, class_ids, guardian_name, guardian_email")
      .eq("id", student_id)
      .single();

    if (!student) {
      return new Response(JSON.stringify({ error: "Student not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find admin emails to notify
    const { data: admins } = await supabase
      .from("profiles")
      .select("email, name")
      .eq("role", "admin");

    const adminEmails = (admins ?? [])
      .map((a) => a.email)
      .filter(Boolean) as string[];

    if (adminEmails.length === 0) {
      return new Response(
        JSON.stringify({ message: "No admin emails found — alert skipped." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const resend = new Resend(RESEND_API_KEY);
    const formattedDate = date
      ? new Date(date).toLocaleDateString("en-CA", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "today";
    const formattedTime = time
      ? time.substring(0, 5) // HH:mm
      : "—";

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
            <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">Late Arrival Alert</p>
            <p style="margin:4px 0 0;font-size:13px;color:#86efac;">${formattedDate}</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 16px;font-size:15px;color:#374151;">
              A student has been marked <strong style="color:#d97706;">late</strong> for today's session.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;overflow:hidden;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0 0 6px;font-size:13px;color:#92400e;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Student</p>
                  <p style="margin:0;font-size:16px;font-weight:700;color:#1f2937;">${student.name}</p>
                  ${time ? `<p style="margin:6px 0 0;font-size:13px;color:#6b7280;">Arrived at <strong>${formattedTime}</strong></p>` : ""}
                </td>
              </tr>
            </table>
            <p style="margin:20px 0 0;font-size:13px;color:#6b7280;">
              Please review the attendance record in the app for any follow-up action.
            </p>
            <div style="margin-top:20px;">
              <a href="${APP_URL}/attendance" style="display:inline-block;background:#15803d;color:#fff;font-weight:600;font-size:13px;padding:10px 22px;border-radius:8px;text-decoration:none;">
                View Attendance
              </a>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">Dār Al-Ulūm Montréal · Automated alert</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const { error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmails,
      subject: `⏰ Late arrival: ${student.name} — ${formattedDate}`,
      html,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: emailError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, notified: adminEmails.length }),
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
