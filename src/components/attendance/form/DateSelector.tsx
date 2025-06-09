
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
          <FormLabel className="text-gray-700 dark:text-gray-300">
            Date
          </FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal border-gray-300 dark:border-gray-700 focus:ring-purple-500 focus:border-purple-500",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  {field.value ? (
                    format(field.value, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg" align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                initialFocus
                className={cn("p-3 pointer-events-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100")}
                classNames={{
                  months: "text-gray-900 dark:text-gray-100",
                  month: "text-gray-900 dark:text-gray-100", 
                  caption: "text-gray-900 dark:text-gray-100 font-medium",
                  caption_label: "text-gray-900 dark:text-gray-100 font-medium",
                  nav_button: "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700",
                  nav_button_previous: "text-gray-900 dark:text-gray-100",
                  nav_button_next: "text-gray-900 dark:text-gray-100",
                  table: "text-gray-900 dark:text-gray-100",
                  head_row: "text-gray-900 dark:text-gray-100",
                  head_cell: "text-gray-700 dark:text-gray-300 font-medium",
                  row: "text-gray-900 dark:text-gray-100",
                  cell: "text-gray-900 dark:text-gray-100",
                  day: "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700",
                  day_selected: "bg-blue-600 text-white hover:bg-blue-700",
                  day_today: "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-semibold",
                  day_outside: "text-gray-400 dark:text-gray-600",
                  day_disabled: "text-gray-300 dark:text-gray-700",
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
