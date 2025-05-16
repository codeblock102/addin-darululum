
import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { RevisionFormData } from "../progress/types";

interface NewRevisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  onSuccess: () => void;
}

export const NewRevisionDialog = ({
  open,
  onOpenChange,
  studentId,
  studentName,
  onSuccess,
}: NewRevisionDialogProps) => {
  const [juzNumber, setJuzNumber] = useState<number | undefined>();
  const [surahNumber, setSurahNumber] = useState<number | undefined>();
  const [quartersRevised, setQuartersRevised] = useState<
    "1st_quarter" | "2_quarters" | "3_quarters" | "4_quarters" | undefined
  >();
  const [memorizationQuality, setMemorizationQuality] = useState<
    "excellent" | "good" | "average" | "needsWork" | "horrible" | undefined
  >();
  const [status, setStatus] = useState<"completed" | "pending" | "needs_improvement">("completed");
  const [teacherNotes, setTeacherNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();

  const resetForm = () => {
    setJuzNumber(undefined);
    setSurahNumber(undefined);
    setQuartersRevised(undefined);
    setMemorizationQuality(undefined);
    setStatus("completed");
    setTeacherNotes("");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const validateForm = (): boolean => {
    if (!juzNumber) {
      toast({
        variant: "destructive",
        title: "Juz number is required",
        description: "Please enter the juz number for this revision.",
      });
      return false;
    }

    if (!quartersRevised) {
      toast({
        variant: "destructive",
        title: "Quarters revised is required",
        description: "Please select how much of the juz was revised.",
      });
      return false;
    }

    if (!memorizationQuality) {
      toast({
        variant: "destructive",
        title: "Memorization quality is required",
        description: "Please rate the quality of memorization.",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // First record the revision in juz_revisions
      const { data: juzRevisionData, error: juzRevisionError } = await supabase
        .from("juz_revisions")
        .insert({
          student_id: studentId,
          juz_revised: juzNumber!,
          revision_date: new Date().toISOString().split("T")[0],
          memorization_quality: memorizationQuality,
          teacher_notes: teacherNotes || null,
          quarters_revised: quartersRevised,
        })
        .select("id")
        .single();

      if (juzRevisionError) throw juzRevisionError;

      // Create a fully valid RevisionFormData object to satisfy TypeScript
      const formData: RevisionFormData = {
        juz_number: juzNumber!,
        surah_number: surahNumber,
        quarters_revised: quartersRevised!,
        memorization_quality: memorizationQuality!,
        teacher_notes: teacherNotes,
        status: status
      };

      // Update any related revision schedule items for this juz
      await updateRevisionSchedule(studentId, juzNumber!, formData);

      toast({
        title: "Revision recorded successfully",
        description: `Revision for Juz ${juzNumber} has been recorded for ${studentName}.`,
      });

      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error recording revision:", error);
      toast({
        variant: "destructive",
        title: "Failed to record revision",
        description: "There was an error recording the revision. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateRevisionSchedule = async (
    studentId: string,
    juzNumber: number,
    formData: RevisionFormData
  ) => {
    // Find any scheduled revisions for this juz and update them
    const { data: scheduledRevisions, error: fetchError } = await supabase
      .from("revision_schedule")
      .select("*")
      .eq("student_id", studentId)
      .eq("juz_number", juzNumber)
      .eq("status", "pending");

    if (fetchError) {
      console.error("Error fetching scheduled revisions:", fetchError);
      return;
    }

    if (scheduledRevisions && scheduledRevisions.length > 0) {
      // Update the most recent scheduled revision to completed
      await supabase
        .from("revision_schedule")
        .update({
          status: "completed",
        })
        .eq("id", scheduledRevisions[0].id);
    }

    // If the revision quality is not good, schedule a follow-up revision
    if (
      formData.memorization_quality === "needsWork" ||
      formData.memorization_quality === "horrible" ||
      formData.status === "needs_improvement"
    ) {
      const nextRevisionDate = new Date();
      nextRevisionDate.setDate(nextRevisionDate.getDate() + 2); // Schedule 2 days later

      await supabase.from("revision_schedule").insert({
        student_id: studentId,
        juz_number: juzNumber,
        surah_number: formData.surah_number,
        scheduled_date: nextRevisionDate.toISOString().split("T")[0],
        priority: "high",
        status: "pending",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Juz Revision</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="juz_number">Juz Number *</Label>
              <Input
                id="juz_number"
                type="number"
                min={1}
                max={30}
                value={juzNumber || ""}
                onChange={(e) => setJuzNumber(parseInt(e.target.value) || undefined)}
              />
            </div>
            <div>
              <Label htmlFor="surah_number">Surah Number (optional)</Label>
              <Input
                id="surah_number"
                type="number"
                min={1}
                max={114}
                value={surahNumber || ""}
                onChange={(e) => setSurahNumber(parseInt(e.target.value) || undefined)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="quarters_revised">Portion Revised *</Label>
            <Select
              value={quartersRevised}
              onValueChange={(value) =>
                setQuartersRevised(
                  value as "1st_quarter" | "2_quarters" | "3_quarters" | "4_quarters"
                )
              }
            >
              <SelectTrigger id="quarters_revised">
                <SelectValue placeholder="Select portion revised" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1st_quarter">First Quarter</SelectItem>
                <SelectItem value="2_quarters">Half Juz</SelectItem>
                <SelectItem value="3_quarters">Three Quarters</SelectItem>
                <SelectItem value="4_quarters">Full Juz</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="memorization_quality">Memorization Quality *</Label>
            <Select
              value={memorizationQuality}
              onValueChange={(value) =>
                setMemorizationQuality(
                  value as "excellent" | "good" | "average" | "needsWork" | "horrible"
                )
              }
            >
              <SelectTrigger id="memorization_quality">
                <SelectValue placeholder="Select quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="average">Average</SelectItem>
                <SelectItem value="needsWork">Needs Work</SelectItem>
                <SelectItem value="horrible">Needs Significant Improvement</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as any)}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="needs_improvement">Needs Improvement</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="teacher_notes">Teacher Notes</Label>
            <Textarea
              id="teacher_notes"
              value={teacherNotes}
              onChange={(e) => setTeacherNotes(e.target.value)}
              placeholder="Notes about the revision quality, areas for improvement, etc."
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
