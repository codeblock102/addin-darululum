
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendanceFilters } from "./AttendanceFilters";
import { AttendanceRecordsTable } from "./AttendanceRecordsTable";

type AttendanceRecord = {
  id: string;
  date: string;
  status: string;
  notes: string | null;
  student: {
    id: string;
    name: string;
  };
  class_schedule: {
    id: string;
    class_name: string;
    day_of_week: string;
    time_slot: string;
  };
};

export function AttendanceTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  
  const { data: attendanceRecords, isLoading } = useQuery({
    queryKey: ["attendance", dateFilter],
    queryFn: async () => {
      let query = supabase
        .from("attendance")
        .select(`
          id,
          date,
          status,
          notes,
          student:student_id(id, name),
          class_schedule:class_schedule_id(id, class_name, day_of_week, time_slot)
        `)
        .order("date", { ascending: false });
      
      if (dateFilter) {
        query = query.eq("date", format(dateFilter, "yyyy-MM-dd"));
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as unknown as AttendanceRecord[];
    },
  });

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter(null);
    setDateFilter(null);
  };

  const filteredRecords = attendanceRecords
    ?.filter((record) => {
      // Filter by search query (student name or class name)
      const matchesSearch = 
        record.student?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.class_schedule?.class_name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by status
      const matchesStatus = !statusFilter || record.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Records</CardTitle>
        <CardDescription>
          View and filter attendance records for all students.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AttendanceFilters 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
        />

        <AttendanceRecordsTable 
          records={filteredRecords}
          isLoading={isLoading}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          dateFilter={dateFilter}
          resetFilters={resetFilters}
        />
      </CardContent>
    </Card>
  );
}
