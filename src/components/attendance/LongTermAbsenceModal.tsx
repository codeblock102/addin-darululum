/**
 * LongTermAbsenceModal — record a multi-day absence for a student.
 * Mirrors Mozaïk Portal's "Attendance Excuse" dialog:
 *   START DATE · END DATE · SELECT REASON · DESCRIPTION
 *
 * On save, creates one attendance record per calendar day in the range
 * with status "excused" and the selected reason stored in `late_reason`.
 */
import { useState } from "react";
import { format, eachDayOfInterval, parseISO, isWeekend } from "date-fns";
import { CalendarDays, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { AbsenceReasonSelect } from "./AbsenceReasonSelect.tsx";

interface LongTermAbsenceModalProps {
  open: boolean;
  onClose: () => void;
  /** Pre-fill a specific student */
  studentId?: string;
  studentName?: string;
  /** Class context for the records */
  classId?: string | null;
}

export function LongTermAbsenceModal({
  open,
  onClose,
  studentId,
  studentName,
  classId,
}: LongTermAbsenceModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const today = format(new Date(), "yyyy-MM-dd");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!studentId) throw new Error("No student selected");
      if (!reason) throw new Error("Please select a reason");
      if (reason === "other" && !description.trim())
        throw new Error("A description is required when selecting 'Other'");

      // Build one record per weekday in the range
      const days = eachDayOfInterval({
        start: parseISO(startDate),
        end: parseISO(endDate),
      }).filter((d) => !isWeekend(d));

      if (days.length === 0) throw new Error("The selected range contains no school days");

      const records = days.map((day) => ({
        student_id: studentId,
        date: format(day, "yyyy-MM-dd"),
        time: null,
        status: "excused",
        late_reason: reason,
        notes: description || null,
        class_id: classId ?? null,
      }));

      const { error } = await supabase
        .from("attendance")
        .upsert(records, { onConflict: "student_id,date" });
      if (error) throw error;
      return records.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast({
        title: "Absence recorded",
        description: `${count} day${count !== 1 ? "s" : ""} marked as excused for ${studentName ?? "student"}.`,
      });
      handleClose();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleClose = () => {
    setStartDate(today);
    setEndDate(today);
    setReason("");
    setDescription("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            Multi-Day Absence
          </DialogTitle>
          {studentName && (
            <p className="text-sm text-gray-500 mt-1">Recording for: <span className="font-medium text-gray-800">{studentName}</span></p>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) setEndDate(e.target.value);
                }}
                className="border-gray-300 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">End Date</Label>
              <Input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-gray-300 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Reason + description */}
          <AbsenceReasonSelect
            value={reason}
            onChange={setReason}
            description={description}
            onDescriptionChange={setDescription}
            showDescription
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={mutation.isPending} className="border-gray-300">
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !reason}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {mutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
            ) : (
              "Save Absence"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
