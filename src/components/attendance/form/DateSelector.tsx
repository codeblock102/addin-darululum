
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UseFormReturn } from "react-hook-form";
import { AttendanceFormValues } from "@/types/attendance-form";

interface DateSelectorProps {
  form: UseFormReturn<AttendanceFormValues>;
}

export function DateSelector({ form }: DateSelectorProps) {
  return (
    <FormField
      control={form.control}
      name="date"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel className="text-slate-700 dark:text-slate-300 font-medium">
            Date
          </FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                    !field.value && "text-slate-500 dark:text-slate-400"
                  )}
                >
                  {field.value ? (
                    <span className="text-slate-900 dark:text-slate-100">
                      {format(field.value, "PPP")}
                    </span>
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg rounded-lg" align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                initialFocus
                className="p-3 pointer-events-auto"
                classNames={{
                  caption: "text-slate-900 dark:text-slate-100",
                  caption_label: "text-slate-900 dark:text-slate-100 font-medium",
                  nav_button: "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700",
                  head_cell: "text-slate-600 dark:text-slate-400 font-normal",
                  cell: "text-slate-900 dark:text-slate-100",
                  day: "text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground font-medium",
                  day_outside: "text-slate-400 dark:text-slate-500",
                  day_disabled: "text-slate-300 dark:text-slate-600",
                }}
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
