
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import * as z from "zod";

interface EditRevisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revisionId: string;
  studentId: string;
  studentName: string;
  onSuccess?: () => void;
}

// Use a single consistent enum for memorization quality
type MemorizationQuality = "excellent" | "good" | "average" | "needsWork" | "horrible";

const formSchema = z.object({
  juz_number: z.number().min(1).max(30),
  memorization_quality: z.enum(["excellent", "good", "average", "needsWork", "horrible"] as const),
  revision_date: z.string(),
  notes: z.string().optional(),
});

export function EditRevisionDialog({
  open,
  onOpenChange,
  revisionId,
  studentId,
  studentName,
  onSuccess,
}: EditRevisionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      juz_number: 1,
      memorization_quality: "average",
      revision_date: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  // Fetch revision data when the dialog opens
  useEffect(() => {
    if (open && revisionId) {
      setIsLoading(true);
      supabase
        .from("juz_revisions")
        .select("*")
        .eq("id", revisionId)
        .single()
        .then(({ data, error }) => {
          setIsLoading(false);
          if (error) {
            toast({
              title: "Error fetching revision",
              description: error.message,
              variant: "destructive",
            });
            return;
          }
          if (data) {
            // Map DB quality to form schema quality
            let mappedQuality: MemorizationQuality = "average";
            
            if (data.memorization_quality === "excellent") mappedQuality = "excellent";
            else if (data.memorization_quality === "good") mappedQuality = "good"; 
            else if (data.memorization_quality === "average") mappedQuality = "average";
            else if (data.memorization_quality === "poor" || 
                    data.memorization_quality === "unsatisfactory") mappedQuality = "needsWork";
            
            form.reset({
              juz_number: data.juz_revised || data.juz_number || 1,
              memorization_quality: mappedQuality,
              revision_date: data.revision_date,
              notes: data.teacher_notes || "",
            });
          }
        });
    }
  }, [open, revisionId, form, toast]);

  const updateRevisionMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // Map form schema quality to DB quality
      let dbQuality: string = "average";
      
      if (values.memorization_quality === "excellent") dbQuality = "excellent";
      else if (values.memorization_quality === "good") dbQuality = "good";
      else if (values.memorization_quality === "average") dbQuality = "average";
      else if (values.memorization_quality === "needsWork") dbQuality = "poor";
      else if (values.memorization_quality === "horrible") dbQuality = "unsatisfactory";
      
      const { error } = await supabase
        .from("juz_revisions")
        .update({
          juz_revised: values.juz_number,
          memorization_quality: dbQuality,
          revision_date: values.revision_date,
          teacher_notes: values.notes,
        })
        .eq("id", revisionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["juz-revisions", studentId] });
      // Also invalidate classroom-records query to update the classroom tab
      queryClient.invalidateQueries({ queryKey: ["classroom-records"] });
      toast({
        title: "Revision Updated",
        description: `The revision for ${studentName} has been updated successfully.`,
      });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error Updating Revision",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateRevisionMutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Revision</DialogTitle>
          <DialogDescription>
            Update the revision details for {studentName}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="juz_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Juz Number</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      placeholder="Enter Juz Number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
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
                      <SelectItem value="horrible">Unsatisfactory</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="revision_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Revision Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes about this revision"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional notes about this revision session.
                  </FormDescription>
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
              <Button type="submit" disabled={updateRevisionMutation.isPending}>
                {updateRevisionMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
