// @ts-nocheck
// =================================================================================
// Edge Function: send-enrollment-confirmation
// Fires when a new student is added. Notifies all admin emails.
//
// Request body:
//   { student_id: string }
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

    const body = await req.json();
    const { student_id } = body;

    if (!student_id) {
      return new Response(JSON.stringify({ error: "student_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch student details
    const { data: student, error: sErr } = await supabase
      .from("students")
      .select("id, name, section, enrollment_date, guardian_name, guardian_contact")
      .eq("id", student_id)
      .single();

    if (sErr || !student) {
      return new Response(JSON.stringify({ error: "Student not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all admin emails from profiles
    const { data: adminProfiles, error: pErr } = await supabase
      .from("profiles")
      .select("email, name")
      .eq("role", "admin");

    if (pErr) throw pErr;

    const admins = (adminProfiles ?? []).filter((p) => p.email);

    if (admins.length === 0) {
      return new Response(
        JSON.stringify({ message: "No admin emails found — skipped.", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const enrollmentDateStr = student.enrollment_date
      ? new Date(student.enrollment_date).toLocaleDateString("en-CA", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Not specified";

    const resend = new Resend(RESEND_API_KEY);
    let sent = 0;
    const errors: string[] = [];

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
            <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">New Student Enrolled</p>
            <p style="margin:4px 0 0;font-size:13px;color:#86efac;">Dār Al-Ulūm Montréal</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 16px;font-size:15px;color:#374151;">
              A new student has been enrolled. Here are the details:
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;overflow:hidden;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0 0 4px;font-size:13px;color:#166534;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Student Information</p>
                  <p style="margin:0;font-size:18px;font-weight:700;color:#1f2937;">${student.name}</p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
                    ${student.section ? `
                    <tr>
                      <td style="font-size:13px;color:#6b7280;padding:3px 0;width:140px;">Section</td>
                      <td style="font-size:13px;color:#1f2937;font-weight:500;">${student.section}</td>
                    </tr>` : ""}
                    <tr>
                      <td style="font-size:13px;color:#6b7280;padding:3px 0;width:140px;">Enrollment Date</td>
                      <td style="font-size:13px;color:#1f2937;font-weight:500;">${enrollmentDateStr}</td>
                    </tr>
                    ${student.guardian_name ? `
                    <tr>
                      <td style="font-size:13px;color:#6b7280;padding:3px 0;width:140px;">Guardian Name</td>
                      <td style="font-size:13px;color:#1f2937;font-weight:500;">${student.guardian_name}</td>
                    </tr>` : ""}
                    ${student.guardian_contact ? `
                    <tr>
                      <td style="font-size:13px;color:#6b7280;padding:3px 0;width:140px;">Guardian Contact</td>
                      <td style="font-size:13px;color:#1f2937;font-weight:500;">${student.guardian_contact}</td>
                    </tr>` : ""}
                  </table>
                </td>
              </tr>
            </table>
            <div style="margin-top:20px;">
              <a href="${APP_URL}/admin/students" style="display:inline-block;background:#15803d;color:#fff;font-weight:600;font-size:13px;padding:10px 22px;border-radius:8px;text-decoration:none;">
                View in Admin Portal
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

    for (const admin of admins) {
      const { error: emailErr } = await resend.emails.send({
        from: FROM_EMAIL,
        to: admin.email,
        subject: `New Student Enrolled: ${student.name}`,
        html,
      });

      if (emailErr) {
        errors.push(`${admin.email}: ${JSON.stringify(emailErr)}`);
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
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
