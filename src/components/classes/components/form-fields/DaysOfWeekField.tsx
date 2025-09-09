import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button.tsx";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const DaysOfWeekField = () => {
  const { control, watch, setValue } = useFormContext();
  const selectedDays = watch("days_of_week") || [];
  const scheduleByDay = watch("schedule_by_day") || [];

  const addSlotForDay = (day: string) => {
    const next = [
      ...scheduleByDay,
      { day, start_time: "09:00", end_time: "10:30" },
    ];
    setValue("schedule_by_day", next, { shouldDirty: true, shouldValidate: true });
  };

  const countSlotsForDay = (day: string): number =>
    (Array.isArray(scheduleByDay) ? scheduleByDay : []).filter((e: any) => e.day === day).length;

  return (
    <FormField
      control={control}
      name="days_of_week"
      render={() => (
        <FormItem>
          <FormLabel>Class Days</FormLabel>
          <div className="grid grid-cols-2 gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedDays.includes(day)}
                  onCheckedChange={(checked: boolean) => {
                    setValue(
                      "days_of_week",
                      checked
                        ? [...selectedDays, day]
                        : selectedDays.filter((d: string) =>
                          d !== day
                        ),
                    );
                    // If granular schedule exists, keep it as source of truth.
                    // Otherwise, ensure schedule_by_day mirrors the general selection with default times.
                    const hasGranular = Array.isArray(scheduleByDay) && scheduleByDay.length > 0;
                    if (!hasGranular) {
                      if (checked) {
                        setValue("schedule_by_day", [
                          ...scheduleByDay,
                          { day, start_time: "09:00", end_time: "10:30" },
                        ], { shouldDirty: true, shouldValidate: true });
                      } else {
                        setValue("schedule_by_day", scheduleByDay.filter((e: any) => e.day !== day), { shouldDirty: true, shouldValidate: true });
                      }
                    }
                  }}
                />
                <span>{day}</span>
                {selectedDays.includes(day) && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      className="ml-2 h-6 px-2 text-[11px]"
                      onClick={() => addSlotForDay(day)}
                    >
                      Add slot
                    </Button>
                    <span className="text-[11px] text-gray-500">{countSlotsForDay(day)} slot(s)</span>
                  </>
                )}
              </div>
            ))}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
