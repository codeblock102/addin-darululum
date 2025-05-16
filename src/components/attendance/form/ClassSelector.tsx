
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";

interface ClassSelectorProps {
  classes?: { id: string; name: string }[];
  isLoading: boolean;
  form: UseFormReturn<any>;
  selectedClass?: string;
  setSelectedClass?: (value: string) => void;
  classesData?: any[];
  label?: string;
}

export function ClassSelector({ 
  classes, 
  isLoading, 
  form, 
  selectedClass, 
  setSelectedClass, 
  classesData,
  label = "Class"
}: ClassSelectorProps) {
  // If we have direct props for value/onChange, use those (for components not using react-hook-form)
  const handleChange = (value: string) => {
    if (setSelectedClass) {
      setSelectedClass(value);
    }
  };

  // Use the component with either direct props or within a form context
  return (
    <FormField
      control={form.control}
      name="class_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-gray-700 dark:text-gray-300">{label}</FormLabel>
          <FormControl>
            <Select 
              onValueChange={(value) => {
                field.onChange(value);
                handleChange(value);
              }} 
              value={selectedClass || field.value}
            >
              <SelectTrigger 
                disabled={isLoading}
                className="w-full border-gray-300 dark:border-gray-700 focus:ring-purple-500 focus:border-purple-500"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </div>
                ) : (
                  <SelectValue placeholder={`Select a ${label.toLowerCase()}`} />
                )}
              </SelectTrigger>
              <SelectContent>
                {(classesData || classes)?.map((cls) => (
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
