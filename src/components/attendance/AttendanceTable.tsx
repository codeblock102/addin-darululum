
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { AttendanceFilters } from "./AttendanceFilters";

type AttendanceRecord = {
  id: string;
  date: string;
  status: string;
  student: {
    id: string;
    name: string;
  };
  class_schedule: {
    class_name: string;
  };
};

export function AttendanceTable() {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<Date | null>(null);

  // Query to get students for the dropdown
  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ["students"],
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
          student:student_id(id, name),
          class_schedule:class_schedule_id(class_name)
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
      return data as unknown as AttendanceRecord[];
    },
  });

  // Render attendance status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Present</Badge>;
      case "absent":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Absent</Badge>;
      case "late":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Late</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedStudent(null);
    setStatusFilter(null);
    setSearchQuery("");
    setDateFilter(null);
  };

  return (
    <Card className="bg-white dark:bg-gray-900 shadow-sm">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">Student Attendance History</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          View and filter attendance records for individual students
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

        {isLoadingAttendance ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : attendanceRecords && attendanceRecords.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-100 dark:bg-gray-800">
                <TableRow>
                  <TableHead className="text-gray-700 dark:text-gray-200">Date</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-200">Student</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-200">Class</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-200">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record) => (
                  <TableRow key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <TableCell className="text-gray-900 dark:text-gray-200">
                      {format(parseISO(record.date), "PPP")}
                    </TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-200">
                      {record.student.name}
                    </TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-200">
                      {record.class_schedule.class_name}
                    </TableCell>
                    <TableCell>{renderStatusBadge(record.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center text-gray-600 dark:text-gray-400 py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
            No attendance records found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
