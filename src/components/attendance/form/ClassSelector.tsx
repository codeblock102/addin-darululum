
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormLabel } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface ClassInfo {
  id: string;
  name: string;
  days_of_week: string[];
  time_slots: any[];
}

interface ClassSelectorProps {
  selectedClass: string;
  setSelectedClass: (value: string) => void;
  isLoading: boolean;
  classesData?: ClassInfo[];
}

export function ClassSelector({
  selectedClass,
  setSelectedClass,
  isLoading,
  classesData
}: ClassSelectorProps) {
  return (
    <div className="space-y-2">
      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Class</FormLabel>
      <Select 
        value={selectedClass} 
        onValueChange={setSelectedClass}
        disabled={isLoading}
      >
        <SelectTrigger className="border-gray-300 dark:border-gray-700 focus:ring-purple-500 focus:border-purple-500">
          <SelectValue placeholder="Select a class" />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
            </div>
          ) : classesData?.length === 0 ? (
            <div className="p-2 text-sm text-gray-500">No classes found</div>
          ) : (
            classesData?.map((classInfo) => (
              <SelectItem key={classInfo.id} value={classInfo.id}>
                {classInfo.name} - {classInfo.days_of_week.join(', ')}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
