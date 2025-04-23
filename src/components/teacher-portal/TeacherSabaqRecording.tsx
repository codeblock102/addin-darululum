
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Check } from "lucide-react";
import { StudentAssignment } from "@/types/progress";

interface TeacherSabaqRecordingProps {
  teacherId: string;
}

// Form schema for recording a student's sabaq
const sabaqSchema = z.object({
  student_id: z.string({
    required_error: "Please select a student",
  }),
  assignment_id: z.string().optional(),
  current_surah: z.coerce.number().min(1).max(114),
  current_juz: z.coerce.number().min(1).max(30),
  start_ayat: z.coerce.number().min(1),
  end_ayat: z.coerce.number().min(1),
  page_start: z.coerce.number().optional(),
  page_end: z.coerce.number().optional(),
  mistake_count: z.coerce.number().min(0).default(0),
  memorization_quality: z.enum(["excellent", "good", "average", "needsWork", "horrible"]),
  lesson_type: z.enum(["hifz", "nazirah", "qaida"]),
  is_new_lesson: z.boolean().default(true),
  tajweed_level: z.string().min(1, "Tajweed level is required"),
  notes: z.string().optional(),
});

export const TeacherSabaqRecording = ({ teacherId }: TeacherSabaqRecordingProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("new_lesson");
  
  // Fetch teacher details
  const { data: teacherData } = useQuery({
    queryKey: ['teacher-details', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name')
        .eq('id', teacherId)
        .single();
      
      if (error) {
        console.error('Error fetching teacher details:', error);
        return null;
      }
      
      return data;
    }
  });
  
  // Fetch students
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['students-for-sabaq'],
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
  
  // Fetch pending assignments
  const { data: pendingAssignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['pending-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_assignments')
        .select(`
          id,
          student_id,
          assignment_date,
          surah_number,
          start_ayat,
          end_ayat,
          page_start,
          page_end,
          assignment_type,
          students (
            id,
            name,
            learning_type
          )
        `)
        .eq('status', 'pending')
        .lte('assignment_date', new Date().toISOString().split('T')[0])
        .order('assignment_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching assignments:', error);
        return [];
      }
      
      return data;
    }
  });
  
  // Form setup
  const form = useForm<z.infer<typeof sabaqSchema>>({
    resolver: zodResolver(sabaqSchema),
    defaultValues: {
      student_id: "",
      current_surah: 1,
      current_juz: 1,
      start_ayat: 1,
      end_ayat: 1,
      mistake_count: 0,
      memorization_quality: "average",
      lesson_type: "hifz",
      is_new_lesson: true,
      tajweed_level: "",
      notes: "",
    },
  });
  
  // Watch for student selection to update form values
  const selectedStudent = form.watch('student_id');
  const studentLearningType = students?.find(s => s.id === selectedStudent)?.learning_type || 'hifz';
  
  // Update lesson type when student changes
  React.useEffect(() => {
    if (studentLearningType) {
      form.setValue('lesson_type', studentLearningType as any);
    }
  }, [selectedStudent, studentLearningType, form]);
  
  // Watch for assignment selection
  const selectedAssignment = form.watch('assignment_id');
  
  // Update form when assignment is selected
  React.useEffect(() => {
    if (selectedAssignment && pendingAssignments) {
      const assignment = pendingAssignments.find(a => a.id === selectedAssignment);
      if (assignment) {
        form.setValue('current_surah', assignment.surah_number);
        form.setValue('start_ayat', assignment.start_ayat);
        form.setValue('end_ayat', assignment.end_ayat);
        
        // Set page numbers if available
        if (assignment.page_start) {
          form.setValue('page_start', assignment.page_start);
        }
        
        if (assignment.page_end) {
          form.setValue('page_end', assignment.page_end);
        }
        
        // Set lesson type based on assignment type
        switch (assignment.assignment_type) {
          case 'sabaq':
            form.setValue('is_new_lesson', true);
            form.setValue('lesson_type', 'hifz');
            break;
          case 'nazirah':
            form.setValue('lesson_type', 'nazirah');
            form.setValue('is_new_lesson', true);
            break;
          case 'qaida':
            form.setValue('lesson_type', 'qaida');
            form.setValue('is_new_lesson', true);
            break;
          case 'sabaq_para':
          case 'dhor':
            form.setValue('is_new_lesson', false);
            form.setValue('lesson_type', 'hifz');
            break;
        }
      }
    }
  }, [selectedAssignment, pendingAssignments, form]);
  
  // Handle form submission
  const progressMutation = useMutation({
    mutationFn: async (values: z.infer<typeof sabaqSchema>) => {
      // Calculate auto rating based on mistake count
      const { data: autoRating } = await supabase
        .rpc('generate_auto_rating', { mistakes: values.mistake_count });
      
      // Create contributor info
      const contributorInfo = teacherData ? {
        contributor_id: teacherData.id,
        contributor_name: `Teacher ${teacherData.name}`
      } : {
        contributor_id: teacherId,
        contributor_name: "Teacher"
      };
      
      // Start a transaction
      const { data: progressData, error: progressError } = await supabase
        .from('progress')
        .insert([{
          student_id: values.student_id,
          current_surah: values.current_surah,
          current_juz: values.current_juz,
          start_ayat: values.start_ayat,
          end_ayat: values.end_ayat,
          page_start: values.page_start,
          page_end: values.page_end,
          mistake_count: values.mistake_count,
          memorization_quality: values.memorization_quality,
          is_new_lesson: values.is_new_lesson,
          lesson_type: values.lesson_type,
          tajweed_level: values.tajweed_level,
          teacher_notes: values.notes,
          date: new Date().toISOString().split('T')[0],
          verses_memorized: values.end_ayat - values.start_ayat + 1,
          auto_rating: autoRating,
          ...contributorInfo
        }])
        .select();
      
      if (progressError) {
        throw new Error(`Failed to save progress: ${progressError.message}`);
      }
      
      // If this was a pending assignment, update its status
      if (values.assignment_id) {
        const { error: assignmentError } = await supabase
          .from('student_assignments')
          .update({ status: 'completed' })
          .eq('id', values.assignment_id);
        
        if (assignmentError) {
          console.error("Error updating assignment status:", assignmentError);
          // Don't fail the whole operation if just updating the status fails
        }
      }
      
      return progressData;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['teacher-summary', teacherId] });
      queryClient.invalidateQueries({ queryKey: ['pending-assignments'] });
      
      toast({
        title: "Progress Recorded",
        description: "Student progress has been successfully saved.",
      });
      
      // Reset form
      form.reset({
        student_id: "",
        assignment_id: undefined,
        current_surah: 1,
        current_juz: 1,
        start_ayat: 1,
        end_ayat: 1,
        page_start: undefined,
        page_end: undefined,
        mistake_count: 0,
        memorization_quality: "average",
        lesson_type: "hifz",
        is_new_lesson: true,
        tajweed_level: "",
        notes: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Saving Progress",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Reset form when switching tabs
    form.reset({
      student_id: "",
      assignment_id: undefined,
      current_surah: 1,
      current_juz: 1,
      start_ayat: 1,
      end_ayat: 1,
      page_start: undefined,
      page_end: undefined,
      mistake_count: 0,
      memorization_quality: "average",
      lesson_type: "hifz",
      is_new_lesson: value === "new_lesson",
      tajweed_level: "",
      notes: "",
    });
  };
  
  function onSubmit(values: z.infer<typeof sabaqSchema>) {
    progressMutation.mutate(values);
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Student Progress</CardTitle>
        <CardDescription>
          Document a student's Quran memorization progress
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="new_lesson" value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new_lesson">New Lesson</TabsTrigger>
            <TabsTrigger value="revision">Revision</TabsTrigger>
          </TabsList>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
              {/* Student selection - common to both tabs */}
              <FormField
                control={form.control}
                name="student_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        
                        // Reset assignment when student changes
                        form.setValue('assignment_id', undefined);
                        
                        // Set lesson type based on student type
                        const student = students?.find(s => s.id === value);
                        if (student?.learning_type) {
                          form.setValue('lesson_type', student.learning_type as any);
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
              
              {/* Assignment selection - only in revision tab */}
              {activeTab === "revision" && (
                <FormField
                  control={form.control}
                  name="assignment_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pending Assignment</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={!selectedStudent || assignmentsLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an assignment" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">-- Select an assignment --</SelectItem>
                          {pendingAssignments
                            ?.filter(a => a.student_id === selectedStudent)
                            .map((assignment) => (
                              <SelectItem key={assignment.id} value={assignment.id}>
                                {assignment.assignment_type.replace('_', ' ')} - Surah {assignment.surah_number} ({assignment.assignment_date})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select a pending assignment to mark as completed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {/* Type selection in new lesson tab */}
              {activeTab === "new_lesson" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="lesson_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lesson Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select lesson type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="hifz">Hifz</SelectItem>
                            <SelectItem value="nazirah">Nazirah</SelectItem>
                            <SelectItem value="qaida">Qaida</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="is_new_lesson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Memorization Status</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === 'true')} 
                          defaultValue={field.value ? 'true' : 'false'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">New Memorization</SelectItem>
                            <SelectItem value="false">Revision</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              {/* Common fields for both tabs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="current_surah"
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
                  name="current_juz"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Juz</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={30} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="mistake_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mistake Count</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="memorization_quality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Memorization Quality</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select quality" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="excellent">Excellent</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="average">Average</SelectItem>
                          <SelectItem value="needsWork">Needs Work</SelectItem>
                          <SelectItem value="horrible">Incomplete</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tajweed_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tajweed Level</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Excellent, Good, Needs Practice" {...field} />
                      </FormControl>
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
                    <FormLabel>Teacher Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional notes about the student's progress, areas for improvement, or specific achievements" 
                        className="min-h-[120px]"
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
                disabled={progressMutation.isPending}
              >
                {progressMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Record {activeTab === "new_lesson" ? "New Lesson" : "Revision"}
                  </>
                )}
              </Button>
              
              {teacherData && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Entry will be recorded as submitted by Teacher {teacherData.name}
                </p>
              )}
            </form>
          </Form>
        </Tabs>
      </CardContent>
    </Card>
  );
};
