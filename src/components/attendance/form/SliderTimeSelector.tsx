
import { Slider } from "@/components/ui/slider.tsx";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form.tsx";
import { UseFormReturn } from "react-hook-form";
import { AttendanceFormValues } from "@/types/attendance-form.ts";

interface SliderTimeSelectorProps {
  form: UseFormReturn<AttendanceFormValues>;
}

export function SliderTimeSelector({ form }: SliderTimeSelectorProps) {
  const timeValue = form.watch("time");

  // Parse current time value or default to 8:00
  const [currentHour, currentMinute] = timeValue ?
    timeValue.split(':').map(Number) : [8, 0];

  const handleTimeChange = (hour: number, minute: number) => {
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    form.setValue("time", timeString);
  };

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
            <div className="space-y-6 p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
              {/* Current Time Display */}
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {currentHour.toString().padStart(2, '0')}:{currentMinute.toString().padStart(2, '0')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(`2000-01-01T${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </div>
              </div>

              {/* Hour Slider */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Hour: {currentHour}
                </label>
                <Slider
                  value={[currentHour]}
                  onValueChange={(value) => handleTimeChange(value[0], currentMinute)}
                  max={23}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>12 AM</span>
                  <span>12 PM</span>
                  <span>11 PM</span>
                </div>
              </div>

              {/* Minute Slider */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Minutes: {currentMinute}
                </label>
                <Slider
                  value={[currentMinute]}
                  onValueChange={(value) => handleTimeChange(currentHour, value[0])}
                  max={59}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>00</span>
                  <span>30</span>
                  <span>59</span>
                </div>
              </div>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
