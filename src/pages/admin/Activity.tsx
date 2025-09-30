import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Legend, PieChart, Pie, Cell } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Loader2, Activity as ActivityIcon, Mail, MessageSquare, BookOpen, CheckSquare } from "lucide-react";

type ActivityItem = {
  id: string;
  type: "progress" | "attendance" | "message" | "email" | "assignment";
  title: string;
  description: string;
  created_at: string;
  meta?: Record<string, unknown>;
};

const MAX_ITEMS = 200;

export default function Activity() {
  const [liveItems, setLiveItems] = useState<ActivityItem[]>([]);
  const itemsRef = useRef<ActivityItem[]>([]);
  itemsRef.current = liveItems;
  const [teacherMap, setTeacherMap] = useState<Record<string, { name: string; section?: string | null }>>({});
  const [studentToClasses, setStudentToClasses] = useState<Record<string, string[]>>({});
  const [studentToTeacherIds, setStudentToTeacherIds] = useState<Record<string, string[]>>({});
  const [selectedTeacher, setSelectedTeacher] = useState<string>("all");
  // Per-graph local filters
  const [dailySection, setDailySection] = useState<string>("all");
  const [dailyClass, setDailyClass] = useState<string>("all");
  const [topClassSection, setTopClassSection] = useState<string>("all");
  const [topClassClass, setTopClassClass] = useState<string>("all");
  const [progressSection, setProgressSection] = useState<string>("all");
  const [progressClass, setProgressClass] = useState<string>("all");
  const [mixSection, setMixSection] = useState<string>("all");
  const [mixClass, setMixClass] = useState<string>("all");
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);

  const { data: initialItems, isLoading } = useQuery<ActivityItem[]>({
    queryKey: ["admin-activity-initial"],
    queryFn: async (): Promise<ActivityItem[]> => {
      const gather: ActivityItem[] = [];

      // Recent progress (today)
      const { data: progress } = await supabase
        .from("progress")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      // Recent attendance
      const { data: attendance } = await supabase
        .from("attendance")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      // Fetch student names for display
      const studentIdsForNames = Array.from(
        new Set([
          ...((progress || []).map((p: any) => p.student_id).filter(Boolean)),
          ...((attendance || []).map((a: any) => a.student_id).filter(Boolean)),
        ])
      );
      let studentNameMap: Record<string, { name: string; section?: string | null }> = {};
      if (studentIdsForNames.length > 0) {
        const { data: studs } = await supabase
          .from("students")
          .select("id, name, section")
          .in("id", studentIdsForNames);
        (studs || []).forEach((s: any) => { studentNameMap[s.id] = { name: s.name, section: s.section }; });
      }

      (progress || []).forEach((p: any) => {
        const s = p.student_id ? studentNameMap[p.student_id] : undefined;
        const by = getTeacherByline(p, p.student_id, teacherMap, studentToTeacherIds);
        gather.push({
          id: `progress:${p.id}`,
          type: "progress",
          title: "Progress entry",
          description: `${s?.name || "Student"}${s?.section ? ` (${s.section})` : ""} — ${p.pages_memorized ?? 0} pages (${p.memorization_quality || "quality"})${by ? ` • by ${by}` : ""}`,
          created_at: p.created_at || p.date,
          meta: p,
        });
      });

      (attendance || []).forEach((a: any) => {
        const s = a.student_id ? studentNameMap[a.student_id] : undefined;
        const by = getTeacherByline(a, a.student_id, teacherMap, studentToTeacherIds);
        gather.push({
          id: `attendance:${a.id}`,
          type: "attendance",
          title: "Attendance",
          description: `${s?.name || "Student"}${s?.section ? ` (${s.section})` : ""} — ${a.status} (${a.date})${by ? ` • by ${by}` : ""}`,
          created_at: a.created_at || a.date,
          meta: a,
        });
      });

      // Recent assignments and their status
      const { data: assignments } = await supabase
        .from("teacher_assignments")
        .select("id, teacher_id, title, due_date, status, class_ids, student_ids, created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      const assignmentIds = (assignments || []).map((a: any) => a.id);
      // Ensure teacher names are available for assignment bylines
      const assignmentTeacherIds = Array.from(new Set((assignments || []).map((a: any) => a.teacher_id).filter(Boolean)));
      if (assignmentTeacherIds.length > 0) {
        const missingT = assignmentTeacherIds.filter((id) => !teacherMap[id]);
        if (missingT.length > 0) {
          const { data: tprofs } = await supabase.from("profiles").select("id, name, section").in("id", missingT);
          const tMap: Record<string, { name: string; section?: string | null }> = {};
          (tprofs || []).forEach((p: any) => { tMap[p.id] = { name: p.name, section: p.section }; });
          setTeacherMap((prev) => ({ ...prev, ...tMap }));
        }
      }
      const { data: submissions } = assignmentIds.length > 0 ? await supabase
        .from("teacher_assignment_submissions")
        .select("assignment_id, student_id, status, submitted_at, graded_at")
        .in("assignment_id", assignmentIds) : { data: [] } as any;

      // Precompute submissions map
      const subByAssignment: Record<string, { submitted: Set<string>; graded: Set<string>; assigned: Set<string> }> = {};
      (assignments || []).forEach((a: any) => {
        subByAssignment[a.id] = {
          submitted: new Set<string>(),
          graded: new Set<string>(),
          assigned: new Set<string>((a.student_ids || []).filter(Boolean)),
        };
      });
      (submissions || []).forEach((s: any) => {
        const bucket = subByAssignment[s.assignment_id];
        if (!bucket) return;
        if (s.status === "submitted") bucket.submitted.add(s.student_id);
        if (s.status === "graded") {
          bucket.submitted.add(s.student_id);
          bucket.graded.add(s.student_id);
        }
      });

      // Load names for assignment students (union for description)
      const allAssignStudentIds = Array.from(new Set((assignments || []).flatMap((a: any) => (a.student_ids || []) as string[])));
      const assignStudentNames: Record<string, string> = { ...Object.fromEntries(Object.entries(studentNameMap).map(([id, v]) => [id, v.name || ""])) };
      if (allAssignStudentIds.length > 0) {
        const missing = allAssignStudentIds.filter((id) => !assignStudentNames[id]);
        if (missing.length > 0) {
          const { data: extraStuds } = await supabase.from("students").select("id, name").in("id", missing);
          (extraStuds || []).forEach((s: any) => { assignStudentNames[s.id] = s.name; });
        }
      }

      (assignments || []).forEach((a: any) => {
        const bucket = subByAssignment[a.id];
        const total = bucket.assigned.size;
        const submittedCount = bucket.submitted.size;
        const gradedCount = bucket.graded.size;
        const notSubmitted = Array.from(bucket.assigned).filter((sid) => !bucket.submitted.has(sid));
        const notSubmittedNames = notSubmitted.slice(0, 5).map((sid) => assignStudentNames[sid] || sid);
        const teacherByline = teacherMap[a.teacher_id]?.name || a.teacher_id;
        gather.push({
          id: `assignment:${a.id}`,
          type: "assignment",
          title: `Assignment: ${a.title}${a.due_date ? ` (due ${a.due_date})` : ""}`,
          description: `By ${teacherByline} — Assigned to ${total} • Submitted ${submittedCount} • Graded ${gradedCount}${notSubmitted.length ? ` • Missing (${notSubmitted.length}): ${notSubmittedNames.join(", ")}${notSubmitted.length > 5 ? ", …" : ""}` : ""}`,
          created_at: a.created_at,
          meta: a,
        });
      });

      // Recent communications
      const { data: comms } = await supabase
        .from("communications")
        .select("id, sender_id, recipient_id, created_at, subject")
        .order("created_at", { ascending: false })
        .limit(50);
      (comms || []).forEach((c: any) => {
        gather.push({
          id: `message:${c.id}`,
          type: "message",
          title: "Message",
          description: `${c.subject || "New message"} — from ${c.sender_id || "system"}`,
          created_at: c.created_at,
          meta: c,
        });
      });

      // Recent email logs
      const { data: emails } = await supabase
        .from("email_logs")
        .select("id, trigger_source, triggered_at, status, emails_sent, emails_skipped")
        .order("triggered_at", { ascending: false })
        .limit(50);
      (emails || []).forEach((e: any) => {
        gather.push({
          id: `email:${e.id}`,
          type: "email",
          title: "Email job",
          description: `${e.status} — sent ${e.emails_sent ?? 0}, skipped ${e.emails_skipped ?? 0} (${e.trigger_source})`,
          created_at: e.triggered_at,
          meta: e,
        });
      });

      // Sort desc by created_at and clamp
      return gather
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, MAX_ITEMS);
    },
  });

  // Populate teacher map and student→classes when initial items load
  useEffect(() => {
    const hydrateMaps = async () => {
      const itemsArr: ActivityItem[] = initialItems || [];
      if (itemsArr.length === 0) return;
      const teacherIds = new Set<string>();
      for (const it of itemsArr) {
        const m = (it.meta || {}) as { teacher_id?: string; sender_id?: string };
        if (m.teacher_id) teacherIds.add(m.teacher_id);
        if (it.type === "message" && m.sender_id) teacherIds.add(m.sender_id);
      }
      if (teacherIds.size > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, name, section")
          .in("id", Array.from(teacherIds));
        const map: Record<string, { name: string; section?: string | null }> = {};
        (profs || []).forEach((p: any) => { map[p.id] = { name: p.name, section: p.section }; });
        setTeacherMap(map);
      }

      const studentIds = Array.from(
        new Set(
          itemsArr
            .map((it: ActivityItem) => (it.meta as { student_id?: string } | undefined)?.student_id)
            .filter((v): v is string => typeof v === "string" && v.length > 0)
        )
      );
      if (studentIds.length > 0) {
        const { data: classes } = await supabase
          .from("classes")
          .select("id, name, current_students, teacher_ids")
          .order("name", { ascending: true });
        const s2c: Record<string, string[]> = {};
        const s2t: Record<string, string[]> = {};
        const allTeacherIds = new Set<string>();
        (classes || []).forEach((c: any) => {
          const ids: string[] = Array.from(new Set((c.current_students || []).filter(Boolean)));
          const tIds: string[] = Array.isArray(c.teacher_ids) ? c.teacher_ids.filter(Boolean) : [];
          for (const sid of ids) {
            if (!s2c[sid]) s2c[sid] = [];
            s2c[sid].push(c.name);
            if (!s2t[sid]) s2t[sid] = [];
            tIds.forEach((tid) => {
              if (!s2t[sid].includes(tid)) s2t[sid].push(tid);
              allTeacherIds.add(tid);
            });
          }
        });
        setStudentToClasses(s2c);
        setStudentToTeacherIds(s2t);
        setAvailableClasses(Array.from(new Set(((classes || []).map((c: any) => c.name).filter(Boolean)))));
        if (allTeacherIds.size > 0) {
          const { data: teachers } = await supabase
            .from("teachers")
            .select("id, name").in("id", Array.from(allTeacherIds));
          const tMap: Record<string, { name: string; section?: string | null }> = {};
          (teachers || []).forEach((t: any) => { tMap[t.id] = { name: t.name, section: null }; });
          setTeacherMap((prev) => ({ ...tMap, ...prev }));
        }
      }
    };
    hydrateMaps();
  }, [initialItems]);

  // Load available sections from madrassah table for current admin
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
      // Always load classes list for filters (names)
      const { data: classes } = await supabase.from("classes").select("name").order("name", { ascending: true });
      setAvailableClasses(Array.from(new Set(((classes || []).map((c: any) => c.name).filter(Boolean)))));
    };
    loadSectionsAndClasses();
  }, []);

  // Subscribe to realtime changes across tables
  useEffect(() => {
    const channel = supabase
      .channel("admin-activity-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "progress" }, async (payload) => {
        const r: any = payload.new || payload.old || {};
        // fetch student for name/section if available
        let student: any = null;
        if (r.student_id) {
          const { data } = await supabase.from("students").select("name, section").eq("id", r.student_id).maybeSingle();
          student = data;
        }
        const item: ActivityItem = {
          id: `progress:${r.id}:${payload.eventType}:${payload.commit_timestamp}`,
          type: "progress",
          title: payload.eventType === "DELETE" ? "Progress deleted" : "Progress entry",
          description: `${student?.name || "Student"}${student?.section ? ` (${student.section})` : ""} — ${r.pages_memorized ?? 0} pages` + (r.teacher_id ? ` • by ${teacherMap[r.teacher_id]?.name || r.teacher_id}${teacherMap[r.teacher_id]?.section ? ` (${teacherMap[r.teacher_id]?.section})` : ""}` : ""),
          created_at: r.created_at || new Date().toISOString(),
          meta: r,
        };
        if (r.teacher_id && !teacherMap[r.teacher_id]) {
          const { data: prof } = await supabase.from("profiles").select("name, section").eq("id", r.teacher_id).maybeSingle();
          if (prof) setTeacherMap((prev) => ({ ...prev, [r.teacher_id]: { name: (prof as any).name, section: (prof as any).section } }));
        }
        setLiveItems([item, ...itemsRef.current].slice(0, MAX_ITEMS));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, async (payload) => {
        const r: any = payload.new || payload.old || {};
        let student: any = null;
        if (r.student_id) {
          const { data } = await supabase.from("students").select("name, section").eq("id", r.student_id).maybeSingle();
          student = data;
        }
        const item: ActivityItem = {
          id: `attendance:${r.id}:${payload.eventType}:${payload.commit_timestamp}`,
          type: "attendance",
          title: payload.eventType === "DELETE" ? "Attendance deleted" : "Attendance",
          description: `${student?.name || "Student"}${student?.section ? ` (${student.section})` : ""} — ${r.status} (${r.date})` + (r.teacher_id ? ` • by ${teacherMap[r.teacher_id]?.name || r.teacher_id}${teacherMap[r.teacher_id]?.section ? ` (${teacherMap[r.teacher_id]?.section})` : ""}` : ""),
          created_at: r.created_at || new Date().toISOString(),
          meta: r,
        };
        if (r.teacher_id && !teacherMap[r.teacher_id]) {
          const { data: prof } = await supabase.from("profiles").select("name, section").eq("id", r.teacher_id).maybeSingle();
          if (prof) setTeacherMap((prev) => ({ ...prev, [r.teacher_id]: { name: (prof as any).name, section: (prof as any).section } }));
        }
        setLiveItems([item, ...itemsRef.current].slice(0, MAX_ITEMS));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "communications" }, async (payload) => {
        const r: any = payload.new || payload.old || {};
        let sender: any = null;
        if (r.sender_id) {
          const { data } = await supabase.from("profiles").select("name, section").eq("id", r.sender_id).maybeSingle();
          sender = data;
        }
        const item: ActivityItem = {
          id: `message:${r.id}:${payload.eventType}:${payload.commit_timestamp}`,
          type: "message",
          title: payload.eventType === "DELETE" ? "Message deleted" : "Message",
          description: `${r.subject || "Message"} — ${sender?.name || "system"}${sender?.section ? ` (${sender.section})` : ""}`,
          created_at: r.created_at || new Date().toISOString(),
          meta: r,
        };
        if (r.sender_id && !teacherMap[r.sender_id]) {
          if (sender) setTeacherMap((prev) => ({ ...prev, [r.sender_id]: { name: (sender as any).name, section: (sender as any).section } }));
        }
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

  function getTeacherByline(meta: any, studentId: string | undefined, tMap: Record<string, { name: string; section?: string | null }>, s2t: Record<string, string[]>) {
    // Prefer contributor fields if present
    const contributorId = meta?.contributor_id as string | undefined;
    if (contributorId) return tMap[contributorId]?.name || contributorId;
    // Fallback: derive from student's class teacher_ids
    if (studentId) {
      const tids = s2t[studentId] || [];
      if (tids.length > 0) return tMap[tids[0]]?.name || tids[0];
    }
    return "";
  }

  const items = useMemo(() => {
    const seed = initialItems || [];
    const merged = [...liveItems, ...seed]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, MAX_ITEMS);
    if (selectedTeacher === "all") return merged;
    return merged.filter((it) => {
      if (it.type === "email") return false; // not teacher-specific
      if (it.type === "message") return false; // exclude messages from teacher filter (different ids)
      const m: any = it.meta || {};
      const sid = m.student_id as string | undefined;
      if (!sid) return false;
      const teacherIds = studentToTeacherIds[sid] || [];
      return teacherIds.includes(selectedTeacher);
    });
  }, [initialItems, liveItems, selectedTeacher, studentToTeacherIds]);

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

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, ActivityItem[]> = { progress: [], attendance: [], message: [], email: [], assignment: [] } as any;
    for (const it of items) {
      (groups[it.type] ||= []).push(it);
    }
    return groups;
  }, [items]);

  const Section = ({ title, type }: { title: string; type: ActivityItem["type"] }) => (
    <Card className="border border-gray-200 bg-white">
      <CardHeader className="border-b">
        <CardTitle className="text-base flex items-center gap-2">{iconFor(type)}<span>{title}</span></CardTitle>
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
            {grouped[type].map((it) => (
              <li key={it.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{iconFor(it.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-gray-900 truncate">{it.title}</div>
                      <div className="text-xs text-gray-500 whitespace-nowrap">{new Date(it.created_at).toLocaleString()}</div>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ActivityIcon className="h-6 w-6 text-gray-700" />
          Activity Feed
        </h1>
        <div className="flex items-center gap-3">
          <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Teacher" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teachers</SelectItem>
              {Object.entries(teacherMap)
                .sort((a, b) => (a[1].name || "").localeCompare(b[1].name || ""))
                .map(([id, t]) => (
                  <SelectItem key={id} value={id}>{t.name}{t.section ? ` (${t.section})` : ""}</SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-xs">Realtime</Badge>
        </div>
      </div>

      {/* Summary charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-gray-200 bg-white">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Last 7 days — Progress & Attendance</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 280 }}>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Select value={dailySection} onValueChange={setDailySection}>
                <SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {availableSections.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={dailyClass} onValueChange={setDailyClass}>
                <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {availableClasses.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={buildDailySeries(items, dailySection, dailyClass, studentToClasses)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="progress" stroke="#2563eb" name="Sabaq entries" />
                <Line type="monotone" dataKey="attendance" stroke="#059669" name="Attendance marks" />
              </LineChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-600 mt-3">
              Shows daily totals for sabaq entries and attendance marks over the selected period. Commentary: short-term trendline used to signal potential increases/decreases in activity; this is an indicative near‑term outlook, not a guarantee.
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Top Classes — Last 7 days</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 280 }}>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Select value={topClassSection} onValueChange={setTopClassSection}>
                <SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {availableSections.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={topClassClass} onValueChange={setTopClassClass}>
                <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {availableClasses.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buildClassPerformance(items, topClassSection, topClassClass, studentToClasses)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="className" hide />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sabaq" stackId="a" fill="#2563eb" name="Sabaq" />
                <Bar dataKey="dhor" stackId="a" fill="#7c3aed" name="Dhor" />
                <Bar dataKey="attendance" stackId="a" fill="#059669" name="Attendance" />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-600 mt-3">
              Top classes by combined activity (sabaq, dhor, attendance) for the selected range. Commentary: higher bars suggest sustained engagement; projected near‑term performance extrapolates current pace.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-gray-200 bg-white">
          <CardHeader className="border-b"><CardTitle className="text-base">Progress Quality — 7 days</CardTitle></CardHeader>
          <CardContent style={{ height: 280 }}>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Select value={progressSection} onValueChange={setProgressSection}>
                <SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {availableSections.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={progressClass} onValueChange={setProgressClass}>
                <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {availableClasses.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buildProgressQuality(items, progressSection, progressClass, studentToClasses)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="excellent" fill="#16a34a" />
                <Bar dataKey="good" fill="#22c55e" />
                <Bar dataKey="average" fill="#f59e0b" />
                <Bar dataKey="needsWork" fill="#ef4444" />
                <Bar dataKey="horrible" fill="#991b1b" />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-600 mt-3">
              Quality distribution of sabaq entries (excellent→horrible). Commentary: highlights learning quality trends; near‑term projection uses recent proportions to anticipate shifts.
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white">
          <CardHeader className="border-b"><CardTitle className="text-base">Attendance Status Mix — 7 days</CardTitle></CardHeader>
          <CardContent style={{ height: 280 }}>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Select value={mixSection} onValueChange={setMixSection}>
                <SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {availableSections.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={mixClass} onValueChange={setMixClass}>
                <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {availableClasses.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie dataKey="value" data={buildAttendanceMix(items, mixSection, mixClass, studentToClasses)} cx="50%" cy="50%" outerRadius={80} label>
                  {buildAttendanceMix(items, mixSection, mixClass, studentToClasses).map((_, idx) => (
                    <Cell key={idx} fill={["#10b981","#ef4444","#f59e0b","#6366f1"][idx % 4]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-600 mt-3">
              Distribution of attendance statuses in the selected period. Commentary: proportions help spot anomalies; expected near‑term mix is projected using recent shares.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Progress" type="progress" />
        <Section title="Attendance" type="attendance" />
        <Section title="Messages" type="message" />
        <Section title="Emails" type="email" />
        <Section title="Assignments" type="assignment" />
      </div>
    </div>
  );
}

function buildDailySeries(items: ActivityItem[], section: string = "all", className: string = "all", studentToClasses: Record<string, string[]> = {}) {
  const days: Record<string, { day: string; progress: number; attendance: number }> = {};
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days[key] = { day: key.slice(5), progress: 0, attendance: 0 };
  }
  for (const it of items) {
    if (section !== "all") {
      const sec = ((it.meta as any)?.students?.section || "").toLowerCase();
      if (sec !== section.toLowerCase()) continue;
    }
    if (className !== "all") {
      const sid = (it.meta as any)?.student_id as string | undefined;
      const classes = sid ? (studentToClasses[sid] || []) : [];
      if (!classes.includes(className)) continue;
    }
    const key = new Date(it.created_at).toISOString().slice(0, 10);
    if (!days[key]) continue;
    if (it.type === "progress") days[key].progress += 1;
    if (it.type === "attendance") days[key].attendance += 1;
  }
  return Object.values(days);
}

function buildClassPerformance(items: ActivityItem[], section: string = "all", classFilter: string = "all", studentToClasses: Record<string, string[]> = {}) {
  // Approximate classes by student section for now; can be enhanced to map students→classes
  const agg: Record<string, { className: string; sabaq: number; dhor: number; attendance: number }> = {};
  const within7 = (d: string) => (Date.now() - new Date(d).getTime()) <= 7 * 24 * 3600 * 1000;
  for (const it of items) {
    if (!within7(it.created_at)) continue;
    if (section !== "all") {
      const sec = ((it.meta as any)?.students?.section || "").toLowerCase();
      if (sec !== section.toLowerCase()) continue;
    }
    const sid = (it.meta as any)?.student_id as string | undefined;
    const studentClasses = sid ? (studentToClasses[sid] || ["Unknown"]) : ["Unknown"];
    for (const className of studentClasses) {
      if (classFilter !== "all" && className !== classFilter) continue;
    agg[className] ||= { className, sabaq: 0, dhor: 0, attendance: 0 };
    if (it.type === "progress") {
        // naive: treat sabaq vs dhor based on keywords in description
        const desc: string = it.description || "";
        if (/dhor/i.test(desc)) agg[className].dhor += 1; else agg[className].sabaq += 1;
    }
    if (it.type === "attendance") agg[className].attendance += 1;
    }
  }
  return Object.values(agg).sort((a, b) => (b.sabaq + b.dhor + b.attendance) - (a.sabaq + a.dhor + a.attendance)).slice(0, 8);
}

function buildTeachers(items: ActivityItem[], teacherMap: Record<string, { name: string; section?: string | null }>) {
  const set = new Set<string>();
  for (const it of items) {
    const m: any = it.meta || {};
    if (m.teacher_id && teacherMap[m.teacher_id]?.name) set.add(teacherMap[m.teacher_id]!.name!);
  }
  return Array.from(set).sort();
}

function buildSections(items: ActivityItem[]) {
  const set = new Set<string>();
  for (const it of items) {
    const sec = (it.meta as any)?.students?.section;
    if (sec) set.add(sec);
  }
  return Array.from(set).sort();
}

function buildTeacherPerformance(items: ActivityItem[], teacherMap: Record<string, { name: string; section?: string | null }>) {
  const agg: Record<string, { teacher: string; progress: number; attendance: number }> = {};
  const within7 = (d: string) => (Date.now() - new Date(d).getTime()) <= 7 * 24 * 3600 * 1000;
  for (const it of items) {
    if (!within7(it.created_at)) continue;
    const m: any = it.meta || {};
    const tName = m.teacher_id ? (teacherMap[m.teacher_id]?.name || m.teacher_id) : "Unknown";
    agg[tName] ||= { teacher: tName, progress: 0, attendance: 0 };
    if (it.type === "progress") agg[tName].progress += 1;
    if (it.type === "attendance") agg[tName].attendance += 1;
  }
  return Object.values(agg).sort((a, b) => (b.progress + b.attendance) - (a.progress + a.attendance)).slice(0, 8);
}

function buildAttendanceMix(items: ActivityItem[], section: string = "all", className: string = "all", studentToClasses: Record<string, string[]> = {}) {
  const within7 = (d: string) => (Date.now() - new Date(d).getTime()) <= 7 * 24 * 3600 * 1000;
  const counts: Record<string, number> = { present: 0, absent: 0, late: 0, excused: 0 };
  for (const it of items) {
    if (it.type !== "attendance" || !within7(it.created_at)) continue;
    if (section !== "all") {
      const sec = ((it.meta as any)?.students?.section || "").toLowerCase();
      if (sec !== section.toLowerCase()) continue;
    }
    if (className !== "all") {
      const sid = (it.meta as any)?.student_id as string | undefined;
      const classes = sid ? (studentToClasses[sid] || []) : [];
      if (!classes.includes(className)) continue;
    }
    const status = ((it.meta as any)?.status || "").toLowerCase();
    if (counts[status] != null) counts[status] += 1;
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
}

function buildProgressQuality(items: ActivityItem[], section: string = "all", className: string = "all", studentToClasses: Record<string, string[]>) {
  const within7 = (d: string) => (Date.now() - new Date(d).getTime()) <= 7 * 24 * 3600 * 1000;
  const counts: Record<string, number> = { excellent: 0, good: 0, average: 0, needsWork: 0, horrible: 0 };
  for (const it of items) {
    if (it.type !== "progress" || !within7(it.created_at)) continue;
    if (section !== "all") {
      const sec = ((it.meta as any)?.students?.section || "").toLowerCase();
      if (sec !== section.toLowerCase()) continue;
    }
    if (className !== "all") {
      const sid = (it.meta as any)?.student_id as string | undefined;
      const classes = sid ? (studentToClasses[sid] || []) : [];
      if (!classes.includes(className)) continue;
    }
    const q = (it.meta as any)?.memorization_quality || "";
    if (counts[q] != null) counts[q] += 1;
  }
  return [{ name: "Quality", ...counts }];
}

function buildClasses(studentToClasses: Record<string, string[]>) {
  const set = new Set<string>();
  Object.values(studentToClasses).forEach((arr) => (arr || []).forEach((n) => set.add(n)));
  return Array.from(set).sort();
}
