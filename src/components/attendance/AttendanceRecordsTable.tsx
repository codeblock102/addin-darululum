import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { StatusBadge, StatusType } from "@/components/ui/status-badge.tsx";

type AttendanceRecord = {
  id: string;
  date: string;
  status: StatusType;
  notes: string | null;
  student: {
    id: string;
    name: string;
  };
  class_schedule: {
    id: string;
    class_name: string;
    day_of_week: string;
    time_slot: string;
  };
};

interface AttendanceRecordsTableProps {
  records: AttendanceRecord[] | undefined;
  isLoading: boolean;
  searchQuery: string;
  statusFilter: string | null;
  dateFilter: Date | null;
  resetFilters: () => void;
}

export function AttendanceRecordsTable({
  records,
  isLoading,
  searchQuery,
  statusFilter,
  dateFilter,
  resetFilters
}: AttendanceRecordsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No attendance records found.</p>
        {(searchQuery || statusFilter || dateFilter) && (
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={resetFilters}
          >
            Clear Filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">
                {record.student?.name || "Unknown"}
              </TableCell>
              <TableCell>
                {record.class_schedule ? 
                  `${record.class_schedule.class_name} (${record.class_schedule.day_of_week}, ${record.class_schedule.time_slot})` : 
                  "Unknown"
                }
              </TableCell>
              <TableCell>
                {record.date ? format(new Date(record.date), "MMM dd, yyyy") : "N/A"}
              </TableCell>
              <TableCell>
                <StatusBadge status={record.status} />
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {record.notes || "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
