
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export function useAttendanceRecords() {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<Date | null>(null);

  // Query to get all students
  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ["students-for-attendance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, name")
        .eq("status", "active");
      
      if (error) throw error;
      return data;
    },
  });

  // Query to get attendance records
  const { 
    data: attendanceRecords, 
    isLoading: isLoadingAttendance 
  } = useQuery({
    queryKey: ["attendance", selectedStudent, statusFilter, searchQuery, dateFilter],
    queryFn: async () => {
      let query = supabase
        .from("attendance")
        .select(`
          id,
          date,
          status,
          notes,
          student:student_id(id, name),
          class_schedule:class_id(class_name)
        `)
        .order("date", { ascending: false });
      
      if (selectedStudent) {
        query = query.eq("student_id", selectedStudent);
      }
      
      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      if (searchQuery) {
        query = query.or(
          `student.name.ilike.%${searchQuery}%,class_schedule.class_name.ilike.%${searchQuery}%`
        );
      }

      if (dateFilter) {
        query = query.eq("date", format(dateFilter, "yyyy-MM-dd"));
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });

  // Reset filters
  const resetFilters = () => {
    setSelectedStudent(null);
    setStatusFilter(null);
    setSearchQuery("");
    setDateFilter(null);
  };

  return {
    students,
    attendanceRecords,
    isLoadingStudents,
    isLoadingAttendance,
    selectedStudent,
    setSelectedStudent,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    dateFilter,
    setDateFilter,
    resetFilters
  };
}
