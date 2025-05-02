
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DialogFooter } from "@/components/ui/dialog";
import { DhorBookEntrySchema } from "./dhorBookValidation";

interface DhorBookEntryFormProps {
  onSubmit: (data: any) => void;
  isPending: boolean;
  onCancel: () => void;
}

export function DhorBookEntryForm({ onSubmit, isPending, onCancel }: DhorBookEntryFormProps) {
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

  function handleSubmit(data: any) {
    onSubmit({
      ...data,
      entry_date: format(date || new Date(), "yyyy-MM-dd"),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                    type="button"
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
                  onChange={e => field.onChange(parseInt(e.target.value) || 0)}
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
                  onChange={e => field.onChange(parseInt(e.target.value) || 0)}
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
                  onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create Entry"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
