import { Resend } from "https://esm.sh/resend@3.2.0";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// POST body: { announcement_id: string }
async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { announcement_id } = (await req.json().catch(() => ({}))) as {
      announcement_id?: string;
    };

    if (!announcement_id) {
      return jsonResponse(400, {
        ok: false,
        error: "announcement_id is required",
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
    const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "";
    const APP_URL = Deno.env.get("APP_URL") ||
      "https://app.daralulummontreal.com/";
    const LOGO_URL = Deno.env.get("LOGO_URL") ||
      "https://depsfpodwaprzxffdcks.supabase.co/storage/v1/object/public/dum-logo/dum-logo.png";

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return jsonResponse(500, { ok: false, error: "Supabase not configured" });
    }
    if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
      return jsonResponse(500, {
        ok: false,
        error: "Email service not configured",
      });
    }

    const sClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 1. Fetch announcement
    const { data: announcement, error: annErr } = await sClient
      .from("announcements")
      .select("id, title, message, class_id, class_name, teacher_id")
      .eq("id", announcement_id)
      .maybeSingle();

    if (annErr || !announcement) {
      return jsonResponse(404, { ok: false, error: "Announcement not found" });
    }

    // Fetch teacher name
    const { data: teacherProfile } = await sClient
      .from("profiles")
      .select("name")
      .eq("id", announcement.teacher_id)
      .maybeSingle();
    const teacherName = (teacherProfile as { name?: string } | null)?.name ??
      "Teacher";

    // 2. Fetch class — get current_students array
    const { data: classRow, error: classErr } = await sClient
      .from("classes")
      .select("id, name, current_students")
      .eq("id", announcement.class_id)
      .maybeSingle();

    if (classErr || !classRow) {
      return jsonResponse(404, { ok: false, error: "Class not found" });
    }

    const className = announcement.class_name ||
      (classRow as { name?: string }).name || "Class";
    const currentStudents: string[] =
      (classRow as { current_students?: string[] }).current_students ?? [];

    if (currentStudents.length === 0) {
      // Update sent count to 0 and return
      await sClient
        .from("announcements")
        .update({ sent_to_count: 0 })
        .eq("id", announcement_id);
      return jsonResponse(200, {
        ok: true,
        sent: 0,
        message: "No students enrolled in this class",
      });
    }

    // 3. For each student, find parent via parents table where student_ids contains the student_id
    const parentEmails: string[] = [];
    const seenParentIds = new Set<string>();

    for (const studentId of currentStudents) {
      const { data: parentRows } = await sClient
        .from("parents")
        .select("id, student_ids")
        .contains("student_ids", [studentId]);

      const rows = (parentRows ?? []) as Array<
        { id: string; student_ids: string[] }
      >;

      for (const parent of rows) {
        if (seenParentIds.has(parent.id)) continue;
        seenParentIds.add(parent.id);

        // 4. Fetch parent email from profiles
        const { data: parentProfile } = await sClient
          .from("profiles")
          .select("email")
          .eq("id", parent.id)
          .eq("role", "parent")
          .maybeSingle();

        const email = (parentProfile as { email?: string } | null)?.email;
        if (email && email.includes("@")) {
          parentEmails.push(email);
        }
      }
    }

    if (parentEmails.length === 0) {
      await sClient
        .from("announcements")
        .update({ sent_to_count: 0 })
        .eq("id", announcement_id);
      return jsonResponse(200, {
        ok: true,
        sent: 0,
        message: "No parent emails found",
      });
    }

    // 5. Send emails via Resend
    const resend = new Resend(RESEND_API_KEY);
    let sent = 0;
    const errors: string[] = [];

    for (const to of parentEmails) {
      try {
        await resend.emails.send({
          from: `${teacherName} <${RESEND_FROM_EMAIL}>`,
          to,
          subject: `[Announcement] ${announcement.title}`,
          html: `
            <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#111827; background:#f9fafb; padding:16px;">
              <div style="max-width:640px; width:100%; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
                <div style="padding:16px; border-bottom:1px solid #f3f4f6; background:#ffffff; text-align:center;">
                  <img src="${LOGO_URL}" alt="Madrassah" width="160" style="display:inline-block; height:auto; max-width:70%; border:0; outline:none; text-decoration:none;" />
                  <div style="margin-top:8px; font-weight:600; font-size:15px; color:#111827;">Class Announcement</div>
                </div>
                <div style="padding:20px;">
                  <p style="font-size:14px; color:#6b7280; margin-bottom:4px;">From <strong style="color:#111827;">${teacherName}</strong> · <strong style="color:#111827;">${className}</strong></p>
                  <h2 style="font-size:18px; font-weight:700; color:#111827; margin:12px 0 8px;">${announcement.title}</h2>
                  <div style="border:1px solid #e5e7eb; border-radius:6px; padding:16px; background:#fafafa; white-space:pre-wrap; color:#374151; font-size:14px; line-height:1.6;">
                    ${(announcement.message as string).replace(/</g, "&lt;")}
                  </div>
                  <div style="margin:24px 0; text-align:center;">
                    <a
                      href="${APP_URL}parent"
                      style="display:inline-block; padding:12px 24px; background-color:#166534; color:#ffffff; text-decoration:none; font-weight:600; border-radius:6px;"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open Parent Portal
                    </a>
                    <p style="font-size:12px; color:#6b7280; margin-top:8px;">
                      Or copy this link: <a href="${APP_URL}parent" style="color:#166534; text-decoration:none;" target="_blank" rel="noopener noreferrer">${APP_URL}parent</a>
                    </p>
                  </div>
                </div>
                <div style="padding:12px 16px; border-top:1px solid #f3f4f6; background:#ffffff; text-align:center; font-size:12px; color:#9ca3af;">
                  This is an automated announcement from your child's madrassah.
                </div>
              </div>
            </div>
          `,
        });
        sent++;
      } catch (e) {
        const msg = (e as Error)?.message || String(e);
        errors.push(`Failed to ${to}: ${msg}`);
      }
    }

    // 6. Update sent_to_count
    await sClient
      .from("announcements")
      .update({ sent_to_count: sent })
      .eq("id", announcement_id);

    return jsonResponse(200, {
      ok: true,
      sent,
      attempted: parentEmails.length,
      errors,
    });
  } catch (e) {
    return jsonResponse(500, {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

serve(handler);
