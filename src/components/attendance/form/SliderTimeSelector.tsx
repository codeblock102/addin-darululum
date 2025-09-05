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
import { useI18n } from "@/contexts/I18nContext.tsx";

interface SliderTimeSelectorProps {
  form: UseFormReturn<AttendanceFormValues>;
}

export function SliderTimeSelector({ form }: SliderTimeSelectorProps) {
  const { t } = useI18n();
  const timeValue = form.watch("time");

  // Parse current time value or default to 8:00
  const [currentHour, currentMinute] = timeValue
    ? timeValue.split(":").map(Number)
    : [8, 0];

  const handleTimeChange = (hour: number, minute: number) => {
    const safeTimeString = `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
    form.setValue("time", safeTimeString);
  };

  // Localized preview respecting user locale (no functionality change)
  const locale = globalThis?.navigator?.language || undefined;
  const localizedTime = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2000, 0, 1, currentHour, currentMinute));

  return (
    <FormField
      control={form.control}
      name="time"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-gray-900 font-medium">{t("pages.attendance.time.label", "Attendance Time")}</FormLabel>
          <FormControl>
            <div className="space-y-5 p-4 sm:p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
              {/* Current Time Display */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <span className="text-2xl font-bold tabular-nums">
                    {currentHour.toString().padStart(2, "0")}:{currentMinute
                      .toString()
                      .padStart(2, "0")}
                  </span>
                  <span className="text-xs sm:text-sm">{localizedTime}</span>
                </div>
                <div className="text-xs sm:text-sm text-gray-500 mt-2">
                  {t("pages.attendance.time.help", "Select the time for this attendance record")}
                </div>
              </div>

              {/* Hour Slider */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{t("pages.attendance.time.hour", "Hour")}</label>
                <Slider
                  value={[currentHour]}
                  onValueChange={(value) => handleTimeChange(value[0], currentMinute)}
                  max={23}
                  min={0}
                  step={1}
                  className="w-full"
                  aria-label={t("pages.attendance.time.ariaHour", "Select hour")}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>00</span>
                  <span>12</span>
                  <span>23</span>
                </div>
              </div>

              {/* Minute Slider */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{t("pages.attendance.time.minutes", "Minutes")}</label>
                <Slider
                  value={[currentMinute]}
                  onValueChange={(value) => handleTimeChange(currentHour, value[0])}
                  max={59}
                  min={0}
                  step={1}
                  className="w-full"
                  aria-label={t("pages.attendance.time.ariaMinutes", "Select minutes")}
                />
                <div className="flex justify-between text-xs text-gray-500">
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
