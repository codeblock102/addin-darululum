import { useFormContext } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Input } from "@/components/ui/input.tsx";

type ScheduleEntry = {
  day: string;
  start_time: string;
  end_time: string;
};

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const abbreviate = (day: string) => day.slice(0, 3);

export const WeeklyScheduleField = () => {
  const { watch, setValue } = useFormContext();
  const scheduleByDay: ScheduleEntry[] = watch("schedule_by_day") || [];

  const isDaySelected = (day: string) =>
    scheduleByDay.some((e) => e.day === day);

  const handleToggleDay = (day: string, checked: boolean) => {
    if (checked) {
      const next: ScheduleEntry[] = [
        ...scheduleByDay,
        { day, start_time: "09:00", end_time: "10:30" },
      ];
      setValue("schedule_by_day", next, { shouldDirty: true, shouldValidate: true });
    } else {
      const next = scheduleByDay.filter((e) => e.day !== day);
      setValue("schedule_by_day", next, { shouldDirty: true, shouldValidate: true });
    }
  };

  const handleTimeChange = (
    day: string,
    field: "start_time" | "end_time",
    value: string,
  ) => {
    const next = scheduleByDay.map((e) =>
      e.day === day ? { ...e, [field]: value } : e,
    );
    setValue("schedule_by_day", next, { shouldDirty: true, shouldValidate: true });
  };

  const getDayEntry = (day: string) =>
    scheduleByDay.find((e) => e.day === day);

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-800">Per-day schedule (optional)</div>
      <div className="rounded-md border border-gray-200 bg-white/60 divide-y">
        {DAYS_OF_WEEK.map((day, idx) => {
          const selected = isDaySelected(day);
          const entry = getDayEntry(day);
          return (
            <div key={day} className="flex items-center gap-2 py-1.5 px-2">
              <div className="flex items-center gap-2 w-20">
                <Checkbox
                  checked={selected}
                  onCheckedChange={(checked: boolean) => handleToggleDay(day, !!checked)}
                />
                <span className="text-xs sm:text-sm text-gray-800">{abbreviate(day)}</span>
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <Input
                  type="time"
                  value={entry?.start_time || ""}
                  onChange={(e) => handleTimeChange(day, "start_time", e.target.value)}
                  disabled={!selected}
                  className="w-[88px] h-8 text-[11px] sm:text-xs"
                />
                <span className="text-xs text-gray-500">to</span>
                <Input
                  type="time"
                  value={entry?.end_time || ""}
                  onChange={(e) => handleTimeChange(day, "end_time", e.target.value)}
                  disabled={!selected}
                  className="w-[88px] h-8 text-[11px] sm:text-xs"
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-[11px] sm:text-xs text-gray-500">When set, this overrides the general days and time above.</div>
    </div>
  );
};


