import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar.tsx";
import { Button } from "@/components/ui/button.tsx";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { cn } from "@/lib/utils.ts";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.tsx";
import type { UseFormReturn } from "react-hook-form";
import type { DailyActivityFormValues } from "../dhorBookValidation.ts";

interface DatePickerFieldProps {
  form: UseFormReturn<DailyActivityFormValues>;
  date: Date | undefined;
  onDateChange: (newDate: Date | undefined) => void;
}

export function DatePickerField({
  form,
  date,
  onDateChange,
}: DatePickerFieldProps) {
  return (
    <FormField
      control={form.control}
      name="entry_date"
      render={() => (
        <FormItem className="flex flex-col">
          <FormLabel>Entry Date</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full pl-3 text-left font-normal",
                  !date && "text-muted-foreground",
                )}
                type="button"
              >
                {date ? format(date, "PPP") : <span>Pick a date</span>}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  onDateChange(newDate);
                  form.setValue("entry_date", newDate);
                }}
                disabled={(d) => d > new Date()}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
