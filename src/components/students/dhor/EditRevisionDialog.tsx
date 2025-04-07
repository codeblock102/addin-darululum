
import { useEffect, useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
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

const formSchema = z.object({
  juz_revised: z.coerce.number().min(1).max(30),
  quarters_revised: z.enum(['1st_quarter', '2_quarters', '3_quarters', '4_quarters']),
  memorization_quality: z.enum(['excellent', 'good', 'average', 'needsWork', 'horrible']),
  teacher_notes: z.string().optional(),
});

interface Revision {
  id: string;
  student_id: string;
  juz_revised: number;
  quarters_revised?: '1st_quarter' | '2_quarters' | '3_quarters' | '4_quarters';
  revision_date: string;
  teacher_notes?: string;
  memorization_quality?: 'excellent' | 'good' | 'average' | 'needsWork' | 'horrible';
}

interface EditRevisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revision: Revision | null;
}

export const EditRevisionDialog = ({
  open,
  onOpenChange,
  revision
}: EditRevisionDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  
  // Setup form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      juz_revised: revision?.juz_revised || 1,
      quarters_revised: revision?.quarters_revised || '1st_quarter',
      memorization_quality: revision?.memorization_quality || 'average',
      teacher_notes: revision?.teacher_notes || '',
    }
  });
  
  // Update form when revision changes
  useEffect(() => {
    if (revision) {
      form.reset({
        juz_revised: revision.juz_revised,
        quarters_revised: revision.quarters_revised || '1st_quarter',
        memorization_quality: revision.memorization_quality || 'average',
        teacher_notes: revision.teacher_notes || '',
      });
    }
  }, [revision, form]);
  
  // Mutation for updating the revision
  const updateRevision = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (!revision?.id) throw new Error("No revision selected");
      
      setSubmitting(true);
      
      try {
        const { error } = await supabase
          .from('juz_revisions')
          .update({
            juz_revised: data.juz_revised,
            quarters_revised: data.quarters_revised,
            memorization_quality: data.memorization_quality,
            teacher_notes: data.teacher_notes || ''
          })
          .eq('id', revision.id);
        
        if (error) throw error;
        
        // Also update the juz_mastery table if quality changed
        const { data: masteryData, error: masteryError } = await supabase
          .from('juz_mastery')
          .select('*')
          .eq('student_id', revision.student_id)
          .eq('juz_number', data.juz_revised)
          .single();
        
        if (masteryError && masteryError.code !== 'PGRST116') {
          throw masteryError;
        }
        
        if (masteryData) {
          // Determine mastery level based on recent revisions
          let mastery_level = masteryData.mastery_level;
          
          // If quality improved, consider upgrading mastery level
          if (
            (revision.memorization_quality === 'needsWork' || revision.memorization_quality === 'horrible') &&
            (data.memorization_quality === 'excellent' || data.memorization_quality === 'good')
          ) {
            if (masteryData.consecutive_good_revisions + 1 >= 3) {
              mastery_level = 'mastered';
            } else if (masteryData.mastery_level === 'in_progress') {
              mastery_level = 'memorized';
            }
          }
          
          // If quality worsened, consider downgrading mastery level
          if (
            (revision.memorization_quality === 'excellent' || revision.memorization_quality === 'good') &&
            (data.memorization_quality === 'needsWork' || data.memorization_quality === 'horrible')
          ) {
            if (masteryData.mastery_level === 'mastered') {
              mastery_level = 'memorized';
            }
          }
          
          const consecutive_good_revisions = 
            (data.memorization_quality === 'excellent' || data.memorization_quality === 'good') 
              ? masteryData.consecutive_good_revisions + 1
              : 0;
          
          const { error: updateMasteryError } = await supabase
            .from('juz_mastery')
            .update({
              mastery_level,
              last_revision_date: new Date().toISOString().split('T')[0],
              consecutive_good_revisions
            })
            .eq('id', masteryData.id);
          
          if (updateMasteryError) throw updateMasteryError;
        }
        
        return true;
      } catch (error: any) {
        console.error("Error updating revision:", error);
        throw new Error(error.message || "Failed to update revision");
      } finally {
        setSubmitting(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Revision updated successfully"
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['student-revisions', revision?.student_id]
      });
      queryClient.invalidateQueries({
        queryKey: ['student-mastery', revision?.student_id]
      });
      
      // Close dialog
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update revision",
        variant: "destructive"
      });
    }
  });
  
  // Form submission handler
  function onSubmit(values: z.infer<typeof formSchema>) {
    updateRevision.mutate(values);
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Revision Entry</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="juz_revised"
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
                "Update Revision"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
