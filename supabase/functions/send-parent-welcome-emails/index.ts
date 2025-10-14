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

    // Get all parents with their student information
    const { data: parents, error: parentsError } = await admin
      .from("parents")
      .select(`
        id,
        name,
        email,
        student_ids,
        students:student_ids (
          name
        )
      `)
      .not("email", "is", null);

    if (parentsError) {
      console.error("[send-parent-welcome-emails] failed to fetch parents:", parentsError.message);
      return new Response(JSON.stringify({ error: parentsError.message }), {
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

        // Get student names for this parent
        const studentNames = Array.isArray(parent.students) 
          ? parent.students.map((s: { name: string }) => s.name).filter(Boolean)
          : [];
        
        const list = studentNames.length > 0 ? studentNames.join(", ") : "your student";

        // Create email HTML
        const html = `<!doctype html><html><body style="font-family:Arial,sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 10px;">
              Welcome to Dār Al-Ulūm Montréal Parent Portal
            </h2>
            <p>Dear ${parent.name},</p>
            <p>An account has been created and linked to <strong>${list}</strong>.</p>
            <p><strong>Login with:</strong></p>
            <ul style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #0f766e;">
              <li>Username (email): <strong>${parent.email}</strong></li>
              <li>Temporary password: <strong>Parent123!</strong></li>
            </ul>
            <p><strong>Access your account:</strong> <a href="${APP_URL}" style="color: #0f766e; text-decoration: none; font-weight: bold;">${APP_URL}</a></p>
            <p>Please log in and change your password for security. If you didn't request this account, please contact the school immediately.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">
              This is an automated message from Dār Al-Ulūm Montréal. Please do not reply to this email.
            </p>
          </div>
        </body></html>`;

        // Send the email
        await resend.emails.send({
          from: RESEND_FROM_EMAIL,
          to: parent.email.trim(),
          subject: "Your Parent Portal Account - Dār Al-Ulūm Montréal",
          html
        });

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
