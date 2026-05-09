/**
 * @file src/pages/HifzReportCard.tsx
 * @summary Printable Hifz (Quran memorization) Report Card for a student.
 *
 * Letter-sized (8.5" x 11") portrait layout designed to look polished when the
 * user triggers Cmd+P / Ctrl+P. Print stylesheet hides app chrome (sidebar,
 * top nav) and the page-level action buttons, and forces a clean white
 * background with black text.
 *
 * Route: /students/:id/report-card (mounted inside DashboardLayout in App.tsx).
 */
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { supabase } from "@/integrations/supabase/client.ts";

// ── Types ────────────────────────────────────────────────────────────
interface StudentRow {
  id: string;
  name: string;
  date_of_birth: string | null;
  grade: string | null;
  section: string | null;
  permanent_code: string | null;
  current_juz: number | null;
  completed_juz: number[] | null;
  class_ids: string[] | null;
}

interface ProgressRow {
  id: string;
  date: string | null;
  current_surah: number | null;
  start_ayat: number | null;
  end_ayat: number | null;
  memorization_quality: string | null;
  teacher_notes: string | null;
  notes: string | null;
}

interface AttendanceTotals {
  total: number;
  present: number;
  absent: number;
  late: number;
  rate: number | null;
}

interface ReportData {
  student: StudentRow;
  progress: ProgressRow[];
  termPagesCount: number;
  attendance: AttendanceTotals;
  teacherName: string;
  className: string;
  termLabel: string;
  termStart: string;
}

// ── Helpers ──────────────────────────────────────────────────────────
function dash(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

/**
 * Compute the current school-year term boundaries.
 *
 * Convention: school year starts Sept 1. Term 1 = Sept 1 → Jan 31,
 * Term 2 = Feb 1 → Aug 31. This is a simple heuristic so the card has
 * a stable label without extra DB plumbing.
 */
function getCurrentTerm(): { label: string; start: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const startYear = month >= 8 ? year : year - 1; // Sept (8) onwards → current year
  const endYear = startYear + 1;

  // Term 1: Sept 1 → Jan 31. Term 2: Feb 1 → Aug 31.
  const inTerm1 = month >= 8 || month <= 0;
  const termNum = inTerm1 ? 1 : 2;
  const termStart = inTerm1
    ? new Date(startYear, 8, 1)
    : new Date(endYear, 1, 1);

  return {
    label: `${startYear}–${endYear} Term ${termNum}`,
    start: termStart.toISOString().split("T")[0],
  };
}

// ── Data fetching ────────────────────────────────────────────────────
async function fetchReportData(studentId: string): Promise<ReportData> {
  const term = getCurrentTerm();

  // 1. Student. Cast through unknown because generated Supabase types
  // omit a few real columns (class_ids, teacher_ids) that are present at
  // runtime — same pattern used elsewhere in this codebase.
  const { data: studentRaw, error: sErr } = await supabase
    .from("students")
    .select(
      "id, name, date_of_birth, grade, section, permanent_code, current_juz, completed_juz, class_ids",
    )
    .eq("id", studentId)
    .maybeSingle();
  if (sErr) throw sErr;
  if (!studentRaw) throw new Error("Student not found");
  const student = studentRaw as unknown as StudentRow;

  // 2. Progress entries — last 30, plus a separate count for this term
  const { data: recentProgress } = await supabase
    .from("progress")
    .select(
      "id, date, current_surah, start_ayat, end_ayat, memorization_quality, teacher_notes, notes",
    )
    .eq("student_id", studentId)
    .order("date", { ascending: false })
    .limit(30);

  const { count: termPagesCount } = await supabase
    .from("progress")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .gte("date", term.start);

  // 3. Attendance totals for the term
  const { data: attendanceRows } = await supabase
    .from("attendance")
    .select("status")
    .eq("student_id", studentId)
    .gte("date", term.start);

  const total = attendanceRows?.length ?? 0;
  const present = attendanceRows?.filter((r) => r.status === "present").length ?? 0;
  const absent = attendanceRows?.filter((r) => r.status === "absent").length ?? 0;
  const late = attendanceRows?.filter((r) => r.status === "late").length ?? 0;
  const rate = total > 0 ? Math.round(((present + late) / total) * 100) : null;

  // 4. Teacher + class info via class_ids → classes → teacher_ids → profiles
  let teacherName = "—";
  let className = "—";
  if (student.class_ids && student.class_ids.length > 0) {
    const { data: classesRaw } = await supabase
      .from("classes")
      .select("id, name, teacher_ids")
      .in("id", student.class_ids);
    const classes = (classesRaw ?? []) as unknown as Array<{
      id: string;
      name: string | null;
      teacher_ids: string[] | null;
    }>;
    if (classes.length > 0) {
      className = classes.map((c) => c.name).filter(Boolean).join(", ") || "—";
      const teacherIds = [
        ...new Set(classes.flatMap((c) => c.teacher_ids ?? [])),
      ];
      if (teacherIds.length > 0) {
        const { data: teachers } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", teacherIds);
        teacherName =
          teachers?.map((t) => t.name).filter(Boolean).join(", ") || "—";
      }
    }
  }

  return {
    student,
    progress: (recentProgress || []) as ProgressRow[],
    termPagesCount: termPagesCount ?? 0,
    attendance: { total, present, absent, late, rate },
    teacherName,
    className,
    termLabel: term.label,
    termStart: term.start,
  };
}

// ── Sub-components ───────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex border-b border-gray-200 py-1.5">
      <span className="w-40 text-xs font-semibold uppercase tracking-wide text-gray-600">
        {label}
      </span>
      <span className="flex-1 text-sm text-gray-900">{value}</span>
    </div>
  );
}

