import { useParentChildren } from "@/hooks/useParentChildren.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client.ts";
import { useQuery } from "@tanstack/react-query";
import { Tables } from "@/types/supabase.ts";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute.tsx";
// Removed Add Parent tab from parent dashboard; sidebar page is the source of truth
import { useToast } from "@/hooks/use-toast.ts";

const Parent = () => {
  const { children, isLoading } = useParentChildren();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(children[0]?.id ?? null);
  const { toast: _toast } = useToast();

  const { data: progressEntries } = useQuery({
    queryKey: ["parent-student-progress", selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      const { data, error } = await supabase
        .from("progress")
        .select("*, students(name)")
        .eq("student_id", selectedStudentId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStudentId,
  });

  const { data: attendance } = useQuery<Tables<"attendance">[] | null>({
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

  const { data: assignments } = useQuery({
    queryKey: ["parent-student-assignments", selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      const { data, error } = await supabase
        .from("teacher_assignments")
        .select("id, title, description, due_date, status, student_ids")
        .contains("student_ids", [selectedStudentId]);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStudentId,
  });

  // Add Parent flow removed from parent dashboard

  return (
    <ProtectedRoute requireParent>
      <div className="space-y-6 animate-fadeIn">
        <Card>
          <CardHeader>
            <CardTitle>Parent Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {isLoading && <span>Loading children...</span>}
              {!isLoading && children.length === 0 && <span>No linked children found.</span>}
              {children.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  className={`px-3 py-2 rounded border ${selectedStudentId === child.id ? "bg-primary text-primary-foreground" : "bg-background"}`}
                  onClick={() => setSelectedStudentId(child.id)}
                >
                  {child.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedStudentId && (
          <Tabs defaultValue="quran" className="w-full">
            <TabsList>
              <TabsTrigger value="quran">Qur'an</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="assignments">Current Work</TabsTrigger>
            </TabsList>
            <TabsContent value="quran">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Qur'an Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(progressEntries || []).map((p: Tables<"progress">) => (
                      <li key={p.id} className="p-3 rounded border">
                        <div className="text-sm text-muted-foreground">{new Date(p.created_at).toLocaleString()}</div>
                        <div>Surah {p.current_surah ?? "-"}, Juz {p.current_juz ?? "-"}, Verses {p.start_ayat ?? "-"}-{p.end_ayat ?? "-"}</div>
                        {p.memorization_quality && <div>Quality: {p.memorization_quality}</div>}
                        {p.notes && <div className="text-sm">Notes: {p.notes}</div>}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="attendance">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(attendance || []).map((a: Tables<"attendance">) => (
                      <li key={a.id} className="p-3 rounded border flex justify-between">
                        <span>{a.date}</span>
                        <span className="uppercase">{a.status}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="assignments">
              <Card>
                <CardHeader>
                  <CardTitle>Current Work</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(assignments || []).map((as: { id: string; title: string; description: string | null; due_date: string | null; status: string }) => (
                      <li key={as.id} className="p-3 rounded border">
                        <div className="font-medium">{as.title}</div>
                        {as.description && <div className="text-sm text-muted-foreground">{as.description}</div>}
                        <div className="text-sm">Due: {as.due_date ?? "-"} | Status: {as.status}</div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default Parent;


