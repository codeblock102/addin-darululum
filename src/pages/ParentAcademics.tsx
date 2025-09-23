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
import { Calendar, ClipboardList, GraduationCap, FileText, Loader2, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { useIsMobile } from "@/hooks/use-mobile.tsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";

const ParentAcademics = () => {
  const { children } = useParentChildren();
  const isMobile = useIsMobile();
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
  type AssignmentRow = {
    id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    attachment_name: string | null;
    attachment_url: string | null;
    student_ids: string[];
  };
  type SubmissionRow = {
    assignment_id: string;
    status: "assigned" | "submitted" | "graded";
    submitted_at: string | null;
    graded_at: string | null;
    grade: number | null;
    feedback: string | null;
  };
  type AssignmentListItem = {
    id: string; // composite `${assignmentId}:${studentId}`
    status: SubmissionRow["status"] | "assigned";
    submitted_at: string | null;
    graded_at: string | null;
    grade: number | null;
    feedback: string | null;
    assignment: Pick<AssignmentRow, "id" | "title" | "description" | "due_date" | "attachment_name" | "attachment_url">;
  };

  const { data: submissions, isLoading: loadingAssignments } = useQuery<AssignmentListItem[]>({
    queryKey: ["parent-academics-assignments", selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [] as AssignmentListItem[];
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

      let assigns: AssignmentRow[] | undefined = pick as AssignmentRow[] | undefined;
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
        assigns = (assignsCs as AssignmentRow[]) || [];
      }

      // Debug: verify array membership
      console.log("[ParentAcademics] selected:", selectedStudentId, "assignments count:", assigns?.length ?? 0);
      (assigns || []).forEach((a: AssignmentRow) => {
        const arr = a?.student_ids || [];
        const includes = Array.isArray(arr) ? arr.includes(selectedStudentId) : false;
        console.log("[ParentAcademics] assignment", a.id, "student_ids:", arr, "includes selected:", includes);
      });

      // Fetch submissions for this student for the returned assignments
      let submissionsByAssignment = new Map<string, SubmissionRow>();
      try {
        const assignmentIds = Array.from(new Set((assigns || []).map((a: AssignmentRow) => a.id)));
        if (assignmentIds.length > 0) {
          const { data: subs, error: subsErr } = await supabase
            .from("teacher_assignment_submissions")
            .select("assignment_id, status, submitted_at, graded_at, grade, feedback")
            .eq("student_id", selectedStudentId)
            .in("assignment_id", assignmentIds);
          if (subsErr) {
            console.error("[ParentAcademics] submissions fetch error:", subsErr);
          } else {
            submissionsByAssignment = new Map((subs || []).map((s: SubmissionRow) => [s.assignment_id, s]));
          }
        }
      } catch (e) {
        console.warn("[ParentAcademics] submissions fetch exception:", e);
      }

      return (assigns || []).map((a: AssignmentRow) => {
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
        } as AssignmentListItem;
      });
    },
    enabled: !!selectedStudentId,
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const filteredAssignments = useMemo<AssignmentListItem[]>(() => {
    const list = (submissions || []).filter((s: AssignmentListItem) => {
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

  // Assignment details modal state
  const [detailRow, setDetailRow] = useState<AssignmentListItem | null>(null);

  // Inline preview state for attachment inside the modal
  interface AttachmentPreviewState {
    url: string; // May be a blob: URL or a signed https URL
    ext: string;
    name: string;
    inline: boolean;
  }
  const [attachmentPreview, setAttachmentPreview] = useState<AttachmentPreviewState | null>(null);
  const [attachmentLoading, setAttachmentLoading] = useState(false);

  // Cleanup created object URLs when closing the modal
  useEffect(() => {
    return () => {
      if (attachmentPreview?.url && attachmentPreview.url.startsWith("blob:")) {
        URL.revokeObjectURL(attachmentPreview.url);
      }
    };
  }, [attachmentPreview?.url]);

  const showAttachmentInModal = async (pathOrUrl?: string | null, fileName?: string | null) => {
    if (!pathOrUrl) return;
    try {
      setAttachmentLoading(true);
      // Determine filename/extension and whether it can be shown inline
      const nameGuess = (fileName || "").trim() || (pathOrUrl.includes("/") ? pathOrUrl.substring(pathOrUrl.lastIndexOf("/") + 1) : "");
      const ext = nameGuess.toLowerCase().split(".").pop() || "";
      const inlineExts = new Set(["jpg","jpeg","png","gif","webp","svg","pdf"]);
      const isInline = inlineExts.has(ext);
      // Resolve a temporary URL (signed if storage path)
      let tempUrl = pathOrUrl;
      if (!/^https?:/i.test(pathOrUrl)) {
        const { data, error } = await supabase.storage
          .from("teacher-assignments")
          .createSignedUrl(pathOrUrl, 300);
        if (error) throw error;
        tempUrl = data?.signedUrl || "";
      }
      if (!tempUrl) return;

      if (isInline) {
        // Show inline directly via the signed URL (keeps headers/content-type for pdf/img)
        setAttachmentPreview({ url: tempUrl, ext, name: nameGuess || "Attachment", inline: true });
      } else {
        // Fetch as blob for download-only types to avoid exposing signed URL broadly
        const resp = await fetch(tempUrl);
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);
        setAttachmentPreview({ url: blobUrl, ext, name: nameGuess || "Attachment", inline: false });
      }
    } catch (e) {
      console.warn("Failed to open attachment:", e);
    } finally {
      setAttachmentLoading(false);
    }
  };

  // Auto-open attachment preview on mobile when opening details
  useEffect(() => {
    if (!detailRow) return;
    const url = detailRow.assignment?.attachment_url;
    if (isMobile && url && !attachmentPreview && !attachmentLoading) {
      // Fire and forget; errors handled inside showAttachmentInModal
      void showAttachmentInModal(url, detailRow.assignment?.attachment_name || null);
    }
  }, [detailRow, isMobile]);

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
                    type="button"
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
                  <Select onValueChange={(v) => setStatusFilter(v as typeof statusFilter)} value={statusFilter}>
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
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingAssignments ? (
                        <TableRow>
                          <TableCell colSpan={7}>Loading…</TableCell>
                        </TableRow>
                      ) : filteredAssignments && filteredAssignments.length > 0 ? (
                        filteredAssignments.map((row: AssignmentListItem) => (
                          <TableRow
                            key={row.id}
                            onClick={() => setDetailRow(row)}
                            className="cursor-pointer hover:bg-muted/30"
                          >
                            <TableCell className="font-medium">
                              {row.assignment?.title}
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
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline" onClick={() => setDetailRow(row)} className="hidden sm:inline-flex">View</Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
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

        {/* Assignment Details Modal */}
        <Dialog open={!!detailRow} onOpenChange={(open) => setDetailRow(open ? detailRow : null)}>
          <DialogContent className="inset-0 left-0 top-0 translate-x-0 translate-y-0 h-[100svh] max-h-[100svh] w-screen max-w-[100vw] overflow-x-hidden overflow-y-auto overscroll-contain box-border rounded-none p-3 shadow-none border border-border bg-background/98 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:translate-x-[-50%] sm:translate-y-[-50%] sm:h-auto sm:max-h-[85vh] sm:w-full sm:max-w-xl sm:rounded-lg sm:p-6 sm:shadow-lg">
            <DialogHeader>
              <DialogTitle>{detailRow?.assignment?.title || "Assignment Details"}</DialogTitle>
              <DialogDescription>
                Assigned work details and any attached file.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="h-1.5 rounded-full bg-gradient-to-r from-primary via-fuchsia-500 to-amber-500" />
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge>
                    {detailRow?.status ? detailRow.status.charAt(0).toUpperCase() + detailRow.status.slice(1) : "Assigned"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <Badge variant="secondary">
                    {detailRow?.assignment?.due_date || "No due date"}
                  </Badge>
                </div>
              </div>

              <Separator />
              <div className="rounded-md border bg-muted/30 p-3">
                <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Description</div>
                <div className="mt-1">{detailRow?.assignment?.description || "—"}</div>
              </div>
              <div className="rounded-md border bg-card/50 p-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Due Date</div>
                    <div>{detailRow?.assignment?.due_date || "—"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div className="capitalize">{detailRow?.status || "assigned"}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Submitted</div>
                    <div>{detailRow?.submitted_at ? new Date(detailRow.submitted_at).toLocaleString() : "—"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Graded</div>
                    <div>{detailRow?.graded_at ? new Date(detailRow.graded_at).toLocaleString() : "—"}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Grade</div>
                    <div>{detailRow?.grade ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Feedback</div>
                    <div>{detailRow?.feedback ?? "—"}</div>
                  </div>
                </div>
              </div>
              <Separator />
              {detailRow?.assignment?.attachment_url && (
                <div className="pt-1 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Paperclip className="h-4 w-4" /> Attachment
                  </div>
                  <Button
                    size="sm"
                    variant="default"
                    className="text-sm rounded-full shadow-sm px-4"
                    disabled={attachmentLoading}
                    aria-label={`Open attachment${detailRow.assignment.attachment_name ? `: ${detailRow.assignment.attachment_name}` : ""}`}
                    onClick={() =>
                      showAttachmentInModal(
                        detailRow.assignment.attachment_url,
                        detailRow.assignment.attachment_name,
                      )
                    }
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Open file
                  </Button>
                </div>
              )}
          {attachmentLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading attachment…
            </div>
          )}
          {attachmentPreview && (
            <div className="mt-3 rounded-lg border shadow-sm overflow-hidden bg-muted/20">
              {attachmentPreview.inline ? (
                attachmentPreview.ext === "pdf" ? (
                  <iframe src={attachmentPreview.url} title={attachmentPreview.name} style={{ width: "100%", height: "65svh", border: 0 }} />
                ) : (
                  <img src={attachmentPreview.url} alt={attachmentPreview.name} style={{ maxWidth: "100%", height: "auto", display: "block" }} />
                )
              ) : (
                <div className="p-3 text-sm text-muted-foreground">
                  This file type cannot be previewed. Use Download instead.
                </div>
              )}
              <div className="p-2 flex gap-2 justify-end border-t bg-background">
                <Button variant="secondary" onClick={() => {
                  if (attachmentPreview?.url && attachmentPreview.url.startsWith("blob:")) URL.revokeObjectURL(attachmentPreview.url);
                  setAttachmentPreview(null);
                }}>Close Preview</Button>
                <Button onClick={() => {
                  if (attachmentPreview) {
                    const a = document.createElement("a");
                    a.href = attachmentPreview.url;
                    a.download = attachmentPreview.name || "attachment";
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                  }
                }}>Download</Button>
              </div>
            </div>
          )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
};

export default ParentAcademics;


