
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";
import { progressFormSchema, ProgressFormValues } from "./types";
import { useProgressSubmit } from "./useProgressSubmit";

interface ProgressFormProps {
  teacherId: string;
  teacherData: any | null;
  students: any[];
  studentsLoading: boolean;
}

export const ProgressForm = ({
  teacherId,
  teacherData,
  students,
  studentsLoading
}: ProgressFormProps) => {
  const progressMutation = useProgressSubmit(teacherId, teacherData);
  
  // Form setup
  const form = useForm<ProgressFormValues>({
    resolver: zodResolver(progressFormSchema),
    defaultValues: {
      student_id: "",
      current_surah: 1,
      current_juz: 1,
      start_ayat: 1,
      end_ayat: 1,
      memorization_quality: "average",
      tajweed_level: "",
      notes: ""
    }
  });
  
  function onSubmit(values: ProgressFormValues) {
    progressMutation.mutate(values, {
      onSuccess: () => {
        form.reset();
      }
    });
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="student_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={studentsLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {students?.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
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
            name="memorization_quality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Memorization Quality</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
        
        <Button type="submit" className="w-full" disabled={progressMutation.isPending}>
          {progressMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Record Progress
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
  );
};
