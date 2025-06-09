
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
                className={cn("p-3 pointer-events-auto bg-white dark:bg-gray-800")}
                classNames={{
                  months: "text-black dark:text-white",
                  month: "text-black dark:text-white", 
                  caption: "text-black dark:text-white font-bold text-base",
                  caption_label: "text-black dark:text-white font-bold text-base",
                  nav_button: "text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 font-bold",
                  nav_button_previous: "text-black dark:text-white font-bold",
                  nav_button_next: "text-black dark:text-white font-bold",
                  table: "text-black dark:text-white",
                  head_row: "text-black dark:text-white",
                  head_cell: "text-black dark:text-white font-bold text-sm",
                  row: "text-black dark:text-white",
                  cell: "text-black dark:text-white",
                  day: "text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 font-medium",
                  day_selected: "bg-blue-600 text-white hover:bg-blue-700 font-bold",
                  day_today: "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-bold border-2 border-blue-500",
                  day_outside: "text-gray-400 dark:text-gray-500",
                  day_disabled: "text-gray-300 dark:text-gray-600",
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
