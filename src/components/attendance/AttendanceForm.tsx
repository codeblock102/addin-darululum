
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Student = {
  id: string;
  name: string;
  status?: string;
};

type Schedule = {
  id: string;
  class_name: string;
  day_of_week: string;
  time_slot: string;
};

const formSchema = z.object({
  class_schedule_id: z.string().min(1, { message: "Please select a class." }),
  student_id: z.string().min(1, { message: "Please select a student." }),
  date: z.date({
    required_error: "Please select a date.",
  }),
  status: z.enum(["present", "absent", "late"], {
    required_error: "Please select an attendance status.",
  }),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AttendanceForm() {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Get all class schedules
  const { data: schedules, isLoading: isLoadingSchedules } = useQuery({
    queryKey: ["schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedules")
        .select("*, teachers(name)");
      
      if (error) throw error;
      return data as (Schedule & { teachers: { name: string } })[];
    },
  });

  // Get students based on selected class
  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ["students", selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      
      const { data, error } = await supabase
        .from("students")
        .select(`
          id, 
          name,
          (
            select status 
            from attendance 
            where student_id = students.id 
            and class_schedule_id = :schedule_id
            and date = :today
          ) as today_status
        `)
        .eq("status", "active");
      
      if (error) throw error;
      return data as (Student & { today_status?: string })[];
    },
    enabled: !!selectedClass,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      class_schedule_id: "",
      student_id: "",
      date: new Date(),
      status: "present",
      notes: "",
    },
  });

  // Reset student selection when class changes
  useEffect(() => {
    if (selectedClass !== form.getValues().class_schedule_id) {
      form.setValue("student_id", "");
    }
    setSelectedClass(form.getValues().class_schedule_id);
  }, [form.watch("class_schedule_id")]);

  const submitAttendance = useMutation({
    mutationFn: async (values: FormValues) => {
      const { error } = await supabase.from("attendance").upsert({
        class_schedule_id: values.class_schedule_id,
        student_id: values.student_id,
        date: format(values.date, "yyyy-MM-dd"),
        status: values.status,
        notes: values.notes || null,
      }, {
        onConflict: 'class_schedule_id,student_id,date'
      });
      
      if (error) throw error;
      return values;
    },
    onSuccess: () => {
      toast.success("Attendance recorded successfully");
      queryClient.invalidateQueries({ queryKey: ["attendance", "students"] });
      form.reset({
        class_schedule_id: form.getValues().class_schedule_id,
        student_id: "",
        date: form.getValues().date,
        status: "present",
        notes: "",
      });
    },
    onError: (error) => {
      toast.error("Failed to record attendance");
      console.error("Error recording attendance:", error);
    },
  });

  function onSubmit(values: FormValues) {
    submitAttendance.mutate(values);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Take Attendance</CardTitle>
        <CardDescription>
          Record attendance for individual students in your class.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <FormField
                control={form.control}
                name="class_schedule_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {schedules?.map((schedule) => (
                          <SelectItem key={schedule.id} value={schedule.id}>
                            {schedule.class_name} - {schedule.day_of_week} ({schedule.time_slot})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="student_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!form.getValues().class_schedule_id}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a student" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students?.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name} 
                            {student.today_status && (
                              <span className="text-muted-foreground ml-2">
                                (Today: {student.today_status})
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="present" className="flex items-center">
                          <div className="flex items-center gap-2">
                            <Check className="text-green-500 h-4 w-4" />
                            <span>Present</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="absent" className="flex items-center">
                          <div className="flex items-center gap-2">
                            <X className="text-red-500 h-4 w-4" />
                            <span>Absent</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="late" className="flex items-center">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="text-amber-500 h-4 w-4" />
                            <span>Late</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes about the student's attendance"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full sm:w-auto"
              disabled={submitAttendance.isPending}
            >
              {submitAttendance.isPending ? "Saving..." : "Record Attendance"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
