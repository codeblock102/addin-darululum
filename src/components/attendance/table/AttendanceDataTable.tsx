import { format, parse, parseISO } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { Clock, Loader2 } from "lucide-react";
import { StatusBadge, StatusType } from "@/components/ui/status-badge.tsx";

type AttendanceRecord = {
  id: string;
  date: string;
  time?: string | null;
  status: string;
  notes?: string;
  students: {
    id: string;
    name: string;
  } | null;
  classes: {
    name?: string;
  } | null;
};

interface AttendanceDataTableProps {
  isLoading?: boolean;
  attendanceRecords?: AttendanceRecord[];
}

export function AttendanceDataTable(
  { isLoading, attendanceRecords }: AttendanceDataTableProps,
) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <p className="text-sm text-gray-500">Loading attendance records...</p>
        </div>
      </div>
    );
  }

  if (!attendanceRecords || attendanceRecords.length === 0) {
    return null;
  }

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return "N/A";
    try {
      const time = parse(timeString, "HH:mm:ss", new Date());
      return format(time, "p");
    } catch (e) {
      return timeString;
    }
  };

  return (
    <ScrollArea className="h-[400px]">
      <div className="border border-purple-100 dark:border-purple-900/30 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className=" dark:bg-purple-900/20 sticky top-0 z-10">
            <TableRow>
              <TableHead className="text-purple-700 dark:text-purple-300">
                Date
              </TableHead>
              <TableHead className="text-purple-700 dark:text-purple-300">
                Time
              </TableHead>
              <TableHead className="text-purple-700 dark:text-purple-300">
                Student
              </TableHead>
              <TableHead className="text-purple-700 dark:text-purple-300">
                Class
              </TableHead>
              <TableHead className="text-purple-700 dark:text-purple-300">
                Status
              </TableHead>
              <TableHead className="text-purple-700 dark:text-purple-300">
                Notes
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendanceRecords.map((record) => (
              <TableRow key={record.id} className=" transition-colors">
                <TableCell className="text-gray-900 dark:text-gray-200 font-medium">
                  {format(parseISO(record.date), "PPP")}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-200 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  {formatTime(record.time)}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-200">
                  {record.students?.name || "Unknown Student"}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-200">
                  {record.classes?.name || "N/A"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={record.status as StatusType} />
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-gray-700 dark:text-gray-300">
                  {record.notes || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  );
}
