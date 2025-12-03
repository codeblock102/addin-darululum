import { Resend } from "https://esm.sh/resend@3.2.0";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// POST body: { recipients: string[], subject?: string, body: string, fromName?: string, senderId?: string }
async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { recipients, subject, body, fromName, senderId } = (await req.json().catch(() => ({}))) as {
      recipients?: string[];
      subject?: string;
      body?: string;
      fromName?: string;
      senderId?: string;
    };

    const list = Array.isArray(recipients) ? recipients.filter((e) => typeof e === "string" && e.includes("@")) : [];
    if (list.length === 0) {
      return jsonResponse(400, { ok: false, error: "No valid recipient emails provided" });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
    const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "";
    const LOGO_URL = Deno.env.get("LOGO_URL") || "https://depsfpodwaprzxffdcks.supabase.co/storage/v1/object/public/dum-logo/dum-logo.png";
    const APP_URL = Deno.env.get("APP_URL") || "https://app.daralulummontreal.com/";
    if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
      return jsonResponse(500, { ok: false, error: "Email service not configured" });
    }

    // Build portal CTA button HTML
    function buildPortalCtaHtml(): string {
      return `
        <div style="margin:24px 0;text-align:center;">
          <a
            href="${APP_URL}"
            style="display:inline-block;padding:12px 24px;background-color:#0f766e;color:#ffffff;text-decoration:none;font-weight:600;border-radius:6px;"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Parent Portal
          </a>
          <p style="font-size:12px;color:#6b7280;margin-top:8px;">
            Or copy this link: <a href="${APP_URL}" style="color:#0f766e;text-decoration:none;" target="_blank" rel="noopener noreferrer">${APP_URL}</a>
          </p>
        </div>
      `;
    }

    const resend = new Resend(RESEND_API_KEY);
    const safeBody = (body || "").toString();

    // Build standardized subject/body using sender details when possible
    let displayName = fromName && fromName.trim().length > 0 ? fromName.trim() : "Sender";
    let senderLine = displayName;

    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
      if (supabaseUrl && serviceRoleKey && senderId) {
        const sClient = createClient(supabaseUrl, serviceRoleKey);
        const { data: prof } = await sClient.from("profiles").select("id, name, role, subject").eq("id", senderId).maybeSingle();
        if (prof?.name) displayName = prof.name;
        if (prof?.role === "teacher") {
          const subjTaught = (prof as any).subject as string | null;
          senderLine = subjTaught && subjTaught.length > 0 ? `${displayName}, ${subjTaught} teacher` : `${displayName} (teacher)`;
        } else {
          // Try to resolve child's name for parent
          const { data: parentRow } = await sClient.from("parents").select("student_ids").eq("id", senderId).maybeSingle();
          const childIds = (parentRow?.student_ids as string[] | undefined) || [];
          if (childIds.length > 0) {
            const firstId = childIds[0];
            const { data: child } = await sClient.from("students").select("name").eq("id", firstId).maybeSingle();
            if (child?.name) senderLine = `${child.name}'s parent`;
          } else {
            senderLine = `${displayName} (parent)`;
          }
        }
      }
    } catch (_e) {
      // Fallbacks already set
    }

    const safeSubject = subject && subject.trim().length > 0
      ? subject.trim()
      : `You have received a message from ${displayName}`;

    let sent = 0;
    const errors: string[] = [];

    for (const to of list) {
      try {
        await resend.emails.send({
          from: `${displayName} <${RESEND_FROM_EMAIL}>`,
          to,
          subject: safeSubject,
          html: `
            <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#111827; background:#f9fafb; padding:16px;">
              <div style="max-width:640px; width:100%; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
                <div style="padding:16px; border-bottom:1px solid #f3f4f6; background:#ffffff; text-align:center;">
                  <img src="${LOGO_URL}" alt="Madrassah" width="160" style="display:inline-block; height:auto; max-width:70%; border:0; outline:none; text-decoration:none;" />
                  <div style="margin-top:8px; font-weight:600; font-size:15px; color:#111827;">New message notification</div>
                </div>
                <div style="padding:16px;">
                  <div style="font-size:14px; color:#374151; margin-bottom:8px;">You have received a new message from:</div>
                  <div style="font-size:16px; font-weight:600; color:#111827; margin-bottom:16px;">${senderLine}</div>
                  <div style="border:1px solid #e5e7eb; border-radius:6px; padding:14px; background:#fafafa; white-space:pre-wrap; color:#111827;">
                    ${safeBody.replace(/</g, "&lt;")}
                  </div>
                  ${buildPortalCtaHtml()}
                </div>
                <div style="padding:12px 16px; border-top:1px solid #f3f4f6; background:#ffffff; text-align:center; font-size:12px; color:#9ca3af;">
                  This is an automated notification.
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

    return jsonResponse(200, { ok: true, sent, attempted: list.length, errors });
  } catch (e) {
    return jsonResponse(500, { ok: false, error: e instanceof Error ? e.message : String(e) });
  }
}

serve(handler);


