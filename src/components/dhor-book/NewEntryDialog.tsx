import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { DhorBookEntrySchema } from "./dhorBookValidation";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export interface NewEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  teacherId: string;
  onSuccess?: (data?: any) => void;
}

export function NewEntryDialog({
  open,
  onOpenChange,
  studentId,
  teacherId,
  onSuccess
}: NewEntryDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date | undefined>(new Date());

  const form = useForm({
    resolver: zodResolver(DhorBookEntrySchema),
    defaultValues: {
      entry_date: date,
      sabak: "",
      sabak_para: "",
      dhor_1: "",
      dhor_1_mistakes: 0,
      dhor_2: "",
      dhor_2_mistakes: 0,
      comments: "",
      points: 0,
      detention: false
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (formData: any) => {
      const { data, error } = await supabase
        .from('dhor_book_entries')
        .insert([{
          student_id: studentId,
          teacher_id: teacherId,
          entry_date: formData.entry_date,
          day_of_week: new Date(formData.entry_date).toLocaleDateString('en-US', { weekday: 'long' }),
          sabak: formData.sabak,
          sabak_para: formData.sabak_para,
          dhor_1: formData.dhor_1,
          dhor_1_mistakes: formData.dhor_1_mistakes || 0,
          dhor_2: formData.dhor_2,
          dhor_2_mistakes: formData.dhor_2_mistakes || 0,
          comments: formData.comments,
          points: formData.points || 0,
          detention: formData.detention || false
        }])
        .select();
    
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dhor-book-entries'] });
      onSuccess?.(data);
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error creating entry:', error);
      toast({
        title: "Error",
        description: "Failed to create entry. Please try again.",
        variant: "destructive"
      });
    }
  });

  function onSubmit(data: any) {
    mutate({
      ...data,
      entry_date: format(date || new Date(), "yyyy-MM-dd"),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Dhor Book Entry</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="entry_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Entry Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        {date ? format(date, "PPP") : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(date) =>
                          date > new Date()
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sabak"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sabak</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter sabak" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sabak_para"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sabak Para</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter sabak para" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dhor_1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dhor 1</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter dhor 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dhor_1_mistakes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dhor 1 Mistakes</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter number of mistakes"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dhor_2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dhor 2</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter dhor 2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dhor_2_mistakes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dhor 2 Mistakes</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter number of mistakes"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comments</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter comments"
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
              name="points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Points</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter points"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create Entry"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
