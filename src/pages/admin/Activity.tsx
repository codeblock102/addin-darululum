import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { AdminPageShell, AdminStatCard } from "@/components/admin/AdminPageShell.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { Calendar } from "@/components/ui/calendar.tsx";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Legend, PieChart, Pie, Cell } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Loader2, Activity as ActivityIcon, Mail, MessageSquare, BookOpen, CheckSquare, Users, TrendingUp, AlertTriangle, Award, CalendarIcon, Filter, BarChart3, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, subDays, startOfDay, endOfDay, subMonths } from "date-fns";

type ActivityItem = {
  id: string;
  type: "progress" | "attendance" | "message" | "email" | "assignment";
  title: string;
  description: string;
  created_at: string;
  meta?: Record<string, unknown>;
};

type TimeRange = "today" | "7days" | "30days" | "3months" | "custom";

type StudentMetric = {
  id: string;
  name: string;
  section?: string | null;
  attendanceRate: number;
  totalProgress: number;
  pagesMemorized: number;
  juzCompleted: number;
  averageQuality: number;
  assignmentCompletionRate: number;
  isAtRisk: boolean;
  isTopPerformer: boolean;
};

type TeacherActivity = {
  id: string;
  name: string;
  section?: string | null;
  progressEntries: number;
  attendanceMarks: number;
  assignmentsCreated: number;
  assignmentsGraded: number;
  totalActions: number;
};

const MAX_ITEMS = 200;

