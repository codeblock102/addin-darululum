import { useFormContext } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { MultiSelect, MultiSelectOption } from "@/components/ui/MultiSelect.tsx";
import { Teacher } from "@/types/teacher.ts";

type ScheduleEntry = {
  day: string;
  start_time: string;
  end_time: string;
  teacher_ids?: string[];
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

export const WeeklyScheduleField = ({ teachers }: { teachers?: Teacher[] }) => {
  const { watch, setValue } = useFormContext();
  const scheduleByDay: ScheduleEntry[] = watch("schedule_by_day") || [];
  const classTeacherIds: string[] = watch("teacher_ids") || [];
  const teacherOptions: MultiSelectOption[] = (teachers || []).map((t) => ({ value: t.id, label: t.name }));

  const getDayEntries = (day: string): { index: number; entry: ScheduleEntry }[] =>
    (scheduleByDay || [])
      .map((entry, index) => ({ index, entry }))
      .filter(({ entry }) => entry.day === day);

  const isDaySelected = (day: string) => getDayEntries(day).length > 0;

  const handleToggleDay = (day: string, checked: boolean) => {
    if (checked) {
      if (!isDaySelected(day)) {
        const next: ScheduleEntry[] = [
          ...scheduleByDay,
          { day, start_time: "09:00", end_time: "10:30", teacher_ids: classTeacherIds || [] },
        ];
        setValue("schedule_by_day", next, { shouldDirty: true, shouldValidate: true });
      }
    } else {
      const next = scheduleByDay.filter((e) => e.day !== day);
      setValue("schedule_by_day", next, { shouldDirty: true, shouldValidate: true });
    }
  };

  const handleTimeChangeByIndex = (
    index: number,
    field: "start_time" | "end_time",
    value: string,
  ) => {
    const next = scheduleByDay.map((e, i) => (i === index ? { ...e, [field]: value } : e));
    setValue("schedule_by_day", next, { shouldDirty: true, shouldValidate: true });
  };

  const handleTeacherChangeByIndex = (index: number, teacherIds: string[]) => {
    const next = scheduleByDay.map((e, i) => (i === index ? { ...e, teacher_ids: teacherIds } : e));
    setValue("schedule_by_day", next, { shouldDirty: true, shouldValidate: true });
  };

  const handleAddSlot = (day: string) => {
    const next: ScheduleEntry[] = [
      ...scheduleByDay,
      { day, start_time: "09:00", end_time: "10:30", teacher_ids: classTeacherIds || [] },
    ];
    setValue("schedule_by_day", next, { shouldDirty: true, shouldValidate: true });
  };

  const handleRemoveSlot = (index: number) => {
    const next = scheduleByDay.filter((_, i) => i !== index);
    setValue("schedule_by_day", next, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-800">Per-day schedule (optional)</div>
      <div className="rounded-md border border-gray-200 bg-white/60 divide-y">
        {DAYS_OF_WEEK.map((day) => {
          const selected = isDaySelected(day);
          const dayEntries = getDayEntries(day);
          return (
            <div key={day} className="flex flex-col gap-2 py-1.5 px-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 w-20">
                  <Checkbox
                    checked={selected}
                    onCheckedChange={(checked: boolean) => handleToggleDay(day, !!checked)}
                  />
                  <span className="text-xs sm:text-sm text-gray-800">{abbreviate(day)}</span>
                </div>
                {selected && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto h-7 px-2 text-xs"
                    onClick={() => handleAddSlot(day)}
                  >
                    Add slot
                  </Button>
                )}
              </div>
              {selected && (
                <div className="flex flex-col gap-2 ml-[2.75rem]">
                  {dayEntries.map(({ index, entry }, slotIdx) => (
                    <div key={`${day}-${slotIdx}`} className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={entry?.start_time || ""}
                        onChange={(e) => handleTimeChangeByIndex(index, "start_time", e.target.value)}
                        className="w-[88px] h-8 text-[11px] sm:text-xs"
                      />
                      <span className="text-xs text-gray-500">to</span>
                      <Input
                        type="time"
                        value={entry?.end_time || ""}
                        onChange={(e) => handleTimeChangeByIndex(index, "end_time", e.target.value)}
                        className="w-[88px] h-8 text-[11px] sm:text-xs"
                      />
                      <div className="w-72">
                        <MultiSelect
                          options={teacherOptions}
                          selected={(entry.teacher_ids && entry.teacher_ids.length > 0) ? entry.teacher_ids : classTeacherIds}
                          onChange={(selected) => handleTeacherChangeByIndex(index, selected as string[])}
                          placeholder="Assign teachers (optional)"
                          triggerClassName="bg-amber-50 border-amber-400 text-amber-900 hover:bg-amber-100"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-red-600"
                        onClick={() => handleRemoveSlot(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="text-[11px] sm:text-xs text-gray-500">When set, this overrides the general days and time above.</div>
    </div>
  );
};


