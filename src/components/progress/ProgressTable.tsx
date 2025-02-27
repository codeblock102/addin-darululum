
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/types/progress";

interface ProgressTableProps {
  data: Progress[];
}

export const ProgressTable = ({ data }: ProgressTableProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Current Surah</TableHead>
            <TableHead>Verses</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Revision</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="font-medium">{entry.students?.name}</TableCell>
              <TableCell>{entry.current_surah}</TableCell>
              <TableCell>{entry.start_ayat} - {entry.end_ayat}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  entry.memorization_quality === 'excellent' ? 'bg-green-100 text-green-800' :
                  entry.memorization_quality === 'good' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {entry.memorization_quality}
                </span>
              </TableCell>
              <TableCell>{new Date(entry.last_revision_date).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm">
                  Update Progress
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
