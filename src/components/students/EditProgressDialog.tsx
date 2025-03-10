
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

interface Progress {
  id: string;
  student_id: string;
  current_surah: number;
  current_juz: number;
  start_ayat: number;
  end_ayat: number;
  verses_memorized: number;
  date: string;
  memorization_quality?: 'excellent' | 'good' | 'average' | 'needsWork' | 'horrible';
  notes?: string;
  teacher_notes?: string;
  contributor_name?: string;
  contributor_id?: string;
}

interface EditProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progressEntry: Progress | null;
}

export const EditProgressDialog = ({ 
  open, 
  onOpenChange, 
  progressEntry 
}: EditProgressDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm({
    defaultValues: {
      current_surah: progressEntry?.current_surah || 1,
      current_juz: progressEntry?.current_juz || 1,
      start_ayat: progressEntry?.start_ayat || 1,
      end_ayat: progressEntry?.end_ayat || 1,
      verses_memorized: progressEntry?.verses_memorized || 0,
      memorization_quality: progressEntry?.memorization_quality || 'average',
      notes: progressEntry?.notes || '',
      teacher_notes: progressEntry?.teacher_notes || '',
    },
  });

  // Update form when progressEntry changes
  useState(() => {
    if (progressEntry) {
      form.reset({
        current_surah: progressEntry.current_surah || 1,
        current_juz: progressEntry.current_juz || 1,
        start_ayat: progressEntry.start_ayat || 1,
        end_ayat: progressEntry.end_ayat || 1,
        verses_memorized: progressEntry.verses_memorized || 0,
        memorization_quality: progressEntry.memorization_quality || 'average',
        notes: progressEntry.notes || '',
        teacher_notes: progressEntry.teacher_notes || '',
      });
    }
  });

  const onSubmit = async (data: any) => {
    if (!progressEntry?.id) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('progress')
        .update({
          ...data,
          // Don't update contributor information to preserve original submission metadata
        })
        .eq('id', progressEntry.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Progress entry has been updated",
      });
      
      // Invalidate both progress queries
      queryClient.invalidateQueries({ queryKey: ['student-progress', progressEntry.student_id] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update progress entry",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Progress Entry</DialogTitle>
          <DialogDescription>
            Make changes to the progress entry
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="current_surah"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Surah</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
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
                      <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_ayat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Verse</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
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
                    <FormLabel>End Verse</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="verses_memorized"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verses Memorized</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="memorization_quality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Memorization Quality</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
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
                      <SelectItem value="horrible">Needs Significant Improvement</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any additional notes or observations" 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="teacher_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teacher Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add teacher notes or feedback" 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Progress"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
