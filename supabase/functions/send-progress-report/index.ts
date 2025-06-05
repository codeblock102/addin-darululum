import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { StudentProgressReportData } from '../../../src/types/reports.ts'; // Adjust path as needed

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
// IMPORTANT: Replace with your verified sender email for production
const SENDER_EMAIL = Deno.env.get('SENDER_EMAIL') || 'nazeefsuleman@gmail.com'; 

interface RequestPayload {
  reportData: StudentProgressReportData;
  recipientEmail: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { reportData, recipientEmail }: RequestPayload = await req.json();

    if (!reportData || !recipientEmail) {
      return new Response(JSON.stringify({ error: 'Missing reportData or recipientEmail' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!RESEND_API_KEY) {
        console.error('Resend API key is not set in environment variables.');
        return new Response(JSON.stringify({ error: 'Email service not configured (missing API key).' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Construct Email HTML Body (Simplified Example)
    // For a real application, use a templating engine or React Email for better HTML generation.
    let emailHtml = `<h1>Daily Progress Report for ${reportData.student_name}</h1>`;
    emailHtml += `<p><strong>Date:</strong> ${reportData.report_date}</p><hr>`;

    emailHtml += `<h2>Sabaq (New Lesson)</h2>`;
    if (reportData.sabaq_current_surah && reportData.sabaq_start_ayat) {
      emailHtml += `<p><strong>Lesson:</strong> Surah ${reportData.sabaq_current_surah}, Ayat ${reportData.sabaq_start_ayat} - ${reportData.sabaq_end_ayat || '...'}</p>`;
      emailHtml += `<p><strong>Quality:</strong> ${reportData.sabaq_memorization_quality || 'Not specified'}</p>`;
      emailHtml += `<p><strong>Comments:</strong> ${reportData.sabaq_comments || 'N/A'}</p>`;
    } else {
      emailHtml += `<p>No Sabaq recorded for this date.</p>`;
    }
    emailHtml += `<hr>`;

    emailHtml += `<h2>Sabaq Para (Revision of Recent Lessons)</h2>`;
    if (reportData.sabaq_para_juz && reportData.sabaq_para_number) {
      emailHtml += `<p><strong>Juz:</strong> ${reportData.sabaq_para_juz}, Para: ${reportData.sabaq_para_number}</p>`;
      emailHtml += `<p><strong>Pages Revised:</strong> ${reportData.sabaq_para_pages_revised || 'Not specified'}</p>`;
      emailHtml += `<p><strong>Teacher Notes:</strong> ${reportData.sabaq_para_teacher_notes || 'N/A'}</p>`;
    } else {
      emailHtml += `<p>No Sabaq Para recorded for this date.</p>`;
    }
    emailHtml += `<hr>`;

    emailHtml += `<h2>Dhor (Revision of Older Lessons)</h2>`;
    if (reportData.dhor_juz_revisions && reportData.dhor_juz_revisions.length > 0) {
      reportData.dhor_juz_revisions.forEach(revision => {
        emailHtml += `<p>
          <strong>Juz ${revision.juz_number}:</strong> 
          Type: ${revision.dhor_type || 'N/A'}, 
          Lines: ${revision.lines_memorized || 'N/A'}, 
          Quality: ${revision.revision_quality || 'N/A'}, 
          Comments: ${revision.teacher_comments || 'N/A'}
        </p>`;
      });
    } else {
      emailHtml += `<p>No Dhor recorded for this date.</p>`;
    }
    emailHtml += `<hr>`;

    emailHtml += `<h2>Attendance</h2>`;
    emailHtml += `<p><strong>Status:</strong> ${reportData.attendance_status || 'Not marked'}</p>`;
    emailHtml += `<p><strong>Notes:</strong> ${reportData.attendance_notes || 'N/A'}</p>`;
    emailHtml += `<hr><p><em>This is an automated report.</em></p>`;

    const emailPayload = {
      from: SENDER_EMAIL,
      to: recipientEmail,
      subject: `Madrasah Progress Report: ${reportData.student_name} - ${reportData.report_date}`,
      html: emailHtml,
    };
    
    console.log("Attempting to send email with payload:", JSON.stringify(emailPayload, null, 2));

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const responseData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend API Error:', responseData);
      throw new Error(responseData.message || 'Failed to send email via Resend.');
    }

    console.log('Email sent successfully via Resend:', responseData);
    return new Response(JSON.stringify({ message: 'Email sent successfully', data: responseData }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 