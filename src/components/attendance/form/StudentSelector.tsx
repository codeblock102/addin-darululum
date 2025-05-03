
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormLabel } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface Student {
  id: string;
  name: string;
}

interface StudentSelectorProps {
  selectedStudent: string;
  setSelectedStudent: (value: string) => void;
  isLoading: boolean;
  students?: Student[];
  disabled: boolean;
}

export function StudentSelector({
  selectedStudent,
  setSelectedStudent,
  isLoading,
  students,
  disabled
}: StudentSelectorProps) {
  return (
    <div className="space-y-2">
      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Student</FormLabel>
      <Select 
        value={selectedStudent} 
        onValueChange={setSelectedStudent}
        disabled={isLoading || disabled}
      >
        <SelectTrigger className="border-gray-300 dark:border-gray-700 focus:ring-purple-500 focus:border-purple-500">
          <SelectValue placeholder="Select a student" />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
            </div>
          ) : students?.length === 0 ? (
            <div className="p-2 text-sm text-gray-500">No students found</div>
          ) : (
            students?.map((student) => (
              <SelectItem key={student.id} value={student.id}>
                {student.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
