
import { Slider } from "@/components/ui/slider.tsx";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.tsx";
import { UseFormReturn } from "react-hook-form";
import { AttendanceFormValues } from "@/types/attendance-form.ts";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Sunrise, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SliderTimeSelectorProps {
  form: UseFormReturn<AttendanceFormValues>;
}

export function SliderTimeSelector({ form }: SliderTimeSelectorProps) {
  const timeValue = form.watch("time");

  // Parse current time value or default to 8:00
  const [currentHour, currentMinute] = timeValue
    ? timeValue.split(":").map(Number)
    : [8, 0];

  const handleTimeChange = (hour: number, minute: number) => {
    const timeString = `${hour.toString().padStart(2, "0")}:${
      minute.toString().padStart(2, "0")
    }`;
    form.setValue("time", timeString);
  };

  const getTimeIcon = () => {
    if (currentHour >= 5 && currentHour < 12) return Sunrise;
    if (currentHour >= 12 && currentHour < 18) return Sun;
    return Moon;
  };

  const getTimeOfDay = () => {
    if (currentHour >= 5 && currentHour < 12) return "Morning";
    if (currentHour >= 12 && currentHour < 18) return "Afternoon";
    if (currentHour >= 18 && currentHour < 22) return "Evening";
    return "Night";
  };

  const getTimeColor = () => {
    if (currentHour >= 5 && currentHour < 12) return "from-amber-400 to-orange-500";
    if (currentHour >= 12 && currentHour < 18) return "from-blue-400 to-blue-600";
    if (currentHour >= 18 && currentHour < 22) return "from-purple-400 to-purple-600";
    return "from-indigo-400 to-indigo-600";
  };

  const TimeIcon = getTimeIcon();

  return (
    <FormField
      control={form.control}
      name="time"
      render={({ field }) => (
        <FormItem className="space-y-4">
          <FormLabel className="text-gray-100 font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-400" />
            Attendance Time
          </FormLabel>
          <FormControl>
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg overflow-hidden">
              <CardContent className="p-8 space-y-8">
                {/* Enhanced Time Display */}
                <div className="text-center space-y-4">
                  <div className={cn(
                    "w-20 h-20 mx-auto rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg",
                    getTimeColor()
                  )}>
                    <TimeIcon className="h-10 w-10 text-white" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-gray-100 tabular-nums tracking-wide">
                      {currentHour.toString().padStart(2, "0")}:{currentMinute
                        .toString().padStart(2, "0")}
                    </div>
                    <div className="text-lg text-gray-300 font-medium">
                      {new Date(
                        `2000-01-01T${currentHour.toString().padStart(2, "0")}:${
                          currentMinute.toString().padStart(2, "0")
                        }`,
                      ).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </div>
                    <div className={cn(
                      "inline-flex px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r text-white",
                      getTimeColor()
                    )}>
                      {getTimeOfDay()}
                    </div>
                  </div>
                </div>

                {/* Enhanced Hour Slider */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      Hour
                    </label>
                    <div className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-sm font-medium border border-blue-500/30">
                      {currentHour}
                    </div>
                  </div>
                  
                  <div className="relative">
                    <Slider
                      value={[currentHour]}
                      onValueChange={(value) =>
                        handleTimeChange(value[0], currentMinute)}
                      max={23}
                      min={0}
                      step={1}
                      className="w-full slider-enhanced"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                      <span className="flex items-center gap-1">
                        <Moon className="h-3 w-3" />
                        12 AM
                      </span>
                      <span className="flex items-center gap-1">
                        <Sunrise className="h-3 w-3" />
                        6 AM
                      </span>
                      <span className="flex items-center gap-1">
                        <Sun className="h-3 w-3" />
                        12 PM
                      </span>
                      <span className="flex items-center gap-1">
                        <Moon className="h-3 w-3" />
                        6 PM
                      </span>
                    </div>
                  </div>
                </div>

                {/* Enhanced Minutes Slider */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      Minutes
                    </label>
                    <div className="px-3 py-1 bg-green-500/20 text-green-300 rounded-lg text-sm font-medium border border-green-500/30">
                      {currentMinute}
                    </div>
                  </div>
                  
                  <div className="relative">
                    <Slider
                      value={[currentMinute]}
                      onValueChange={(value) =>
                        handleTimeChange(currentHour, value[0])}
                      max={59}
                      min={0}
                      step={5}
                      className="w-full slider-enhanced"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                      <span>:00</span>
                      <span>:15</span>
                      <span>:30</span>
                      <span>:45</span>
                    </div>
                  </div>
                </div>

                {/* Quick Time Presets */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">Quick Select</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { time: "08:00", label: "8:00 AM" },
                      { time: "12:00", label: "12:00 PM" },
                      { time: "14:30", label: "2:30 PM" },
                      { time: "16:00", label: "4:00 PM" },
                    ].map((preset) => (
                      <button
                        key={preset.time}
                        type="button"
                        onClick={() => {
                          const [hour, minute] = preset.time.split(':').map(Number);
                          handleTimeChange(hour, minute);
                        }}
                        className={cn(
                          "px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200",
                          "border hover:shadow-md hover:-translate-y-0.5",
                          field.value === preset.time
                            ? "bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/25"
                            : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:border-blue-500/50"
                        )}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
