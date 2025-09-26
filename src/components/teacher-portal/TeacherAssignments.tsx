import { useEffect as _useEffect, useMemo, useRef, useState } from "react";
import { Assignment, AssignmentStatus, NewAssignmentInput } from "@/types/assignment.ts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { useTeacherClasses } from "@/hooks/useTeacherClasses.ts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/components/ui/use-toast.ts";
import { Calendar, CheckCircle2, Clock, FileUp, Trash2, Upload, MessageSquare as _MessageSquare, MessageSquarePlus, MessageSquareText, Loader2, Save } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog.tsx";
import { useI18n } from "@/contexts/I18nContext.tsx";
import { useIsMobile } from "@/hooks/use-mobile.tsx";

interface TeacherAssignmentsProps {
  teacherId: string;
}

export const TeacherAssignments = ({ teacherId }: TeacherAssignmentsProps) => {
  const { toast } = useToast();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<NewAssignmentInput>({ title: "", description: "", dueDate: "", file: null });
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"create" | "list">("create");
  const [listFilter, setListFilter] = useState<"all" | "pending" | "overdue" | "completed">("all");
  const [openSubmissions, setOpenSubmissions] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isMobile = useIsMobile();

  // Attachment preview modal state (desktop only)
  interface AttachmentPreviewState {
    url: string;
    ext: string;
    name: string;
    inline: boolean;
  }
  const [attachmentPreview, setAttachmentPreview] = useState<AttachmentPreviewState | null>(null);
  const [attachmentLoading, setAttachmentLoading] = useState(false);

  // Cleanup any blob URLs when closing
  _useEffect(() => {
    return () => {
      if (attachmentPreview?.url && attachmentPreview.url.startsWith("blob:")) {
        URL.revokeObjectURL(attachmentPreview.url);
      }
    };
  }, [attachmentPreview?.url]);

  const guessMimeType = (filename: string): string => {
    const ext = filename.toLowerCase().split(".").pop() || "";
    switch (ext) {
      case "jpg":
      case "jpeg": return "image/jpeg";
      case "png": return "image/png";
      case "gif": return "image/gif";
      case "webp": return "image/webp";
      case "svg": return "image/svg+xml";
      case "pdf": return "application/pdf";
      case "txt": return "text/plain";
      case "csv": return "text/csv";
      case "json": return "application/json";
      case "doc": return "application/msword";
      case "docx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      case "xls": return "application/vnd.ms-excel";
      case "xlsx": return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      case "ppt": return "application/vnd.ms-powerpoint";
      case "pptx": return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
      case "zip": return "application/zip";
      case "rar": return "application/vnd.rar";
      case "7z": return "application/x-7z-compressed";
      default: return "application/octet-stream";
    }
  };

  const { data: classes } = useTeacherClasses(teacherId);

  const { data: students } = useQuery({
    queryKey: ["assignment-students", teacherId, selectedClassIds],
    queryFn: async () => {
      if (selectedClassIds.length === 0) return [] as { id: string; name: string }[];

      const { data: cls, error: clsErr } = await supabase
        .from("classes")
        .select("current_students, id")
        .in("id", selectedClassIds);
      if (clsErr) return [] as { id: string; name: string }[];
      const studentIds = (cls || [])
        .flatMap((c: { current_students?: string[] }) => c.current_students || [])
        .filter((id: string, i: number, arr: string[]) => id && arr.indexOf(id) === i);
      if (studentIds.length === 0) return [] as { id: string; name: string }[];
      const { data: st, error: stErr } = await supabase
        .from("students")
        .select("id, name")
        .in("id", studentIds)
        .order("name", { ascending: true });
      if (stErr) return [] as { id: string; name: string }[];
      return (st || []) as { id: string; name: string }[];
    },
    enabled: true,
  });

  const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ["teacher-assignments", teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_assignments")
        .select("id, title, description, due_date, status, attachment_name, attachment_url, class_ids, student_ids, created_at, updated_at")
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((row) => ({
        id: row.id,
        teacherId,
        title: row.title,
        description: row.description ?? "",
        dueDate: row.due_date ?? undefined,
        status: row.status as AssignmentStatus,
        attachmentName: row.attachment_name ?? undefined,
        attachmentUrl: row.attachment_url ?? undefined,
        classIds: row.class_ids ?? [],
        studentIds: row.student_ids ?? [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })) as Assignment[];
    },
    enabled: !!teacherId,
  });

  const handleFilePick = () => fileInputRef.current?.click();

  const resetForm = () => {
    setForm({ title: "", description: "", dueDate: "", file: null });
    setSelectedClassIds([]);
    setSelectedStudentIds([]);
  };

  const createAssignment = async () => {
    if (!form.title.trim()) return;

    try {
      // 1) Create assignment first to obtain the id
      const { data: inserted, error } = await supabase.from("teacher_assignments").insert({
        teacher_id: teacherId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        due_date: form.dueDate || null,
        status: "pending",
        // attachment fields will be set after upload (if any)
        attachment_name: null,
        attachment_url: null,
        class_ids: selectedClassIds,
        student_ids: selectedStudentIds,
      }).select("id").single();
      if (error) throw error;

      // Seed submissions for targeted students for immediate visibility
      const assignmentId = inserted?.id as string;
      if (assignmentId) {
        // 2) If there is a file, upload to storage and update the row with storage path
        if (form.file) {
          try {
            const file = form.file as File;
            const bucket = "teacher-assignments";
            const sanitized = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
            const objectPath = `${teacherId}/${assignmentId}/${Date.now()}_${sanitized}`;
            const resolvedContentType = file.type && file.type.trim() !== "" ? file.type : guessMimeType(file.name);
            const { error: uploadErr } = await supabase.storage.from(bucket).upload(objectPath, file, {
              cacheControl: "3600",
              upsert: true,
              contentType: resolvedContentType,
            });
            if (uploadErr) throw uploadErr;
            await supabase
              .from("teacher_assignments")
              .update({ attachment_name: file.name, attachment_url: objectPath })
              .eq("id", assignmentId)
              .eq("teacher_id", teacherId);
          } catch (uploadOrUpdateErr) {
            console.warn("Attachment upload/update failed:", uploadOrUpdateErr);
          }
        }

        let targetStudentIds: string[] = [];
        if (selectedStudentIds.length > 0) {
          targetStudentIds = [...selectedStudentIds];
        } else if (selectedClassIds.length > 0) {
          const { data: cls } = await supabase
            .from("classes")
            .select("current_students, id")
            .in("id", selectedClassIds);
          const ids = (cls || [])
            .flatMap((c: { current_students?: string[] }) => c.current_students || [])
            .filter((id: string, i: number, arr: string[]) => id && arr.indexOf(id) === i);
          targetStudentIds = ids;
        }

        if (targetStudentIds.length > 0) {
          const rows = targetStudentIds.map((sid) => ({ assignment_id: assignmentId, student_id: sid, status: "assigned" as const }));
          // Insert in chunks to avoid payload limits
          const chunkSize = 500;
          for (let i = 0; i < rows.length; i += chunkSize) {
            const chunk = rows.slice(i, i + chunkSize);
            const { error: subErr } = await supabase.from("teacher_assignment_submissions").insert(chunk);
            if (subErr) {
              // Non-fatal; continue
              console.warn("Failed to seed some submissions:", subErr.message);
              break;
            }
          }
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["teacher-assignments", teacherId] });
      await queryClient.invalidateQueries({ queryKey: ["teacher-assignment-submissions"] });
      resetForm();
      toast({ title: t("pages.teacherPortal.assignments.toastCreated", "Assignment created"), description: t("pages.teacherPortal.assignments.toastSaved", "Saved to database.") });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: t("pages.teacherPortal.assignments.toastCreateFailed", "Failed to create assignment"), description: message || t("pages.teacherPortal.assignments.toastCreateFailedDesc", "Check that migrations are applied and you are logged in."), variant: "destructive" });
    }
  };

  const deleteAssignment = async (id: string) => {
    try {
      const { error } = await supabase.from("teacher_assignments").delete().eq("id", id).eq("teacher_id", teacherId);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["teacher-assignments", teacherId] });
      toast({ title: t("pages.teacherPortal.assignments.toastDeleted", "Assignment deleted") });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: t("pages.teacherPortal.assignments.toastDeleteFailed", "Delete failed"), description: message, variant: "destructive" });
    }
  };

  const markCompleted = async (id: string) => {
    try {
      const { error } = await supabase.from("teacher_assignments").update({ status: "completed" }).eq("id", id).eq("teacher_id", teacherId);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["teacher-assignments", teacherId] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: t("pages.teacherPortal.assignments.toastUpdateFailed", "Update failed"), description: message, variant: "destructive" });
    }
  };

  const markPending = async (id: string) => {
    try {
      const { error } = await supabase.from("teacher_assignments").update({ status: "pending" }).eq("id", id).eq("teacher_id", teacherId);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["teacher-assignments", teacherId] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: t("pages.teacherPortal.assignments.toastUpdateFailed", "Update failed"), description: message, variant: "destructive" });
    }
  };

  const computedAssignments = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return (assignments || []).map((a) => {
      if (a.status === "completed" || !a.dueDate) return a;
      if (a.dueDate < today) {
        return { ...a, status: "overdue" as AssignmentStatus };
      }
      return a;
    });
  }, [assignments]);

  const visibleAssignments = useMemo(() => {
    if (listFilter === "all") return computedAssignments;
    return computedAssignments.filter((a) => a.status === listFilter);
  }, [computedAssignments, listFilter]);

  const openAttachmentFromPath = async (pathOrUrl?: string | null, fileName?: string | null) => {
    if (!pathOrUrl) return;
    try {
      const nameGuess = (fileName || "").trim() || (pathOrUrl.includes("/") ? pathOrUrl.substring(pathOrUrl.lastIndexOf("/") + 1) : "");

      // Resolve a temporary URL to fetch the file (signed if storage path)
      let tempUrl = pathOrUrl;
      if (!/^https?:/i.test(pathOrUrl)) {
        const { data } = await supabase.storage
          .from("teacher-assignments")
          .createSignedUrl(pathOrUrl, 300);
        tempUrl = data?.signedUrl || "";
      }
      if (!tempUrl) return;

      // Open a new tab immediately to avoid popup blockers, then stream the blob into it
      const newTab = window.open("about:blank", "_blank", "noopener,noreferrer");

      // Fetch as blob so we can mask the superseded URL
      const resp = await fetch(tempUrl);
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);

      if (newTab) {
        try {
          newTab.document.title = nameGuess || "Attachment";
        } catch (_e) {
          // ignore cross-origin title set failures
        }
        newTab.location.href = blobUrl;
      } else {
        // Fallback if pop-up blocked
        const a = document.createElement("a");
        a.href = blobUrl;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.download = nameGuess || "attachment";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }

      // Do not revoke the object URL immediately; it may be in use by the new tab
    } catch (e) {
      console.warn("Failed to open attachment:", e);
    }
  };

  // Desktop modal preview (images, pdf inline; others via blob with download)
  const showAttachmentInModal = async (pathOrUrl?: string | null, fileName?: string | null) => {
    if (!pathOrUrl) return;
    try {
      setAttachmentLoading(true);
      const nameGuess = (fileName || "").trim() || (pathOrUrl.includes("/") ? pathOrUrl.substring(pathOrUrl.lastIndexOf("/") + 1) : "");
      const ext = nameGuess.toLowerCase().split(".").pop() || "";
      const inlineExts = new Set(["jpg","jpeg","png","gif","webp","svg","pdf"]);
      const isInline = inlineExts.has(ext);

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
        setAttachmentPreview({ url: tempUrl, ext, name: nameGuess || "Attachment", inline: true });
      } else {
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

  const handleAttachmentClick = (pathOrUrl?: string | null, fileName?: string | null) => {
    if (isMobile) {
      // Keep mobile behavior: open in a new tab
      void openAttachmentFromPath(pathOrUrl, fileName);
    } else {
      void showAttachmentInModal(pathOrUrl, fileName);
    }
  };

  const toggleSubmissions = (id: string) => {
    setOpenSubmissions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{t("pages.teacherPortal.assignments.title", "Assignments")}</h2>
          <p className="text-sm text-foreground">{t("pages.teacherPortal.assignments.subtitle", "Create and track assignments for your students")}</p>
        </div>
        <div className="inline-flex rounded-md border bg-card p-1">
          <Button variant={activeTab === "create" ? "default" : "ghost"} onClick={() => setActiveTab("create")}>{t("pages.teacherPortal.assignments.tabs.create", "Create")}</Button>
          <Button variant={activeTab === "list" ? "default" : "ghost"} onClick={() => setActiveTab("list")}>{t("pages.teacherPortal.assignments.tabs.list", "My Assignments")}</Button>
        </div>
      </div>

      {activeTab === "create" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">{t("pages.teacherPortal.assignments.stepRecipients.title", "Step 1: Choose recipients")}</CardTitle>
            <CardDescription className="text-foreground/80">{t("pages.teacherPortal.assignments.stepRecipients.desc", "Select classes and optionally specific students")}</CardDescription>
          </CardHeader>
          <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">{t("pages.teacherPortal.assignments.nameLabel", "Name of assignment")}</label>
              <Input
                placeholder={t("pages.teacherPortal.assignments.namePlaceholder", "e.g., Term 1 Essay")}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground flex items-center gap-2"><Calendar className="w-4 h-4" /> {t("pages.teacherPortal.assignments.dueDate", "Due date")}</label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">{t("pages.teacherPortal.assignments.classes", "Classes")}</label>
              <div className="border rounded-md p-2 max-h-48 overflow-auto bg-background">
                {(classes || []).length === 0 && (<div className="text-sm text-foreground/80">{t("pages.teacherPortal.assignments.noClasses", "No classes found.")}</div>)}
                {(classes || []).map((c: { id: string; name: string }) => (
                  <label key={c.id} className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={selectedClassIds.includes(c.id)}
                      onChange={(e) => {
                        setSelectedClassIds((prev) => e.target.checked ? [...prev, c.id] : prev.filter((id) => id !== c.id));
                      }}
                    />
                    <span className="text-sm">{c.name}</span>
                  </label>
                ))}
              </div>
              <div className="text-xs text-foreground/80">{t("pages.teacherPortal.assignments.tip", "Tip: Select classes first, then pick specific students if needed.")}</div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">{t("pages.teacherPortal.assignments.students", "Students")}</label>
              <Input placeholder={t("pages.teacherPortal.assignments.searchStudents", "Search students")} value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="bg-background" />
              <div className="border rounded-md p-2 max-h-64 md:max-h-48 overflow-auto bg-background">
                {(students || []).length === 0 && (<div className="text-sm text-foreground/80">{t("pages.teacherPortal.assignments.selectClassesToLoad", "Select classes to load students.")}</div>)}
                {(students || [])
                  .filter((s: { id: string; name: string }) => s.name.toLowerCase().includes(studentSearch.toLowerCase()))
                  .map((s: { id: string; name: string }) => (
                  <label key={s.id} className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={selectedStudentIds.includes(s.id)}
                      onChange={(e) => {
                        setSelectedStudentIds((prev) => e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id));
                      }}
                    />
                    <span className="text-sm">{s.name}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-foreground/80">{t("pages.teacherPortal.assignments.overrideNote", "Selecting students overrides classes for targeting. Leave students empty to assign to all students in selected classes.")}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="secondary">{selectedClassIds.length} {t("pages.teacherPortal.assignments.classesLabel", "classes")}</Badge>
                <Badge variant="secondary">{selectedStudentIds.length} {t("pages.teacherPortal.assignments.studentsLabel", "students")}</Badge>
                <Button variant="outline" size="sm" onClick={() => { setSelectedStudentIds([]); setSelectedClassIds([]); }}>{t("pages.teacherPortal.assignments.clearSelections", "Clear selections")}</Button>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <label className="text-sm font-medium text-foreground">{t("pages.teacherPortal.assignments.description", "Description")}</label>
            <Textarea
              placeholder={t("pages.teacherPortal.assignments.descriptionPlaceholder", "Provide clear instructions and expectations...")}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4}
            />
          </div>

          <div className="mt-4 flex flex-col md:flex-row md:items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => setForm((f) => ({ ...f, file: e.target.files?.[0] || null }))}
            />
            <Button type="button" variant="secondary" onClick={handleFilePick}>
              <Upload className="w-4 h-4 mr-2" /> {t("pages.teacherPortal.assignments.attachFile", "Attach file")}
            </Button>
            {form.file && (
              <span className="text-sm text-muted-foreground truncate">
                {form.file.name} ({(form.file.type && form.file.type.trim() !== "") ? form.file.type : guessMimeType(form.file.name)})
              </span>
            )}
            <div className="md:ml-auto flex gap-2">
              <Button type="button" disabled={!form.title || (selectedClassIds.length === 0 && selectedStudentIds.length === 0)} onClick={createAssignment}>
                <FileUp className="w-4 h-4 mr-2" /> {t("pages.teacherPortal.assignments.create", "Create assignment")}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>{t("pages.teacherPortal.assignments.clear", "Clear")}</Button>
            </div>
          </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "list" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">{t("pages.teacherPortal.assignments.listTitle", "My Assignments")}</CardTitle>
            <CardDescription className="text-foreground/80">{t("pages.teacherPortal.assignments.listDesc", "Track status and manage submissions")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-sm">{t("pages.teacherPortal.assignments.filter", "Filter:")}</span>
              <Button size="sm" variant={listFilter === "all" ? "default" : "outline"} onClick={() => setListFilter("all")}>{t("pages.teacherPortal.assignments.filters.all", "All")}</Button>
              <Button size="sm" variant={listFilter === "pending" ? "default" : "outline"} onClick={() => setListFilter("pending")}>{t("pages.teacherPortal.assignments.filters.pending", "Pending")}</Button>
              <Button size="sm" variant={listFilter === "overdue" ? "default" : "outline"} onClick={() => setListFilter("overdue")}>{t("pages.teacherPortal.assignments.filters.overdue", "Overdue")}</Button>
              <Button size="sm" variant={listFilter === "completed" ? "default" : "outline"} onClick={() => setListFilter("completed")}>{t("pages.teacherPortal.assignments.filters.completed", "Completed")}</Button>
            </div>
          <div className="space-y-4">
            {isLoadingAssignments && (<p className="text-sm text-foreground">{t("pages.teacherPortal.assignments.loading", "Loading assignments…")}</p>)}
            {!isLoadingAssignments && visibleAssignments.length === 0 && (<p className="text-sm text-foreground">{t("pages.teacherPortal.assignments.empty", "No assignments yet.")}</p>)}

            <div className="grid grid-cols-1 gap-3">
              {visibleAssignments.map((a) => (
                <div key={a.id} className="p-4 border rounded-lg bg-card/50 flex flex-col gap-3 overflow-hidden">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{a.title}</span>
                      {a.status === "completed" && <Badge variant="secondary"><CheckCircle2 className="w-3 h-3 mr-1" /> {t("pages.teacherPortal.assignments.status.completed", "Completed")}</Badge>}
                      {a.status === "pending" && <Badge><Clock className="w-3 h-3 mr-1" /> {t("pages.teacherPortal.assignments.status.pending", "Pending")}</Badge>}
                      {a.status === "overdue" && <Badge variant="destructive">{t("pages.teacherPortal.assignments.status.overdue", "Overdue")}</Badge>}
                    </div>
                    {a.description && (
                      <p className="text-sm text-foreground mt-1">{a.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-foreground/80 mt-2 flex-wrap">
                      {a.dueDate && <span>{t("pages.teacherPortal.assignments.meta.due", "Due:")} {a.dueDate}</span>}
                      <Separator orientation="vertical" />
                      <span>{t("pages.teacherPortal.assignments.meta.created", "Created:")} {new Date(a.createdAt).toLocaleString()}</span>
                      {a.attachmentName && a.attachmentUrl && (
                        <>
                          <Separator orientation="vertical" />
                          <button className="underline text-left" type="button" onClick={() => handleAttachmentClick(a.attachmentUrl, a.attachmentName)}>{a.attachmentName}</button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {a.status !== "completed" ? (
                      <Button size="sm" variant="secondary" onClick={() => markCompleted(a.id)}>
                        <CheckCircle2 className="w-4 h-4 mr-1" /> {t("pages.teacherPortal.assignments.actions.markCompleted", "Mark completed")}
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => markPending(a.id)}>
                        <Clock className="w-4 h-4 mr-1" /> {t("pages.teacherPortal.assignments.actions.markPending", "Mark pending")}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => deleteAssignment(a.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <div className="ml-auto">
                      <Button size="sm" variant="outline" onClick={() => toggleSubmissions(a.id)}>
                        {openSubmissions.has(a.id) ? t("pages.teacherPortal.assignments.actions.hideSubmissions", "Hide submissions") : t("pages.teacherPortal.assignments.actions.manageSubmissions", "Manage submissions")}
                      </Button>
                    </div>
                  </div>

                  {openSubmissions.has(a.id) && (
                    <div className="w-full overflow-x-auto">
                      <AssignmentSubmissions assignmentId={a.id} classIds={a.classIds || []} explicitStudentIds={a.studentIds || []} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* Attachment Preview Modal (desktop) */}
          {!isMobile && (
            <Dialog open={!!attachmentPreview || attachmentLoading} onOpenChange={(open) => {
              if (!open) {
                if (attachmentPreview?.url && attachmentPreview.url.startsWith("blob:")) URL.revokeObjectURL(attachmentPreview.url);
                setAttachmentPreview(null);
                setAttachmentLoading(false);
              }
            }}>
              <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{attachmentPreview?.name || t("pages.teacherPortal.assignments.attachment", "Attachment")}</DialogTitle>
                </DialogHeader>
                <div className="min-h-[200px]">
                  {attachmentLoading && (
                    <div className="h-[50svh] flex items-center justify-center text-sm text-muted-foreground">
                      {t("pages.teacherPortal.assignments.loadingAttachment", "Loading attachment…")}
                    </div>
                  )}
                  {!attachmentLoading && attachmentPreview && (
                    <div className="mt-3 rounded-lg border shadow-sm overflow-hidden bg-muted/20">
                      {attachmentPreview.inline ? (
                        attachmentPreview.ext === "pdf" ? (
                          <iframe src={attachmentPreview.url} title={attachmentPreview.name} style={{ width: "100%", height: "65svh", border: 0 }} />
                        ) : (
                          <img src={attachmentPreview.url} alt={attachmentPreview.name} style={{ maxWidth: "100%", height: "auto", display: "block" }} />
                        )
                      ) : (
                        <div className="p-3 text-sm text-muted-foreground">
                          {t("pages.teacherPortal.assignments.noPreview", "This file type cannot be previewed. Use Download instead.")}
                        </div>
                      )}
                      <div className="p-2 flex gap-2 justify-end border-t bg-background">
                        <Button variant="secondary" onClick={() => {
                          if (attachmentPreview?.url && attachmentPreview.url.startsWith("blob:")) URL.revokeObjectURL(attachmentPreview.url);
                          setAttachmentPreview(null);
                        }}>{t("common.close", "Close")}</Button>
                        {attachmentPreview && (
                          <Button onClick={() => {
                            const a = document.createElement("a");
                            a.href = attachmentPreview.url;
                            a.download = attachmentPreview.name || "attachment";
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                          }}>{t("common.download", "Download")}</Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeacherAssignments;

// Inline submissions component for brevity
const AssignmentSubmissions = ({ assignmentId, classIds, explicitStudentIds }: { assignmentId: string; classIds: string[]; explicitStudentIds: string[]; }) => {
  const { toast } = useToast();
  const { t: translate } = useI18n();
  const queryClient = useQueryClient();
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [recentlySavedIds, setRecentlySavedIds] = useState<Set<string>>(new Set());
  interface SubmissionRow {
    student_id: string;
    status?: "assigned"|"submitted"|"graded";
    grade?: number|null;
    feedback?: string|null;
    submitted_at?: string|null;
    graded_at?: string|null;
  }
  // Fetch submissions first to know exactly who this assignment targets
  const { data: submissions, isLoading } = useQuery({
    queryKey: ["teacher-assignment-submissions", assignmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_assignment_submissions")
        .select("id, student_id, status, grade, feedback, submitted_at, graded_at")
        .eq("assignment_id", assignmentId);
      if (error) throw error;
      const map = new Map<string, SubmissionRow>();
      (data || []).forEach((s) => map.set(s.student_id, s as SubmissionRow));
      return map; // Map studentId -> submission row
    },
  });

  // Now fetch only the students that are actually targeted (explicit ids > submissions > classes)
  const { data: students } = useQuery({
    queryKey: ["assignment-submission-students", assignmentId, classIds, explicitStudentIds, submissions?.size || 0],
    queryFn: async () => {
      // Priority 1: explicit student IDs stored on the assignment
      if (explicitStudentIds && explicitStudentIds.length > 0) {
        const { data: st } = await supabase
          .from("students")
          .select("id, name")
          .in("id", explicitStudentIds)
          .order("name", { ascending: true });
        return (st || []) as { id: string; name: string }[];
      }

      // Priority 2: any seeded submissions (authoritative list of who has the assignment)
      const submissionIds = submissions ? Array.from(submissions.keys()) : [];
      if (submissionIds.length > 0) {
        const { data: st } = await supabase
          .from("students")
          .select("id, name")
          .in("id", submissionIds)
          .order("name", { ascending: true });
        return (st || []) as { id: string; name: string }[];
      }

      // Fallback: full class rosters if nothing else available
      let unionIds: string[] = [];
      if (classIds && classIds.length > 0) {
        const { data: cls } = await supabase.from("classes").select("current_students").in("id", classIds);
        const classIdsFlat = (cls || []).flatMap((c: { current_students?: string[] }) => c.current_students || []);
        unionIds = unionIds.concat(classIdsFlat as string[]);
      }
      const uniqueIds = Array.from(new Set((unionIds as string[]).filter(Boolean)));
      if (uniqueIds.length === 0) return [] as { id: string; name: string }[];
      const { data: st } = await supabase.from("students").select("id, name").in("id", uniqueIds).order("name", { ascending: true });
      return (st || []) as { id: string; name: string }[];
    },
  });

  const upsertSubmission = async (
    studentId: string,
    partial: { status?: "assigned"|"submitted"|"graded"; grade?: number|null; feedback?: string|null; submitted_at?: string|null; graded_at?: string|null }
  ) => {
    try {
      const cacheKey = ["teacher-assignment-submissions", assignmentId] as const;
      setSavingIds((prev) => new Set(prev).add(studentId));
      // Optimistic UI update
      const prev = queryClient.getQueryData<Map<string, SubmissionRow>>(cacheKey as unknown as string[]);
      if (prev) {
        const next = new Map(prev);
        const existing = next.get(studentId) || { assignment_id: assignmentId, student_id: studentId };
        next.set(studentId, { ...(existing as SubmissionRow), ...partial });
        queryClient.setQueryData(cacheKey as unknown as string[], next);
      }

      const { error } = await supabase
        .from("teacher_assignment_submissions")
        .upsert(
          { assignment_id: assignmentId, student_id: studentId, ...partial },
          { onConflict: "assignment_id,student_id" },
        );
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: cacheKey as unknown as string[] });
      // Brief saved indicator
      setRecentlySavedIds((prev) => new Set(prev).add(studentId));
      setTimeout(() => {
        setRecentlySavedIds((prev) => {
          const copy = new Set(prev);
          copy.delete(studentId);
          return copy;
        });
      }, 1200);
    } catch (err: unknown) {
      await queryClient.invalidateQueries({ queryKey: ["teacher-assignment-submissions", assignmentId] });
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: translate("pages.teacherPortal.assignments.toastSaveFailed", "Save failed"), description: message, variant: "destructive" });
    }
    finally {
      setSavingIds((prev) => {
        const copy = new Set(prev);
        copy.delete(studentId);
        return copy;
      });
    }
  };

  return (
    <div className="mt-4 border-t pt-4">
      <div className="text-sm font-semibold mb-3 text-foreground">{translate("pages.teacherPortal.assignments.submissions.title", "Submissions")}</div>
      {isLoading && <div className="text-sm text-foreground/80">{translate("pages.teacherPortal.assignments.submissions.loading", "Loading…")}</div>}
      <div className="space-y-4">
        {(students || []).map((s: { id: string; name: string }) => {
          const sub = submissions?.get(s.id) as SubmissionRow | undefined;
          const status: "assigned"|"submitted"|"graded" = sub?.status || "assigned";
          const grade = sub?.grade ?? "";
          return (
            <div key={s.id} className="grid gap-4 p-4 md:p-5 rounded-lg border bg-card md:grid-cols-12 items-start md:items-center">
              <div className="md:col-span-5 flex min-w-0 flex-col gap-1">
                <div className="text-sm font-medium flex items-center gap-2 flex-wrap break-words">
                  <span>{s.name}</span>
                  {(sub?.submitted_at || sub?.graded_at) && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-foreground/80 lg:hidden">
                      <Calendar className="h-3 w-3" />
                      {new Date(sub?.submitted_at || sub?.graded_at || "").toLocaleDateString()}
                    </span>
                  )}
                  {status === "assigned" && <Badge variant="outline">{translate("pages.teacherPortal.assignments.submissions.submission", "Submission")}</Badge>}
                  {status === "submitted" && <Badge variant="secondary">{translate("pages.teacherPortal.assignments.submissions.submitted", "Submitted")}</Badge>}
                  {status === "graded" && <Badge>{translate("pages.teacherPortal.assignments.status.completed", "Completed")}</Badge>}
                  {sub?.feedback && <Badge className="bg-emerald-600 text-white">{translate("pages.teacherPortal.assignments.submissions.feedback", "Feedback")}</Badge>}
                  {recentlySavedIds.has(s.id) && <Badge className="bg-emerald-500/90 text-white">{translate("pages.teacherPortal.assignments.submissions.save", "Save")}</Badge>}
                </div>
                <div className="hidden lg:block text-xs text-foreground/80">
                  {status === "submitted" && sub?.submitted_at ? `${translate("pages.teacherPortal.assignments.submissions.submitted", "Submitted")}: ${new Date(sub.submitted_at).toLocaleString()}` : null}
                  {status === "graded" && sub?.graded_at ? `${translate("pages.teacherPortal.assignments.status.completed", "Completed")}: ${new Date(sub.graded_at).toLocaleString()}` : null}
                </div>
              </div>
              <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 items-start md:items-center md:border-l md:pl-5">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-foreground/80">{translate("pages.teacherPortal.assignments.submissions.submission", "Submission")}</span>
                  <Button
                    size="sm"
                    className={`w-full h-10 ${status === "submitted" ? "bg-sky-600 hover:bg-sky-700" : savingIds.has(s.id) ? "bg-emerald-600" : "bg-emerald-600 hover:bg-emerald-700"} text-white inline-flex items-center justify-center`}
                    disabled={savingIds.has(s.id)}
                    onClick={() => upsertSubmission(s.id, { status: "submitted", submitted_at: new Date().toISOString() })}
                    title={savingIds.has(s.id) ? translate("pages.teacherPortal.assignments.submissions.saving", "Saving") : status === "submitted" ? translate("pages.teacherPortal.assignments.submissions.submitted", "Submitted") : translate("pages.teacherPortal.assignments.submissions.markSubmitted", "Mark submitted")}
                  >
                    {savingIds.has(s.id)
                      ? (<Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} aria-hidden="true" />)
                      : (<CheckCircle2 className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />)}
                  </Button>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-foreground/80">{translate("pages.teacherPortal.assignments.submissions.grade", "Grade")}</span>
                  <Input
                    placeholder={translate("pages.teacherPortal.assignments.submissions.gradePlaceholder", "Grade %")}
                    className="w-full h-10"
                    value={grade}
                    onChange={(e) => {
                      const v = e.target.value === "" ? null : Number(e.target.value);
                      upsertSubmission(s.id, { grade: v, status: "graded", graded_at: new Date().toISOString() });
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1 md:col-auto sm:col-span-2">
                  <span className="text-xs font-medium text-foreground/80">{translate("pages.teacherPortal.assignments.submissions.feedback", "Feedback")}</span>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full h-10 bg-fuchsia-600 hover:bg-fuchsia-700 text-white inline-flex items-center justify-center gap-2">
                        {sub?.feedback
                          ? <MessageSquareText className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
                          : <MessageSquarePlus className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />}
                        <span className="sr-only">{sub?.feedback ? translate("pages.teacherPortal.assignments.submissions.editFeedback", "Edit feedback") : translate("pages.teacherPortal.assignments.submissions.addFeedback", "Add feedback")}</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>{translate("pages.teacherPortal.assignments.submissions.feedbackFor", "Feedback for {name}").replace("{name}", s.name)}</DialogTitle>
                      </DialogHeader>
                      <Textarea
                        rows={6}
                        autoFocus
                        defaultValue={sub?.feedback ?? ""}
                        placeholder={translate("pages.teacherPortal.assignments.submissions.feedbackPlaceholder", "Type feedback and press Enter to save")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            const target = e.target as HTMLTextAreaElement;
                            const v = target.value.trim();
                            upsertSubmission(s.id, { feedback: v === "" ? null : v });
                            const root = (e.currentTarget as HTMLElement).closest('[role="dialog"]');
                            const close = root?.querySelector('[data-radix-dialog-close]') as HTMLButtonElement | null;
                            close?.click();
                          }
                        }}
                      />
                      <DialogFooter>
                        <Button
                          onClick={(ev) => {
                            const root = (ev.currentTarget as HTMLElement).closest('[role="dialog"]');
                            const textarea = root?.querySelector('textarea') as HTMLTextAreaElement | null;
                            const v = textarea?.value.trim() || "";
                            upsertSubmission(s.id, { feedback: v === "" ? null : v });
                          }}
                          data-radix-dialog-close
                        >
                          <Save className="mr-2 h-4 w-4" /> {translate("pages.teacherPortal.assignments.submissions.save", "Save")}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          );
        })}
        {(!students || students.length === 0) && (
          <div className="text-xs text-muted-foreground">{translate("pages.teacherPortal.assignments.submissions.noneStudents", "No students to display for this assignment.")}</div>
        )}
      </div>
    </div>
  );
};


