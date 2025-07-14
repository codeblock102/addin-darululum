import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@3.2.0";
import { corsHeaders } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");
const resend = new Resend(RESEND_API_KEY);

interface ProgressRecord {
  date: string;
  student_id: string;
  // other progress fields
  start_ayat: number;
  end_ayat: number;
  current_surah: number;
  pages_memorized: number;
  notes: string;
  teacher_notes: string;
  memorization_quality: string;
}

interface Student {
  id: string;
  name: string;
  guardian_contact: string;
  guardian_name: string;
  guardian_email: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body to get trigger source
    let triggerSource = 'manual';
    let timestamp = new Date().toISOString();
    
    try {
      const body = await req.text();
      if (body) {
        const parsedBody = JSON.parse(body);
        triggerSource = parsedBody.source || 'manual';
        timestamp = parsedBody.timestamp || timestamp;
      }
    } catch (parseError) {
      console.log("No body or invalid JSON, treating as manual trigger");
    }

    console.log(`Function invoked. Trigger source: ${triggerSource}, Timestamp: ${timestamp}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
        },
      },
    );

    // Log the trigger event
    try {
      await supabase
        .from("email_logs")
        .insert({
          trigger_source: triggerSource,
          triggered_at: timestamp,
          status: 'started'
        });
    } catch (logError) {
      console.log("Could not log to email_logs table (table may not exist):", logError);
    }

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    console.log(`Querying progress records since: ${yesterday}`);

    const { data: progressRecords, error: progressError } = await supabase
      .from("progress")
      .select("*")
      .gte("created_at", yesterday);

    if (progressError) {
      console.error("Error fetching progress records:", progressError);
      throw progressError;
    }

    console.log(`Found ${progressRecords?.length || 0} progress records.`);

    if (!progressRecords || progressRecords.length === 0) {
      // Log completion even if no records
      try {
        await supabase
          .from("email_logs")
          .insert({
            trigger_source: triggerSource,
            triggered_at: timestamp,
            status: 'completed',
            emails_sent: 0,
            message: 'No progress records for today'
          });
      } catch (logError) {
        console.log("Could not log completion to email_logs table:", logError);
      }

      return new Response(JSON.stringify({ 
        message: "No progress records for today.",
        triggerSource,
        timestamp,
        emailsSent: 0
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const studentIds = [...new Set(progressRecords.map((r) => r.student_id))];

    const { data: students, error: studentsError } = await supabase
      .from("students")
      .select("id, name, guardian_contact, guardian_name, guardian_email")
      .in("id", studentIds);

    if (studentsError) {
      throw studentsError;
    }

    const studentsMap = new Map(students.map((s) => [s.id, s]));

    // Using a Map to group progress records by student
    const studentProgressMap = new Map<string, { student: Student; progresses: ProgressRecord[] }>();

    for (const record of progressRecords as ProgressRecord[]) {
        const student = studentsMap.get(record.student_id);
        if (!student) {
            console.warn(`Student with ID ${record.student_id} not found for a progress record.`);
            continue;
        }

        if (!studentProgressMap.has(record.student_id)) {
            studentProgressMap.set(record.student_id, { student, progresses: [] });
        }
        
        const studentData = studentProgressMap.get(record.student_id);
        if (studentData) {
            studentData.progresses.push(record);
        }
    }

    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // START of new code for principal's email
    const PRINCIPAL_EMAIL = "mzbaig9@gmail.com";
    let overallProgressHtml = `
      <p>Overall student progress for ${reportDate}.</p>
      <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="padding: 8px; border-bottom: 1px solid #ddd; background-color: #f2f2f2; text-align: left;">Student</th>
            <th style="padding: 8px; border-bottom: 1px solid #ddd; background-color: #f2f2f2; text-align: left;">Lesson</th>
            <th style="padding: 8px; border-bottom: 1px solid #ddd; background-color: #f2f2f2; text-align: left;">Pages Memorized</th>
            <th style="padding: 8px; border-bottom: 1px solid #ddd; background-color: #f2f2f2; text-align: left;">Quality</th>
            <th style="padding: 8px; border-bottom: 1px solid #ddd; background-color: #f2f2f2; text-align: left;">Notes</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const { student, progresses } of studentProgressMap.values()) {
        for (const p of progresses) {
            overallProgressHtml += `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${student.name}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">Surah ${p.current_surah}:${p.start_ayat}-${p.end_ayat}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.pages_memorized}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.memorization_quality}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.teacher_notes || p.notes || 'N/A'}</td>
                </tr>
            `;
        }
    }

    overallProgressHtml += `
        </tbody>
      </table>
    `;

