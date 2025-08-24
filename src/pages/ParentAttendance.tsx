import { ProtectedRoute } from "@/components/auth/ProtectedRoute.tsx";
import { useParentChildren } from "@/hooks/useParentChildren.ts";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { supabase } from "@/integrations/supabase/client.ts";
import { useQuery } from "@tanstack/react-query";
import { Tables } from "@/types/supabase.ts";

const ParentAttendance = () => {
  const { children } = useParentChildren();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(children[0]?.id ?? null);

  const { data: attendance } = useQuery<Tables["attendance"][] | null>({
    queryKey: ["parent-student-attendance", selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", selectedStudentId)
        .order("date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStudentId,
  });

  return (
    <ProtectedRoute requireParent>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Attendance</CardTitle>
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
            <ul className="space-y-2">
              {(attendance || []).map((a: any) => (
                <li key={a.id} className="p-3 rounded border flex justify-between">
                  <span>{a.date}</span>
                  <span className="uppercase">{a.status}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default ParentAttendance;


