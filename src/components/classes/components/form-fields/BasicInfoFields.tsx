import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.tsx";
import { Input } from "@/components/ui/input.tsx";
import { MultiSelect, MultiSelectOption } from "@/components/ui/MultiSelect.tsx";
import { Teacher } from "@/types/teacher.ts";
import { useFormContext } from "react-hook-form";

interface BasicInfoFieldsProps {
  teachers?: Teacher[];
}

export const BasicInfoFields = ({ teachers }: BasicInfoFieldsProps) => {
  const { control, setValue } = useFormContext();

  const teacherOptions: MultiSelectOption[] =
    teachers?.map((teacher) => ({
      value: teacher.id,
      label: teacher.name,
    })) || [];

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
        name="teacher_ids"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Teachers</FormLabel>
            <FormControl>
              <MultiSelect
                options={teacherOptions}
                selected={field.value || []}
                onChange={(selected) => setValue("teacher_ids", selected)}
                placeholder="Select teachers"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="subject"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Subject</FormLabel>
            <FormControl>
              <Input placeholder="Enter subject" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="section"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Section</FormLabel>
            <FormControl>
              <Input placeholder="Enter section" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
