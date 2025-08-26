import { CalendarCheck, CalendarX, Clock } from "lucide-react";
import { AttendanceStatus } from "@/types/attendance.ts";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.tsx";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group.tsx";
import { UseFormReturn } from "react-hook-form";

type AttendanceFormValues = {
  class_id: string;
  student_id: string;
  status: AttendanceStatus;
  notes: string;
};

interface AttendanceStatusRadioGroupProps {
  form: UseFormReturn<AttendanceFormValues>;
}

export function AttendanceStatusRadioGroup(
  { form }: AttendanceStatusRadioGroupProps,
) {
  return (
    <FormField
      control={form.control}
      name="status"
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormLabel className="text-black">
            Attendance Status
          </FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              value={field.value}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2 p-2 rounded-md  transition-colors">
                <RadioGroupItem
                  value="present"
                  id="present"
                  className="text-purple-600 border-gray-400 focus:ring-purple-500"
                />
                <label
                  htmlFor="present"
                  className="flex items-center text-gray-900 dark:text-gray-100 font-medium cursor-pointer"
                >
                  <CalendarCheck className="h-4 w-4 mr-2 text-green-600" />
                  Present
                </label>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-md  transition-colors">
                <RadioGroupItem
                  value="absent"
                  id="absent"
                  className="text-purple-600 border-gray-400 focus:ring-purple-500"
                />
                <label
                  htmlFor="absent"
                  className="flex items-center text-gray-900 dark:text-gray-100 font-medium cursor-pointer"
                >
                  <CalendarX className="h-4 w-4 mr-2 text-red-600" />
                  Absent
                </label>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-md  transition-colors">
                <RadioGroupItem
                  value="late"
                  id="late"
                  className="text-purple-600 border-gray-400 focus:ring-purple-500"
                />
                <label
                  htmlFor="late"
                  className="flex items-center text-gray-900 dark:text-gray-100 font-medium cursor-pointer"
                >
                  <Clock className="h-4 w-4 mr-2 text-amber-600" />
                  Late
                </label>
              </div>
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
