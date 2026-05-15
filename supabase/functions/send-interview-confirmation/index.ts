// @ts-nocheck
// =================================================================================
// Edge Function: send-interview-confirmation
// Called after a parent books an interview slot.
// Sends a confirmation email to the parent with date/time/teacher details.
//
// Request body:
//   { slot_id: string, student_id: string, parent_id: string }
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

    const { slot_id, student_id, parent_id } = await req.json();

    if (!slot_id || !student_id || !parent_id) {
      return new Response(
        JSON.stringify({ error: "slot_id, student_id, parent_id required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Fetch slot with teacher + window
    const { data: slot, error: slotErr } = await supabase
      .from("interview_slots")
      .select(
        "slot_date, slot_time, duration_minutes, teacher:profiles!interview_slots_teacher_id_fkey(name), window:interview_windows!interview_slots_window_id_fkey(title)",
      )
      .eq("id", slot_id)
      .single();

    if (slotErr || !slot) {
      return new Response(
        JSON.stringify({ error: "Slot not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Fetch student name
    const { data: student } = await supabase
      .from("students")
      .select("name")
      .eq("id", student_id)
      .maybeSingle();

    // Fetch parent profile
    const { data: parent } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("id", parent_id)
      .maybeSingle();

    if (!parent?.email) {
      return new Response(
        JSON.stringify({ message: "Parent has no email — skipped", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Format date/time
    const slotDate = new Date(slot.slot_date + "T" + slot.slot_time);
    const dateStr = slotDate.toLocaleDateString("en-CA", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeStr = slotDate.toLocaleTimeString("en-CA", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const teacherName = (slot.teacher as any)?.name ?? "your child's teacher";
    const windowTitle = (slot.window as any)?.title ??
      "Parent-Teacher Interview";
    const studentName = student?.name ?? "Your child";
    const parentName = parent.name ?? "Parent";

    const html = `<!DOCTYPE html>
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
            <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">Interview Confirmed</p>
            <p style="margin:4px 0 0;font-size:13px;color:#86efac;">Dār Al-Ulūm Montréal</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 16px;font-size:15px;color:#374151;">Dear ${parentName},</p>
            <p style="margin:0 0 20px;font-size:15px;color:#374151;">
              Your parent-teacher interview for <strong>${studentName}</strong> has been confirmed.
            </p>
            <!-- Details card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;overflow:hidden;margin-bottom:20px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 4px;font-size:12px;color:#166534;font-weight:600;text-transform:uppercase;letter-spacing:.06em;">${windowTitle}</p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
                    <tr>
                      <td style="padding:4px 0;font-size:13px;color:#6b7280;width:100px;">Date</td>
                      <td style="padding:4px 0;font-size:14px;font-weight:600;color:#1f2937;">${dateStr}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:13px;color:#6b7280;">Time</td>
                      <td style="padding:4px 0;font-size:14px;font-weight:600;color:#1f2937;">${timeStr} (${slot.duration_minutes} min)</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:13px;color:#6b7280;">Teacher</td>
                      <td style="padding:4px 0;font-size:14px;font-weight:600;color:#1f2937;">${teacherName}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:13px;color:#6b7280;">Student</td>
                      <td style="padding:4px 0;font-size:14px;font-weight:600;color:#1f2937;">${studentName}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 20px;font-size:13px;color:#6b7280;">
              If you need to reschedule or cancel, please log in to the parent portal.
            </p>
            <a href="${APP_URL}/parent/interviews"
               style="display:inline-block;background:#15803d;color:#fff;font-weight:600;font-size:13px;padding:10px 22px;border-radius:8px;text-decoration:none;">
              View in Parent Portal
            </a>
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

    const resend = new Resend(RESEND_API_KEY);
    const { error: emailErr } = await resend.emails.send({
      from: FROM_EMAIL,
      to: parent.email,
      subject:
        `Interview Confirmed: ${dateStr} at ${timeStr} with ${teacherName}`,
      html,
    });

    if (emailErr) {
      console.error("Resend error:", emailErr);
      return new Response(
        JSON.stringify({ success: false, error: emailErr }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ success: true, sent: 1 }),
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
