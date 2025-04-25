
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useFormContext } from "react-hook-form";

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
                  onCheckedChange={(checked) => {
                    setValue(
                      "days_of_week",
                      checked
                        ? [...selectedDays, day]
                        : selectedDays.filter((d) => d !== day)
                    );
                  }}
                />
                <span>{day}</span>
              </div>
            ))}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
