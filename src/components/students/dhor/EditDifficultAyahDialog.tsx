
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { DifficultAyah } from "../progress/types";

const formSchema = z.object({
  surah_number: z.coerce.number().min(1).max(114),
  ayah_number: z.coerce.number().min(1),
  juz_number: z.coerce.number().min(1).max(30),
  notes: z.string().optional(),
  revision_count: z.coerce.number().min(0)
});

interface EditDifficultAyahDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ayah: DifficultAyah | null;
}

export const EditDifficultAyahDialog = ({
  open,
  onOpenChange,
  ayah
}: EditDifficultAyahDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  
  // Setup form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      surah_number: ayah?.surah_number || 1,
      ayah_number: ayah?.ayah_number || 1,
      juz_number: ayah?.juz_number || 1,
      notes: ayah?.notes || '',
      revision_count: ayah?.revision_count || 0
    }
  });
  
  // Update form when ayah changes
  useEffect(() => {
    if (ayah) {
      form.reset({
        surah_number: ayah.surah_number,
        ayah_number: ayah.ayah_number,
        juz_number: ayah.juz_number,
        notes: ayah.notes,
        revision_count: ayah.revision_count
      });
    }
  }, [ayah, form]);
  
  // Mutation for updating difficult ayah
  const updateDifficultAyah = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (!ayah?.id) throw new Error("No ayah selected");
      
      setSubmitting(true);
      
      try {
        const { error } = await supabase
          .from('difficult_ayahs')
          .update({
            surah_number: data.surah_number,
            ayah_number: data.ayah_number,
            juz_number: data.juz_number,
            notes: data.notes || '',
            revision_count: data.revision_count,
            last_revised: new Date().toISOString().split('T')[0]
          })
          .eq('id', ayah.id);
        
        if (error) throw error;
        return true;
      } catch (error: any) {
        console.error("Error updating difficult ayah:", error);
        throw new Error(error.message || "Failed to update difficult ayah");
      } finally {
        setSubmitting(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Difficult ayah updated successfully"
      });
      
      // Invalidate query to refresh data
      queryClient.invalidateQueries({
        queryKey: ['student-difficult-ayahs', ayah?.student_id]
      });
      
      // Close dialog
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update difficult ayah",
        variant: "destructive"
      });
    }
  });
  
  // Form submission handler
  function onSubmit(values: z.infer<typeof formSchema>) {
    updateDifficultAyah.mutate(values);
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Difficult Ayah</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
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
                name="ayah_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ayah Number</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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
                name="revision_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Revision Count</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
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
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add notes about why this ayah is difficult"
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
                "Update Ayah"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
