// @ts-nocheck
/* eslint-disable */
// Edge Function: send-digest
//
// Triggered by a cron job (configured separately). Accepts POST with optional body:
//   { batch?: 'morning' | 'evening', dryRun?: boolean }
//
// For each user in `notification_preferences` where standard_digest = true:
//   - Determine the user's "due" digest time (digest_morning_at / digest_evening_at).
//   - If the current time (in the user's timezone, when available) is within a 5-minute
//     window of the due time, gather undelivered `notifications_outbox` rows for that user
//     where tier = 'standard' and delivered_at IS NULL since their last_delivered_at.
//   - Respect quiet hours: standard digests skip when the user is within their
//     quiet_hours_start..quiet_hours_end window (urgent tier is unaffected; not handled here).
//   - If a Resend API key is configured, send an email; otherwise just log.
//   - Mark all included outbox rows delivered_at = now() and digest_batch_id = <uuid>.
//
// Style mirrors `daily-progress-email/index.ts`.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@3.2.0";
import { corsHeaders } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");
const DEFAULT_TIMEZONE = Deno.env.get("REPORT_TIMEZONE") ?? "America/Toronto";
const APP_URL = Deno.env.get("APP_URL") || "https://app.daralulummontreal.com/";

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DigestBatch = "morning" | "evening";

interface NotificationPreference {
  user_id: string;
  standard_digest: boolean;
  digest_morning_at: string | null; // "HH:MM" or "HH:MM:SS"
  digest_evening_at: string | null;
  quiet_hours_start: string | null; // "HH:MM"
  quiet_hours_end: string | null;
  last_delivered_at: string | null; // ISO timestamp
  timezone: string | null;
  email: string | null;
}

interface OutboxRow {
  id: string;
  user_id: string;
  tier: string;
  title: string | null;
  body: string | null;
  payload: unknown;
  created_at: string;
  delivered_at: string | null;
}

