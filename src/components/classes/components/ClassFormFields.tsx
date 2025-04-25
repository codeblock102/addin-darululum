
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface ClassFormFieldsProps {
  teachers?: any[];
}

export const ClassFormFields = ({ teachers }: ClassFormFieldsProps) => {
  const { control, watch, setValue } = useFormContext();
  const selectedDays = watch("days_of_week") || [];

  return (
    <>
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Class Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter class name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="teacher_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Teacher (Optional)</FormLabel>
            <Select
              value={field.value}
              onValueChange={field.onChange}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="">None (Unassigned)</SelectItem>
                {teachers?.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="time_start"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Time</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="time_end"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Time</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="room"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Room</FormLabel>
            <FormControl>
              <Input placeholder="Enter room number/name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="capacity"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Class Capacity</FormLabel>
            <FormControl>
              <Input
                type="number"
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

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
    </>
  );
};
