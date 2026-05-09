import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/components/ui/use-toast.ts";
import { useQueryClient } from "@tanstack/react-query";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = "image/*,application/pdf,.doc,.docx";

export interface ExistingSubmission {
  id?: string;
  status: "assigned" | "submitted" | "graded" | string | null;
  submitted_at?: string | null;
  graded_at?: string | null;
  grade?: number | null;
  feedback?: string | null;
  attachment_url?: string | null;
  parent_note?: string | null;
}

interface SubmitAssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  assignmentId: string;
  studentId: string;
  assignmentTitle: string;
  existingSubmission?: ExistingSubmission | null;
}

export const SubmitAssignmentDialog = ({
  open,
  onClose,
  assignmentId,
  studentId,
  assignmentTitle,
  existingSubmission,
}: SubmitAssignmentDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [note, setNote] = useState<string>(existingSubmission?.parent_note || "");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isGraded = existingSubmission?.status === "graded";

  useEffect(() => {
    if (open) {
      setNote(existingSubmission?.parent_note || "");
      setFile(null);
    }
  }, [open, existingSubmission?.parent_note]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Please pick a file under 5MB.",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }
    setFile(f);
  };

  const handleSubmit = async () => {
    if (isGraded) return;
    if (!note.trim() && !file) {
      toast({
        title: "Nothing to submit",
        description: "Add a note or upload a file.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      let attachmentUrl: string | null = existingSubmission?.attachment_url ?? null;

      if (file) {
        const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
        const path = `${studentId}/${assignmentId}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("assignment-submissions")
          .upload(path, file, { upsert: true, contentType: file.type || undefined });
        if (uploadError) throw uploadError;

        const { data: pub } = supabase.storage
          .from("assignment-submissions")
          .getPublicUrl(path);
        attachmentUrl = pub?.publicUrl ?? null;
      }

      const { error: upsertError } = await supabase
        .from("teacher_assignment_submissions")
        .upsert(
          {
            assignment_id: assignmentId,
            student_id: studentId,
            status: "submitted",
            submitted_at: new Date().toISOString(),
            attachment_url: attachmentUrl,
            parent_note: note.trim() || null,
          },
          { onConflict: "assignment_id,student_id" },
        );
      if (upsertError) throw upsertError;

      toast({
        title: "Submission sent",
        description: "Your child's work has been submitted.",
      });

      queryClient.invalidateQueries({ queryKey: ["parent-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["parent-academics-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["parent-student-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["assignment-submission", assignmentId, studentId] });

      onClose();
    } catch (err) {
      console.error("Submit assignment failed:", err);
      toast({
        title: "Submission failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit Work</DialogTitle>
          <DialogDescription className="truncate">{assignmentTitle}</DialogDescription>
        </DialogHeader>

        {isGraded && (
          <div className="rounded-md border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Graded</Badge>
              {existingSubmission?.grade != null && (
                <span className="text-lg font-semibold">{existingSubmission.grade}</span>
              )}
            </div>
            {existingSubmission?.feedback && (
              <div className="text-sm">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Feedback</div>
                <div className="mt-1 whitespace-pre-wrap">{existingSubmission.feedback}</div>
              </div>
            )}
          </div>
        )}

        {!isGraded && (
          <div className="space-y-4">
            {existingSubmission?.status === "submitted" && (
              <div className="rounded-md border border-amber-200 bg-amber-50 text-amber-900 p-2 text-xs">
                Already submitted{existingSubmission.submitted_at ? ` on ${new Date(existingSubmission.submitted_at).toLocaleString()}` : ""}. Resubmitting will replace the previous attachment and note.
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="parent-note">Note from parent (optional)</Label>
              <Textarea
                id="parent-note"
                placeholder="Add any notes for the teacher..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent-file">Attach file (optional, &lt; 5MB)</Label>
              <Input
                id="parent-file"
                type="file"
                accept={ACCEPTED_TYPES}
                onChange={handleFileChange}
              />
              {file && (
                <div className="text-xs text-muted-foreground truncate">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {isGraded ? "Close" : "Cancel"}
          </Button>
          {!isGraded && (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {existingSubmission?.status === "submitted" ? "Resubmit" : "Submit"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitAssignmentDialog;
