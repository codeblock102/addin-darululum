import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { TeacherFormValues } from "./teacherSchema.ts";

interface SectionSelectFieldProps {
  form: UseFormReturn<TeacherFormValues>;
  sections: string[] | undefined;
  isLoadingSections: boolean;
}

export const SectionSelectField = ({
  form,
  sections,
  isLoadingSections,
}: SectionSelectFieldProps) => {
  return (
    <FormField
      control={form.control}
      name="section"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Section</FormLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
            value={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a section" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {isLoadingSections && (
                <SelectItem value="loading" disabled>
                  Loading sections...
                </SelectItem>
              )}
              {sections && sections.length > 0
                ? (
                  sections.map((section) => (
                    <SelectItem key={section} value={section}>
                      {section}
                    </SelectItem>
                  ))
                )
                : !isLoadingSections && (
                  <SelectItem value="no-sections" disabled>
                    No sections found
                  </SelectItem>
                )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
