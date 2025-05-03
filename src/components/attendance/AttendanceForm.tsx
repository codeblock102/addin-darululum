
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { CalendarX, CalendarCheck, Clock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AttendanceStatus } from "@/types/attendance";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Student = {
  id: string;
  name: string;
};

interface ClassInfo {
  id: string;
  name: string;
  days_of_week: string[];
  time_slots: any[];
}

export function AttendanceForm() {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = new Date();
  const formattedDate = format(today, "yyyy-MM-dd");

  const form = useForm({
    defaultValues: {
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
      return data as ClassInfo[];
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
      return data as Student[];
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
    mutationFn: async (values: { status: AttendanceStatus; notes: string }) => {
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

  const onSubmit = (values: { status: AttendanceStatus; notes: string }) => {
    saveAttendance.mutate(values);
  };

  return (
    <Card className="border border-purple-200 dark:border-purple-800/40 shadow-sm overflow-hidden bg-white dark:bg-gray-900">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-900 border-b border-purple-100 dark:border-purple-900/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-purple-700 dark:text-purple-300">Mark Attendance</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CalendarCheck className="h-4 w-4 text-purple-500 dark:text-purple-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-700">
                  <p>Record today's attendance</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          Record attendance for {format(today, "PPP")}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Class</FormLabel>
            <Select 
              value={selectedClass} 
              onValueChange={setSelectedClass}
              disabled={isLoadingClasses}
            >
              <SelectTrigger className="border-gray-300 dark:border-gray-700 focus:ring-purple-500 focus:border-purple-500">
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingClasses ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                  </div>
                ) : classesData?.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500">No classes found</div>
                ) : (
                  classesData?.map((classInfo) => (
                    <SelectItem key={classInfo.id} value={classInfo.id}>
                      {classInfo.name} - {classInfo.days_of_week.join(', ')}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Student</FormLabel>
            <Select 
              value={selectedStudent} 
              onValueChange={setSelectedStudent}
              disabled={isLoadingStudents || !selectedClass}
            >
              <SelectTrigger className="border-gray-300 dark:border-gray-700 focus:ring-purple-500 focus:border-purple-500">
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingStudents ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                  </div>
                ) : students?.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500">No students found</div>
                ) : (
                  students?.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedStudent && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-gray-700 dark:text-gray-300">Attendance Status</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          className="flex flex-col space-y-2"
                        >
                          <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors">
                            <RadioGroupItem 
                              value="present" 
                              id="present" 
                              className="text-purple-600 border-gray-400 focus:ring-purple-500"
                            />
                            <label htmlFor="present" className="flex items-center text-gray-900 dark:text-gray-100 font-medium cursor-pointer">
                              <CalendarCheck className="h-4 w-4 mr-2 text-green-600" />
                              Present
                            </label>
                          </div>
                          <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors">
                            <RadioGroupItem 
                              value="absent" 
                              id="absent" 
                              className="text-purple-600 border-gray-400 focus:ring-purple-500"
                            />
                            <label htmlFor="absent" className="flex items-center text-gray-900 dark:text-gray-100 font-medium cursor-pointer">
                              <CalendarX className="h-4 w-4 mr-2 text-red-600" />
                              Absent
                            </label>
                          </div>
                          <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors">
                            <RadioGroupItem 
                              value="late" 
                              id="late" 
                              className="text-purple-600 border-gray-400 focus:ring-purple-500"
                            />
                            <label htmlFor="late" className="flex items-center text-gray-900 dark:text-gray-100 font-medium cursor-pointer">
                              <Clock className="h-4 w-4 mr-2 text-amber-600" />
                              Late
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-300">Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional notes about attendance"
                          className="resize-none border-gray-300 dark:border-gray-700 focus:ring-purple-500 focus:border-purple-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                  disabled={saveAttendance.isPending}
                >
                  {saveAttendance.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    existingAttendance ? "Update Attendance" : "Save Attendance"
                  )}
                </Button>
              </form>
            </Form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
