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
import { useI18n } from "@/contexts/I18nContext.tsx";

interface DateSelectorProps {
  form: UseFormReturn<AttendanceFormValues>;
}

export function DateSelector({ form }: DateSelectorProps) {
  const { t } = useI18n();
  return (
    <FormField
      control={form.control}
      name="date"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel className="text-black font-medium">
            {t("pages.attendance.form.date", "Date")}
          </FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal border-gray-300 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-[hsl(142.8,64.2%,24.1%)] focus:border-[hsl(142.8,64.2%,24.1%)] text-black",
                    !field.value && "text-black",
                  )}
                >
                  {field.value
                    ? (
                      <span className="text-slate-900 ">
                        {format(field.value, "PPP")}
                      </span>
                    )
                    : <span>{t("pages.attendance.form.pickDate", "Pick a date")}</span>}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-white border border-gray-200 shadow-lg rounded-lg"
              align="start"
            >
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