function StatBlock({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="border border-gray-300 rounded-md px-4 py-3 text-center bg-white">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-900 mt-1 leading-tight">
        {value}
      </p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────
const HifzReportCard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const logoUrl =
    (import.meta.env.VITE_LOGO_URL as string | undefined) ||
    (import.meta.env.LOGO_URL as string | undefined) ||
    "";

  const { data, isLoading, error } = useQuery({
    queryKey: ["hifz-report-card", id],
    queryFn: () => fetchReportData(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[900px] w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Report Card Unavailable</h2>
        <p className="text-gray-600 mb-4">
          {error instanceof Error ? error.message : "Could not load student data."}
        </p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
    );
  }

  const { student, progress, termPagesCount, attendance, teacherName, className, termLabel } = data;
  const latestEntry = progress[0];
  const remarks =
    progress.find((p) => p.teacher_notes && p.teacher_notes.trim())
      ?.teacher_notes ?? "—";

  return (
    <>
      {/* Print stylesheet — hides app chrome and page actions, forces white. */}
      <style>{`
        @media print {
          @page { size: letter portrait; margin: 0.5in; }
          html, body { background: #ffffff !important; }
          body * { visibility: hidden !important; }
          .report-card-print, .report-card-print * { visibility: visible !important; }
          .report-card-print {
            position: absolute !important;
            left: 0; top: 0;
            width: 100%;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .report-card-print * {
            color: #000000 !important;
            background: transparent !important;
            box-shadow: none !important;
          }
          .report-card-print table { page-break-inside: auto; }
          .report-card-print tr { page-break-inside: avoid; page-break-after: auto; }
          .no-print { display: none !important; }
          .print-page-break { page-break-before: always; }
          .signature-block { page-break-inside: avoid; }
        }
      `}</style>

      {/* Page actions (hidden in print) */}
      <div className="no-print flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> Print / Save as PDF
        </Button>
      </div>

      {/* Report Card body — Letter-sized container */}
      <div
        className="report-card-print mx-auto bg-white text-gray-900 shadow-md border border-gray-200 print:shadow-none"
        style={{ width: "8.5in", minHeight: "11in", padding: "0.5in" }}
      >
        {/* Letterhead */}
        <header className="flex items-center justify-between border-b-2 border-gray-900 pb-3">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Darul Ulum Montreal"
                className="h-14 w-14 object-contain"
              />
            ) : (
              <div className="h-14 w-14 rounded-full border-2 border-gray-900 flex items-center justify-center font-bold text-lg">
                DUM
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold leading-tight">Darul Ulum Montreal</h1>
              <p className="text-xs text-gray-600">
                Hifz Department · Student Progress Record
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-gray-600">
            <p>Issued: {fmtDate(new Date().toISOString())}</p>
          </div>
        </header>

        {/* Title */}
        <div className="text-center mt-5">
          <h2 className="text-2xl font-bold tracking-wide uppercase">
            Hifz Progress Report
          </h2>
          <p className="text-sm text-gray-600 mt-1">{termLabel}</p>
        </div>

        {/* Student info */}
        <section className="mt-6 grid grid-cols-2 gap-x-8">
          <div>
            <InfoRow label="Name" value={dash(student.name)} />
            <InfoRow label="Section" value={dash(student.section)} />
            <InfoRow label="Grade" value={dash(student.grade)} />
            <InfoRow label="Date of Birth" value={fmtDate(student.date_of_birth)} />
          </div>
          <div>
            <InfoRow label="Permanent Code" value={dash(student.permanent_code)} />
            <InfoRow label="Class / Group" value={dash(className)} />
            <InfoRow label="Teacher" value={dash(teacherName)} />
            <InfoRow
              label="Completed Juz"
              value={
                student.completed_juz && student.completed_juz.length > 0
                  ? `${student.completed_juz.length} (${student.completed_juz.join(", ")})`
                  : "—"
              }
            />
          </div>
        </section>

        {/* Progress summary */}
        <section className="mt-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-700 mb-2 border-b border-gray-300 pb-1">
            Progress Summary
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <StatBlock
              label="Current Surah"
              value={
                latestEntry?.current_surah
                  ? `Surah ${latestEntry.current_surah}`
                  : "—"
              }
              sub={latestEntry?.date ? fmtDate(latestEntry.date) : "No entries"}
            />
            <StatBlock
              label="Current Juz"
              value={student.current_juz ? `Juz ${student.current_juz}` : "—"}
              sub={
                student.completed_juz?.length
                  ? `${student.completed_juz.length} completed`
                  : undefined
              }
            />
            <StatBlock
              label="Sessions This Term"
              value={String(termPagesCount)}
              sub="Progress entries logged"
            />
          </div>
        </section>

        {/* Detailed entries */}
        <section className="mt-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-700 mb-2 border-b border-gray-300 pb-1">
            Recent Progress Entries (last {progress.length})
          </h3>
          {progress.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-3">
              No progress entries on record.
            </p>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left px-2 py-1.5 border border-gray-300 font-semibold w-24">
                    Date
                  </th>
                  <th className="text-left px-2 py-1.5 border border-gray-300 font-semibold w-20">
                    Surah
                  </th>
                  <th className="text-left px-2 py-1.5 border border-gray-300 font-semibold w-24">
                    Ayat Range
                  </th>
                  <th className="text-left px-2 py-1.5 border border-gray-300 font-semibold w-24">
                    Quality
                  </th>
                  <th className="text-left px-2 py-1.5 border border-gray-300 font-semibold">
                    Teacher Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {progress.map((p) => {
                  const ayatRange =
                    p.start_ayat && p.end_ayat
                      ? `${p.start_ayat}–${p.end_ayat}`
                      : p.start_ayat
                      ? String(p.start_ayat)
                      : "—";
                  return (
                    <tr key={p.id}>
                      <td className="px-2 py-1.5 border border-gray-300">
                        {fmtDate(p.date)}
                      </td>
                      <td className="px-2 py-1.5 border border-gray-300">
                        {p.current_surah ? `S. ${p.current_surah}` : "—"}
                      </td>
                      <td className="px-2 py-1.5 border border-gray-300">
                        {ayatRange}
                      </td>
                      <td className="px-2 py-1.5 border border-gray-300 capitalize">
                        {dash(p.memorization_quality)}
                      </td>
                      <td className="px-2 py-1.5 border border-gray-300">
                        {dash(p.teacher_notes ?? p.notes)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* Attendance */}
        <section className="mt-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-700 mb-2 border-b border-gray-300 pb-1">
            Attendance Summary (Term to date)
          </h3>
          <div className="grid grid-cols-5 gap-3">
            <StatBlock label="Total Days" value={String(attendance.total)} />
            <StatBlock label="Present" value={String(attendance.present)} />
            <StatBlock label="Absent" value={String(attendance.absent)} />
            <StatBlock label="Late" value={String(attendance.late)} />
            <StatBlock
              label="Rate"
              value={attendance.rate != null ? `${attendance.rate}%` : "—"}
            />
          </div>
        </section>

        {/* Remarks */}
        <section className="mt-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-700 mb-2 border-b border-gray-300 pb-1">
            Teacher Remarks
          </h3>
          <div className="border border-gray-300 rounded-md min-h-[80px] p-3 text-sm whitespace-pre-wrap">
            {remarks}
          </div>
        </section>

        {/* Signature blocks */}
        <section className="signature-block mt-10 grid grid-cols-3 gap-6">
          <div>
            <div className="border-t border-gray-900 pt-1 text-xs text-gray-700">
              Teacher Signature
            </div>
          </div>
          <div>
            <div className="border-t border-gray-900 pt-1 text-xs text-gray-700">
              Principal Signature
            </div>
          </div>
          <div>
            <div className="border-t border-gray-900 pt-1 text-xs text-gray-700">
              Date
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default HifzReportCard;
