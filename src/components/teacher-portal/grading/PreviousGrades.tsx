
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getQualityColor } from "./gradingUtils";
import { StudentGrade } from "./types";

interface PreviousGradesProps {
  selectedStudent: string;
  grades: StudentGrade[];
}

export const PreviousGrades = ({ selectedStudent, grades }: PreviousGradesProps) => {
  if (!selectedStudent || !grades || grades.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium mb-4">Previous Grades for {selectedStudent}</h3>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Memorization</TableHead>
              <TableHead>Tajweed</TableHead>
              <TableHead>Surah</TableHead>
              <TableHead>Juz</TableHead>
              <TableHead>Contributor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grades.map((grade: StudentGrade) => (
              <TableRow key={grade.created_at}>
                <TableCell>{new Date(grade.date || grade.created_at).toLocaleDateString()}</TableCell>
                <TableCell className={getQualityColor(grade.memorization_quality || '')}>
                  {grade.memorization_quality || 'N/A'}
                </TableCell>
                <TableCell>{grade.tajweed_level || 'N/A'}</TableCell>
                <TableCell>{grade.current_surah || 'N/A'}</TableCell>
                <TableCell>{grade.current_juz || 'N/A'}</TableCell>
                <TableCell>
                  {grade.contributor_name || 'Unknown'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
