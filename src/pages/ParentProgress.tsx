import { ProtectedRoute } from "@/components/auth/ProtectedRoute.tsx";
import { useParentChildren } from "@/hooks/useParentChildren.ts";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { DhorBook } from "@/components/dhor-book/DhorBook.tsx";
import { subDays, startOfWeek, endOfWeek, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client.ts";
import { useQuery } from "@tanstack/react-query";

const ParentProgress = () => {
  const { children } = useParentChildren();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(children[0]?.id ?? null);

  const { data: weekly } = useQuery({
    queryKey: ["parent-student-progress-weekly", selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
      const from = weekStart.toISOString();
      const to = weekEnd.toISOString();

      const { data, error } = await supabase
        .from("progress")
        .select("id, student_id, assignment_type, created_at")
        .eq("student_id", selectedStudentId)
        .gte("created_at", from)
        .lte("created_at", to)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const days = Array.from({ length: 7 }).map((_, i) => format(subDays(weekEnd, 6 - i), "EEE dd"));
      const counters = days.map(() => ({ sabaq: 0, sabaq_para: 0, dhor: 0 }));
      (data || []).forEach((row: any) => {
        const d = new Date(row.created_at);
        const dayIndex = Math.min(6, Math.max(0, Math.floor((d.getDay() + 6) % 7))); // Mon=0..Sun=6
        const type = (row.assignment_type || "").toLowerCase();
        if (type === "sabaq") counters[dayIndex].sabaq++;
        else if (type === "sabaq_para") counters[dayIndex].sabaq_para++;
        else if (type === "dhor") counters[dayIndex].dhor++;
      });
      return { days, counters } as { days: string[]; counters: { sabaq: number; sabaq_para: number; dhor: number }[] };
    },
    enabled: !!selectedStudentId,
  });

  return (
    <ProtectedRoute requireParent>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Qur'an Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap mb-4">
              {children.map((child) => (
                <button
                  key={child.id}
                  className={`px-3 py-2 rounded border ${selectedStudentId === child.id ? "bg-primary text-primary-foreground" : "bg-background"}`}
                  onClick={() => setSelectedStudentId(child.id)}
                >
                  {child.name}
                </button>
              ))}
            </div>
            {selectedStudentId && (
              <DhorBook
                studentId={selectedStudentId}
                isAdmin={false}
                isLoadingTeacher={false}
                readOnly={true}
                skipAuth={true}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default ParentProgress;


