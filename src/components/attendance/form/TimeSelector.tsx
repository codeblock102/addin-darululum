
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area.tsx";
import { Button } from "@/components/ui/button.tsx";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form.tsx";
import { UseFormReturn } from "react-hook-form";
import { AttendanceStatus } from "@/types/attendance.ts";

type AttendanceFormValues = {
  student_id: string;
  status: AttendanceStatus;
  notes: string;
  date: Date;
  time: string;
  late_reason?: string;
};

interface TimeSelectorProps {
  form: UseFormReturn<AttendanceFormValues>;
  selectedTime?: string;
  onTimeSelect?: (time: string) => void;
}

export function TimeSelector({ form, selectedTime, onTimeSelect }: TimeSelectorProps) {
  // Generate time slots from 6:00 AM to 10:00 PM in 15-minute intervals
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour < 22; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        slots.push({ value: timeString, display: displayTime });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  return (
    <FormField
      control={form.control}
      name="time"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-gray-900 dark:text-gray-100 font-medium">
            Attendance Time
          </FormLabel>
          <FormControl>
            <ScrollArea className="w-full whitespace-nowrap rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
              <div className="flex w-max space-x-3 p-4">
                {timeSlots.map((slot) => (
                  <Button
                    key={slot.value}
                    type="button"
                    variant={selectedTime === slot.value || field.value === slot.value ? "default" : "outline"}
                    size="sm"
                    className={`flex-shrink-0 font-medium transition-all ${
                      selectedTime === slot.value || field.value === slot.value
                        ? "bg-blue-600 text-white shadow-md border-blue-600 hover:bg-blue-700"
                        : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-600 hover:border-blue-300"
                    }`}
                    onClick={() => {
                      field.onChange(slot.value);
                      onTimeSelect?.(slot.value);
                    }}
                  >
                    {slot.display}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="h-3" />
            </ScrollArea>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
