import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Teacher } from "@/types/teacher.ts";
import { useFormContext } from "react-hook-form";

interface BasicInfoFieldsProps {
  teachers?: Teacher[];
}

export const BasicInfoFields = ({ teachers }: BasicInfoFieldsProps) => {
  const { control } = useFormContext();

  return (
    <div className="space-y-4">
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
              value={field.value || ""}
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
    </div>
  );
};
