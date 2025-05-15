
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Student } from "@/types/teacher";
import { Loader2 } from "lucide-react";

interface StudentSelectorProps {
  selectedStudent: string;
  onSelectStudent: (value: string) => void;
  students: Student[];
  isLoading: boolean;
}

export const StudentSelector = ({
  selectedStudent,
  onSelectStudent,
  students,
  isLoading
}: StudentSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="student">Select Student</Label>
      <Select 
        value={selectedStudent} 
        onValueChange={onSelectStudent}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a student" />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <div className="flex justify-center p-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : students && students.length > 0 ? (
            students.map((student: Student) => (
              <SelectItem key={student.name} value={student.name}>
                {student.name}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="none" disabled>No students available</SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
