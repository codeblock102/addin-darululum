
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, Save, BookOpen } from "lucide-react";

interface SabaqAssignmentProps {
  teacherId: string;
}

const assignmentSchema = z.object({
  student_id: z.string({
    required_error: "Please select a student",
  }),
  assignment_type: z.enum(["sabaq", "sabaq_para", "dhor", "nazirah", "qaida"]),
  surah_number: z.coerce.number().min(1).max(114),
  start_ayat: z.coerce.number().min(1),
  end_ayat: z.coerce.number().min(1),
  page_start: z.coerce.number().optional(),
  page_end: z.coerce.number().optional(),
  assignment_date: z.string(),
});

export const SabaqAssignment = ({ teacherId }: SabaqAssignmentProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  
  // Fetch students for the dropdown
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['students-for-assignment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, learning_type')
        .eq('status', 'active')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching students:', error);
        return [];
      }
      
      return data;
    }
  });

  const form = useForm<z.infer<typeof assignmentSchema>>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      student_id: "",
      assignment_type: "sabaq",
      surah_number: 1,
      start_ayat: 1,
      end_ayat: 5,
      page_start: undefined,
      page_end: undefined,
      assignment_date: today,
    },
  });

  const assignmentMutation = useMutation({
    mutationFn: async (values: z.infer<typeof assignmentSchema>) => {
      const { data, error } = await supabase
        .from('student_assignments')
        .insert([{
          student_id: values.student_id,
          assignment_type: values.assignment_type,
          surah_number: values.surah_number,
          start_ayat: values.start_ayat,
          end_ayat: values.end_ayat,
          page_start: values.page_start,
          page_end: values.page_end,
          assignment_date: values.assignment_date,
          status: 'pending',
          teacher_id: teacherId
        }]);
      
      if (error) {
        throw new Error(`Failed to save assignment: ${error.message}`);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
      toast({
        title: "Assignment Created",
        description: "Student assignment has been successfully created.",
      });
      form.reset({
        student_id: "",
        assignment_type: "sabaq",
        surah_number: 1,
        start_ayat: 1,
        end_ayat: 5,
        page_start: undefined,
        page_end: undefined,
        assignment_date: today,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Assignment",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  function onSubmit(values: z.infer<typeof assignmentSchema>) {
    assignmentMutation.mutate(values);
  }

  const selectedStudent = form.watch('student_id');
  const studentType = students?.find(s => s.id === selectedStudent)?.learning_type || 'hifz';
  const assignmentType = form.watch('assignment_type');

  // Need to dynamically change available assignment types based on student learning type
  const isQaidaStudent = studentType === 'qaida';
  const isNazirahStudent = studentType === 'nazirah';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign New Lesson</CardTitle>
        <CardDescription>
          Create a new assignment for students to complete
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="student_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      
                      // Adjust the assignment type based on student type
                      const student = students?.find(s => s.id === value);
                      if (student?.learning_type === 'qaida') {
                        form.setValue('assignment_type', 'qaida');
                      } else if (student?.learning_type === 'nazirah') {
                        form.setValue('assignment_type', 'nazirah');
                      } else {
                        form.setValue('assignment_type', 'sabaq');
                      }
                    }} 
                    defaultValue={field.value}
                    disabled={studentsLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students?.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} ({student.learning_type})
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
              name="assignment_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignment Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isQaidaStudent || isNazirahStudent}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select assignment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isQaidaStudent ? (
                        <SelectItem value="qaida">Qaida</SelectItem>
                      ) : isNazirahStudent ? (
                        <SelectItem value="nazirah">Nazirah</SelectItem>
                      ) : (
                        <>
                          <SelectItem value="sabaq">New Sabaq</SelectItem>
                          <SelectItem value="sabaq_para">Sabaq Para</SelectItem>
                          <SelectItem value="dhor">Dhor</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Type of assignment for the student
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="surah_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Surah Number</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={114} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="assignment_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_ayat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starting Ayat</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="end_ayat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ending Ayat</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="page_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starting Page (13-line Quran)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        placeholder="Optional" 
                        value={field.value !== undefined ? field.value : ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="page_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ending Page (13-line Quran)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        placeholder="Optional" 
                        value={field.value !== undefined ? field.value : ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={assignmentMutation.isPending}
            >
              {assignmentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Create Assignment
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
