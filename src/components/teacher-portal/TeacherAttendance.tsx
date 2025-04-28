
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Check, Loader2, UserRound, X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AttendanceStatus } from "@/types/attendance";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TeacherAttendanceProps {
  teacherId: string;
}

export const TeacherAttendance = ({ teacherId }: TeacherAttendanceProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['teacher-classes', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .eq('teacher_id', teacherId)
        .eq('status', 'active');
        
      if (error) {
        console.error('Error fetching classes:', error);
        return [];
      }
      
      return data;
    }
  });
  
  // Fetch students for selected class
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['class-students', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      
      const { data, error } = await supabase
        .from('class_enrollments')
        .select(`
          student_id,
          students(id, name, guardian_name)
        `)
        .eq('class_id', selectedClass)
        .eq('status', 'active');
        
      if (error) {
        console.error('Error fetching class students:', error);
        return [];
      }
      
      return data.map((enrollment: any) => enrollment.students);
    },
    enabled: !!selectedClass
  });
  
  // Fetch existing attendance records for the selected date and class
  const { data: attendanceRecords, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance-records', selectedDate, selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('class_id', selectedClass)
        .eq('date', dateString);
        
      if (error) {
        console.error('Error fetching attendance records:', error);
        return [];
      }
      
      return data;
    },
    enabled: !!selectedClass
  });
  
  // Mutation for saving attendance
  const attendanceMutation = useMutation({
    mutationFn: async (values: { student_id: string, status: AttendanceStatus, notes?: string }) => {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      
      // Check if record already exists
      const { data: existingRecord, error: checkError } = await supabase
        .from('attendance')
        .select('id')
        .eq('student_id', values.student_id)
        .eq('class_id', selectedClass)
        .eq('date', dateString)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is the "no rows returned" error
        throw checkError;
      }
      
      if (existingRecord) {
        // Update existing record
        const { data, error } = await supabase
          .from('attendance')
          .update({
            status: values.status,
            notes: values.notes
          })
          .eq('id', existingRecord.id);
          
        if (error) throw error;
        return data;
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('attendance')
          .insert([{
            student_id: values.student_id,
            class_id: selectedClass,
            date: dateString,
            status: values.status,
            notes: values.notes
          }]);
          
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records', selectedDate, selectedClass] });
      toast({
        title: "Attendance Updated",
        description: "Student attendance has been recorded."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save attendance record. Please try again.",
        variant: "destructive"
      });
      console.error('Error saving attendance:', error);
    }
  });
  
  const getStudentAttendance = (studentId: string) => {
    if (!attendanceRecords) return null;
    return attendanceRecords.find((record: any) => record.student_id === studentId);
  };
  
  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    attendanceMutation.mutate({
      student_id: studentId,
      status,
    });
  };
  
  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Present</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Absent</Badge>;
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Late</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Class Attendance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <FormLabel>Class</FormLabel>
            <Select value={selectedClass || ""} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes?.map((cls: any) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <FormLabel>Date</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="border rounded-md overflow-hidden">
          <Tabs defaultValue="mark">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
              <TabsTrigger value="view">View Records</TabsTrigger>
            </TabsList>
            
            <TabsContent value="mark">
              {(!selectedClass || !students) ? (
                <div className="p-6 text-center text-muted-foreground">
                  {!selectedClass ? "Please select a class to mark attendance" : "No students found in this class"}
                </div>
              ) : studentsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead className="text-center">Present</TableHead>
                      <TableHead className="text-center">Late</TableHead>
                      <TableHead className="text-center">Absent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student: any) => {
                      const attendanceRecord = getStudentAttendance(student.id);
                      const status = attendanceRecord?.status || null;
                      
                      return (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <UserRound className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium">{student.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {student.guardian_name || 'No guardian info'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button 
                              variant={status === 'present' ? 'default' : 'outline'}
                              size="icon"
                              className={status === 'present' ? 'bg-green-600 hover:bg-green-700' : ''}
                              onClick={() => handleAttendanceChange(student.id, 'present')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button 
                              variant={status === 'late' ? 'default' : 'outline'}
                              size="icon"
                              className={status === 'late' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                              onClick={() => handleAttendanceChange(student.id, 'late')}
                            >
                              <CalendarIcon className="h-4 w-4" />
                            </Button>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button 
                              variant={status === 'absent' ? 'default' : 'outline'}
                              size="icon"
                              className={status === 'absent' ? 'bg-red-600 hover:bg-red-700' : ''}
                              onClick={() => handleAttendanceChange(student.id, 'absent')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
            
            <TabsContent value="view">
              {!selectedClass ? (
                <div className="p-6 text-center text-muted-foreground">
                  Please select a class to view attendance records
                </div>
              ) : attendanceLoading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !attendanceRecords || attendanceRecords.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  No attendance records found for this date
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.map((record: any) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {students?.find((s: any) => s.id === record.student_id)?.name || 'Unknown Student'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(record.status as AttendanceStatus)}
                        </TableCell>
                        <TableCell>
                          {record.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};
