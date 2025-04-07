
import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { RevisionFormData } from "../progress/types";

const formSchema = z.object({
  juz_number: z.coerce.number().min(1).max(30),
  surah_number: z.coerce.number().min(1).max(114).optional(),
  quarters_revised: z.enum(['1st_quarter', '2_quarters', '3_quarters', '4_quarters']),
  memorization_quality: z.enum(['excellent', 'good', 'average', 'needsWork', 'horrible']),
  teacher_notes: z.string().optional(),
  status: z.enum(['completed', 'pending', 'needs_improvement'])
});

interface NewRevisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
}

export const NewRevisionDialog = ({
  open,
  onOpenChange,
  studentId,
  studentName
}: NewRevisionDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  
  // Setup form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      juz_number: 1,
      surah_number: undefined,
      quarters_revised: '1st_quarter',
      memorization_quality: 'average',
      teacher_notes: '',
      status: 'completed'
    }
  });
  
  // Get teacher information
  const getTeacherInfo = async () => {
    if (!session?.user) return null;
    
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name')
        .eq('email', session.user.email)
        .single();
      
      if (error) {
        console.error("Error fetching teacher info:", error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error("Failed to get teacher info:", error);
      return null;
    }
  };
  
  // Mutation for submitting the revision
  const submitRevision = useMutation({
    mutationFn: async (data: RevisionFormData) => {
      setSubmitting(true);
      
      try {
        // Get teacher info
        const teacherInfo = await getTeacherInfo();
        
        // Insert revision entry
        const { error: revisionError } = await supabase
          .from('juz_revisions')
          .insert([{
            student_id: studentId,
            juz_revised: data.juz_number,
            revision_date: new Date().toISOString().split('T')[0],
            teacher_notes: data.teacher_notes || '',
            memorization_quality: data.memorization_quality,
            teacher_id: teacherInfo?.id,
            quarters_revised: data.quarters_revised
          }]);
        
        if (revisionError) throw revisionError;
        
        // Update juz mastery data or create if it doesn't exist
        const { data: masteryData, error: masteryCheckError } = await supabase
          .from('juz_mastery')
          .select('*')
          .eq('student_id', studentId)
          .eq('juz_number', data.juz_number)
          .single();
        
        if (masteryCheckError && masteryCheckError.code !== 'PGRST116') {
          throw masteryCheckError;
        }
        
        // Determine mastery level based on memorization quality
        let mastery_level = 'in_progress';
        if (data.memorization_quality === 'excellent') {
          mastery_level = 'mastered';
        } else if (data.memorization_quality === 'good') {
          mastery_level = 'memorized';
        }
        
        if (masteryData) {
          // Update existing mastery record
          const consecutive_good_revisions = 
            (data.memorization_quality === 'excellent' || data.memorization_quality === 'good') 
              ? masteryData.consecutive_good_revisions + 1
              : 0;
          
          // If 3 consecutive good revisions, upgrade mastery level
          if (consecutive_good_revisions >= 3 && masteryData.mastery_level === 'memorized') {
            mastery_level = 'mastered';
          }
          
          const { error: updateError } = await supabase
            .from('juz_mastery')
            .update({
              mastery_level,
              last_revision_date: new Date().toISOString().split('T')[0],
              revision_count: masteryData.revision_count + 1,
              consecutive_good_revisions
            })
            .eq('id', masteryData.id);
          
          if (updateError) throw updateError;
        } else {
          // Create new mastery record
          const { error: insertError } = await supabase
            .from('juz_mastery')
            .insert([{
              student_id: studentId,
              juz_number: data.juz_number,
              mastery_level,
              last_revision_date: new Date().toISOString().split('T')[0],
              revision_count: 1,
              consecutive_good_revisions: 
                (data.memorization_quality === 'excellent' || data.memorization_quality === 'good') ? 1 : 0
            }]);
          
          if (insertError) throw insertError;
        }
        
        return true;
      } catch (error: any) {
        console.error("Error submitting revision:", error);
        throw new Error(error.message || "Failed to submit revision");
      } finally {
        setSubmitting(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Revision added successfully"
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['student-revisions', studentId]
      });
      queryClient.invalidateQueries({
        queryKey: ['student-mastery', studentId]
      });
      
      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add revision",
        variant: "destructive"
      });
    }
  });
  
  // Form submission handler
  function onSubmit(values: z.infer<typeof formSchema>) {
    submitRevision.mutate(values);
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Revision Entry</DialogTitle>
          <DialogDescription>
            Record a new revision for {studentName}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="juz_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Juz Number</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={30} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="surah_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Surah Number (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={114} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="quarters_revised"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Portion Revised</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select portion" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1st_quarter">First Quarter</SelectItem>
                      <SelectItem value="2_quarters">Half Juz</SelectItem>
                      <SelectItem value="3_quarters">Three Quarters</SelectItem>
                      <SelectItem value="4_quarters">Full Juz</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="memorization_quality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quality of Recitation</FormLabel>
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Revision Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="needs_improvement">Needs Improvement</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="teacher_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any notes about this revision"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Revision"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
