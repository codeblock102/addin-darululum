import { ProtectedRoute } from "@/components/auth/ProtectedRoute.tsx";
import { useParentChildren } from "@/hooks/useParentChildren.ts";
import { ChildSelector } from "@/components/parent/ChildSelector.tsx";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { supabase } from "@/integrations/supabase/client.ts";
import { useQuery } from "@tanstack/react-query";
import { Tables } from "@/types/supabase.ts";

const statusConfig = (status: string) => {
  switch (status?.toLowerCase()) {
    case "present":
      return { label: "Present", className: "bg-green-100 text-green-800 border border-green-200" };
    case "absent":
      return { label: "Absent", className: "bg-red-100 text-red-800 border border-red-200" };
    case "late":
      return { label: "Late", className: "bg-amber-100 text-amber-800 border border-amber-200" };
    default:
      return { label: status || "Unknown", className: "bg-muted text-muted-foreground border" };
  }
};

const ParentAttendance = () => {
  const { children } = useParentChildren();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedStudentId && children.length > 0) {
      setSelectedStudentId(children[0].id);
    }
  }, [children, selectedStudentId]);

  const { data: attendance } = useQuery<Tables<"attendance">[]>({
    queryKey: ["parent-student-attendance", selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      const { data, error } = await supabase
        .from("attendance")
        .select("id, student_id, date, status, session, reason, notes")
        .eq("student_id", selectedStudentId)
        .order("date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStudentId,
  });

  const records = attendance || [];
  const total = records.length;
  const presentCount = records.filter((a) => a.status?.toLowerCase() === "present").length;
  const absentCount = records.filter((a) => a.status?.toLowerCase() === "absent").length;
  const lateCount = records.filter((a) => a.status?.toLowerCase() === "late").length;
  const attendanceRate = total > 0 ? Math.round((presentCount / total) * 100) : null;

  return (
    <ProtectedRoute requireParent>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Attendance</h1>
          <p className="text-muted-foreground text-sm mb-4">Track your child's attendance record.</p>
          <ChildSelector
            children={children}
            selectedId={selectedStudentId}
            onSelect={setSelectedStudentId}
          />
        </div>

        {selectedStudentId && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-5 pb-4 text-center">
                  <div className="text-3xl font-bold">
                    {attendanceRate !== null ? `${attendanceRate}%` : "—"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Attendance Rate</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 pb-4 text-center">
                  <div className="text-3xl font-bold text-green-700">{presentCount}</div>
                  <div className="text-xs text-muted-foreground mt-1">Present</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 pb-4 text-center">
                  <div className="text-3xl font-bold text-red-600">{absentCount}</div>
                  <div className="text-xs text-muted-foreground mt-1">Absent</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 pb-4 text-center">
                  <div className="text-3xl font-bold text-amber-600">{lateCount}</div>
                  <div className="text-xs text-muted-foreground mt-1">Late</div>
                </CardContent>
              </Card>
            </div>

            {/* Record list */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Session History</CardTitle>
              </CardHeader>
              <CardContent>
                {records.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No attendance records found.</p>
                ) : (
                  <ul className="space-y-2">
                    {records.map((a) => {
                      const cfg = statusConfig(a.status);
                      return (
                        <li key={a.id} className="flex items-center justify-between text-sm py-1">
                          <span className="text-muted-foreground">{a.date}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
                            {cfg.label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default ParentAttendance;
