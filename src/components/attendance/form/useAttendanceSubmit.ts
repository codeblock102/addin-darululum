
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { AttendanceStatus } from "@/types/attendance.ts";

type AttendanceFormValues = {
  student_id: string;
  status: AttendanceStatus;
  notes: string;
  date: Date;
  time: string;
  late_reason?: string;
  class_id: string;
};

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

export function useAttendanceSubmit() {
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedReason, setSelectedReason] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = new Date();

  const form = useForm<AttendanceFormValues>({
    defaultValues: {
      student_id: "",
      status: "present" as AttendanceStatus,
      notes: "",
      date: today,
      time: format(new Date(), "HH:mm"),
      late_reason: "",
      class_id: "",
    },
  });

  const selectedDate = form.watch("date");
  const formattedDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(today, "yyyy-MM-dd");

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
      form.setValue("status", existingAttendance.status as AttendanceStatus);
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
    } else {
      form.setValue("status", "present");
      form.setValue("notes", "");
      form.setValue("time", format(new Date(), "HH:mm"));
      form.setValue("late_reason", "");
      form.setValue("class_id", "");
      setSelectedReason("");
    }
  }, [existingAttendance, form]);

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
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: AttendanceFormValues) => {
    saveAttendance.mutate(values);
  };

  return {
    form,
    onSubmit,
    selectedStudent,
    setSelectedStudent,
    selectedReason,
    setSelectedReason,
    existingAttendance,
    saveAttendance,
  };
}
