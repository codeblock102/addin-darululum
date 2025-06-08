import { Skeleton } from "@/components/ui/skeleton.tsx";
import { StatusType } from "@/components/ui/status-badge.tsx";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table.tsx";

export type AttendanceRecord = {
  id: string;
  date: string;
  status: StatusType;
  notes: string | null;
  students: {
    id: string;
    name: string;
  } | null;
  classes: {
    id: string;
    name: string;
  } | null;
};

interface AttendanceRecordsTableProps {
  records: AttendanceRecord[] | undefined;
}

const AttendanceRecordsTable: React.FC<AttendanceRecordsTableProps> = ({ records }) => {
  if (!records) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <Table>
      <TableBody>
        {records.map((record) => (
          <TableRow key={record.id}>
            <TableCell className="font-medium">
              {record.students?.name || "Unknown"}
            </TableCell>
            <TableCell>
              {record.classes?.name || "Unknown"}
            </TableCell>
            <TableCell>
              {record.date ? format(new Date(record.date), "MMM dd, yyyy") : "N/A"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default AttendanceRecordsTable; 