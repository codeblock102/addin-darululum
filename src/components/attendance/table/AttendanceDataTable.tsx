
import { format, parseISO } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AttendanceStatusBadge } from "./AttendanceStatusBadge";
import { Loader2 } from "lucide-react";

type AttendanceRecord = {
  id: string;
  date: string;
  status: string;
  notes?: string;
  student: {
    id: string;
    name: string;
  };
  class_schedule: {
    class_name: string;
  };
};

interface AttendanceDataTableProps {
  isLoading: boolean;
  attendanceRecords?: AttendanceRecord[];
}

export function AttendanceDataTable({ isLoading, attendanceRecords }: AttendanceDataTableProps) {
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
  
  return (
    <ScrollArea className="h-[400px]">
      <div className="border border-purple-100 dark:border-purple-900/30 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-purple-50 dark:bg-purple-900/20 sticky top-0 z-10">
            <TableRow>
              <TableHead className="text-purple-700 dark:text-purple-300">Date</TableHead>
              <TableHead className="text-purple-700 dark:text-purple-300">Student</TableHead>
              <TableHead className="text-purple-700 dark:text-purple-300">Class</TableHead>
              <TableHead className="text-purple-700 dark:text-purple-300">Status</TableHead>
              <TableHead className="text-purple-700 dark:text-purple-300">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendanceRecords.map((record) => (
              <TableRow key={record.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
                <TableCell className="text-gray-900 dark:text-gray-200 font-medium">
                  {format(parseISO(record.date), "PPP")}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-200">
                  {record.student.name}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-gray-200">
                  {record.class_schedule.class_name}
                </TableCell>
                <TableCell>
                  <AttendanceStatusBadge status={record.status} />
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
