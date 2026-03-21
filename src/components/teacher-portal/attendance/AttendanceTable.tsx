import { Button } from "@/components/ui/button.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { MoreHorizontal } from "lucide-react";
import { AttendanceStatusBadge } from "./AttendanceStatusBadge.tsx";
import type { StudentWithAttendance } from "./types.ts";

interface AttendanceTableProps {
  filteredStudents: StudentWithAttendance[] | undefined;
  hasStudents: boolean;
  selectedStudentIds: Set<string>;
  editingStudentId: string | null;
  attendanceLoading: boolean;
  isAllFilteredSelected: boolean | undefined;
  isSomeFilteredSelected: boolean;
  onSelectAllChange: (checked: boolean | "indeterminate") => void;
  onRowCheckboxChange: (studentId: string, checked: boolean | "indeterminate") => void;
  onStatusUpdate: (studentId: string, newStatus: string) => void;
  onEditStudent: (studentId: string) => void;
}

export const AttendanceTable = ({
  filteredStudents,
  hasStudents,
  selectedStudentIds,
  editingStudentId,
  attendanceLoading,
  isAllFilteredSelected,
  isSomeFilteredSelected,
  onSelectAllChange,
  onRowCheckboxChange,
  onStatusUpdate,
  onEditStudent,
}: AttendanceTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px] px-2">
              <Checkbox
                checked={isAllFilteredSelected
                  ? true
                  : isSomeFilteredSelected
                  ? "indeterminate"
                  : false}
                onCheckedChange={onSelectAllChange}
                aria-label="Select all rows on this page"
                disabled={!filteredStudents ||
                  filteredStudents.length === 0 || attendanceLoading}
              />
            </TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Note</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredStudents?.map((student) => (
            <TableRow
              key={student.id}
              data-state={selectedStudentIds.has(student.id)
                ? "selected"
                : ""}
            >
              <TableCell className="px-2">
                <Checkbox
                  checked={selectedStudentIds.has(student.id)}
                  onCheckedChange={(checked) =>
                    onRowCheckboxChange(student.id, checked)}
                  aria-label={`Select row for ${student.name}`}
                  disabled={attendanceLoading}
                />
              </TableCell>
              <TableCell className="font-medium">
                {student.name}
              </TableCell>
              <TableCell>
                {editingStudentId === student.id
                  ? (
                    <Select
                      value={student.status || ""}
                      onValueChange={(newStatus) => {
                        onStatusUpdate(student.id, newStatus);
                      }}
                    >
                      <SelectTrigger className="h-8 w-auto min-w-[100px]">
                        <SelectValue placeholder="Set status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">
                          Present
                        </SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="late">Late</SelectItem>
                        <SelectItem value="excused">
                          Excused
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )
                  : (
                    <AttendanceStatusBadge status={student.status} />
                  )}
              </TableCell>
              <TableCell>{student.notes || "-"}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onEditStudent(student.id)}
                    >
                      Edit Status
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled>
                      Add Note
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled>
                      View History
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {(!filteredStudents || filteredStudents.length === 0) &&
            hasStudents && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No students match the current filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
