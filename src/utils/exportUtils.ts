import { useToast } from "@/components/ui/use-toast.ts";

export type AttendanceExportRow = {
  date: string;
  time?: string | null;
  student_name: string;
  class_name: string;
  status: string;
  absence_reason?: string | null;
  notes?: string | null;
};

export const exportAttendanceAsCSV = (
  data: AttendanceExportRow[],
  toast: ReturnType<typeof useToast>["toast"],
  filename?: string,
) => {
  if (!data || data.length === 0) {
    toast({
      title: "Nothing to export",
      description: "No attendance records match the current filters.",
      variant: "destructive",
    });
    return;
  }

  const headers = ["Date", "Time", "Student", "Class", "Status", "Absence Reason", "Notes"];
  const rows = data.map((r) => [
    r.date,
    r.time ?? "",
    `"${(r.student_name ?? "").replace(/"/g, '""')}"`,
    `"${(r.class_name ?? "").replace(/"/g, '""')}"`,
    r.status,
    r.absence_reason ?? "",
    `"${(r.notes ?? "").replace(/"/g, '""')}"`,
  ].join(","));

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `attendance-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  toast({
    title: "Export complete",
    description: `${data.length} attendance record${data.length !== 1 ? "s" : ""} exported.`,
  });
};

export const exportDataAsCSV = (
  data: Array<{ name: string; verses: number }>,
  toast: ReturnType<typeof useToast>["toast"],
) => {
  if (!data || data.length === 0) return;

  // Create CSV for student progress
  const studentCSV = [
    "Student Name,Verses Memorized",
    ...data.map((student) => `${student.name},${student.verses}`),
  ].join("\n");

  // Create and download the file
  const blob = new Blob([studentCSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `student-progress-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  toast({
    title: "Export Complete",
    description: "Student progress data has been exported as CSV.",
  });
};
