
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

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
    queryKey: ["attendance", selectedStudent, statusFilter],
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
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as unknown as AttendanceRecord[];
    },
  });

  // Render attendance status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge variant="outline" className="bg-green-50 text-green-700">Present</Badge>;
      case "absent":
        return <Badge variant="outline" className="bg-red-50 text-red-700">Absent</Badge>;
      case "late":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700">Late</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedStudent(null);
    setStatusFilter(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Attendance History</CardTitle>
        <CardDescription>
          View and filter attendance records for individual students
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-4">
          <Select 
            value={selectedStudent || ""} 
            onValueChange={(value) => setSelectedStudent(value || null)}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select a student" />
            </SelectTrigger>
            <SelectContent>
              {students?.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={statusFilter || ""} 
            onValueChange={(value) => setStatusFilter(value || null)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Attendance Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="late">Late</SelectItem>
            </SelectContent>
          </Select>

          {(selectedStudent || statusFilter) && (
            <Button variant="outline" onClick={resetFilters}>
              Clear Filters
            </Button>
          )}
        </div>

        {isLoadingAttendance ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : attendanceRecords && attendanceRecords.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {format(parseISO(record.date), "PPP")}
                  </TableCell>
                  <TableCell>{record.student.name}</TableCell>
                  <TableCell>{record.class_schedule.class_name}</TableCell>
                  <TableCell>{renderStatusBadge(record.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No attendance records found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
