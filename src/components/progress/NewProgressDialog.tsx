import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useState } from "react";
import { useForm } from "react-hook-form";
import { BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast.ts";
import { supabase } from "@/integrations/supabase/client.ts";
import { useQueryClient } from "@tanstack/react-query";

interface ProgressFormData {
  student_id: string;
  current_surah: number;
  current_juz: number;
  start_ayat: number;
  end_ayat: number;
  verses_memorized: number;
  memorization_quality: 'excellent' | 'good' | 'average' | 'needsWork' | 'horrible';
  notes: string;
}

export const NewProgressDialog = () => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<ProgressFormData>({
    defaultValues: {
      current_surah: 1,
      current_juz: 1,
      start_ayat: 1,
      end_ayat: 1,
      verses_memorized: 0,
      memorization_quality: 'average',
      notes: '',
    },
  });

  const onSubmit = async (data: ProgressFormData) => {
    try {
      const { error } = await supabase
        .from('progress')
        .insert([{
          ...data,
          date: new Date().toISOString(),
          last_revision_date: new Date().toISOString(),
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Progress entry has been saved",
      });
      
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to save progress entry:", error);
      toast({
        title: "Error",
        description: "Failed to save progress entry",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <BookOpen className="mr-2" />
          New Progress Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Progress Entry</DialogTitle>
          <DialogDescription>
            Record daily Sabaq progress for a student
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="current_surah"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Surah</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
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
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_ayat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Verse</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
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
                      <Input type="number" {...field} />
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
                    <Input type="number" {...field} />
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit">Save Progress</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
