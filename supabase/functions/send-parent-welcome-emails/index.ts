import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { Resend } from "https://esm.sh/resend@3.2.0";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing env: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Enforce POST; return a clear error for other methods
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const admin = createClient(supabaseUrl!, serviceRoleKey!);

    // Read optional payload to target specific parents
    let targetParentIds: string[] = [];
    try {
      const body = await req.json();
      if (Array.isArray(body?.parentIds)) {
        targetParentIds = (body.parentIds as unknown[])
          .map((v) => (typeof v === "string" ? v : ""))
          .filter((v) => v.length > 0);
      }
    } catch (_) { /* ignore */ }

    // Get target parents (flat fields only)
    type ParentRow = { id: string; name: string; email: string; student_ids: string[] };
    let parents: ParentRow[] | null = null;
    let parentsError: unknown = null;
    if (targetParentIds.length > 0) {
      const { data, error } = await admin
        .from("parents")
        .select("id, name, email, student_ids")
        .in("id", targetParentIds)
        .not("email", "is", null);
      parents = (data || []) as ParentRow[];
      parentsError = error;
    } else {
      const { data, error } = await admin
        .from("parents")
        .select("id, name, email, student_ids")
        .not("email", "is", null);
      parents = (data || []) as ParentRow[];
      parentsError = error;
    }

    if (parentsError) {
      const msg = (parentsError as { message?: string } | null)?.message || "Unknown error";
      console.error("[send-parent-welcome-emails] failed to fetch parents:", msg);
      return new Response(JSON.stringify({ error: msg }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!parents || parents.length === 0) {
      return new Response(JSON.stringify({ 
        message: "No parents found to send emails to",
        emailsSent: 0,
        emailsSkipped: 0
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build student name map from all referenced student_ids
    const allStudentIds = new Set<string>();
    for (const p of (parents || [])) {
      const ids = Array.isArray(p?.student_ids) ? p.student_ids : [];
      for (const id of ids) {
        if (typeof id === "string" && id) allStudentIds.add(id);
      }
    }

    const studentIdToName = new Map<string, string>();
    if (allStudentIds.size > 0) {
      try {
        const { data: studs, error: studsError } = await admin
          .from("students")
          .select("id, name")
          .in("id", Array.from(allStudentIds));
        if (!studsError && Array.isArray(studs)) {
          for (const s of studs) {
            if (s?.id) studentIdToName.set(String(s.id), String(s.name || "student"));
          }
        } else if (studsError) {
          console.error("[send-parent-welcome-emails] failed to fetch students:", studsError.message);
        }
      } catch (e) {
        console.error("[send-parent-welcome-emails] unexpected error fetching students:", (e as Error)?.message || String(e));
      }
    }

    // Get email configuration
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");
    const APP_URL = Deno.env.get("APP_URL") || "https://app.daralulummontreal.com/";

    if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
      console.error("[send-parent-welcome-emails] missing email configuration");
      return new Response(JSON.stringify({ error: "Email configuration missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resend = new Resend(RESEND_API_KEY);
    const RATE_LIMIT_INTERVAL_MS = 500; // 2 requests/second
    const MAX_RATE_LIMIT_RETRIES = 5;

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const isRateLimitError = (err: unknown): boolean => {
      try {
        if (!err) return false;
        type RateErrorShape = { statusCode?: number; name?: unknown; message?: unknown };
        const e = err as RateErrorShape;
        if (typeof e.statusCode === "number" && e.statusCode === 429) return true;
        if (typeof e.name === "string" && /rate.?limit/i.test(e.name)) return true;
        if (typeof e.message === "string" && /(429|too many requests|rate.?limit)/i.test(e.message)) return true;
      } catch (_) { /* ignore */ }
      return false;
    };

    const getRetryAfterMs = (err: unknown, fallbackMs: number): number => {
      try {
        type HeadersLike = { get?: (name: string) => string | null } | Record<string, unknown>;
        type ResponseLike = { headers?: HeadersLike };
        type ErrorWithResponse = { response?: ResponseLike };
        const { response } = (err as ErrorWithResponse) || {};
        const headers = response?.headers;

        let headerValue: unknown = undefined;
        if (headers && typeof (headers as { get?: unknown }).get === "function") {
          const get = (headers as { get: (name: string) => string | null }).get;
          headerValue = get("retry-after");
        } else if (headers && typeof headers === "object" && "retry-after" in (headers as Record<string, unknown>)) {
          headerValue = (headers as Record<string, unknown>)["retry-after"]; 
        }

        const seconds = typeof headerValue === "string" ? Number(headerValue) : NaN;
        if (!Number.isNaN(seconds) && seconds > 0) return Math.min(seconds * 1000, 10_000);
      } catch (_) { /* ignore */ }
      return fallbackMs;
    };

    const sendEmailWithRetry = async (payload: { from: string; to: string; subject: string; html: string }) => {
      let attempt = 0;
      // base backoff ~750ms, exponential with cap and jitter
      const baseMs = 750;
      while (true) {
        try {
          return await resend.emails.send(payload);
        } catch (e) {
          attempt += 1;
          if (isRateLimitError(e) && attempt <= MAX_RATE_LIMIT_RETRIES) {
            const expBackoff = Math.min(baseMs * Math.pow(2, attempt - 1), 8000);
            const withRetryAfter = getRetryAfterMs(e, expBackoff);
            const jitter = Math.floor(Math.random() * 200);
            const waitMs = withRetryAfter + jitter;
            console.warn(`[send-parent-welcome-emails] 429 rate-limited, retrying in ${waitMs}ms (attempt ${attempt}/${MAX_RATE_LIMIT_RETRIES})`);
            await sleep(waitMs);
            continue;
          }
          throw e;
        }
      }
    };
    let emailsSent = 0;
    let emailsSkipped = 0;
    const errors: string[] = [];

    // Send emails to each parent
    for (const parent of parents) {
      try {
        // Skip if no email
        if (!parent.email || parent.email.trim() === "") {
          emailsSkipped++;
          continue;
        }

        // Get student names for this parent via pre-fetched map
        const studentNames = Array.isArray(parent.student_ids)
          ? parent.student_ids
              .map((id: string) => studentIdToName.get(id))
              .filter((n: string | undefined): n is string => Boolean(n))
          : [];
        
        const list = studentNames.length > 0 ? studentNames.join(", ") : "your student";

        // Create email HTML
        const html = `<!doctype html><html><body style="font-family:Arial,sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 10px;">
              Welcome to Dār Al-Ulūm Montréal Parent Portal
            </h2>
            <p>Assalamualaikum ${parent.name},</p>
            <p>An account has been created and linked to <strong>${list}</strong>.</p>
            <p><strong>Login with:</strong></p>
            <ul style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #0f766e;">
              <li>Username (email): <strong>${parent.email}</strong></li>
              <li>Temporary password: <strong>Parent123!</strong></li>
            </ul>
            <p><strong>Access your account:</strong> <a href="${APP_URL}" style="color: #0f766e; text-decoration: none; font-weight: bold;">${APP_URL}</a></p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">
              This is an automated message from Dār Al-Ulūm Montréal. Please do not reply to this email.
            </p>
          </div>
        </body></html>`;

        // Send the email with retry and rate-limit pacing
        await sendEmailWithRetry({
          from: RESEND_FROM_EMAIL,
          to: parent.email.trim(),
          subject: "Your Parent Portal Account - Dār Al-Ulūm Montréal",
          html
        });

        // Pace to 2 requests/second
        await sleep(RATE_LIMIT_INTERVAL_MS);

        emailsSent++;
        console.log(`[send-parent-welcome-emails] sent email to ${parent.email}`);

      } catch (emailError) {
        emailsSkipped++;
        const errorMsg = `Failed to send email to ${parent.email}: ${(emailError as Error).message}`;
        errors.push(errorMsg);
        console.error(`[send-parent-welcome-emails] ${errorMsg}`);
      }
    }

    // Log the activity
    try {
      await admin
        .from("email_activity_log")
        .insert({
          trigger_source: "admin_manual",
          triggered_at: new Date().toISOString(),
          status: emailsSent > 0 ? "completed" : "error",
          emails_sent: emailsSent,
          emails_skipped: emailsSkipped,
          message: `Admin manually sent welcome emails. Sent: ${emailsSent}, Skipped: ${emailsSkipped}${errors.length > 0 ? `. Errors: ${errors.slice(0, 3).join('; ')}` : ''}`,
          activity_status: emailsSent > 0 ? "success" : "error"
        });
    } catch (logError) {
      console.error("[send-parent-welcome-emails] failed to log activity:", (logError as Error).message);
    }

    return new Response(JSON.stringify({
      message: "Welcome emails sent successfully",
      emailsSent,
      emailsSkipped,
      totalParents: parents.length,
      errors: errors.slice(0, 5) // Return first 5 errors for debugging
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[send-parent-welcome-emails] unhandled error:", (error as Error)?.message || String(error));
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
