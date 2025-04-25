
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Teacher } from "@/types/teacher";
import { useFormContext } from "react-hook-form";

interface ClassBasicInfoProps {
  teachers?: Teacher[];
}

export const ClassBasicInfo = ({ teachers }: ClassBasicInfoProps) => {
  return (
    <div className="space-y-4">
      <FormField
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
        name="teacher_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Assigned Teacher</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ""}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
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
    </div>
  );
};

// Add subcomponents for room and capacity inputs
const RoomInput = () => {
  const { control } = useFormContext();
  
  return (
    <FormField
      control={control}
      name="room"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Room</FormLabel>
          <FormControl>
            <Input placeholder="Room number or location" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const CapacityInput = () => {
  const { control } = useFormContext();
  
  return (
    <FormField
      control={control}
      name="capacity"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Capacity</FormLabel>
          <FormControl>
            <Input 
              type="number" 
              min={1}
              placeholder="Class capacity" 
              {...field}
              onChange={e => field.onChange(parseInt(e.target.value) || 1)} 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

// Attach subcomponents to main component
ClassBasicInfo.RoomInput = RoomInput;
ClassBasicInfo.CapacityInput = CapacityInput;
