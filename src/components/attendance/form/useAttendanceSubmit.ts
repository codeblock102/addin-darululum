import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { AttendanceFormValues } from "@/types/attendance-form.ts";

const attendanceSchema = z.object({
  class_id: z.string().min(1, "Please select a class"),
  student_id: z.string().min(1, "Please select a student"),
  date: z.date(),
  time: z.string().min(1, "Time is required"),
  status: z.enum(["present", "absent", "late", "excused"]),
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
  onError?: (error: Error) => void;
}

export function useAttendanceSubmit({ onSuccess, onError }: UseAttendanceSubmitProps = {}) {
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedReason, setSelectedReason] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = new Date();

  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
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
  const formattedDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(today, "yyyy-MM-dd");

  // Update selectedStudent when form student_id changes
  useEffect(() => {
    if (watchedStudentId && watchedStudentId !== selectedStudent) {
      setSelectedStudent(watchedStudentId);
    }
  }, [watchedStudentId, selectedStudent]);

  const { data: existingAttendance, refetch: refetchAttendance } = useQuery({
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
      // Load existing record into form
      form.setValue("status", existingAttendance.status as any);
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
      toast({
        title: "Existing Record Found",
        description: `Loading attendance record for ${format(selectedDate || today, "MMM dd, yyyy")}`,
      });
    } else if (selectedStudent && selectedDate) {
      // Reset form for new record
      form.setValue("status", "present");
      form.setValue("notes", "");
      form.setValue("time", format(new Date(), "HH:mm"));
      form.setValue("late_reason", "");
      setSelectedReason("");
    }
  }, [existingAttendance, form, selectedStudent, selectedDate, toast, today]);

  const saveAttendance = useMutation({
    mutationFn: async (values: AttendanceFormValues) => {
      if (!selectedStudent) {
        throw new Error("Please select a student");
      }

      const attendanceData = {
        student_id: selectedStudent,
        date: formattedDate,
        status: values.status,
        notes: values.notes,
        time: values.time,
        late_reason: values.status === "late" ? values.late_reason : null,
        class_id: values.class_id || null,
      };

      if (existingAttendance) {
        const { error } = await supabase
          .from("attendance")
          .update(attendanceData)
          .eq("id", existingAttendance.id);

        if (error) throw error;
        return { action: "updated" };
      } else {
        const { error } = await supabase
          .from("attendance")
          .insert([attendanceData]);

        if (error) throw error;
        return { action: "created" };
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Attendance ${data.action} successfully`,
      });
      refetchAttendance();
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      onError?.(error);
    },
  });

  const handleSubmit = (values: AttendanceFormValues) => {
    saveAttendance.mutate(values);
  };

  const isProcessing = saveAttendance.isPending;

  return {
    form,
    handleSubmit,
    isProcessing,
    selectedStudent,
    setSelectedStudent,
    selectedReason,
    setSelectedReason,
    existingAttendance,
    saveAttendance,
  };
}
