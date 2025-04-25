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
import { CalendarX, CalendarCheck, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AttendanceStatus } from "@/types/attendance";

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
      form.setValue("status", existingAttendance.status);
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
    <Card>
      <CardHeader>
        <CardTitle>Mark Attendance</CardTitle>
        <CardDescription>
          Record today's attendance for {format(today, "PPP")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Class</label>
            <Select 
              value={selectedClass} 
              onValueChange={setSelectedClass}
              disabled={isLoadingClasses}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classesData?.map((classInfo) => (
                  <SelectItem key={classInfo.id} value={classInfo.id}>
                    {classInfo.name} - {classInfo.days_of_week.join(', ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Student</label>
            <Select 
              value={selectedStudent} 
              onValueChange={setSelectedStudent}
              disabled={isLoadingStudents || !selectedClass}
            >
              <SelectTrigger>
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
          </div>

          {selectedStudent && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Attendance Status</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="present" id="present" />
                            <label htmlFor="present" className="flex items-center text-sm font-medium">
                              <CalendarCheck className="h-4 w-4 mr-2 text-green-600" />
                              Present
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="absent" id="absent" />
                            <label htmlFor="absent" className="flex items-center text-sm font-medium">
                              <CalendarX className="h-4 w-4 mr-2 text-red-600" />
                              Absent
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="late" id="late" />
                            <label htmlFor="late" className="flex items-center text-sm font-medium">
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
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional notes about attendance"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={saveAttendance.isPending}
                >
                  {saveAttendance.isPending ? "Saving..." : (existingAttendance ? "Update Attendance" : "Save Attendance")}
                </Button>
              </form>
            </Form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
