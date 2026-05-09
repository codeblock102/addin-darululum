/**
 * @file src/pages/admin/Reports.tsx
 * @summary Admin Reports dashboard — lazy-loaded, section-grouped report runner
 * with CSV export capability. Mirrors the Mozaïk Portal layout style.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Play, BarChart2, Users, Calendar, BookOpen, Loader2 } from "lucide-react";
import { AdminPageShell } from "@/components/admin/AdminPageShell.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useToast } from "@/components/ui/use-toast.ts";
import { supabase } from "@/integrations/supabase/client.ts";

// ─── CSV helper ───────────────────────────────────────────────────────────────

export function buildCSV(
  rows: Record<string, unknown>[],
  headers: string[],
): string {
  const lines = [
    headers.map((h) => JSON.stringify(h)).join(","),
    ...rows.map((r) =>
      headers.map((h) => JSON.stringify(r[h] ?? "")).join(","),
    ),
  ];
  return lines.join("\n");
}

export function exportCSV(
  filename: string,
  rows: Record<string, unknown>[],
  headers: string[],
) {
  const csv = buildCSV(rows, headers);
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
}

// ─── Report IDs ───────────────────────────────────────────────────────────────

type ReportId =
  | "attendance-by-student"
  | "attendance-by-section"
  | "full-student-roster"
  | "students-by-section"
  | "hifz-progress";

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function fetchAttendanceByStudent() {
  // Fetch all active students
  const { data: students, error: sErr } = await supabase
    .from("students")
    .select("id, name, section")
    .eq("status", "active");
  if (sErr) throw sErr;

  // Fetch all attendance records
  const { data: records, error: aErr } = await supabase
    .from("attendance")
    .select("student_id, status");
  if (aErr) throw aErr;

  const STATUS_KEYS = ["present", "absent", "late", "excused", "sick"] as const;

  const rows = (students ?? []).map((s) => {
    const studentRecords = (records ?? []).filter((r) => r.student_id === s.id);
    const counts: Record<string, number> = {};
    for (const k of STATUS_KEYS) counts[k] = 0;
    for (const r of studentRecords) {
      const key = r.status?.toLowerCase();
      if (key && key in counts) counts[key]++;
    }
    const total = studentRecords.length;
    const present = counts["present"] ?? 0;
    const rate = total > 0 ? ((present / total) * 100).toFixed(1) : "0.0";
    return {
      Name: s.name,
      Section: s.section ?? "",
      Present: present,
      Absent: counts["absent"],
      Late: counts["late"],
      Excused: counts["excused"],
      Sick: counts["sick"],
      "Total Days": total,
      "Attendance Rate %": rate,
    };
  });
  return rows;
}

async function fetchAttendanceBySection() {
  const { data: students, error: sErr } = await supabase
    .from("students")
    .select("id, section")
    .eq("status", "active");
  if (sErr) throw sErr;

  const { data: records, error: aErr } = await supabase
    .from("attendance")
    .select("student_id, status");
  if (aErr) throw aErr;

  const sectionMap: Record<
    string,
    { ids: Set<string>; present: number; absent: number; late: number; excused: number; total: number }
  > = {};
  const studentSectionMap: Record<string, string> = {};

  for (const s of students ?? []) {
    const sec = s.section ?? "Unknown";
    if (!sectionMap[sec]) {
      sectionMap[sec] = { ids: new Set(), present: 0, absent: 0, late: 0, excused: 0, total: 0 };
    }
    sectionMap[sec].ids.add(s.id);
    studentSectionMap[s.id] = sec;
  }

  for (const r of records ?? []) {
    const sec = studentSectionMap[r.student_id];
    if (!sec) continue;
    const data = sectionMap[sec];
    data.total++;
    const k = r.status?.toLowerCase();
    if (k === "present") data.present++;
    else if (k === "absent") data.absent++;
    else if (k === "late") data.late++;
    else if (k === "excused") data.excused++;
  }

  return Object.entries(sectionMap).map(([section, d]) => ({
    Section: section,
    Students: d.ids.size,
    Present: d.present,
    Absent: d.absent,
    Late: d.late,
    Excused: d.excused,
    "Attendance Rate %":
      d.total > 0 ? ((d.present / d.total) * 100).toFixed(1) : "0.0",
  }));
}

async function fetchFullStudentRoster() {
  const { data, error } = await supabase
    .from("students")
    .select(
      "id, name, gender, section, grade, date_of_birth, guardian_name, guardian_contact, guardian_email, secondary_guardian_name, secondary_guardian_phone, enrollment_date, status",
    )
    .eq("status", "active");
  if (error) throw error;
  return (data ?? []).map((s) => ({
    Name: s.name,
    Gender: s.gender ?? "",
    Section: s.section ?? "",
    Grade: s.grade ?? "",
    DOB: s.date_of_birth ?? "",
    "Guardian Name": s.guardian_name ?? "",
    "Guardian Phone": s.guardian_contact ?? "",
    "Guardian Email": s.guardian_email ?? "",
    "Secondary Guardian": s.secondary_guardian_name ?? "",
    "Secondary Phone": s.secondary_guardian_phone ?? "",
    "Enrollment Date": s.enrollment_date ?? "",
    Status: s.status,
  }));
}

async function fetchStudentsBySection() {
  const { data, error } = await supabase
    .from("students")
    .select("section")
    .eq("status", "active");
  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const s of data ?? []) {
    const sec = s.section ?? "Unknown";
    counts[sec] = (counts[sec] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([section, count]) => ({ Section: section, "Student Count": count }));
}

async function fetchHifzProgress() {
  const { data, error } = await supabase
    .from("progress")
    .select("student_id, surah, juz, quality, created_at, students(name, section)")
    .order("created_at", { ascending: false });
  if (error) throw error;

  // Keep only the most recent entry per student
  const seen = new Set<string>();
  const latest: typeof data = [];
  for (const row of data ?? []) {
    if (!seen.has(row.student_id)) {
      seen.add(row.student_id);
      latest.push(row);
    }
  }

  // Count total entries per student
  const entryCounts: Record<string, number> = {};
  for (const row of data ?? []) {
    entryCounts[row.student_id] = (entryCounts[row.student_id] ?? 0) + 1;
  }

  return latest.map((r) => {
    const student = Array.isArray(r.students) ? r.students[0] : r.students;
    return {
      Name: student?.name ?? r.student_id,
      Section: student?.section ?? "",
      "Current Juz": r.juz ?? "",
      "Quality (last entry)": r.quality ?? "",
      "Date (last entry)": r.created_at ? r.created_at.split("T")[0] : "",
      "Total Entries": entryCounts[r.student_id] ?? 1,
    };
  });
}

// ─── Report config ────────────────────────────────────────────────────────────

interface ReportDef {
  id: ReportId;
  name: string;
  description: string;
  filename: string;
  headers: string[];
  fetcher: () => Promise<Record<string, unknown>[]>;
}

const SECTIONS: {
  title: string;
  icon: React.ReactNode;
  reports: ReportDef[];
}[] = [
  {
    title: "Attendance Reports",
    icon: <Calendar className="w-4 h-4 text-green-600" />,
    reports: [
      {
        id: "attendance-by-student",
        name: "Attendance by Student",
        description:
          "Present / absent / late / excused / sick counts per active student.",
        filename: "attendance-by-student",
        headers: [
          "Name",
          "Section",
          "Present",
          "Absent",
          "Late",
          "Excused",
          "Sick",
          "Total Days",
          "Attendance Rate %",
        ],
        fetcher: fetchAttendanceByStudent,
      },
      {
        id: "attendance-by-section",
        name: "Attendance by Class / Section",
        description: "Aggregated attendance counts grouped by section.",
        filename: "attendance-by-section",
        headers: [
          "Section",
          "Students",
          "Present",
          "Absent",
          "Late",
          "Excused",
          "Attendance Rate %",
        ],
        fetcher: fetchAttendanceBySection,
      },
    ],
  },
  {
    title: "Student Reports",
    icon: <Users className="w-4 h-4 text-blue-600" />,
    reports: [
      {
        id: "full-student-roster",
        name: "Full Student Roster",
        description: "All active students with contact and enrollment details.",
        filename: "full-student-roster",
        headers: [
          "Name",
          "Gender",
          "Section",
          "Grade",
          "DOB",
          "Guardian Name",
          "Guardian Phone",
          "Guardian Email",
          "Secondary Guardian",
          "Secondary Phone",
          "Enrollment Date",
          "Status",
        ],
        fetcher: fetchFullStudentRoster,
      },
      {
        id: "students-by-section",
        name: "Students by Section",
        description: "Count of active students per section.",
        filename: "students-by-section",
        headers: ["Section", "Student Count"],
        fetcher: fetchStudentsBySection,
      },
    ],
  },
  {
    title: "Hifz / Progress Reports",
    icon: <BookOpen className="w-4 h-4 text-purple-600" />,
    reports: [
      {
        id: "hifz-progress",
        name: "Hifz Progress by Student",
        description:
          "Most recent progress entry per student — juz, quality, and total entries.",
        filename: "hifz-progress",
        headers: [
          "Name",
          "Section",
          "Current Juz",
          "Quality (last entry)",
          "Date (last entry)",
          "Total Entries",
        ],
        fetcher: fetchHifzProgress,
      },
    ],
  },
];

// ─── Report Row component ─────────────────────────────────────────────────────

interface ReportRowProps {
  report: ReportDef;
  isActive: boolean;
  onGenerate: () => void;
  data?: Record<string, unknown>[];
  isLoading: boolean;
}

function ReportRow({ report, isActive, onGenerate, data, isLoading }: ReportRowProps) {
  const { toast } = useToast();

  const handleExport = () => {
    if (!data || data.length === 0) {
      toast({
        title: "No data to export",
        description: "Generate the report first before exporting.",
        variant: "destructive",
      });
      return;
    }
    exportCSV(report.filename, data, report.headers);
    toast({
      title: "Export started",
      description: `${data.length} rows exported to ${report.filename}.csv`,
    });
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-700">{report.name}</p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{report.description}</p>
        {isActive && data && (
          <p className="text-xs text-green-700 font-medium mt-1">
            {data.length} row{data.length !== 1 ? "s" : ""} ready
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onGenerate}
          disabled={isLoading}
          className="gap-1.5 text-xs"
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Play className="w-3 h-3" />
          )}
          Generate
        </Button>
        <Button
          size="sm"
          onClick={handleExport}
          disabled={isLoading || !data}
          className="gap-1.5 text-xs bg-green-700 hover:bg-green-800 text-white"
        >
          <Download className="w-3 h-3" />
          Export CSV
        </Button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Reports() {
  const [activeReport, setActiveReport] = useState<ReportId | null>(null);

  // One query per report — all start disabled, enabled only when activeReport matches
  const queries: Record<ReportId, ReturnType<typeof useQuery>> = {
    "attendance-by-student": useQuery({
      queryKey: ["report", "attendance-by-student"],
      queryFn: fetchAttendanceByStudent,
      enabled: activeReport === "attendance-by-student",
      staleTime: 5 * 60 * 1000,
    }),
    "attendance-by-section": useQuery({
      queryKey: ["report", "attendance-by-section"],
      queryFn: fetchAttendanceBySection,
      enabled: activeReport === "attendance-by-section",
      staleTime: 5 * 60 * 1000,
    }),
    "full-student-roster": useQuery({
      queryKey: ["report", "full-student-roster"],
      queryFn: fetchFullStudentRoster,
      enabled: activeReport === "full-student-roster",
      staleTime: 5 * 60 * 1000,
    }),
    "students-by-section": useQuery({
      queryKey: ["report", "students-by-section"],
      queryFn: fetchStudentsBySection,
      enabled: activeReport === "students-by-section",
      staleTime: 5 * 60 * 1000,
    }),
    "hifz-progress": useQuery({
      queryKey: ["report", "hifz-progress"],
      queryFn: fetchHifzProgress,
      enabled: activeReport === "hifz-progress",
      staleTime: 5 * 60 * 1000,
    }),
  };

  return (
    <AdminPageShell
      title="Reports"
      subtitle="Generate and export data reports"
      icon={<BarChart2 className="w-5 h-5 text-green-700" />}
      iconBg="bg-green-50"
    >
      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <div
            key={section.title}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
          >
            {/* Section header */}
            <div className="flex items-center gap-2 border-l-2 border-green-600 pl-3 mb-4">
              {section.icon}
              <h2 className="text-base font-bold text-gray-900 tracking-tight">
                {section.title}
              </h2>
            </div>

            {/* Report rows */}
            <div>
              {section.reports.map((report) => {
                const q = queries[report.id];
                return (
                  <ReportRow
                    key={report.id}
                    report={report}
                    isActive={activeReport === report.id || q.isFetched}
                    isLoading={q.isFetching}
                    data={q.data as Record<string, unknown>[] | undefined}
                    onGenerate={() => {
                      setActiveReport(report.id);
                      if (q.isFetched) {
                        q.refetch();
                      }
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </AdminPageShell>
  );
}
