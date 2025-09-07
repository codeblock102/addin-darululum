import { ProtectedRoute } from "@/components/auth/ProtectedRoute.tsx";
import { useParentChildren } from "@/hooks/useParentChildren.ts";
import { useEffect, useMemo, useState } from "react";
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

  // Ensure a default child is selected once children load
  useEffect(() => {
    if (!selectedStudentId && children && children.length > 0) {
      setSelectedStudentId(children[0].id);
    }
  }, [children, selectedStudentId]);

  // Debug: compare parent children IDs and selected student
  useEffect(() => {
    try {
      const childIds = (children || []).map((c) => c.id);
      console.log("[ParentAcademics] Parent children IDs:", childIds);
      console.log("[ParentAcademics] Selected student ID:", selectedStudentId);
    } catch (e) {
      console.warn("[ParentAcademics] Debug logging failed:", e);
    }
  }, [children, selectedStudentId]);

  // Remove stray debug log

  // Assignments for selected child
  const { data: submissions, isLoading: loadingAssignments } = useQuery({
    queryKey: ["parent-academics-assignments", selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [] as any[];
      // DEV debug: can this user read any assignments at all (RLS check)?
      if (import.meta.env.DEV) {
        const { data: anyRow, error: anyErr } = await supabase
          .from("teacher_assignments")
          .select("id")
          .limit(1);
        console.log("[ParentAcademics] RLS probe — any assignment visible?", { anyCount: anyRow?.length || 0, anyErr });
      }

      // Fetch assignments directly targeting this child; avoid submissions endpoint to prevent 500s
      console.log("[ParentAcademics] fetching assignments (overlaps) for:", selectedStudentId);
      const { data: assignsOv, error: assignsOvError } = await supabase
        .from("teacher_assignments")
        .select("id, title, description, due_date, attachment_name, attachment_url, student_ids")
        .overlaps("student_ids", [selectedStudentId])
        .order("due_date", { ascending: false });
      if (assignsOvError) {
        console.error("[ParentAcademics] overlaps query error:", assignsOvError);
      }
      const pick = (assignsOv && assignsOv.length > 0) ? assignsOv : undefined;

      let assigns = pick;
      if (!assigns) {
        console.log("[ParentAcademics] no results via overlaps; trying contains() for:", selectedStudentId);
        const { data: assignsCs, error: assignsCsError } = await supabase
          .from("teacher_assignments")
          .select("id, title, description, due_date, attachment_name, attachment_url, student_ids")
          .contains("student_ids", [selectedStudentId])
          .order("due_date", { ascending: false });
        if (assignsCsError) {
          console.error("[ParentAcademics] contains query error:", assignsCsError);
        }
        assigns = assignsCs || [];
      }

      // Debug: verify array membership
      console.log("[ParentAcademics] selected:", selectedStudentId, "assignments count:", assigns?.length ?? 0);
      (assigns || []).forEach((a: any) => {
        const arr = a?.student_ids || [];
        const includes = Array.isArray(arr) ? arr.includes(selectedStudentId) : false;
        console.log("[ParentAcademics] assignment", a.id, "student_ids:", arr, "includes selected:", includes);
      });

      // Fetch submissions for this student for the returned assignments
      let submissionsByAssignment = new Map<string, any>();
      try {
        const assignmentIds = Array.from(new Set((assigns || []).map((a: any) => a.id)));
        if (assignmentIds.length > 0) {
          const { data: subs, error: subsErr } = await supabase
            .from("teacher_assignment_submissions")
            .select("assignment_id, status, submitted_at, graded_at, grade, feedback")
            .eq("student_id", selectedStudentId)
            .in("assignment_id", assignmentIds);
          if (subsErr) {
            console.error("[ParentAcademics] submissions fetch error:", subsErr);
          } else {
            submissionsByAssignment = new Map((subs || []).map((s: any) => [s.assignment_id, s]));
          }
        }
      } catch (e) {
        console.warn("[ParentAcademics] submissions fetch exception:", e);
      }

      return (assigns || []).map((a: any) => {
        const sub = submissionsByAssignment.get(a.id);
        return {
          id: `${a.id}:${selectedStudentId}`,
          status: sub?.status || "assigned",
          submitted_at: sub?.submitted_at || null,
          graded_at: sub?.graded_at || null,
          grade: sub?.grade ?? null,
          feedback: sub?.feedback ?? null,
          assignment: {
            id: a.id,
            title: a.title,
            description: a.description,
            due_date: a.due_date,
            attachment_name: a.attachment_name,
            attachment_url: a.attachment_url,
          },
        };
      });
    },
    enabled: !!selectedStudentId,
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
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
            <div className="-mx-1 mb-4">
              <div className="flex gap-2 overflow-x-auto whitespace-nowrap px-1 py-1">
                {children.map((child) => (
                  <button
                    key={child.id}
                    className={`px-3 py-2 rounded border shrink-0 ${selectedStudentId === child.id ? "bg-primary text-primary-foreground" : "bg-background"}`}
                    onClick={() => setSelectedStudentId(child.id)}
                  >
                    {child.name}
                  </button>
                ))}
              </div>
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
                {import.meta.env.DEV && (
                  <div className="text-xs text-foreground/70">
                    Debug — children: {(children || []).map((c) => c.id).join(", ")} | selected: {selectedStudentId || "none"} | rows: {filteredAssignments?.length || 0}
                  </div>
                )}
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


