import { Resend } from "https://esm.sh/resend@3.2.0";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

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

// POST body: { recipients: string[], subject?: string, body: string, fromName?: string }
async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { recipients, subject, body, fromName } = (await req.json().catch(() => ({}))) as {
      recipients?: string[];
      subject?: string;
      body?: string;
      fromName?: string;
    };

    const list = Array.isArray(recipients) ? recipients.filter((e) => typeof e === "string" && e.includes("@")) : [];
    if (list.length === 0) {
      return jsonResponse(400, { ok: false, error: "No valid recipient emails provided" });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
    const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "";
    if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
      return jsonResponse(500, { ok: false, error: "Email service not configured" });
    }

    const resend = new Resend(RESEND_API_KEY);
    const safeSubject = subject && subject.trim().length > 0
      ? subject.trim()
      : "Message from your child's teacher";
    const senderName = fromName && fromName.trim().length > 0 ? fromName.trim() : "Teacher";
    const safeBody = (body || "").toString();

    let sent = 0;
    const errors: string[] = [];

    for (const to of list) {
      try {
        await resend.emails.send({
          from: `${senderName} <${RESEND_FROM_EMAIL}>`,
          to,
          subject: safeSubject,
          html: `<div style="font-family: sans-serif; line-height: 1.5; white-space: pre-wrap;">${safeBody.replace(/</g, "&lt;")}</div>` ,
        });
        sent++;
      } catch (e) {
        errors.push(`Failed to ${to}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return jsonResponse(200, { ok: true, sent, attempted: list.length, errors });
  } catch (e) {
    return jsonResponse(500, { ok: false, error: e instanceof Error ? e.message : String(e) });
  }
}

serve(handler);


