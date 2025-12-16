import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@3.2.0";
import { corsHeaders } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");
const APP_URL = Deno.env.get("APP_URL") || "https://app.daralulummontreal.com/";

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

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
      return new Response(JSON.stringify({ error: "Email sender not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
    );

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin via profiles.role to avoid recursion
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (!profile || profile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse body: to can be a string or array; subject/body required
    let payload: any = {};
    try {
      payload = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const toList = Array.isArray(payload.to)
      ? payload.to
      : typeof payload.to === "string"
      ? [payload.to]
      : [];
    const subject: string = String(payload.subject || "").trim();
    let html: string = String(payload.html || "").trim();

    if (toList.length === 0 || !subject || !html) {
      return new Response(JSON.stringify({ error: "Missing to/subject/html" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Append portal CTA button to HTML (before closing body/html tags if present, or at the end)
    const portalCta = buildPortalCtaHtml();
    if (html.includes("</body>")) {
      html = html.replace("</body>", `${portalCta}</body>`);
    } else if (html.includes("</html>")) {
      html = html.replace("</html>", `${portalCta}</html>`);
    } else {
      html = `${html}${portalCta}`;
    }

    const resend = new Resend(RESEND_API_KEY);
    const results: Array<{ to: string; status: string; error?: string }> = [];

    for (const to of toList) {
      try {
        await resend.emails.send({ from: RESEND_FROM_EMAIL, to, subject, html });
        results.push({ to, status: "sent" });
      } catch (e) {
        results.push({ to, status: "failed", error: e instanceof Error ? e.message : String(e) });
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});


