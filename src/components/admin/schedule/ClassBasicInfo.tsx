
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Teacher } from "@/types/teacher";

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
            <Select onValueChange={field.onChange} value={field.value}>
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
