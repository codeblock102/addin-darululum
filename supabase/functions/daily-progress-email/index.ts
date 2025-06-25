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
    console.log("Function invoked. Starting process.");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
        },
      },
    );

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
      return new Response(JSON.stringify({ message: "No progress records for today." }), {
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

    for (const { student, progresses } of studentProgressMap.values()) {
        if (!student.guardian_email) {
            console.log(`Student ${student.name} has no guardian email. Skipping.`);
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
                continue;
            }

            await resend.emails.send({
                from: RESEND_FROM_EMAIL,
                to: student.guardian_email,
                subject: `Quran Progress Report for ${student.name} - ${reportDate}`,
                html: emailHtml,
            });
            console.log(`Email sent to ${student.guardian_email}`);
        } catch (emailError) {
            console.error(`Failed to send email to ${student.guardian_email}:`, emailError);
        }
    }

    console.log("Email sending process completed successfully.");

    return new Response(JSON.stringify({ message: "Emails sent successfully." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Function execution failed:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}); 