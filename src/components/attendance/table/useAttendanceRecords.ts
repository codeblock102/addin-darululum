import React from 'react';
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { format } from "date-fns";

export function useAttendanceRecords() {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<Date | null>(null);

  // Query to get all students - with no filtering by teacher
  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ["students-for-attendance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, name")
        .eq("status", "active")
        .order("name", { ascending: true });
      
      if (error) {
        console.error("Error fetching students:", error);
        throw error;
      }
      
      console.log(`Found ${data?.length || 0} students for attendance records`);
      return data || [];
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
      
      if (error) {
        console.error("Error fetching attendance records:", error);
        throw error;
      }
      
      console.log(`Found ${data?.length || 0} attendance records`);
      return data || [];
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
