
import { Student } from "@/types/teacher";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileCheck, Loader2 } from "lucide-react";
import { getQualityColor, getQualityPercentage } from "./gradingUtils";

interface StudentsOverviewProps {
  students: Student[];
  isLoading: boolean;
  onSelectStudent: (name: string) => void;
}

export const StudentsOverview = ({ students, isLoading, onSelectStudent }: StudentsOverviewProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!students || students.length === 0) {
    return (
      <div className="text-center p-6 border rounded-md">
        <FileCheck className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-20" />
        <p>No students in the database</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student Name</TableHead>
            <TableHead>Current Surah</TableHead>
            <TableHead>Current Juz</TableHead>
            <TableHead>Memorization Quality</TableHead>
            <TableHead>Tajweed Level</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student: Student) => (
            <TableRow key={student.id}>
              <TableCell className="font-medium">{student.name}</TableCell>
              <TableCell>{student.current_surah || 'N/A'}</TableCell>
              <TableCell>{student.current_juz || 'N/A'}</TableCell>
              <TableCell>
                {student.memorization_quality ? (
                  <div className="flex flex-col gap-1">
                    <span className={getQualityColor(student.memorization_quality)}>
                      {student.memorization_quality}
                    </span>
                    <Progress value={getQualityPercentage(student.memorization_quality)} className="h-1" />
                  </div>
                ) : (
                  'Not graded'
                )}
              </TableCell>
              <TableCell>{student.tajweed_level || 'Not graded'}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectStudent(student.name)}
                >
                  Grade
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
