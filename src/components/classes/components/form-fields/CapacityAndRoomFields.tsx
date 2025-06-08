import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form.tsx";
import { Input } from "@/components/ui/input.tsx";
import { useFormContext } from "react-hook-form";

export const CapacityAndRoomFields = () => {
  const { control } = useFormContext();

  return (
    <div className="grid grid-cols-2 gap-4">
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
