// @ts-nocheck
/* eslint-disable */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@3.2.0";
import { corsHeaders } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");
// Hardcoded fallback logo URL (public and absolute)
const DEFAULT_ORG_LOGO_URL = "https://depsfpodwaprzxffdcks.supabase.co/storage/v1/object/public/dum-logo/dum-logo.png";
const APP_URL = Deno.env.get("APP_URL") || "https://app.daralulummontreal.com/";
const resend = new Resend(RESEND_API_KEY);

// Guard long-running operations so the job can't hang indefinitely
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise
      .then((value) => { clearTimeout(timer); resolve(value); })
      .catch((err) => { clearTimeout(timer); reject(err); });
  });
}

// Timezone-aware formatting to avoid off-by-one day issues in emails
const REPORT_TIME_ZONE = Deno.env.get("REPORT_TIMEZONE") ?? "America/Toronto";
const fmtDate = (d: string | Date) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: REPORT_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
const fmtDay = (d: string | Date) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: REPORT_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(d));

const buildPortalCtaHtml = () => `
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

type EmailResult = {
  student_name: string;
  guardian_email: string;
  status: 'sent' | 'failed';
  error?: string;
};

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

// Types used for academic/assignment sections in emails
type AssignmentForEmail = {
  id: string;
  title: string;
  due_date: string | null;
};

type SubmissionDb = {
  assignment_id: string;
  status: 'assigned' | 'submitted' | 'graded';
  grade: number | null;
  feedback: string | null;
  submitted_at: string | null;
  graded_at: string | null;
};

type EmailRow = {
  assignment_id: string;
  title: string;
  due_date: string | null;
  status: string;
  grade: string;
  feedback: string;
  submitted_at?: string | null;
  graded_at?: string | null;
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body to get trigger source
    let triggerSource = 'manual';
    let timestamp = new Date().toISOString();
    let requestScope: 'school' | 'class' | 'section' = 'school';
    let requestClassId: string | null = null;
    let requestSection: string | null = null;
    
    try {
      const body = await req.text();
      if (body) {
        const parsedBody = JSON.parse(body);
        triggerSource = parsedBody.source || 'manual';
        timestamp = parsedBody.timestamp || timestamp;
        if (parsedBody.scope === 'class' || parsedBody.scope === 'school' || parsedBody.scope === 'section') {
          requestScope = parsedBody.scope;
        }
        if (parsedBody.classId && typeof parsedBody.classId === 'string') {
          requestClassId = parsedBody.classId;
        }
        if (parsedBody.section && typeof parsedBody.section === 'string') {
          requestSection = parsedBody.section;
        }
      }
    } catch (_parseError) {
      console.log("No body or invalid JSON, treating as manual trigger");
    }

    console.log(`Function invoked. Trigger source: ${triggerSource}, Timestamp: ${timestamp}`);
    if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
      console.error("Resend config missing", { hasKey: !!RESEND_API_KEY, from: RESEND_FROM_EMAIL });
      return new Response(JSON.stringify({ error: "Email sender not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create two clients: one with service role for privileged DB access,
    // and one with the caller's JWT to identify who invoked the function
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      },
    );

    // Load schedule settings
    const { data: settingsRows } = await supabaseService
      .from('app_settings')
      .select('key, value')
      .in('key', ['email_schedule_enabled','email_schedule_time','email_timezone','org_logo_url']);
    const settingsMap = new Map<string, string>((settingsRows || []).map((r: { key: string; value: string }) => [r.key, r.value]));
    const scheduleEnabled = (settingsMap.get('email_schedule_enabled') ?? 'true') !== 'false';
    const _scheduleTime = settingsMap.get('email_schedule_time') || '21:30';
    const scheduleTz = settingsMap.get('email_timezone') || 'America/New_York';
    // Force using the Supabase Storage public logo URL
    const logoUrl = DEFAULT_ORG_LOGO_URL;
    let logoImgHtml = '';
    try {
      const resp = await fetch(logoUrl);
      if (resp.ok) {
        const contentType = resp.headers.get('content-type') || 'image/png';
        const bytes = new Uint8Array(await resp.arrayBuffer());
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        const base64 = btoa(binary);
        logoImgHtml = `<div style="text-align:center;margin-top:16px;"><img src="data:${contentType};base64,${base64}" alt="Dār Al-Ulūm Montréal" style="max-width:200px;height:auto;"/></div>`;
      } else {
        logoImgHtml = `<div style=\"text-align:center;margin-top:16px;\"><img src=\"${logoUrl}\" alt=\"Dār Al-Ulūm Montréal\" style=\"max-width:200px;height:auto;\"/></div>`;
      }
    } catch (_e) {
      logoImgHtml = `<div style=\"text-align:center;margin-top:16px;\"><img src=\"${logoUrl}\" alt=\"Dār Al-Ulūm Montréal\" style=\"max-width:200px;height:auto;\"/></div>`;
    }

    // If scheduled trigger and schedule is disabled, exit early
    if (triggerSource === 'scheduled' && !scheduleEnabled) {
      console.log('Scheduled run skipped: email schedule disabled');
      return new Response(JSON.stringify({ skipped: true, reason: 'disabled' }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // (Duplicate-run guard removed per request)

    // pg_cron fires at the configured minute; no extra time check needed beyond enabled flag

    // Hard cap total runtime (default 120s)
    const maxRuntimeMs = Number(Deno.env.get('DAILY_EMAIL_MAX_MS') ?? 120000);
    const startedAtMs = Date.now();
    const timeRemainingMs = () => Math.max(0, maxRuntimeMs - (Date.now() - startedAtMs));
    let endedDueToTimeout = false;

    // Identify invoking user and their madrassah for manual invocations. Skip for scheduled runs.
    let invokingMadrassahId: string | null = null;
    let userId: string | null = null;
    let invokingTeacherSection: string | null = null;
    if (triggerSource !== 'scheduled') {
      const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
      if (userErr || !userData?.user) {
        console.error("Unable to resolve invoking user from token", userErr);
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = userData.user.id;
      const { data: teacherProfile, error: teacherProfileErr } = await supabaseService
        .from("profiles")
        .select("id, role, madrassah_id, capabilities, section")
        .eq("id", userId)
        .maybeSingle();
      if (teacherProfileErr || !teacherProfile?.madrassah_id) {
        console.error("Invoking user's profile missing madrassah_id", teacherProfileErr);
        return new Response(JSON.stringify({ error: "Profile missing madrassah_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      invokingMadrassahId = teacherProfile.madrassah_id as string;
      invokingTeacherSection = (teacherProfile as any)?.section || null;

      // Capability enforcement: only admins or teachers with daily_progress_email capability
      const isAdminRole = teacherProfile.role === 'admin';
      const caps = Array.isArray((teacherProfile as any).capabilities) ? (teacherProfile as any).capabilities as string[] : [];
      const hasDailyCap = caps.includes('daily_progress_email');
      if (!isAdminRole && !hasDailyCap) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // If teacher requests section scope, enforce it matches their own section
      if (!isAdminRole && requestScope === 'section') {
        // Fallback to teacher's section if none provided
        if (!requestSection && invokingTeacherSection) {
          requestSection = invokingTeacherSection;
        }
        const reqSec = (requestSection || '').trim().toLowerCase();
        const teacherSec = (invokingTeacherSection || '').trim().toLowerCase();
        if (!reqSec || !teacherSec || reqSec !== teacherSec) {
          return new Response(JSON.stringify({ error: 'Forbidden: section mismatch' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // Log the trigger event
    try {
      await supabaseService
        .from("email_logs")
        .insert({
          trigger_source: triggerSource,
          triggered_at: timestamp,
          status: 'started',
          emails_sent: 0,
          emails_skipped: 0,
          message: userId ? `invoked by ${userId}${invokingMadrassahId ? ' (madrassah ' + invokingMadrassahId + ')' : ''}` : 'scheduled run',
        });
    } catch (logError) {
      console.log("Could not log to email_logs table (table may not exist):", logError);
    }

    // Compute today's local date string based on configured timezone
    const tzForReport = scheduleTz || REPORT_TIME_ZONE;
    const todayLocalDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: tzForReport,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    console.log(`Querying progress for local day ${todayLocalDate} (${tzForReport})`);

    // If scoping to a section, precompute allowed student IDs for that section
    let allowedSectionStudentIds: string[] = [];
    if (requestScope === 'section' && requestSection) {
      const { data: sectionStudents } = await supabaseService
        .from('students')
        .select('id')
        .eq('section', requestSection);
      allowedSectionStudentIds = Array.from(new Set((sectionStudents || []).map((s: { id: string }) => s.id)));
    }

    let progressQuery = supabaseService
      .from("progress")
      .select("*")
      .eq('date', todayLocalDate);
    if (requestScope === 'class' && requestClassId) {
      // Filter progress by students in the specified class
      const { data: cls } = await supabaseService
        .from('classes')
        .select('current_students')
        .eq('id', requestClassId)
        .maybeSingle();
      const classStudentIds: string[] = Array.from(new Set((cls?.current_students || []).filter(Boolean)));
      if (classStudentIds.length > 0) {
        progressQuery = progressQuery.in('student_id', classStudentIds);
      } else {
        // No students => empty result
        progressQuery = progressQuery.in('student_id', ['00000000-0000-0000-0000-000000000000']);
      }
    } else if (requestScope === 'section' && requestSection) {
      if (allowedSectionStudentIds.length > 0) {
        progressQuery = progressQuery.in('student_id', allowedSectionStudentIds);
      } else {
        progressQuery = progressQuery.in('student_id', ['00000000-0000-0000-0000-000000000000']);
      }
    }
    const { data: progressRecords, error: progressError } = await progressQuery;

    if (progressError) {
      console.error("Error fetching progress records:", progressError);
      throw progressError;
    }

    console.log(`Found ${progressRecords?.length || 0} progress records.`);
    
    // Academic submissions in the last 24 hours (submitted or graded)
    const yesterdayISO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: subsDaily, error: subsErr } = await supabaseService
      .from("teacher_assignment_submissions")
      .select("assignment_id, student_id, status, submitted_at, graded_at, grade, feedback, created_at")
      .or(`submitted_at.gte.${yesterdayISO},graded_at.gte.${yesterdayISO}`);
    if (subsErr) {
      console.error("Error fetching submissions:", subsErr);
    }

    const progressStudentIds = [...new Set((progressRecords || []).map((r) => r.student_id))];
    const submissionStudentIds = [...new Set((subsDaily || []).map((s) => s.student_id))];
    const allStudentIds = [...new Set([...progressStudentIds, ...submissionStudentIds])];

    let studentsQuery = supabaseService
      .from("students")
      .select("id, name, guardian_contact, guardian_name, guardian_email, madrassah_id")
      .in("id", allStudentIds.length > 0 ? allStudentIds : ["00000000-0000-0000-0000-000000000000"]);
    if (requestScope === 'class' && requestClassId) {
      // Ensure we only email for students in the selected class
      const { data: cls2 } = await supabaseService
        .from('classes')
        .select('current_students')
        .eq('id', requestClassId)
        .maybeSingle();
      const allowedIds = Array.from(new Set((cls2?.current_students || []).filter(Boolean)));
      if (allowedIds.length > 0) {
        studentsQuery = studentsQuery.in('id', allowedIds);
      } else {
        studentsQuery = studentsQuery.in('id', ['00000000-0000-0000-0000-000000000000']);
      }
    } else if (requestScope === 'section' && requestSection) {
      // Limit students to the requested section
      studentsQuery = studentsQuery.eq('section', requestSection);
    }
    const { data: students, error: studentsError } = await studentsQuery; // include all students with activity

    if (studentsError) {
      throw studentsError;
    }

    const studentsMap = new Map(students.map((s) => [s.id, s]));

    // Using a Map to group progress records by student
    const studentProgressMap = new Map<string, { student: Student; progresses: ProgressRecord[] }>();

    for (const record of (progressRecords || []) as ProgressRecord[]) {
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

    const now = new Date();
    const reportDate = fmtDay(now);

    // Build academic activity per student
    const filteredSubs = (subsDaily || []).filter((s) => studentsMap.has(s.student_id));
    const assignmentIds = [...new Set(filteredSubs.map((s) => s.assignment_id))];
    let assignmentMap = new Map<string, { id: string; title: string; due_date: string | null }>();
    if (assignmentIds.length > 0) {
      const { data: assigns, error: assignsError } = await supabaseService
        .from("teacher_assignments")
        .select("id, title, due_date")
        .in("id", assignmentIds);
      if (assignsError) {
        console.error("Error fetching assignments for academic section:", assignsError);
      } else {
        assignmentMap = new Map((assigns || []).map((a: { id: string; title: string; due_date: string | null }) => [a.id, { id: a.id, title: a.title, due_date: a.due_date }]));
      }
    }

    const studentAcademicMap = new Map<string, Array<{ assignmentTitle: string; status: string; grade: number | null; submitted_at: string | null; graded_at: string | null; due_date: string | null; feedback: string | null }>>();
    for (const sub of filteredSubs) {
      const a = assignmentMap.get(sub.assignment_id);
      const arr = studentAcademicMap.get(sub.student_id) || [];
      arr.push({
        assignmentTitle: a?.title || sub.assignment_id,
        status: sub.status,
        grade: sub.grade ?? null,
        submitted_at: sub.submitted_at ?? null,
        graded_at: sub.graded_at ?? null,
        due_date: a?.due_date ?? null,
        feedback: sub.feedback ?? null,
      });
      studentAcademicMap.set(sub.student_id, arr);
    }

    // START: Dynamic admin emails for this madrassah
    const { data: adminRows, error: adminErr } = await supabaseService
      .from("profiles")
      .select("email")
      .eq("role", "admin")
      .not("email", "is", null);
    if (adminErr) {
      console.error("Failed to fetch admin emails:", adminErr);
    }
    const ADMIN_EMAILS: string[] = Array.from(new Set(
      (adminRows || [])
        .map((r: { email: string | null }) => (r.email || "").trim())
        .filter((e: string) => !!e)
    ));
    // Build class-organized admin summary
    // Fetch classes (optionally scoped to a specific class)
    const { data: classRows } = await supabaseService
      .from('classes')
      .select('id, name, current_students');
    const allClasses: Array<{ id: string; name: string; current_students: string[] | null }> = (classRows || []) as any[];

    // If request limited to one class, filter to that class
    const classesForSummary = (requestScope === 'class' && requestClassId)
      ? allClasses.filter(c => c.id === requestClassId)
      : (requestScope === 'section' && allowedSectionStudentIds.length > 0)
        ? allClasses.filter(c => (c.current_students || []).some((sid: string | null) => !!sid && allowedSectionStudentIds.includes(sid)))
        : allClasses;

    let classSectionsHtml = '';
    for (const cls of classesForSummary) {
      const classStudentIds = Array.from(new Set((cls.current_students || []).filter(Boolean)));
      const eligibleIds = (requestScope === 'section' && allowedSectionStudentIds.length > 0)
        ? classStudentIds.filter((sid) => allowedSectionStudentIds.includes(sid))
        : classStudentIds;
      // Filter to students with activity today or recent submissions
      const activeStudentIds = eligibleIds.filter((sid) => studentsMap.has(sid) && (studentProgressMap.has(sid) || studentAcademicMap.has(sid)));
      if (activeStudentIds.length === 0) {
        continue;
      }

      // Sabaq/progress table for this class
      let classProgressHtml = `
        <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="padding: 8px; border-bottom: 1px solid #ddd; background-color: #f2f2f2; text-align: left;">Student</th>
              <th style="padding: 8px; border-bottom: 1px solid #ddd; background-color: #f2f2f2; text-align: left;">Lesson</th>
              <th style="padding: 8px; border-bottom: 1px solid #ddd; background-color: #f2f2f2; text-align: left;">Pages Memorized</th>
              <th style="padding: 8px; border-bottom: 1px solid #ddd; background-color: #f2f2f2; text-align: left;">Quality</th>
            </tr>
          </thead>
          <tbody>`;

      const totalPagesByStudent = new Map<string, number>();
      for (const sid of activeStudentIds) {
        const student = studentsMap.get(sid);
        const entry = studentProgressMap.get(sid);
        if (!student || !entry) continue;
        const progresses = entry.progresses || [];
        for (const p of progresses) {
          classProgressHtml += `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${student.name}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">Surah ${p.current_surah}:${p.start_ayat}-${p.end_ayat}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${p.pages_memorized}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${p.memorization_quality}</td>
            </tr>`;
          totalPagesByStudent.set(sid, (totalPagesByStudent.get(sid) || 0) + (p.pages_memorized || 0));
        }
      }
      classProgressHtml += `</tbody></table>`;

      // Top student by pages memorized
      let topStudentHtml = '';
      if (totalPagesByStudent.size > 0) {
        const topEntry = Array.from(totalPagesByStudent.entries()).sort((a, b) => b[1] - a[1])[0];
        const topStudent = studentsMap.get(topEntry[0]);
        if (topStudent) {
          topStudentHtml = `<div style="margin:8px 0; font-size:14px;"><strong>Top Sabaq:</strong> ${topStudent.name} (${topEntry[1]} pages)</div>`;
        }
      }

      // Assignments for this class: aggregate unique assignments from academic map
      const assignmentAggregate = new Map<string, { title: string; due: string | null; count: number }>();
      for (const sid of activeStudentIds) {
        const rows = studentAcademicMap.get(sid) || [];
        for (const r of rows) {
          const key = `${r.assignmentTitle}|${r.due_date || ''}`;
          const prev = assignmentAggregate.get(key);
          if (prev) {
            prev.count += 1;
          } else {
            assignmentAggregate.set(key, { title: r.assignmentTitle, due: r.due_date || null, count: 1 });
          }
        }
      }
      let classAssignmentsHtml = '';
      if (assignmentAggregate.size > 0) {
        classAssignmentsHtml = `
          <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; margin-top:8px;">
            <thead>
              <tr>
                <th style="padding: 8px; border-bottom: 1px solid #ddd; background-color: #f2f2f2; text-align: left;">Assignment</th>
                <th style="padding: 8px; border-bottom: 1px solid #ddd; background-color: #f2f2f2; text-align: left;">Due</th>
                <th style="padding: 8px; border-bottom: 1px solid #ddd; background-color: #f2f2f2; text-align: left;">Students</th>
              </tr>
            </thead>
            <tbody>`;
        for (const { title, due, count } of assignmentAggregate.values()) {
          classAssignmentsHtml += `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${title}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${due || '—'}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${count}</td>
            </tr>`;
        }
        classAssignmentsHtml += `</tbody></table>`;
      }

      classSectionsHtml += `
        <div style="margin:20px 0;">
          <h3 style="margin:0 0 8px 0;">Class: ${cls.name}</h3>
          ${topStudentHtml}
          <h4 style="margin:12px 0 6px 0;">Sabaq Today</h4>
          ${classProgressHtml}
          ${assignmentAggregate.size > 0 ? `<h4 style=\"margin:16px 0 6px 0;\">Assignments (Last 24h)</h4>${classAssignmentsHtml}` : ''}
        </div>`;
    }

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
                  <p>Assalamu Alaikum Principal,</p>
                  <p>Here is the class-organized progress report for ${reportDate}:</p>
                  ${classSectionsHtml || '<p>No activity detected for today.</p>'}
                  <div class="trigger-info">
                      Report generated ${triggerSource === 'scheduled' ? 'automatically' : 'manually'} at ${new Date(timestamp).toLocaleString()}
                  </div>
                  <p>JazakAllah Khairan,</p>
                  <p><strong>Dār Al-Ulūm Montréal</strong></p>
                  ${logoImgHtml}
              </div>
              <div class="footer">
                  <p>This is an automated email.</p>
              </div>
          </div>
      </body>
      </html>
    `;

    // (Admin summary email will be sent after guardian emails if time remains)
    // END dynamic admin emails (moved send to end)

    let emailsSent = 0;
    let emailsSkipped = 0;
    const emailResults = [];
    // Collect email payloads for batch sending
    const emailPayloads: Array<{
        from: string;
        to: string;
        subject: string;
        html: string;
        student_name: string;
        guardian_email: string;
    }> = [];

    for (const { student, progresses } of studentProgressMap.values()) {
        // Collect all parent emails from both sources
        const parentEmailsSet = new Set<string>();
        
        // Source 1: Direct guardian_email from students table
        if (student.guardian_email) {
            const trimmed = student.guardian_email.trim();
            if (trimmed) {
                parentEmailsSet.add(trimmed);
            }
        }

        // Source 2: `parents` table (student_ids array) -> fetch parent IDs, then emails from profiles
        try {
            const studentUuid = student.id; // Keep as UUID, don't convert to string

            const { data: parents, error: parentsError } = await supabaseService
                .from("parents")
                .select("id, student_ids")
                .contains("student_ids", [studentUuid]);

            if (parentsError) {
                console.error(`Error fetching parents for student ${studentUuid}:`, parentsError.message);
            } else {
                console.log(`Found ${(parents || []).length} parent rows for student ${studentUuid}`);

                const parentIds = (parents || []).map((p: any) => p.id);

                if (parentIds.length > 0) {
                    const { data: profiles, error: profilesError } = await supabaseService
                        .from("profiles")
                        .select("email, role")
                        .in("id", parentIds)
                        .eq("role", "parent");
                    
                    if (profilesError) {
                        console.error(`Error fetching profiles:`, profilesError.message);
                    } else {
                        const parentEmails = (profiles || []).map((p: any) => p.email).filter(Boolean);
                        
                        for (const email of parentEmails) {
                            const trimmed = email.trim();
                            if (trimmed) {
                                parentEmailsSet.add(trimmed);
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error(`Exception in parent email lookup for student ${student.id}:`, (e as Error).message);
        }

        // Skip if no parent emails found at all
        if (parentEmailsSet.size === 0) {
            console.log(`Student ${student.name} has no parent emails. Skipping.`);
            emailsSkipped++;
            continue;
        }

        const parentEmails = Array.from(parentEmailsSet);

        const progressSummary = progresses.map(p => 
            `<tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">Surah ${p.current_surah}:${p.start_ayat}-${p.end_ayat}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.pages_memorized}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.memorization_quality}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.teacher_notes || p.notes || 'N/A'}</td>
            </tr>`
        ).join('');

        // Build academic updates section for this student
        let academicRows = '';
        try {
          // Fetch all submissions for this student
          const { data: subs, error: subsErr } = await supabaseService
            .from('teacher_assignment_submissions')
            .select('assignment_id, status, grade, feedback, submitted_at, graded_at')
            .eq('student_id', student.id)
            .order('submitted_at', { ascending: false });
          if (!subsErr && subs && subs.length > 0) {
            const assignmentIds = Array.from(new Set((subs as SubmissionDb[]).map((s) => s.assignment_id).filter(Boolean)));
            const idToAssignment = new Map<string, AssignmentForEmail>();
            if (assignmentIds.length > 0) {
              const { data: assigns } = await supabaseService
                .from('teacher_assignments')
                .select('id, title, due_date, attachment_name, attachment_url')
                .in('id', assignmentIds);
              (assigns || []).forEach((a: { id: string; title: string; due_date: string | null }) => idToAssignment.set(a.id, { id: a.id, title: a.title, due_date: a.due_date }));
            }
            // Start with submitted/graded items
            const rows: EmailRow[] = (subs as SubmissionDb[]).map((s) => {
              const a = idToAssignment.get(s.assignment_id);
              return {
                assignment_id: s.assignment_id,
                title: a?.title || 'Assignment',
                due_date: a?.due_date || null,
                status: s.status || 'assigned',
                grade: s.grade == null ? '' : String(s.grade),
                feedback: s.feedback || '',
                submitted_at: s.submitted_at ?? null,
                graded_at: s.graded_at ?? null,
              };
            });

            // Also include directly assigned items without a submission yet, so parents see assignments + due date
            try {
              const { data: directAssigns, error: directErr } = await supabaseService
                .from('teacher_assignments')
                .select('id, title, due_date')
                .overlaps('student_ids', [student.id]);
              if (!directErr && directAssigns) {
                const existingIds = new Set(assignmentIds);
                for (const a of directAssigns as Array<AssignmentForEmail>) {
                  if (!existingIds.has(a.id)) {
                    rows.push({
                      assignment_id: a.id,
                      title: a.title || 'Assignment',
                      due_date: a.due_date || null,
                      status: 'assigned',
                      grade: '',
                      feedback: '',
                    });
                  }
                }
              }
            } catch (_e) {
              // ignore fallback failures
            }

            // Sort: prioritize submitted/graded by submitted_at desc, then upcoming by due_date asc
            rows.sort((a, b) => {
              const aSubmitted = a.submitted_at ? 1 : 0;
              const bSubmitted = b.submitted_at ? 1 : 0;
              if (aSubmitted !== bSubmitted) return bSubmitted - aSubmitted;
              // If both not submitted, sort by earliest due date first
              if (!a.submitted_at && !b.submitted_at) {
                const ad = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
                const bd = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;
                return ad - bd;
              }
              // Both submitted: newest first
              const at = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
              const bt = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
              return bt - at;
            });

            // Limit to recent 5 items for brevity
            const limited = rows.slice(0, 5);
            academicRows = limited.map((r: EmailRow) => {
              const dueText = r.due_date ? r.due_date : '—';
              const gradeText = r.grade || '—';
              const feedbackText = r.feedback || '—';
              return `
                <tr>
                  <td style="padding:6px 8px;border-bottom:1px solid #eee;word-break:break-word;">${r.title}</td>
                  <td style="padding:6px 8px;border-bottom:1px solid #eee;text-transform:capitalize;">${r.status}</td>
                  <td style="padding:6px 8px;border-bottom:1px solid #eee;">${dueText}</td>
                  <td style="padding:6px 8px;border-bottom:1px solid #eee;">${gradeText}</td>
                  <td style="padding:6px 8px;border-bottom:1px solid #eee;word-break:break-word;">${feedbackText}</td>
                </tr>
              `;
            }).join('');
          }
        } catch (_e) {
          academicRows = '';
        }

        const academicSection = `
          <h2 style="margin:24px 0 8px 0; font-size:18px;">Academic Updates</h2>
          <p style="margin:0 0 10px 0; color:#374151; font-size:14px;">Recent assignment activity for ${student.name}${academicRows ? '' : ' (no recent updates)'}.</p>
          <table border="0" cellpadding="0" cellspacing="0" style="width:100%; border-collapse:collapse;">
            <thead>
              <tr>
                <th style="text-align:left; padding:8px; background:#f3f4f6; font-size:13px;">Assignment</th>
                <th style="text-align:left; padding:8px; background:#f3f4f6; font-size:13px;">Status</th>
                <th style="text-align:left; padding:8px; background:#f3f4f6; font-size:13px;">Due</th>
                <th style="text-align:left; padding:8px; background:#f3f4f6; font-size:13px;">Grade</th>
                <th style="text-align:left; padding:8px; background:#f3f4f6; font-size:13px;">Feedback</th>
              </tr>
            </thead>
            <tbody>
              ${academicRows || '<tr><td colspan="5" style="padding:8px; color:#6b7280;">No recent academic activity.</td></tr>'}
            </tbody>
          </table>
        `;

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
                    <p>Assalamu Alaikum ${student.guardian_name || 'Guardian'},</p>
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
                    ${academicSection}
                    ${buildPortalCtaHtml()}
                    <div class="trigger-info">
                        Report generated ${triggerSource === 'scheduled' ? 'automatically' : 'manually'} at ${fmtDate(timestamp)}
                    </div>
                    <p>JazakAllah Khairan</p>
                    <p><strong>Dār Al-Ulūm Montréal</strong></p>
                    ${logoImgHtml}
                </div>
                <div class="footer">
                    <p>This is an automated email. Please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        `;

        if (!RESEND_FROM_EMAIL) {
            console.error("RESEND_FROM_EMAIL environment variable is not set.");
            // Mark all parent emails as failed
            for (const email of parentEmails) {
                emailsSkipped++;
                emailResults.push({
                    student_name: student.name,
                    guardian_email: email,
                    status: 'failed',
                    error: 'RESEND_FROM_EMAIL not configured'
                });
            }
            continue;
        }

        // Collect email payloads for batch sending - one per parent email
        for (const parentEmail of parentEmails) {
            emailPayloads.push({
                from: RESEND_FROM_EMAIL,
                to: parentEmail,
                subject: `Quran Progress Report for ${student.name} - ${reportDate}`,
                html: emailHtml,
                student_name: student.name,
                guardian_email: parentEmail,
            });
        }
    }

    // Send emails in batches using Resend batch API
    if (emailPayloads.length > 0) {
        const BATCH_SIZE = 150; // Split into chunks of 150 emails
        const batches: typeof emailPayloads[] = [];
        
        // Split email payloads into chunks
        for (let i = 0; i < emailPayloads.length; i += BATCH_SIZE) {
            batches.push(emailPayloads.slice(i, i + BATCH_SIZE));
        }

        console.log(`Sending ${emailPayloads.length} emails in ${batches.length} batch(es)`);

        // Process each batch
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            try {
                // Prepare batch payload (remove student metadata for API call)
                const batchPayload = batch.map(({ student_name, guardian_email, ...emailData }) => emailData);
                
                const { data, error } = await resend.batch.send(batchPayload);
                
                if (error) {
                    console.error(`Batch ${batchIndex + 1} failed:`, error);
                    // Mark all emails in this batch as failed
                    for (const payload of batch) {
                        emailsSkipped++;
                        emailResults.push({
                            student_name: payload.student_name,
                            guardian_email: payload.guardian_email,
                            status: 'failed',
                            error: error instanceof Error ? error.message : String(error)
                        });
                    }
                } else if (data) {
                    // Process batch results
                    // Resend batch API returns an array of results, one per email
                    // Each result has an id if successful, or error if failed
                    const results = Array.isArray(data) ? data : [];
                    
                    for (let i = 0; i < batch.length; i++) {
                        const payload = batch[i];
                        const result = results[i];
                        
                        if (result && result.id && !result.error) {
                            // Success
                            emailsSent++;
                            emailResults.push({
                                student_name: payload.student_name,
                                guardian_email: payload.guardian_email,
                                status: 'sent'
                            });
                            console.log(`Email sent to ${payload.guardian_email} for student ${payload.student_name}`);
                        } else {
                            // Failed
                            emailsSkipped++;
                            const errorMsg = result?.error ? (result.error instanceof Error ? result.error.message : String(result.error)) : 'Unknown error';
                            emailResults.push({
                                student_name: payload.student_name,
                                guardian_email: payload.guardian_email,
                                status: 'failed',
                                error: errorMsg
                            });
                            console.error(`Failed to send email to ${payload.guardian_email} for student ${payload.student_name}:`, errorMsg);
                        }
                    }
                } else {
                    // No data returned, mark all as failed
                    console.error(`Batch ${batchIndex + 1} returned no data`);
                    for (const payload of batch) {
                        emailsSkipped++;
                        emailResults.push({
                            student_name: payload.student_name,
                            guardian_email: payload.guardian_email,
                            status: 'failed',
                            error: 'No response from batch API'
                        });
                    }
                }
            } catch (batchError) {
                const errMsg = batchError instanceof Error ? batchError.message : String(batchError);
                console.error(`Exception sending batch ${batchIndex + 1}:`, errMsg);
                // Mark all emails in this batch as failed
                for (const payload of batch) {
                    emailsSkipped++;
                    emailResults.push({
                        student_name: payload.student_name,
                        guardian_email: payload.guardian_email,
                        status: 'failed',
                        error: errMsg
                    });
                }
            }
        }
    }

    // Log completion
    // Send admin summary last if enough time remains
    try {
      if (ADMIN_EMAILS.length > 0 && timeRemainingMs() > 15000) {
        await withTimeout(resend.emails.send({
          from: `Dār Al-Ulūm Montréal <${RESEND_FROM_EMAIL}>`,
          to: ADMIN_EMAILS,
          subject: `Daily Student Progress Report - ${reportDate}`,
          html: principalEmailHtml,
        }), 20000, 'Admin summary email send (post-guardians)');
        console.log(`Admin summary email sent to:`, ADMIN_EMAILS);
      } else if (ADMIN_EMAILS.length === 0) {
        console.log('No admin emails configured; skipping admin summary');
      } else {
        console.log('Skipping admin summary due to low remaining time');
      }
    } catch (emailError) {
      console.error(`Error sending admin summary email:`, emailError);
    }

    // Log completion
    try {
      await supabaseService
        .from("email_logs")
        .insert({
          trigger_source: triggerSource,
          triggered_at: timestamp,
          status: 'completed',
          emails_sent: emailsSent,
          emails_skipped: emailsSkipped,
          message: `Sent ${emailsSent} emails, skipped ${emailsSkipped}${endedDueToTimeout ? ' (timed out and ended early)' : ''}`
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
  } catch (error: unknown) {
    console.error("Function execution failed:", error);
    
    // Try to log the error
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );
      
      await supabase
        .from("email_logs")
        .insert({
          trigger_source: 'unknown',
          triggered_at: new Date().toISOString(),
          status: 'error',
          message: (error instanceof Error ? error.message : String(error))
        });
    } catch (logError) {
      console.log("Could not log error to email_logs table:", logError);
    }

    return new Response(JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}); 