interface UserResult {
  user_id: string;
  email: string | null;
  status:
    | "sent"
    | "logged"
    | "skipped_quiet_hours"
    | "skipped_no_notifications"
    | "skipped_window"
    | "failed";
  digest_batch_id?: string;
  notifications: number;
  reason?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Time helpers
// ---------------------------------------------------------------------------

/** Returns the user's local time (HH:MM) given an IANA timezone. Falls back to default. */
function nowInZone(tz: string | null): {
  hours: number;
  minutes: number;
  totalMinutes: number;
} {
  const zone = tz || DEFAULT_TIMEZONE;
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const hours = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minutes = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return { hours, minutes, totalMinutes: hours * 60 + minutes };
}

/** Parses "HH:MM" or "HH:MM:SS" to total minutes since midnight. Returns null on bad input. */
function parseClock(value: string | null): number | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

/**
 * True if `nowMinutes` falls within the inclusive quiet window [start, end].
 * Supports overnight ranges (e.g. 22:00..07:00).
 */
function isInQuietHours(
  nowMinutes: number,
  startMinutes: number | null,
  endMinutes: number | null,
): boolean {
  if (startMinutes == null || endMinutes == null) return false;
  if (startMinutes === endMinutes) return false; // empty window
  if (startMinutes < endMinutes) {
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }
  // Overnight window
  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
}

/** True if the user's current local time is within +/-WINDOW_MIN of the target. */
function withinWindow(
  nowMinutes: number,
  targetMinutes: number | null,
  windowMin: number,
): boolean {
  if (targetMinutes == null) return false;
  const diff = Math.abs(nowMinutes - targetMinutes);
  // Handle wrap-around (e.g. now=00:02, target=23:58)
  const wrapDiff = Math.min(diff, 24 * 60 - diff);
  return wrapDiff <= windowMin;
}

// ---------------------------------------------------------------------------
// Email rendering
// ---------------------------------------------------------------------------

function renderDigestHtml(
  batch: DigestBatch | null,
  notifications: OutboxRow[],
): string {
  const heading = batch === "evening"
    ? "Evening Digest"
    : batch === "morning"
    ? "Morning Digest"
    : "Notification Digest";

  const rows = notifications
    .map(
      (n, idx) => `
        <tr style="background:${idx % 2 === 0 ? "#ffffff" : "#f9fafb"};">
          <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827;font-weight:600;">
            ${escapeHtml(n.title || "Notification")}
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#4b5563;">
            ${escapeHtml(n.body || "")}
          </td>
        </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;padding:32px 16px;">
  <tr><td align="center">
    <table cellpadding="0" cellspacing="0" border="0" style="max-width:620px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <tr>
        <td style="background:linear-gradient(135deg,#052e16 0%,#14532d 55%,#166534 100%);padding:28px 36px;color:#ffffff;">
          <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:1.6px;text-transform:uppercase;color:#86efac;">Dār Al-Ulūm Montréal</p>
          <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;">${heading}</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 36px;">
          <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.5;">
            You have <strong>${notifications.length}</strong> update${
    notifications.length === 1 ? "" : "s"
  } waiting for you.
          </p>
          <table border="0" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#f0fdf4;">
                <th style="text-align:left;padding:10px 14px;font-size:12px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #d1fae5;">What</th>
                <th style="text-align:left;padding:10px 14px;font-size:12px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #d1fae5;">Details</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px;">
            <tr><td align="center">
              <a href="${APP_URL}" target="_blank" rel="noopener noreferrer"
                 style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;">
                Open Portal
              </a>
            </td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 36px;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:11px;">Automated digest · You can change delivery times in your notification preferences.</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------------------------------------------------------------------------
// UUID (Deno standard crypto)
// ---------------------------------------------------------------------------

function newUuid(): string {
  // crypto.randomUUID is available in Deno Deploy / Edge Functions
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // ---- Authentication ----------------------------------------------------
  // This function sends real emails and mutates outbox state. It must only
  // be invoked by the scheduled cron job. Require either:
  //   * x-cron-secret header matching CRON_SECRET env, OR
  //   * Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
  // Anonymous callers — including anyone who learns the function URL — get 401.
  const cronSecret = Deno.env.get("CRON_SECRET") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const headerSecret = req.headers.get("x-cron-secret") ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";
  const bearer = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  const secretOk = cronSecret !== "" && headerSecret === cronSecret;
  const bearerOk = serviceRoleKey !== "" && bearer === serviceRoleKey;
  if (!secretOk && !bearerOk) {
    return new Response(
      JSON.stringify({ error: "unauthorized" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    let batch: DigestBatch | null = null;
    let dryRun = false;
    try {
      const text = await req.text();
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed.batch === "morning" || parsed.batch === "evening") {
          batch = parsed.batch;
        }
        if (typeof parsed.dryRun === "boolean") {
          dryRun = parsed.dryRun;
        }
      }
    } catch (_e) {
      console.log("send-digest: no body or invalid JSON, defaulting to {}");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) {
      return new Response(
        JSON.stringify({ error: "Supabase env missing" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    const supabase = createClient(supabaseUrl, serviceKey);

    // 1) Load preferences for users with standard_digest enabled.
    //    Email lives on auth.users, NOT on notification_preferences, so we
    //    look it up per-user below via supabase.auth.admin.getUserById.
    const { data: prefsRaw, error: prefsErr } = await supabase
      .from("notification_preferences")
      .select(
        "user_id, standard_digest, digest_morning_at, digest_evening_at, quiet_hours_start, quiet_hours_end, last_delivered_at, timezone",
      )
      .eq("standard_digest", true);

    if (prefsErr) {
      console.error("send-digest: failed to load preferences", prefsErr);
      throw prefsErr;
    }

    const prefsBase = (prefsRaw || []) as Omit<
      NotificationPreference,
      "email"
    >[];

    // Resolve email per user from auth.users (service-role required).
    const prefs: NotificationPreference[] = [];
    for (const p of prefsBase) {
      let email: string | null = null;
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(
          p.user_id,
        );
        email = userData?.user?.email ?? null;
      } catch (e) {
        console.warn(
          `send-digest: could not resolve email for ${p.user_id}`,
          e instanceof Error ? e.message : String(e),
        );
      }
      prefs.push({ ...p, email });
    }
    console.log(
      `send-digest: loaded ${prefs.length} preference rows (batch=${
        batch ?? "auto"
      }, dryRun=${dryRun})`,
    );

    const WINDOW_MIN = 5; // +/- 5 minutes
    const results: UserResult[] = [];

    for (const pref of prefs) {
      const localNow = nowInZone(pref.timezone);
      const morningMin = parseClock(pref.digest_morning_at);
      const eveningMin = parseClock(pref.digest_evening_at);

      // Determine which batch this user is in window for.
      let matchedBatch: DigestBatch | null = null;
      if (batch === "morning") {
        if (withinWindow(localNow.totalMinutes, morningMin, WINDOW_MIN)) {
          matchedBatch = "morning";
        }
      } else if (batch === "evening") {
        if (withinWindow(localNow.totalMinutes, eveningMin, WINDOW_MIN)) {
          matchedBatch = "evening";
        }
      } else {
        // No batch hint — accept whichever window the user is in.
        if (withinWindow(localNow.totalMinutes, morningMin, WINDOW_MIN)) {
          matchedBatch = "morning";
        } else if (
          withinWindow(localNow.totalMinutes, eveningMin, WINDOW_MIN)
        ) {
          matchedBatch = "evening";
        }
      }

      if (!matchedBatch) {
        results.push({
          user_id: pref.user_id,
          email: pref.email,
          status: "skipped_window",
          notifications: 0,
          reason: `local time ${pad(localNow.hours)}:${
            pad(localNow.minutes)
          } not within +/-${WINDOW_MIN}m of digest times`,
        });
        continue;
      }

      // Quiet hours — standard tier defers.
      const quietStart = parseClock(pref.quiet_hours_start);
      const quietEnd = parseClock(pref.quiet_hours_end);
      if (isInQuietHours(localNow.totalMinutes, quietStart, quietEnd)) {
        results.push({
          user_id: pref.user_id,
          email: pref.email,
          status: "skipped_quiet_hours",
          notifications: 0,
          reason: "within quiet hours",
        });
        continue;
      }

      // 2) Pull undelivered standard notifications since last_delivered_at.
      let outboxQuery = supabase
        .from("notifications_outbox")
        .select(
          "id, user_id, tier, title, body, payload, created_at, delivered_at",
        )
        .eq("user_id", pref.user_id)
        .eq("tier", "standard")
        .is("delivered_at", null)
        .order("created_at", { ascending: true });

      if (pref.last_delivered_at) {
        // Use >= (not >) so notifications created at the exact same instant as
        // the previous delivery boundary aren't silently skipped. The
        // delivered_at IS NULL filter above is the authoritative dedupe.
        outboxQuery = outboxQuery.gte("created_at", pref.last_delivered_at);
      }

      const { data: outboxRaw, error: outboxErr } = await outboxQuery;
      if (outboxErr) {
        console.error(
          `send-digest: failed to fetch outbox for ${pref.user_id}`,
          outboxErr,
        );
        results.push({
          user_id: pref.user_id,
          email: pref.email,
          status: "failed",
          notifications: 0,
          error: outboxErr.message,
        });
        continue;
      }

      const notifications = (outboxRaw || []) as OutboxRow[];
      if (notifications.length === 0) {
        results.push({
          user_id: pref.user_id,
          email: pref.email,
          status: "skipped_no_notifications",
          notifications: 0,
        });
        continue;
      }

      const digestBatchId = newUuid();
      const nowIso = new Date().toISOString();

      // 3) Send email if possible, else log + mark failed (no transport).
      let deliveryStatus: UserResult["status"] = "logged";
      let deliveryError: string | undefined;

      if (dryRun) {
        // Dry run: don't send, don't mutate.
        deliveryStatus = "logged";
      } else if (resend && RESEND_FROM_EMAIL && pref.email) {
        try {
          const { error: sendErr } = await resend.emails.send({
            from: `Dār Al-Ulūm Montréal <${RESEND_FROM_EMAIL}>`,
            to: pref.email,
            subject: matchedBatch === "evening"
              ? "Your evening digest"
              : "Your morning digest",
            html: renderDigestHtml(matchedBatch, notifications),
          });
          if (sendErr) {
            deliveryStatus = "failed";
            deliveryError = sendErr instanceof Error
              ? sendErr.message
              : String(sendErr);
            console.error(
              `send-digest: Resend failed for ${pref.user_id}`,
              deliveryError,
            );
          } else {
            deliveryStatus = "sent";
          }
        } catch (e) {
          deliveryStatus = "failed";
          deliveryError = e instanceof Error ? e.message : String(e);
          console.error(
            `send-digest: Resend threw for ${pref.user_id}`,
            deliveryError,
          );
        }
      } else {
        // No Resend or no email — treat as a failed delivery so we can retry
        // later. Critically: do NOT mark outbox rows delivered here, or the
        // notifications are lost forever.
        deliveryStatus = "failed";
        deliveryError = !resend
          ? "skipped_no_transport: RESEND_API_KEY not configured"
          : !RESEND_FROM_EMAIL
          ? "skipped_no_transport: RESEND_FROM_EMAIL not configured"
          : "skipped_no_transport: user has no email on auth.users";
        console.warn(
          `send-digest: not delivering ${notifications.length} notifications to ${pref.user_id} (${matchedBatch}); resend=${!!resend} from=${!!RESEND_FROM_EMAIL} email=${!!pref
            .email} — will retry next run`,
        );
      }

      // Only mark outbox + last_delivered_at after an actual successful send.
      // "logged" (dry-run) and "failed" (no transport / Resend error) both
      // leave delivered_at NULL so the next run can retry.
      if (deliveryStatus === "sent") {
        const ids = notifications.map((n) => n.id);
        const { error: markErr } = await supabase
          .from("notifications_outbox")
          .update({
            delivered_at: nowIso,
            digest_batch_id: digestBatchId,
          })
          .in("id", ids);

        if (markErr) {
          console.error(
            `send-digest: failed to mark outbox delivered for ${pref.user_id}`,
            markErr,
          );
          deliveryStatus = "failed";
          deliveryError = markErr.message;
        } else {
          const { error: prefUpdateErr } = await supabase
            .from("notification_preferences")
            .update({ last_delivered_at: nowIso })
            .eq("user_id", pref.user_id);
          if (prefUpdateErr) {
            console.error(
              `send-digest: failed to update last_delivered_at for ${pref.user_id}`,
              prefUpdateErr,
            );
          }
        }
      }

      results.push({
        user_id: pref.user_id,
        email: pref.email,
        status: deliveryStatus,
        digest_batch_id: digestBatchId,
        notifications: notifications.length,
        error: deliveryError,
      });
    }

    const summary = {
      batch,
      dryRun,
      processed: results.length,
      sent: results.filter((r) => r.status === "sent").length,
      logged: results.filter((r) => r.status === "logged").length,
      skipped_window: results.filter((r) =>
        r.status === "skipped_window"
      ).length,
      skipped_quiet_hours: results.filter((r) =>
        r.status === "skipped_quiet_hours"
      ).length,
      skipped_no_notifications: results.filter((r) =>
        r.status === "skipped_no_notifications"
      ).length,
      failed: results.filter((r) => r.status === "failed").length,
    };
    console.log("send-digest: done", summary);

    return new Response(
      JSON.stringify({ ...summary, results }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    console.error("send-digest: unhandled error", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
