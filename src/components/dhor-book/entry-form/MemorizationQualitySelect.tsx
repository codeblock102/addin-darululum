import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.tsx";
import type { UseFormReturn } from "react-hook-form";
import type { DailyActivityFormValues } from "../dhorBookValidation.ts";

interface MemorizationQualitySelectProps {
  form: UseFormReturn<DailyActivityFormValues>;
  name:
    | "memorization_quality"
    | "sabaq_para_memorization_quality"
    | "dhor_memorization_quality";
  label: string;
}

export function MemorizationQualitySelect({
  form,
  name,
  label,
}: MemorizationQualitySelectProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value}
            defaultValue="average"
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select quality" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="excellent">Excellent</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="average">Average</SelectItem>
              <SelectItem value="needsWork">Needs Work</SelectItem>
              <SelectItem value="horrible">Incomplete/Horrible</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
