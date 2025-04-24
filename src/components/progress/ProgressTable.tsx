import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/types/progress";

export const ProgressTable = ({ data }: { data: Progress[] }) => {
  // Remove reference to non-existent 'students' property
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Date</TableHead>
          <TableHead>Current Surah</TableHead>
          <TableHead>Verses Memorized</TableHead>
          <TableHead>Memorization Quality</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((progress) => (
          <TableRow key={progress.id}>
            <TableCell className="font-medium">{progress.date}</TableCell>
            <TableCell>{progress.current_surah}</TableCell>
            <TableCell>{progress.verses_memorized}</TableCell>
            <TableCell>{progress.memorization_quality}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
