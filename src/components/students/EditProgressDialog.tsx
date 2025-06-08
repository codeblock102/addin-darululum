import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.tsx";
import { Input } from "@/components/ui/input.tsx";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { ProgressFormData, Progress } from "@/types/progress.ts";
import React from "react";

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

  const form = useForm<ProgressFormData>({
    defaultValues: {
      current_surah: progressEntry?.current_surah || 1,
      current_juz: progressEntry?.current_juz || 1,
      start_ayat: progressEntry?.start_ayat || 1,
      end_ayat: progressEntry?.end_ayat || 1,
      verses_memorized: progressEntry?.verses_memorized || 0,
      memorization_quality: progressEntry?.memorization_quality || 'average',
      notes: progressEntry?.notes || '',
    },
  });

  // Update form when progressEntry changes
  React.useEffect(() => {
    if (progressEntry) {
      form.reset({
        current_surah: progressEntry.current_surah || 1,
        current_juz: progressEntry.current_juz || 1,
        start_ayat: progressEntry.start_ayat || 1,
        end_ayat: progressEntry.end_ayat || 1,
        verses_memorized: progressEntry.verses_memorized || 0,
        memorization_quality: progressEntry.memorization_quality || 'average',
        notes: progressEntry.notes || '',
      });
    }
  }, [progressEntry, form]);

  const onSubmit = async (data: ProgressFormData) => {
    if (!progressEntry?.id) return;
    
    setIsProcessing(true);
    try {
      const updateData: Partial<Progress> = {
        current_surah: data.current_surah,
        current_juz: data.current_juz,
        start_ayat: data.start_ayat,
        end_ayat: data.end_ayat,
        verses_memorized: data.verses_memorized,
        memorization_quality: data.memorization_quality,
        notes: data.notes,
      };

      const { error } = await supabase
        .from('progress')
        .update(updateData)
        .eq('id', progressEntry.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Progress entry has been updated",
      });
      
      queryClient.invalidateQueries({ queryKey: ['student-progress', progressEntry.student_id] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update progress entry";
      toast({
        title: "Error",
        description: message,
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
