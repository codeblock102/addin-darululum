
import { useState } from "react";
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

const formSchema = z.object({
  surah_number: z.coerce.number().min(1).max(114),
  ayah_number: z.coerce.number().min(1),
  juz_number: z.coerce.number().min(1).max(30),
  notes: z.string().optional()
});

interface NewDifficultAyahDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
}

export const NewDifficultAyahDialog = ({
  open,
  onOpenChange,
  studentId
}: NewDifficultAyahDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  
  // Setup form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      surah_number: 1,
      ayah_number: 1,
      juz_number: 1,
      notes: ''
    }
  });
  
  // Mutation for adding a difficult ayah
  const addDifficultAyah = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      setSubmitting(true);
      
      try {
        const { error } = await supabase
          .from('difficult_ayahs')
          .insert([{
            student_id: studentId,
            surah_number: data.surah_number,
            ayah_number: data.ayah_number,
            juz_number: data.juz_number,
            notes: data.notes || '',
            date_added: new Date().toISOString().split('T')[0],
            revision_count: 0,
            last_revised: null,
            status: 'active'
          }]);
        
        if (error) throw error;
        return true;
      } catch (error: any) {
        console.error("Error adding difficult ayah:", error);
        throw new Error(error.message || "Failed to add difficult ayah");
      } finally {
        setSubmitting(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Difficult ayah added successfully"
      });
      
      // Invalidate query to refresh data
      queryClient.invalidateQueries({
        queryKey: ['student-difficult-ayahs', studentId]
      });
      
      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add difficult ayah",
        variant: "destructive"
      });
    }
  });
  
  // Form submission handler
  function onSubmit(values: z.infer<typeof formSchema>) {
    addDifficultAyah.mutate(values);
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Difficult Ayah</DialogTitle>
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
                "Add Difficult Ayah"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