    const principalEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
              .container { width: 100%; max-width: 800px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .header { background-color: #004d40; color: #ffffff; padding: 10px 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
              .content { padding: 20px; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #888888; }
              table { width: 100%; border-collapse: collapse; }
              th { background-color: #f2f2f2; text-align: left; padding: 8px; }
              .trigger-info { background-color: #f8f9fa; padding: 8px; border-radius: 4px; margin-bottom: 16px; font-size: 12px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Daily Student Progress Summary</h1>
              </div>
              <div class="content">
                  <p>Dear Principal,</p>
                  <p>Here is the overall student progress report for ${reportDate}:</p>
                  ${overallProgressHtml}
                  <div class="trigger-info">
                      Report generated ${triggerSource === 'scheduled' ? 'automatically' : 'manually'} at ${new Date(timestamp).toLocaleString()}
                  </div>
                  <p>Thank you,</p>
                  <p><strong>Darul Uloom</strong></p>
              </div>
              <div class="footer">
                  <p>This is an automated email.</p>
              </div>
          </div>
      </body>
      </html>
    `;

    try {
        if (!RESEND_FROM_EMAIL) {
            console.error("RESEND_FROM_EMAIL environment variable is not set.");
        } else {
            await resend.emails.send({
                from: RESEND_FROM_EMAIL,
                to: PRINCIPAL_EMAIL,
                subject: `Daily Student Progress Report - ${reportDate}`,
                html: principalEmailHtml,
            });
            console.log(`Principal's summary email sent to ${PRINCIPAL_EMAIL}`);
        }
    } catch (emailError) {
        console.error(`Error sending principal's summary email:`, emailError);
    }
    // END of new code for principal's email

    let emailsSent = 0;
    let emailsSkipped = 0;
    const emailResults = [];

    for (const { student, progresses } of studentProgressMap.values()) {
        if (!student.guardian_email) {
            console.log(`Student ${student.name} has no guardian email. Skipping.`);
            emailsSkipped++;
            continue;
        }

        const progressSummary = progresses.map(p => 
            `<tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">Surah ${p.current_surah}:${p.start_ayat}-${p.end_ayat}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.pages_memorized}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.memorization_quality}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.teacher_notes || p.notes || 'N/A'}</td>
            </tr>`
        ).join('');

        const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
                .container { width: 100%; max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .header { background-color: #004d40; color: #ffffff; padding: 10px 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
                .content { padding: 20px; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #888888; }
                table { width: 100%; border-collapse: collapse; }
                th { background-color: #f2f2f2; text-align: left; padding: 8px; }
                .trigger-info { background-color: #f8f9fa; padding: 8px; border-radius: 4px; margin-bottom: 16px; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Quran Progress for ${student.name}</h1>
                </div>
                <div class="content">
                    <p>Dear ${student.guardian_name || 'Guardian'},</p>
                    <p>Here is the progress report for <strong>${student.name}</strong> for ${reportDate}:</p>
                    <table border="0" cellpadding="0" cellspacing="0">
                        <thead>
                            <tr>
                                <th>Lesson</th>
                                <th>Pages Memorized</th>
                                <th>Quality</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${progressSummary}
                        </tbody>
                    </table>
                    <div class="trigger-info">
                        Report generated ${triggerSource === 'scheduled' ? 'automatically' : 'manually'} at ${new Date(timestamp).toLocaleString()}
                    </div>
                    <p>Thank you,</p>
                    <p><strong>Darul Uloom</strong></p>
                </div>
                <div class="footer">
                    <p>This is an automated email. Please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        `;

        try {
            if (!RESEND_FROM_EMAIL) {
                console.error("RESEND_FROM_EMAIL environment variable is not set.");
                emailsSkipped++;
                continue;
            }

            await resend.emails.send({
                from: RESEND_FROM_EMAIL,
                to: student.guardian_email,
                subject: `Quran Progress Report for ${student.name} - ${reportDate}`,
                html: emailHtml,
            });
            
            console.log(`Email sent to ${student.guardian_email} for student ${student.name}`);
            emailsSent++;
            emailResults.push({
                student_name: student.name,
                guardian_email: student.guardian_email,
                status: 'sent'
            });
        } catch (emailError) {
            console.error(`Failed to send email to ${student.guardian_email} for student ${student.name}:`, emailError);
            emailsSkipped++;
            emailResults.push({
                student_name: student.name,
                guardian_email: student.guardian_email,
                status: 'failed',
                error: emailError.message
            });
        }
    }

    // Log completion
    try {
      await supabase
        .from("email_logs")
        .insert({
          trigger_source: triggerSource,
          triggered_at: timestamp,
          status: 'completed',
          emails_sent: emailsSent,
          emails_skipped: emailsSkipped,
          message: `Sent ${emailsSent} emails, skipped ${emailsSkipped}`
        });
    } catch (logError) {
      console.log("Could not log completion to email_logs table:", logError);
    }

    console.log(`Email sending process completed successfully. Sent: ${emailsSent}, Skipped: ${emailsSkipped}`);

    return new Response(JSON.stringify({ 
      message: "Email sending process completed.",
      triggerSource,
      timestamp,
      emailsSent,
      emailsSkipped,
      totalStudents: studentProgressMap.size,
      results: emailResults
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Function execution failed:", error);
    
    // Try to log the error
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        {
          global: {
            headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
          },
        },
      );
      
      await supabase
        .from("email_logs")
        .insert({
          trigger_source: 'unknown',
          triggered_at: new Date().toISOString(),
          status: 'error',
          message: error.message
        });
    } catch (logError) {
      console.log("Could not log error to email_logs table:", logError);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}); 