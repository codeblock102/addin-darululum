import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { AttendanceFormValues } from "@/types/attendance-form.ts";
import { useI18n } from "@/contexts/I18nContext.tsx";
import { formatErrorMessage } from "@/utils/formatErrorMessage.ts";

const attendanceSchema = z.object({
  class_id: z.string().optional(),
  student_id: z.string().optional(),
  date: z.date(),
  time: z.string().min(1, "Time is required"),
  status: z.enum(["present", "absent", "late", "excused", "early_departure"]),
  late_reason: z.string().optional(),
  notes: z.string().optional(),
});

type AttendanceRecord = {
  id: string;
  class_id: string | null;
  created_at: string | null;
  date: string;
  notes: string | null;
  status: string;
  student_id: string | null;
  time: string | null;
  late_reason: string | null;
};

interface UseAttendanceSubmitProps {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export function useAttendanceSubmit(
  { onSuccess, onError }: UseAttendanceSubmitProps = {},
) {
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [_selectedReason, setSelectedReason] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = new Date();
  const { t } = useI18n();

  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema.refine((v) => !!v.time, {
      message: t("pages.attendance.validation.timeRequired", "Time is required"),
      path: ["time"],
    })),
    defaultValues: {
      class_id: "",
      student_id: "",
      date: today,
      time: format(new Date(), "HH:mm"),
      status: "present",
      late_reason: "",
      notes: "",
    },
  });

  const selectedDate = form.watch("date");
  const watchedStudentId = form.watch("student_id");
  const formattedDate = selectedDate
    ? format(selectedDate, "yyyy-MM-dd")
    : format(today, "yyyy-MM-dd");

  useEffect(() => {
    if (watchedStudentId && watchedStudentId !== selectedStudent) {
      setSelectedStudent(watchedStudentId);
    }
  }, [watchedStudentId, selectedStudent]);

  const { data: existingAttendance, refetch: _refetchAttendance } = useQuery({
    queryKey: ["attendance", selectedStudent, formattedDate],
    queryFn: async (): Promise<AttendanceRecord | null> => {
      if (!selectedStudent) return null;

      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", selectedStudent)
        .eq("date", formattedDate)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!selectedStudent,
  });

  useEffect(() => {
    if (existingAttendance) {
      form.setValue("status", existingAttendance.status as AttendanceFormValues["status"]);
      form.setValue("notes", existingAttendance.notes || "");
      if (existingAttendance.time) {
        form.setValue("time", existingAttendance.time);
      }
      if (existingAttendance.late_reason) {
        form.setValue("late_reason", existingAttendance.late_reason);
        setSelectedReason(existingAttendance.late_reason);
      }
      if (existingAttendance.class_id) {
        form.setValue("class_id", existingAttendance.class_id);
      }
    } else if (selectedStudent && selectedDate) {
      form.setValue("status", "present");
      form.setValue("notes", "");
      form.setValue("time", format(new Date(), "HH:mm"));
      form.setValue("late_reason", "");
      form.setValue("class_id", "");
      setSelectedReason("");
    }
  }, [existingAttendance, form, selectedStudent, selectedDate]);

  const saveAttendanceMutation = useMutation({
    mutationFn: async (values: {
      student_ids: string[],
      status: string,
      formData: AttendanceFormValues,
    }) => {
      const { student_ids, status, formData } = values;
      
      const records = student_ids.map(studentId => ({
        student_id: studentId,
        date: format(formData.date, "yyyy-MM-dd"),
        time: formData.time,
        status: status,
        notes: formData.notes,
        late_reason: status === 'late' ? formData.late_reason : null,
        class_id: formData.class_id || null,
      }));

      const { error } = await supabase.from('attendance').upsert(records, { onConflict: 'student_id,date' });
      if (error) throw error;
      return { count: student_ids.length };
    },
    onSuccess: (data) => {
      toast({
        title: t("pages.attendance.save.successTitle", "Success"),
        description: t("pages.attendance.save.successDesc", "Attendance recorded for {count} students.").replace("{count}", String(data.count)),
      });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: t("common.error", "Error"),
        description: formatErrorMessage(error),
        variant: "destructive",
      });
      onError?.(error);
    },
  });

  const handleBulkSubmit = (student_ids: string[], status: string) => {
    const formData = form.getValues();
    saveAttendanceMutation.mutate({ student_ids, status, formData });
  };

  const isProcessing = saveAttendanceMutation.isPending;

  return {
    form,
    isProcessing,
    handleBulkSubmit,
  };
}
