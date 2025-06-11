
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StudentGrade } from "./types";

interface PreviousGradesTableProps {
  selectedStudent: string;
  studentGrades: StudentGrade[] | undefined;
}

export const PreviousGradesTable = ({
  selectedStudent,
  studentGrades,
}: PreviousGradesTableProps) => {
  const getQualityColor = (quality: string | null | undefined) => {
    switch (quality) {
      case "excellent":
        return "text-green-600";
      case "good":
        return "text-blue-600";
      case "average":
        return "text-yellow-600";
      case "needsWork":
        return "text-orange-600";
      case "horrible":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (!selectedStudent || !studentGrades || studentGrades.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium mb-4">
        Previous Grades for {selectedStudent}
      </h3>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Memorization</TableHead>
              <TableHead>Surah</TableHead>
              <TableHead>Juz</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {studentGrades.map((grade: StudentGrade, index: number) => (
              <TableRow key={grade.created_at || index}>
                <TableCell>
                  {new Date(grade.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className={getQualityColor(grade.memorization_quality)}>
                  {grade.memorization_quality || "N/A"}
                </TableCell>
                <TableCell>{grade.current_surah || "N/A"}</TableCell>
                <TableCell>{grade.current_juz || "N/A"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
