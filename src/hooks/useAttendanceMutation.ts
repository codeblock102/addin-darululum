import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/components/ui/use-toast.ts";
import { useI18n } from "@/contexts/I18nContext.tsx";
import { formatErrorMessage } from "@/utils/formatErrorMessage.ts";

export interface AttendanceRecord {
  student_id: string;
  date: string;
  status: string;
  time?: string | null;
  notes?: string | null;
  late_reason?: string | null;
  class_id?: string | null;
}

export interface UseAttendanceMutationOptions {
  onSuccess?: (count: number) => void;
  onError?: (error: unknown) => void;
  /** Custom success message */
  successMessage?: string;
  /** Whether to show toast notifications (default: true) */
  showToasts?: boolean;
}

/**
 * Unified hook for saving/upserting attendance records.
 * Handles both single and bulk attendance submissions.
 */
export function useAttendanceMutation(options: UseAttendanceMutationOptions = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const { onSuccess, onError, showToasts = true } = options;

  const mutation = useMutation({
    mutationFn: async (records: AttendanceRecord[]) => {
      if (records.length === 0) {
        throw new Error("No attendance records to save");
      }

      // Normalize records - ensure late_reason is null for non-late statuses
      const normalizedRecords = records.map((record) => ({
        student_id: record.student_id,
        date: record.date,
        status: record.status,
        time: record.time || null,
        notes: record.notes || null,
        late_reason: record.status === "late" ? (record.late_reason || null) : null,
        class_id: record.class_id || null,
      }));

      const { error } = await supabase
        .from("attendance")
        .upsert(normalizedRecords, { onConflict: "student_id,date" });

      if (error) throw error;
      return normalizedRecords.length;
    },
    onSuccess: (count) => {
      if (showToasts) {
        toast({
          title: t("pages.attendance.save.successTitle", "Success"),
          description: options.successMessage || 
            t("pages.attendance.save.successDesc", "Attendance recorded for {count} students.").replace("{count}", String(count)),
        });
      }
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      onSuccess?.(count);
    },
    onError: (error) => {
      if (showToasts) {
        toast({
          title: t("common.error", "Error"),
          description: formatErrorMessage(error),
          variant: "destructive",
        });
      }
      onError?.(error);
    },
  });

  /**
   * Save attendance for a single student
   */
  const saveAttendance = (record: AttendanceRecord) => {
    mutation.mutate([record]);
  };

  /**
   * Save attendance for multiple students with the same status/time
   */
  const saveBulkAttendance = (
    studentIds: string[],
    data: Omit<AttendanceRecord, "student_id">
  ) => {
    const records = studentIds.map((studentId) => ({
      ...data,
      student_id: studentId,
    }));
    mutation.mutate(records);
  };

  /**
   * Save attendance records (supports both single and multiple)
   */
  const save = (records: AttendanceRecord | AttendanceRecord[]) => {
    const recordsArray = Array.isArray(records) ? records : [records];
    mutation.mutate(recordsArray);
  };

  return {
    save,
    saveAttendance,
    saveBulkAttendance,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
