import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { AttendanceStatus } from "@/types/attendance.ts";

export function useAttendanceSubmit() {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = new Date();
  const formattedDate = format(today, "yyyy-MM-dd");

  const form = useForm({
    defaultValues: {
      class_id: "",
      student_id: "",
      status: "present" as AttendanceStatus,
      notes: "",
    },
  });

  const { data: classesData, isLoading: isLoadingClasses } = useQuery({
    queryKey: ["class-schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, days_of_week, time_slots")
        .order("name", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ["students-by-class", selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];

      const { data, error } = await supabase
        .from("students")
        .select("id, name")
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: !!selectedClass,
  });

  const { data: existingAttendance, refetch: refetchAttendance } = useQuery({
    queryKey: ["attendance", selectedStudent, selectedClass, formattedDate],
    queryFn: async () => {
      if (!selectedStudent || !selectedClass) return null;

      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", selectedStudent)
        .eq("class_id", selectedClass)
        .eq("date", formattedDate)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!selectedStudent && !!selectedClass,
  });

  useEffect(() => {
    if (existingAttendance) {
      form.setValue("status", existingAttendance.status as AttendanceStatus);
      form.setValue("notes", existingAttendance.notes || "");
    } else {
      form.setValue("status", "present");
      form.setValue("notes", "");
    }
  }, [existingAttendance, form]);

  const saveAttendance = useMutation({
    mutationFn: async (values: {
      class_id: string;
      student_id: string;
      status: AttendanceStatus;
      notes: string;
    }) => {
      if (!selectedStudent || !selectedClass) {
        throw new Error("Please select a class and student");
      }

      const attendanceData = {
        student_id: selectedStudent,
        class_id: selectedClass,
        date: formattedDate,
        status: values.status,
        notes: values.notes,
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

  const onSubmit = (values: {
    class_id: string;
    student_id: string;
    status: AttendanceStatus;
    notes: string;
  }) => {
    saveAttendance.mutate(values);
  };

  return {
    form,
    onSubmit,
    selectedClass,
    setSelectedClass,
    selectedStudent,
    setSelectedStudent,
    classesData,
    students,
    isLoadingClasses,
    isLoadingStudents,
    existingAttendance,
    saveAttendance,
  };
}
