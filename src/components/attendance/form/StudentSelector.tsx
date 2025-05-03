
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";

interface StudentSelectorProps {
  students?: { id: string; name: string }[];
  isLoading: boolean;
  form: UseFormReturn<any>;
  disabled?: boolean;
  selectedStudent?: string;
  setSelectedStudent?: (value: string) => void;
}

export function StudentSelector({ 
  students, 
  isLoading, 
  form, 
  disabled = false,
  selectedStudent,
  setSelectedStudent 
}: StudentSelectorProps) {
  // If we have direct props for value/onChange, use those (for components not using react-hook-form)
  const handleChange = (value: string) => {
    if (setSelectedStudent) {
      setSelectedStudent(value);
    }
  };

  return (
    <FormField
      control={form.control}
      name="student_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-gray-700 dark:text-gray-300">Student</FormLabel>
          <FormControl>
            <Select 
              onValueChange={(value) => {
                field.onChange(value);
                handleChange(value);
              }}
              value={selectedStudent || field.value}
              disabled={disabled || isLoading}
            >
              <SelectTrigger 
                disabled={disabled || isLoading}
                className="w-full border-gray-300 dark:border-gray-700 focus:ring-purple-500 focus:border-purple-500"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </div>
                ) : (
                  <SelectValue placeholder="Select a student" />
                )}
              </SelectTrigger>
              <SelectContent>
                {students?.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
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
