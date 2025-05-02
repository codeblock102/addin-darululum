
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
import { Filter, Loader2, Search, Info } from "lucide-react";
import { AttendanceFilters } from "./AttendanceFilters";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
        return <Badge className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">Present</Badge>;
      case "absent":
        return <Badge className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">Absent</Badge>;
      case "late":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">Late</Badge>;
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
    <Card className="bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800/40 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-900 border-b border-purple-100 dark:border-purple-900/30">
        <div className="flex items-center gap-2">
          <CardTitle className="text-purple-700 dark:text-purple-300">Student Attendance History</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-purple-500 dark:text-purple-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-700">
                <p>Filter and view past attendance records</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          View and filter attendance records for individual students
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-gray-500" />
            <Input
              placeholder="Search by student or class name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-gray-300 dark:border-gray-700"
            />
          </div>
          
          <AttendanceFilters 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
          />
          
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={resetFilters}
              className="text-purple-600 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-900/20"
            >
              Reset Filters
            </Button>
          </div>
        </div>

        {isLoadingAttendance ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : attendanceRecords && attendanceRecords.length > 0 ? (
          <div className="border border-purple-100 dark:border-purple-900/30 rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-purple-50 dark:bg-purple-900/20">
                <TableRow>
                  <TableHead className="text-purple-700 dark:text-purple-300">Date</TableHead>
                  <TableHead className="text-purple-700 dark:text-purple-300">Student</TableHead>
                  <TableHead className="text-purple-700 dark:text-purple-300">Class</TableHead>
                  <TableHead className="text-purple-700 dark:text-purple-300">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record) => (
                  <TableRow key={record.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
                    <TableCell className="text-gray-900 dark:text-gray-200 font-medium">
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
          <div className="text-center text-gray-500 py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-lg font-medium">No attendance records found</p>
            <p className="text-sm mt-2">Try adjusting your filters or select another date range</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
