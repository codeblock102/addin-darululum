
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Clock, CheckSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { getInitials } from "@/utils/stringUtils";
import { AttendanceFormValues } from "@/types/attendance-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface BulkAttendanceGridProps {
  form: UseFormReturn<AttendanceFormValues>;
}

interface BulkAttendanceData {
  student_ids: string[];
  status: string;
  time: string;
  date: string;
  notes?: string;
  late_reason?: string;
}

export function BulkAttendanceGrid({ form }: BulkAttendanceGridProps) {
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [bulkTime, setBulkTime] = useState<string>(format(new Date(), "HH:mm"));
  const [bulkNotes, setBulkNotes] = useState<string>("");
  const [bulkLateReason, setBulkLateReason] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: students, isLoading } = useQuery({
    queryKey: ["all-students-bulk"],
    queryFn: async () => {
      console.log("Fetching all students for bulk attendance");
      const { data, error } = await supabase
        .from("students")
        .select("id, name, status")
        .eq("status", "active")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching students for bulk attendance:", error);
        throw error;
      }

      console.log(`Found ${data?.length || 0} students for bulk attendance`);
      return data || [];
    },
  });

  const bulkAttendanceMutation = useMutation({
    mutationFn: async (data: BulkAttendanceData) => {
      const attendanceRecords = Array.from(selectedStudents).map(studentId => ({
        student_id: studentId,
        date: data.date,
        status: data.status,
        time: data.time,
        notes: data.notes,
        late_reason: data.status === "late" ? data.late_reason : null,
      }));

      const { error } = await supabase
        .from("attendance")
        .upsert(attendanceRecords, { onConflict: "student_id,date" });

      if (error) throw error;
      return attendanceRecords.length;
    },
    onSuccess: (count) => {
      toast({
        title: "Success",
        description: `Attendance recorded for ${count} students`,
      });
      setSelectedStudents(new Set());
      setBulkStatus("");
      setBulkNotes("");
      setBulkLateReason("");
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

  const handleStudentToggle = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && students) {
      setSelectedStudents(new Set(students.map(s => s.id)));
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleBulkSubmit = () => {
    if (selectedStudents.size === 0) {
      toast({
        title: "No students selected",
        description: "Please select at least one student",
        variant: "destructive",
      });
      return;
    }

    if (!bulkStatus) {
      toast({
        title: "Status required",
        description: "Please select an attendance status",
        variant: "destructive",
      });
      return;
    }

    const currentDate = form.getValues("date");
    bulkAttendanceMutation.mutate({
      student_ids: Array.from(selectedStudents),
      status: bulkStatus,
      time: bulkTime,
      date: format(currentDate, "yyyy-MM-dd"),
      notes: bulkNotes,
      late_reason: bulkLateReason,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading students...
      </div>
    );
  }

  const isAllSelected = students && selectedStudents.size === students.length;
  const isSomeSelected = selectedStudents.size > 0 && !isAllSelected;

  return (
    <div className="space-y-6">
      {/* Bulk Actions Header */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={isAllSelected ? true : isSomeSelected ? "indeterminate" : false}
                onCheckedChange={handleSelectAll}
                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">
                {selectedStudents.size > 0 
                  ? `${selectedStudents.size} student(s) selected` 
                  : "Select students for bulk attendance"}
              </span>
            </div>

            {selectedStudents.size > 0 && (
              <div className="flex flex-wrap gap-3 items-center">
                <Select value={bulkStatus} onValueChange={setBulkStatus}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="excused">Excused</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="time"
                  value={bulkTime}
                  onChange={(e) => setBulkTime(e.target.value)}
                  className="w-[120px] h-9"
                />

                {bulkStatus === "late" && (
                  <Input
                    placeholder="Late reason"
                    value={bulkLateReason}
                    onChange={(e) => setBulkLateReason(e.target.value)}
                    className="w-[140px] h-9"
                  />
                )}

                <Input
                  placeholder="Notes"
                  value={bulkNotes}
                  onChange={(e) => setBulkNotes(e.target.value)}
                  className="w-[140px] h-9"
                />

                <Button
                  onClick={handleBulkSubmit}
                  disabled={bulkAttendanceMutation.isPending}
                  className="h-9 bg-blue-600 hover:bg-blue-700"
                >
                  {bulkAttendanceMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckSquare className="h-4 w-4 mr-2" />
                  )}
                  Apply to Selected
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Student Grid */}
      <FormField
        control={form.control}
        name="student_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-900 dark:text-gray-100 font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Select Students for Bulk Attendance
            </FormLabel>
            <FormControl>
              <ScrollArea className="h-96 w-full rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {students?.map((student) => (
                    <Card
                      key={student.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                        selectedStudents.has(student.id)
                          ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30 border-blue-500 shadow-md"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-blue-300"
                      }`}
                      onClick={() => handleStudentToggle(student.id, !selectedStudents.has(student.id))}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={selectedStudents.has(student.id)}
                            onChange={() => {}} // Handled by card click
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300 font-medium">
                              {getInitials(student.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-black">
                              {student.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Active Student
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {(!students || students.length === 0) && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No students found
                  </div>
                )}
              </ScrollArea>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Selected Students Summary */}
      {selectedStudents.size > 0 && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckSquare className="h-3 w-3 mr-1" />
                  {selectedStudents.size} Selected
                </Badge>
                <span className="text-sm text-gray-600">
                  Ready for bulk attendance recording
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedStudents(new Set())}
                className="text-gray-600 hover:text-gray-800"
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
