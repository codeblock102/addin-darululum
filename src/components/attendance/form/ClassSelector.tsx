import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Loader2 } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.tsx";
import { UseFormReturn } from "react-hook-form";
import { AttendanceFormValues } from "@/types/attendance-form.ts";

interface ClassSelectorProps {
  classes?: {
    id: string;
    name: string;
  }[];
  isLoading?: boolean;
  form: UseFormReturn<AttendanceFormValues>;
  selectedClassId?: string;
  onClassChange?: (value: string) => void;
  classesData?: {
    id: string;
    name: string;
  }[];
  label?: string;
}

export function ClassSelector({
  classes,
  isLoading = false,
  form,
  selectedClassId,
  onClassChange,
  classesData,
  label = "Class",
}: ClassSelectorProps) {
  const handleChange = (value: string) => {
    if (onClassChange) {
      onClassChange(value);
    }
  };

  const triggerContent = isLoading
    ? (
      <div className="flex items-center">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Loading...
      </div>
    )
    : <SelectValue placeholder={`Select a ${label.toLowerCase()}`} />;

  return (
    <FormField
      control={form.control}
      name="class_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                {triggerContent}
              </SelectTrigger>
              <SelectContent>
                {(classes || classesData)?.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
