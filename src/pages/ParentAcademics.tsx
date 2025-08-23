import { ProtectedRoute } from "@/components/auth/ProtectedRoute.tsx";
import { useParentChildren } from "@/hooks/useParentChildren.ts";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Input } from "@/components/ui/input.tsx";
import { supabase } from "@/integrations/supabase/client.ts";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ClipboardList, GraduationCap } from "lucide-react";

const ParentAcademics = () => {
  const { children } = useParentChildren();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(children[0]?.id ?? null);
  const [statusFilter, setStatusFilter] = useState<"all" | "assigned" | "submitted" | "graded">("all");
  const [search, setSearch] = useState("");

  // Assignments for selected child
  const { data: submissions, isLoading: loadingAssignments } = useQuery({
    queryKey: ["parent-academics-assignments", selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [] as any[];
      const { data, error } = await supabase
        .from("teacher_assignment_submissions")
        .select(
          "id, status, submitted_at, graded_at, grade, feedback, assignment:teacher_assignments(id, title, description, due_date, attachment_name, attachment_url)"
        )
        .eq("student_id", selectedStudentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStudentId,
  });

  const filteredAssignments = useMemo(() => {
    const list = (submissions || []).filter((s: any) => {
      if (!s.assignment) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          s.assignment.title.toLowerCase().includes(q) ||
          (s.assignment.description || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
    return list;
  }, [submissions, statusFilter, search]);

  return (
    <ProtectedRoute requireParent>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Academics</CardTitle>
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
            <Tabs defaultValue="assignments" className="w-full">
              <TabsList className="grid grid-cols-2 sm:grid-cols-3 w-full">
                <TabsTrigger value="assignments" className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  <span>Assignments</span>
                </TabsTrigger>
                <TabsTrigger value="grades" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>Grades</span>
                </TabsTrigger>
                <TabsTrigger value="reports" className="hidden sm:flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Reports</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="assignments" className="mt-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Select onValueChange={(v) => setStatusFilter(v as any)} value={statusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="graded">Graded</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="sm:col-span-2">
                    <Input placeholder="Search assignments" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                </div>

                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead className="hidden sm:table-cell">Description</TableHead>
                        <TableHead>Due</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                        <TableHead className="hidden md:table-cell">Feedback</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingAssignments ? (
                        <TableRow>
                          <TableCell colSpan={6}>Loading…</TableCell>
                        </TableRow>
                      ) : filteredAssignments && filteredAssignments.length > 0 ? (
                        filteredAssignments.map((row: any) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">
                              {row.assignment?.attachment_url ? (
                                <a href={row.assignment.attachment_url} target="_blank" rel="noreferrer" className="underline">
                                  {row.assignment?.title}
                                </a>
                              ) : (
                                row.assignment?.title
                              )}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-foreground/80">
                              {row.assignment?.description || "—"}
                            </TableCell>
                            <TableCell>
                              {row.assignment?.due_date || "—"}
                            </TableCell>
                            <TableCell className="capitalize">{row.status}</TableCell>
                            <TableCell className="text-center">{row.grade ?? "—"}</TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-foreground/80">
                              {row.feedback ?? "—"}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                            No assignments found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="grades" className="mt-4">
                <div className="text-sm text-muted-foreground">Grades view coming soon.</div>
              </TabsContent>

              <TabsContent value="reports" className="mt-4">
                <div className="text-sm text-muted-foreground">Reports view coming soon.</div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default ParentAcademics;