export default function Activity() {
  const navigate = useNavigate();
  const [liveItems, setLiveItems] = useState<ActivityItem[]>([]);
  const itemsRef = useRef<ActivityItem[]>([]);
  itemsRef.current = liveItems;
  const [teacherMap, setTeacherMap] = useState<Record<string, { name: string; section?: string | null }>>({});
  const [studentToClasses, setStudentToClasses] = useState<Record<string, string[]>>({});
  const [studentToTeacherIds, setStudentToTeacherIds] = useState<Record<string, string[]>>({});
  
  // Filters
  const [selectedTeacher, setSelectedTeacher] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>(["progress", "attendance", "assignment", "message", "email"]);
  const [timeRange, setTimeRange] = useState<TimeRange>("7days");
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>("");
  
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Array<{ id: string; name: string }>>([]);

  // Get date range based on selection
  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case "today":
        return { from: startOfDay(now), to: endOfDay(now) };
      case "7days":
        return { from: startOfDay(subDays(now, 7)), to: endOfDay(now) };
      case "30days":
        return { from: startOfDay(subDays(now, 30)), to: endOfDay(now) };
      case "3months":
        return { from: startOfDay(subMonths(now, 3)), to: endOfDay(now) };
      case "custom":
        return {
          from: customDateRange.from ? startOfDay(customDateRange.from) : undefined,
          to: customDateRange.to ? endOfDay(customDateRange.to) : undefined,
        };
      default:
        return { from: startOfDay(subDays(now, 7)), to: endOfDay(now) };
    }
  };

  const dateRange = getDateRange();

  // Fetch all data for the selected time range
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["admin-dashboard", timeRange, customDateRange, selectedTeacher, selectedStudent, selectedClass, selectedSection],
    queryFn: async () => {
      const { from, to } = dateRange;
      if (!from || !to) return null;

      const fromISO = from.toISOString();
      const toISO = to.toISOString();

      // Fetch progress entries (include contributor info for teacher attribution)
      let progressQuery = supabase
        .from("progress")
        .select("*, students(name, section), contributor_id, contributor_name, contributor:profiles!contributor_id(name, role)")
        .gte("created_at", fromISO)
        .lte("created_at", toISO)
        .order("created_at", { ascending: false });

      if (selectedStudent !== "all") {
        progressQuery = progressQuery.eq("student_id", selectedStudent);
      }

      const { data: progress } = await progressQuery;

      // Fetch attendance (include class info and student's assigned teachers to derive teacher)
      let attendanceQuery = supabase
        .from("attendance")
        .select("*, students(name, section), classes(teacher_ids, name)")
        .gte("created_at", fromISO)
        .lte("created_at", toISO)
        .order("created_at", { ascending: false });

      if (selectedStudent !== "all") {
        attendanceQuery = attendanceQuery.eq("student_id", selectedStudent);
      }

      const { data: attendance } = await attendanceQuery;

      // Fetch assignments
      let assignmentsQuery = supabase
        .from("teacher_assignments")
        .select("id, teacher_id, title, due_date, status, class_ids, student_ids, created_at")
        .gte("created_at", fromISO)
        .lte("created_at", toISO)
        .order("created_at", { ascending: false });

      if (selectedTeacher !== "all") {
        assignmentsQuery = assignmentsQuery.eq("teacher_id", selectedTeacher);
      }

      const { data: assignments } = await assignmentsQuery;

      // Fetch assignment submissions
      const assignmentIds = (assignments || []).map((a: any) => a.id);
      const { data: submissions } = assignmentIds.length > 0
        ? await supabase
            .from("teacher_assignment_submissions")
            .select("assignment_id, student_id, status, submitted_at, graded_at")
            .in("assignment_id", assignmentIds)
        : { data: [] };

      // Fetch communications (include sender profile for teacher attribution)
      let commsQuery = supabase
        .from("communications")
        .select("id, sender_id, recipient_id, created_at, subject, sender:profiles!sender_id(name, role, section)")
        .gte("created_at", fromISO)
        .lte("created_at", toISO)
        .order("created_at", { ascending: false });

      const { data: comms } = await commsQuery;

      // Fetch email logs
      const { data: emails } = await supabase
        .from("email_logs")
        .select("id, trigger_source, triggered_at, status, emails_sent, emails_skipped")
        .gte("triggered_at", fromISO)
        .lte("triggered_at", toISO)
        .order("triggered_at", { ascending: false });

      // Fetch all students for metrics
      const { data: allStudents } = await supabase
        .from("students")
        .select("id, name, section, status")
        .eq("status", "active");

      // Fetch all teachers (only those with role='teacher')
      const { data: allTeachers } = await supabase
        .from("profiles")
        .select("id, name, section")
        .eq("role", "teacher");

      return {
        progress: progress || [],
        attendance: attendance || [],
        assignments: assignments || [],
        submissions: submissions || [],
        communications: comms || [],
        emails: emails || [],
        students: allStudents || [],
        teachers: allTeachers || [],
      };
    },
    enabled: !!dateRange.from && !!dateRange.to,
  });

  // Build activity items from dashboard data
  const initialItems = useMemo(() => {
    if (!dashboardData) return [];
    const gather: ActivityItem[] = [];

    // Progress entries
    (dashboardData.progress || []).forEach((p: any) => {
      const s = p.students || {};
      // Get teacher name - prefer joined contributor profile, then contributor_name, then teacherMap lookup
      const teacherId = p.contributor_id;
      const contributorProfile = p.contributor;
      let teacherName = "Unknown";
      
      if (contributorProfile?.name) {
        // Use name from joined profile (most reliable)
        teacherName = contributorProfile.name;
      } else if (p.contributor_name) {
        // Use cached contributor_name (may have "Teacher " prefix)
        teacherName = p.contributor_name.replace(/^Teacher\s+/i, ""); // Remove "Teacher " prefix if present
      } else if (teacherId && teacherMap[teacherId]?.name) {
        // Fallback to teacherMap lookup
        teacherName = teacherMap[teacherId].name;
      }
      
      gather.push({
        id: `progress:${p.id}`,
        type: "progress",
        title: "Progress entry",
        description: `By ${teacherName} — ${s.name || "Student"}${s.section ? ` (${s.section})` : ""} — ${p.pages_memorized ?? 0} pages (${p.memorization_quality || "quality"})`,
        created_at: p.created_at || p.date,
        meta: p,
      });
    });

    // Attendance
    (dashboardData.attendance || []).forEach((a: any) => {
      const s = a.students || {};
      // Get teacher from class relationship, student's assigned teachers, or direct teacher_id
      const classData = a.classes || {};
      const teacherIds = classData?.teacher_ids || [];
      
      // Try multiple sources for teacher ID
      let teacherId: string | null = null;
      if (a.teacher_id) {
        teacherId = a.teacher_id;
      } else if (teacherIds.length > 0) {
        // Use first teacher from class
        teacherId = teacherIds[0];
      } else if (a.student_id && studentToTeacherIds[a.student_id]?.length > 0) {
        // Fallback to student's assigned teachers
        teacherId = studentToTeacherIds[a.student_id][0];
      }
      
      // Get teacher name
      let teacherName = "Unknown";
      if (teacherId) {
        const teacherData = teacherMap[teacherId];
        teacherName = teacherData?.name || "Unknown";
      }
      
      gather.push({
        id: `attendance:${a.id}`,
        type: "attendance",
        title: "Attendance",
        description: `By ${teacherName} — ${s.name || "Student"}${s.section ? ` (${s.section})` : ""} — ${a.status} (${a.date})`,
        created_at: a.created_at || a.date,
        meta: a,
      });
    });

    // Assignments
    const subByAssignment: Record<string, { submitted: Set<string>; graded: Set<string>; assigned: Set<string> }> = {};
    (dashboardData.assignments || []).forEach((a: any) => {
      subByAssignment[a.id] = {
        submitted: new Set<string>(),
        graded: new Set<string>(),
        assigned: new Set<string>((a.student_ids || []).filter(Boolean)),
      };
    });
    (dashboardData.submissions || []).forEach((s: any) => {
      const bucket = subByAssignment[s.assignment_id];
      if (!bucket) return;
      if (s.status === "submitted") bucket.submitted.add(s.student_id);
      if (s.status === "graded") {
        bucket.submitted.add(s.student_id);
        bucket.graded.add(s.student_id);
      }
    });

    (dashboardData.assignments || []).forEach((a: any) => {
      const bucket = subByAssignment[a.id];
      const total = bucket.assigned.size;
      const submittedCount = bucket.submitted.size;
      const gradedCount = bucket.graded.size;
      const teacherName = teacherMap[a.teacher_id]?.name || a.teacher_id;
      gather.push({
        id: `assignment:${a.id}`,
        type: "assignment",
        title: `Assignment: ${a.title}${a.due_date ? ` (due ${a.due_date})` : ""}`,
        description: `By ${teacherName} — Assigned to ${total} • Submitted ${submittedCount} • Graded ${gradedCount}`,
        created_at: a.created_at,
        meta: a,
      });
    });

    // Communications
    (dashboardData.communications || []).forEach((c: any) => {
      // Get sender info - prefer joined sender data, fallback to teacherMap
      const senderId = c.sender_id;
      const senderData = c.sender || (senderId ? teacherMap[senderId] : null);
      const senderName = senderData?.name || (senderId ? "Unknown" : "System");
      const senderRole = senderData?.role;
      const senderLabel = senderRole === "teacher" ? `Teacher ${senderName}` : senderName;
      gather.push({
        id: `message:${c.id}`,
        type: "message",
        title: "Message",
        description: `By ${senderLabel}${senderData?.section ? ` (${senderData.section})` : ""} — ${c.subject || "New message"}`,
        created_at: c.created_at,
        meta: c,
      });
    });

    // Emails
    (dashboardData.emails || []).forEach((e: any) => {
      gather.push({
        id: `email:${e.id}`,
        type: "email",
        title: "Email job",
        description: `${e.status} — sent ${e.emails_sent ?? 0}, skipped ${e.emails_skipped ?? 0} (${e.trigger_source})`,
        created_at: e.triggered_at,
        meta: e,
      });
    });

    return gather
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, MAX_ITEMS);
  }, [dashboardData, teacherMap]);

  // Populate teacher map - only from teachers data
  useEffect(() => {
    if (!dashboardData?.teachers) return;
    const map: Record<string, { name: string; section?: string | null }> = {};
    // Only add teachers (they're already filtered by role='teacher' in the query)
    (dashboardData.teachers || []).forEach((t: any) => {
      if (t.id && t.name) {
        map[t.id] = { name: t.name, section: t.section || null };
      }
    });
    setTeacherMap(map);
  }, [dashboardData]);

  // Load available sections and classes
  useEffect(() => {
    const loadSectionsAndClasses = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) return;
      const { data: prof } = await supabase.from("profiles").select("madrassah_id").eq("id", uid).maybeSingle();
      const madrassahId = (prof as any)?.madrassah_id;
      if (madrassahId) {
        const { data: mad } = await supabase.from("madrassahs").select("section").eq("id", madrassahId).maybeSingle();
        const secs = Array.isArray((mad as any)?.section) ? ((mad as any).section as string[]) : [];
        setAvailableSections(Array.from(new Set(secs.filter(Boolean))));
      }
      const { data: classes } = await supabase.from("classes").select("id, name, current_students, teacher_ids").order("name", { ascending: true });
      setAvailableClasses(Array.from(new Set(((classes || []).map((c: any) => c.name).filter(Boolean)))));
      
      // Build student-to-classes mapping
      const s2c: Record<string, string[]> = {};
      const s2t: Record<string, string[]> = {};
      (classes || []).forEach((c: any) => {
        const ids: string[] = Array.from(new Set((c.current_students || []).filter(Boolean)));
        const tIds: string[] = Array.isArray(c.teacher_ids) ? c.teacher_ids.filter(Boolean) : [];
        for (const sid of ids) {
          if (!s2c[sid]) s2c[sid] = [];
          s2c[sid].push(c.name);
          if (!s2t[sid]) s2t[sid] = [];
          tIds.forEach((tid) => {
            if (!s2t[sid].includes(tid)) s2t[sid].push(tid);
          });
        }
      });
      setStudentToClasses(s2c);
      setStudentToTeacherIds(s2t);
    };
    loadSectionsAndClasses();
  }, []);

  // Load available students
  useEffect(() => {
    if (!dashboardData?.students) return;
    const students = (dashboardData.students || []).map((s: any) => ({ id: s.id, name: s.name }));
    setAvailableStudents(students);
  }, [dashboardData]);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel("admin-activity-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "progress" }, async (payload) => {
        const r: any = payload.new || payload.old || {};
        let student: any = null;
        let teacher: any = { name: "Unknown" };
        if (r.student_id) {
          const { data } = await supabase.from("students").select("name, section").eq("id", r.student_id).maybeSingle();
          student = data;
        }
        // Get teacher info from contributor - fetch profile if needed
        if (r.contributor_id) {
          // First try teacherMap
          const teacherData = teacherMap[r.contributor_id];
          if (teacherData) {
            teacher = teacherData;
          } else if (r.contributor_name) {
            // Use contributor_name, removing "Teacher " prefix if present
            teacher = { name: r.contributor_name.replace(/^Teacher\s+/i, "") };
          } else {
            // Fetch from profiles table
            const { data: profile } = await supabase
              .from("profiles")
              .select("name")
              .eq("id", r.contributor_id)
              .maybeSingle();
            teacher = { name: profile?.name || "Unknown" };
          }
        } else if (r.contributor_name) {
          teacher = { name: r.contributor_name.replace(/^Teacher\s+/i, "") };
        }
        const item: ActivityItem = {
          id: `progress:${r.id}:${payload.eventType}:${payload.commit_timestamp}`,
          type: "progress",
          title: payload.eventType === "DELETE" ? "Progress deleted" : "Progress entry",
          description: `By ${teacher.name} — ${student?.name || "Student"}${student?.section ? ` (${student.section})` : ""} — ${r.pages_memorized ?? 0} pages`,
          created_at: r.created_at || new Date().toISOString(),
          meta: r,
        };
        setLiveItems([item, ...itemsRef.current].slice(0, MAX_ITEMS));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, async (payload) => {
        const r: any = payload.new || payload.old || {};
        let student: any = null;
        let teacher: any = { name: "Unknown" };
        if (r.student_id) {
          const { data } = await supabase.from("students").select("name, section").eq("id", r.student_id).maybeSingle();
          student = data;
        }
        // Get teacher from multiple sources
        let teacherId: string | null = null;
        
        // Try direct teacher_id first
        if (r.teacher_id) {
          teacherId = r.teacher_id;
        } else if (r.class_id) {
          // Get from class
          const { data: classData } = await supabase
            .from("classes")
            .select("teacher_ids")
            .eq("id", r.class_id)
            .maybeSingle();
          if (classData?.teacher_ids && Array.isArray(classData.teacher_ids) && classData.teacher_ids.length > 0) {
            teacherId = classData.teacher_ids[0];
          }
        }
        
        // If still no teacher, try student's assigned teachers
        if (!teacherId && r.student_id && studentToTeacherIds[r.student_id]?.length > 0) {
          teacherId = studentToTeacherIds[r.student_id][0];
        }
        
        // Get teacher name
        if (teacherId) {
          const teacherData = teacherMap[teacherId];
          teacher = teacherData || { name: "Unknown" };
        }
        
        const item: ActivityItem = {
          id: `attendance:${r.id}:${payload.eventType}:${payload.commit_timestamp}`,
          type: "attendance",
          title: payload.eventType === "DELETE" ? "Attendance deleted" : "Attendance",
          description: `By ${teacher.name} — ${student?.name || "Student"}${student?.section ? ` (${student.section})` : ""} — ${r.status} (${r.date})`,
          created_at: r.created_at || new Date().toISOString(),
          meta: r,
        };
        setLiveItems([item, ...itemsRef.current].slice(0, MAX_ITEMS));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "communications" }, async (payload) => {
        const r: any = payload.new || payload.old || {};
        let sender: any = null;
        if (r.sender_id) {
          const { data } = await supabase.from("profiles").select("name, section, role").eq("id", r.sender_id).maybeSingle();
          sender = data;
        }
        const senderLabel = sender?.role === "teacher" ? `Teacher ${sender.name}` : (sender?.name || "System");
        const item: ActivityItem = {
          id: `message:${r.id}:${payload.eventType}:${payload.commit_timestamp}`,
          type: "message",
          title: payload.eventType === "DELETE" ? "Message deleted" : "Message",
          description: `By ${senderLabel}${sender?.section ? ` (${sender.section})` : ""} — ${r.subject || "Message"}`,
          created_at: r.created_at || new Date().toISOString(),
          meta: r,
        };
        setLiveItems([item, ...itemsRef.current].slice(0, MAX_ITEMS));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "email_logs" }, (payload) => {
        const r: any = payload.new || payload.old || {};
        const item: ActivityItem = {
          id: `email:${r.id}:${payload.eventType}:${payload.commit_timestamp}`,
          type: "email",
          title: "Email job",
          description: `${r.status} — sent ${r.emails_sent ?? 0}, skipped ${r.emails_skipped ?? 0}`,
          created_at: r.triggered_at || new Date().toISOString(),
          meta: r,
        };
        setLiveItems([item, ...itemsRef.current].slice(0, MAX_ITEMS));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Calculate student metrics - defined before use
  const calculateStudentMetrics = (data: any): StudentMetric[] => {
    if (!data) return [];
    const students = data.students || [];
    const progress = data.progress || [];
    const attendance = data.attendance || [];
    const assignments = data.assignments || [];
    const submissions = data.submissions || [];

    return students.map((student: any) => {
      const studentProgress = progress.filter((p: any) => p.student_id === student.id);
      const studentAttendance = attendance.filter((a: any) => a.student_id === student.id);
      const studentAssignments = assignments.filter((a: any) => 
        (a.student_ids || []).includes(student.id)
      );
      const studentSubmissions = submissions.filter((s: any) => s.student_id === student.id);

      // Attendance rate
      const presentCount = studentAttendance.filter((a: any) => a.status === "present").length;
      const attendanceRate = studentAttendance.length > 0
        ? Math.round((presentCount / studentAttendance.length) * 100)
        : 0;

      // Progress metrics
      const pagesMemorized = studentProgress.reduce((sum: number, p: any) => sum + (p.pages_memorized || 0), 0);
      const juzCompleted = student.completed_juz?.length || 0;
      const totalProgress = studentProgress.length;

      // Quality average
      const qualityScores: Record<string, number> = {
        excellent: 5,
        good: 4,
        average: 3,
        needsWork: 2,
        horrible: 1,
      };
      const qualityEntries = studentProgress.filter((p: any) => p.memorization_quality);
      const qualitySum = qualityEntries.reduce((sum: number, p: any) => {
        return sum + (qualityScores[p.memorization_quality] || 0);
      }, 0);
      const averageQuality = qualityEntries.length > 0 ? qualitySum / qualityEntries.length : 0;

      // Assignment completion
      const assignedCount = studentAssignments.length;
      const submittedCount = studentSubmissions.filter((s: any) => s.status === "submitted" || s.status === "graded").length;
      const assignmentCompletionRate = assignedCount > 0
        ? Math.round((submittedCount / assignedCount) * 100)
        : 0;

      // At-risk criteria: attendance < 70% OR average quality < 2.5 OR no progress in last 7 days
      const recentProgress = studentProgress.filter((p: any) => {
        const daysAgo = (Date.now() - new Date(p.created_at || p.date).getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo <= 7;
      });
      const isAtRisk = attendanceRate < 70 || averageQuality < 2.5 || recentProgress.length === 0;

      // Top performer criteria: attendance >= 75% AND average quality >= 3.5 AND recent progress
      const isTopPerformer = attendanceRate >= 75 && averageQuality >= 3.5 && recentProgress.length > 0;

      return {
        id: student.id,
        name: student.name,
        section: student.section,
        attendanceRate,
        totalProgress,
        pagesMemorized,
        juzCompleted,
        averageQuality,
        assignmentCompletionRate,
        isAtRisk,
        isTopPerformer,
      };
    });
  };

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!dashboardData) return null;

    const progress = dashboardData.progress || [];
    const attendance = dashboardData.attendance || [];
    const assignments = dashboardData.assignments || [];
    const submissions = dashboardData.submissions || [];
    const students = dashboardData.students || [];

    // Teacher actions — count all progress entries, attendance records, and assignments
    // (contributor_id / teacher_id may be null on older records, so we count totals)
    const teacherActions = new Map<string, number>();
    progress.forEach((p: any) => {
      const teacherId = p.contributor_id || p.teacher_id || "__unattributed__";
      teacherActions.set(teacherId, (teacherActions.get(teacherId) || 0) + 1);
    });
    attendance.forEach((a: any) => {
      const teacherId = (a.classes?.teacher_ids?.[0]) || a.teacher_id || "__unattributed__";
      teacherActions.set(teacherId, (teacherActions.get(teacherId) || 0) + 1);
    });
    assignments.forEach((a: any) => {
      const teacherId = a.teacher_id || "__unattributed__";
      teacherActions.set(teacherId, (teacherActions.get(teacherId) || 0) + 1);
    });
    const totalTeacherActions = Array.from(teacherActions.values()).reduce((a, b) => a + b, 0);

    // Attendance rate
    const presentCount = attendance.filter((a: any) => a.status === "present").length;
    const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;

    // Assignment completion
    const totalAssigned = assignments.reduce((sum: number, a: any) => sum + (a.student_ids?.length || 0), 0);
    const submittedCount = submissions.filter((s: any) => s.status === "submitted" || s.status === "graded").length;
    const assignmentCompletionRate = totalAssigned > 0 ? Math.round((submittedCount / totalAssigned) * 100) : 0;

    // Quality average
    const qualityScores: Record<string, number> = {
      excellent: 5,
      good: 4,
      average: 3,
      needsWork: 2,
      horrible: 1,
    };
    const qualityEntries = progress.filter((p: any) => p.memorization_quality);
    const qualitySum = qualityEntries.reduce((sum: number, p: any) => {
      return sum + (qualityScores[p.memorization_quality] || 0);
    }, 0);
    const averageQuality = qualityEntries.length > 0 ? qualitySum / qualityEntries.length : 0;

    // At-risk students (low attendance or poor quality)
    const studentMetrics = calculateStudentMetrics(dashboardData);
    const atRiskCount = studentMetrics.filter((s) => s.isAtRisk).length;
    const topPerformersCount = studentMetrics.filter((s) => s.isTopPerformer).length;

    return {
      totalTeacherActions,
      totalProgressEntries: progress.length,
      totalAttendanceMarks: attendance.length,
      assignmentCompletionRate,
      averageAttendanceRate: attendanceRate,
      atRiskStudentsCount: atRiskCount,
      topPerformersCount,
      averageQuality: Math.round(averageQuality * 10) / 10,
    };
  }, [dashboardData]);

  const studentMetrics = useMemo(() => {
    return calculateStudentMetrics(dashboardData);
  }, [dashboardData]);

  // Calculate teacher activity
  const teacherActivity = useMemo(() => {
    if (!dashboardData) return [];
    const progress = dashboardData.progress || [];
    const attendance = dashboardData.attendance || [];
    const assignments = dashboardData.assignments || [];
    const submissions = dashboardData.submissions || [];

    const activityMap = new Map<string, TeacherActivity>();

    // Process progress entries
    progress.forEach((p: any) => {
      const teacherId = p.contributor_id || p.teacher_id;
      if (!teacherId) return;
      if (!activityMap.has(teacherId)) {
        activityMap.set(teacherId, {
          id: teacherId,
          name: teacherMap[teacherId]?.name || teacherId,
          section: teacherMap[teacherId]?.section,
          progressEntries: 0,
          attendanceMarks: 0,
          assignmentsCreated: 0,
          assignmentsGraded: 0,
          totalActions: 0,
        });
      }
      const activity = activityMap.get(teacherId)!;
      activity.progressEntries++;
      activity.totalActions++;
    });

    // Process attendance
    attendance.forEach((a: any) => {
      const teacherId = a.teacher_id;
      if (!teacherId) return;
      if (!activityMap.has(teacherId)) {
        activityMap.set(teacherId, {
          id: teacherId,
          name: teacherMap[teacherId]?.name || teacherId,
          section: teacherMap[teacherId]?.section,
          progressEntries: 0,
          attendanceMarks: 0,
          assignmentsCreated: 0,
          assignmentsGraded: 0,
          totalActions: 0,
        });
      }
      const activity = activityMap.get(teacherId)!;
      activity.attendanceMarks++;
      activity.totalActions++;
    });

    // Process assignments
    assignments.forEach((a: any) => {
      const teacherId = a.teacher_id;
      if (!teacherId) return;
      if (!activityMap.has(teacherId)) {
        activityMap.set(teacherId, {
          id: teacherId,
          name: teacherMap[teacherId]?.name || teacherId,
          section: teacherMap[teacherId]?.section,
          progressEntries: 0,
          attendanceMarks: 0,
          assignmentsCreated: 0,
          assignmentsGraded: 0,
          totalActions: 0,
        });
      }
      const activity = activityMap.get(teacherId)!;
      activity.assignmentsCreated++;
      activity.totalActions++;
    });

    // Process graded assignments
    submissions.forEach((s: any) => {
      if (s.status !== "graded") return;
      const assignment = assignments.find((a: any) => a.id === s.assignment_id);
      if (!assignment) return;
      const teacherId = assignment.teacher_id;
      if (!teacherId) return;
      if (!activityMap.has(teacherId)) {
        activityMap.set(teacherId, {
          id: teacherId,
          name: teacherMap[teacherId]?.name || teacherId,
          section: teacherMap[teacherId]?.section,
          progressEntries: 0,
          attendanceMarks: 0,
          assignmentsCreated: 0,
          assignmentsGraded: 0,
          totalActions: 0,
        });
      }
      const activity = activityMap.get(teacherId)!;
      activity.assignmentsGraded++;
    });

    return Array.from(activityMap.values()).sort((a, b) => b.totalActions - a.totalActions);
  }, [dashboardData, teacherMap]);

  // Filter items
  const items = useMemo(() => {
    const seed = initialItems || [];
    const merged = [...liveItems, ...seed]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, MAX_ITEMS);

    return merged.filter((it) => {
      // Activity type filter
      if (!selectedActivityTypes.includes(it.type)) return false;

      // Teacher filter
      if (selectedTeacher !== "all") {
        if (it.type === "email") return false;
        const m: any = it.meta || {};
        const teacherId = m.contributor_id || m.teacher_id || m.sender_id;
        if (teacherId !== selectedTeacher) return false;
      }

      // Student filter
      if (selectedStudent !== "all") {
        const m: any = it.meta || {};
        if (m.student_id !== selectedStudent) return false;
      }

      // Section filter
      if (selectedSection !== "all") {
        const m: any = it.meta || {};
        const section = m.students?.section || m.section;
        if (section?.toLowerCase() !== selectedSection.toLowerCase()) return false;
      }

      // Class filter
      if (selectedClass !== "all") {
        const m: any = it.meta || {};
        const sid = m.student_id;
        if (!sid) return false;
        const classes = studentToClasses[sid] || [];
        if (!classes.includes(selectedClass)) return false;
      }

      return true;
    });
  }, [initialItems, liveItems, selectedTeacher, selectedStudent, selectedClass, selectedSection, selectedActivityTypes, studentToClasses]);

  // Build chart data - use raw dashboard data, not filtered items
  const chartData = useMemo(() => {
    if (!dashboardData) return null;

    const progress = dashboardData.progress || [];
    const attendance = dashboardData.attendance || [];

    // Daily series - use raw data
    const days: Record<string, { day: string; progress: number; attendance: number }> = {};
    const { from, to } = dateRange;
    if (from && to) {
      const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
      for (let i = 0; i <= daysDiff; i++) {
        const d = new Date(from);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        days[key] = { day: format(d, "MMM dd"), progress: 0, attendance: 0 };
      }
    }

    // Count progress entries by date
    progress.forEach((p: any) => {
      const dateKey = (p.created_at || p.date || "").slice(0, 10);
      if (days[dateKey]) {
        days[dateKey].progress += 1;
      }
    });

    // Count attendance entries by date
    attendance.forEach((a: any) => {
      const dateKey = (a.created_at || a.date || "").slice(0, 10);
      if (days[dateKey]) {
        days[dateKey].attendance += 1;
      }
    });

    // Quality distribution
    const qualityCounts: Record<string, number> = {
      excellent: 0,
      good: 0,
      average: 0,
      needsWork: 0,
      horrible: 0,
    };
    progress.forEach((p: any) => {
      const quality = p.memorization_quality;
      if (quality && qualityCounts[quality] !== undefined) {
        qualityCounts[quality]++;
      }
    });

    // Attendance mix
    const attendanceCounts: Record<string, number> = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };
    attendance.forEach((a: any) => {
      const status = (a.status || "").toLowerCase();
      if (attendanceCounts[status] !== undefined) {
        attendanceCounts[status]++;
      }
    });

    // Sort daily series by date key (which is already in YYYY-MM-DD format)
    const sortedDailySeries = Object.entries(days)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([, value]) => value);

    return {
      dailySeries: sortedDailySeries.length > 0 ? sortedDailySeries : [{ day: "No data", progress: 0, attendance: 0 }],
      qualityDistribution: qualityCounts,
      attendanceMix: Object.entries(attendanceCounts)
        .map(([name, value]) => ({ name, value }))
        .filter((d) => d.value > 0),
      teacherActivity: teacherActivity.length > 0 ? teacherActivity.slice(0, 10) : [{ id: "none", name: "No activity", totalActions: 0 }],
    };
  }, [dashboardData, dateRange, teacherActivity]);

  const iconFor = (type: ActivityItem["type"]) => {
    switch (type) {
      case "progress": return <BookOpen className="h-4 w-4 text-blue-600" />;
      case "attendance": return <CheckSquare className="h-4 w-4 text-emerald-600" />;
      case "message": return <MessageSquare className="h-4 w-4 text-purple-600" />;
      case "email": return <Mail className="h-4 w-4 text-orange-600" />;
      case "assignment": return <BookOpen className="h-4 w-4 text-purple-600" />;
      default: return <ActivityIcon className="h-4 w-4" />;
    }
  };

  const grouped = useMemo(() => {
    const groups: Record<string, ActivityItem[]> = {
      progress: [],
      attendance: [],
      message: [],
      email: [],
      assignment: [],
    };
    for (const it of items) {
      (groups[it.type] ||= []).push(it);
    }
    return groups;
  }, [items]);

  const Section = ({ title, type }: { title: string; type: ActivityItem["type"] }) => (
    <Card className="border border-gray-200 bg-white">
      <CardHeader className="border-b">
        <CardTitle className="text-base flex items-center gap-2">
          {iconFor(type)}
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading && (!grouped[type] || grouped[type].length === 0) ? (
          <div className="flex items-center justify-center py-8 text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading...
          </div>
        ) : !grouped[type] || grouped[type].length === 0 ? (
          <div className="py-6 text-center text-gray-600 text-sm">No {title.toLowerCase()} yet.</div>
        ) : (
          <ul className="divide-y">
            {grouped[type].slice(0, 20).map((it) => (
              <li key={it.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{iconFor(it.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-gray-900 truncate">{it.title}</div>
                      <div className="text-xs text-gray-500 whitespace-nowrap">
                        {format(new Date(it.created_at), "MMM dd, yyyy HH:mm")}
                      </div>
                    </div>
                    <div className="text-sm text-gray-700 mt-0.5 break-words">{it.description}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );

  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery) return availableStudents;
    return availableStudents.filter((s) =>
      s.name.toLowerCase().includes(studentSearchQuery.toLowerCase())
    );
  }, [availableStudents, studentSearchQuery]);

  const atRiskStudents = useMemo(() => {
    return studentMetrics.filter((s) => s.isAtRisk).slice(0, 10);
  }, [studentMetrics]);

  const topPerformers = useMemo(() => {
    return studentMetrics.filter((s) => s.isTopPerformer).slice(0, 10);
  }, [studentMetrics]);

  // Type config for feed items
  const typeConfig: Record<ActivityItem["type"], { dot: string; iconBg: string; label: string }> = {
    progress:   { dot: "#16a34a", iconBg: "bg-green-50",  label: "Progress"   },
    attendance: { dot: "#2563eb", iconBg: "bg-blue-50",   label: "Attendance" },
    assignment: { dot: "#7c3aed", iconBg: "bg-violet-50", label: "Assignment" },
    message:    { dot: "#9333ea", iconBg: "bg-purple-50", label: "Message"    },
    email:      { dot: "#ea580c", iconBg: "bg-orange-50", label: "Email"      },
  };

  const selectCls = "h-9 rounded-xl border-gray-200 bg-gray-50 text-sm focus:bg-white";

  return (
    <AdminPageShell
      title="Activity Dashboard"
      subtitle="Track teacher actions and student progress in real-time"
      actions={
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-200 rounded-xl px-3 py-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            Live
          </span>
          <Button
            variant="outline"
            onClick={() => navigate("/analytics")}
            className="flex items-center gap-2 rounded-xl border-gray-200 text-sm h-9"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      {/* ── Compact filter bar ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-0.5 self-end pb-2">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </div>

          {/* Time range */}
          <div className="space-y-1">
            <p className="text-xs text-gray-400 font-medium">Period</p>
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <SelectTrigger className={selectCls} style={{ minWidth: 130 }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="3months">Last 3 months</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {timeRange === "custom" && (
            <div className="space-y-1">
              <p className="text-xs text-gray-400 font-medium">Date range</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 rounded-xl border-gray-200 text-sm bg-gray-50">
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {customDateRange.from && customDateRange.to
                      ? `${format(customDateRange.from, "MMM dd")} – ${format(customDateRange.to, "MMM dd")}`
                      : "Pick range"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: customDateRange.from, to: customDateRange.to }}
                    onSelect={(range) => { if (range?.from && range?.to) setCustomDateRange({ from: range.from, to: range.to }); }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Teacher */}
          <div className="space-y-1">
            <p className="text-xs text-gray-400 font-medium">Teacher</p>
            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
              <SelectTrigger className={selectCls} style={{ minWidth: 140 }}>
                <SelectValue placeholder="All teachers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All teachers</SelectItem>
                {Object.entries(teacherMap).sort((a, b) => (a[1].name || "").localeCompare(b[1].name || "")).map(([id, t]) => (
                  <SelectItem key={id} value={id}>{t.name}{t.section ? ` (${t.section})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Student */}
          <div className="space-y-1">
            <p className="text-xs text-gray-400 font-medium">Student</p>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className={selectCls} style={{ minWidth: 140 }}>
                <SelectValue placeholder="All students" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All students</SelectItem>
                {availableStudents.filter(s => !studentSearchQuery || s.name.toLowerCase().includes(studentSearchQuery.toLowerCase())).map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Section */}
          {availableSections.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-gray-400 font-medium">Section</p>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className={selectCls} style={{ minWidth: 120 }}>
                  <SelectValue placeholder="All sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sections</SelectItem>
                  {availableSections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Type filter chips */}
          <div className="space-y-1 ml-auto">
            <p className="text-xs text-gray-400 font-medium">Activity type</p>
            <div className="flex items-center gap-1.5">
              {(["progress", "attendance", "assignment", "message", "email"] as ActivityItem["type"][]).map((type) => {
                const cfg = typeConfig[type];
                const active = selectedActivityTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedActivityTypes(active
                      ? selectedActivityTypes.filter(t => t !== type)
                      : [...selectedActivityTypes, type]
                    )}
                    className={`h-9 px-3 rounded-xl text-xs font-medium transition-colors border ${
                      active ? "text-white border-transparent" : "text-gray-500 bg-gray-50 border-gray-200 hover:bg-gray-100"
                    }`}
                    style={active ? { background: cfg.dot, borderColor: cfg.dot } : {}}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI cards ──────────────────────────────────────────────── */}
      {summaryMetrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <AdminStatCard
            label="Teacher Actions"
            value={summaryMetrics.totalTeacherActions}
            icon={<Users className="h-4 w-4 text-blue-600" />}
            iconBg="bg-blue-50"
            meta={`${summaryMetrics.totalProgressEntries} progress + ${summaryMetrics.totalAttendanceMarks} attendance`}
          />
          <AdminStatCard
            label="Avg Attendance"
            value={`${summaryMetrics.averageAttendanceRate}%`}
            icon={<CheckSquare className="h-4 w-4 text-emerald-600" />}
            iconBg="bg-emerald-50"
            meta={`${summaryMetrics.totalAttendanceMarks} records`}
          />
          <AdminStatCard
            label="Avg Quality"
            value={summaryMetrics.averageQuality.toFixed(1)}
            icon={<TrendingUp className="h-4 w-4 text-violet-600" />}
            iconBg="bg-violet-50"
            meta="out of 5.0"
          />
          <AdminStatCard
            label="At-Risk Students"
            value={summaryMetrics.atRiskStudentsCount}
            icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
            iconBg="bg-red-50"
            meta={`${summaryMetrics.topPerformersCount} top performers`}
            metaColor="text-green-600"
          />
        </div>
      )}

      {/* ── Main content row ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Unified activity feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Activity Feed</h2>
              <p className="text-xs text-gray-400 mt-0.5">{items.length} events in selected period</p>
            </div>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: 560 }}>
            {isLoading && items.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading activity…</span>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <ActivityIcon className="h-8 w-8 mb-3 opacity-30" />
                <p className="text-sm">No activity in this period</p>
              </div>
            ) : (
              <ul>
                {items.slice(0, 60).map((it, i) => {
                  const cfg = typeConfig[it.type];
                  return (
                    <li key={it.id} className={`flex items-start gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors ${i !== 0 ? "border-t border-gray-50" : ""}`}>
                      {/* Dot + icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${cfg.iconBg}`}>
                          {iconFor(it.type)}
                        </div>
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: cfg.dot }}>
                            {cfg.label}
                          </span>
                          <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                            {format(new Date(it.created_at), "MMM d, HH:mm")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 font-medium mt-0.5 truncate">{it.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 break-words leading-relaxed">{it.description}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Sidebar: at-risk + top performers */}
        <div className="space-y-5">
          {/* At-risk */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <div className="p-1.5 bg-red-50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">At-Risk Students</h3>
                <p className="text-xs text-gray-400">&lt;70% attendance or low quality</p>
              </div>
            </div>
            {atRiskStudents.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">None found 🎉</div>
            ) : (
              <ul>
                {atRiskStudents.map((s, i) => (
                  <li key={s.id} className={`flex items-center justify-between px-5 py-3 hover:bg-gray-50 ${i !== 0 ? "border-t border-gray-50" : ""}`}>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{s.attendanceRate}% attend · {s.averageQuality.toFixed(1)} quality</p>
                    </div>
                    <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-lg">Risk</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Top performers */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <div className="p-1.5 bg-yellow-50 rounded-lg">
                <Award className="h-4 w-4 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Top Performers</h3>
                <p className="text-xs text-gray-400">≥75% attendance & quality ≥3.5</p>
              </div>
            </div>
            {topPerformers.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">No data yet</div>
            ) : (
              <ul>
                {topPerformers.map((s, i) => (
                  <li key={s.id} className={`flex items-center justify-between px-5 py-3 hover:bg-gray-50 ${i !== 0 ? "border-t border-gray-50" : ""}`}>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{s.attendanceRate}% · {s.pagesMemorized} pages · {s.averageQuality.toFixed(1)} quality</p>
                    </div>
                    <span className="text-xs font-semibold text-yellow-700 bg-yellow-50 px-2 py-1 rounded-lg">Top</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ── Charts row ─────────────────────────────────────────────── */}
      {chartData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Progress & Attendance timeline */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Progress & Attendance Over Time</h3>
            </div>
            <div className="p-6" style={{ height: 280 }}>
              {chartData.dailySeries[0]?.day !== "No data" ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.dailySeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #f3f4f6", fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="progress" stroke="#16a34a" strokeWidth={2} dot={false} name="Progress" />
                    <Line type="monotone" dataKey="attendance" stroke="#2563eb" strokeWidth={2} dot={false} name="Attendance" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">No data for this period</div>
              )}
            </div>
          </div>

          {/* Teacher activity */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Teacher Activity</h3>
            </div>
            <div className="p-6" style={{ height: 280 }}>
              {chartData.teacherActivity[0]?.id !== "none" ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.teacherActivity} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #f3f4f6", fontSize: 12 }} />
                    <Bar dataKey="totalActions" fill="#166534" radius={[0, 4, 4, 0]} name="Actions" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">No teacher activity yet</div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
