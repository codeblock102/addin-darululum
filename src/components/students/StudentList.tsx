import { Badge } from "@/components/ui/badge.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { Edit, Users, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton.tsx";

interface Student {
  id: string;
  name: string;
  date_of_birth: string | null;
  enrollment_date: string | null;
  guardian_name: string | null;
  guardian_contact: string | null;
  status: "active" | "inactive" | "vacation" | "hospitalized" | "suspended" | "graduated";
  madrassah_id?: string;
  section?: string;
  medical_condition?: string | null;
  status_start_date?: string | null;
  status_end_date?: string | null;
}

interface StudentListProps {
  students?: Student[];
  isLoading?: boolean;
  onEditStudent?: (student: Student) => void;
}

const getStatusColorClass = (status: string) => {
  switch (status) {
    case "active": return "bg-green-100 text-green-800 hover:bg-green-200";
    case "inactive": return "bg-red-100 text-red-800 hover:bg-red-200";
    case "suspended": return "bg-red-100 text-red-800 hover:bg-red-200";
    case "hospitalized": return "bg-orange-100 text-orange-800 hover:bg-orange-200";
    case "vacation": return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "graduated": return "bg-purple-100 text-purple-800 hover:bg-purple-200";
    default: return "";
  }
};

/** Returns a consistent bg color class based on the first letter of the name. */
const getAvatarBgClass = (name: string): string => {
  const ch = (name.charAt(0) || "A").toUpperCase();
  if ("ABC".includes(ch)) return "bg-green-700";
  if ("DEF".includes(ch)) return "bg-blue-700";
  if ("GHI".includes(ch)) return "bg-purple-700";
  if ("JKL".includes(ch)) return "bg-amber-700";
  if ("MNO".includes(ch)) return "bg-rose-700";
  if ("PQR".includes(ch)) return "bg-cyan-700";
  if ("STU".includes(ch)) return "bg-indigo-700";
  return "bg-teal-700"; // V–Z
};

export const StudentList = ({
  students,
  isLoading,
  onEditStudent,
}: StudentListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!students || students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 text-gray-500">
        <Users className="h-16 w-16 mb-4" />
        <h3 className="text-xl font-semibold">No Students Found</h3>
        <p>There are no students to display at the moment.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader className="bg-gray-50/60">
        <TableRow>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-400 py-4 px-4 w-[250px]">Student</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-400 py-4 px-4">Section</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-400 py-4 px-4">Guardian</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-400 py-4 px-4">Status</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-400 py-4 px-4">Enrollment Date</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-400 py-4 px-4 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <TableRow
            key={student.id}
            className="hover:bg-green-50/30 cursor-pointer transition-colors duration-100"
            onClick={() => onEditStudent?.(student)}
          >
            <TableCell className="py-4 px-4">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${getAvatarBgClass(student.name)}`}
                  style={{ color: "#ffffff" }}
                >
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-gray-900">{student.name}</span>
              </div>
            </TableCell>
            <TableCell className="py-4 px-4">
              <Badge variant="secondary" className="capitalize rounded-full px-2.5 py-0.5 text-xs font-semibold">
                {student.section || "Unassigned"}
              </Badge>
            </TableCell>
            <TableCell className="py-4 px-4">
              <div>
                <p className="text-sm text-gray-900">{student.guardian_name || "N/A"}</p>
                <p className="text-xs text-gray-500">
                  {student.guardian_contact || "No contact"}
                </p>
              </div>
            </TableCell>
            <TableCell className="py-4 px-4">
              <div className="flex flex-col items-start gap-1">
                <Badge
                  variant="outline"
                  className={`capitalize rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColorClass(student.status)}`}
                >
                  {student.status}
                </Badge>
                {(student.status === "vacation" || student.status === "hospitalized" || student.status === "suspended") && student.status_start_date && (
                  <div className="flex items-center text-xs text-gray-400">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>
                      {new Date(student.status_start_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      {student.status_end_date
                        ? ` - ${new Date(student.status_end_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
                        : " - Ongoing"}
                    </span>
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell className="py-4 px-4 text-sm text-gray-700">
              {student.enrollment_date
                ? new Date(student.enrollment_date).toLocaleDateString()
                : "N/A"}
            </TableCell>
            <TableCell className="py-4 px-4 text-right">
              <button
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditStudent?.(student);
                }}
                title="Edit student"
              >
                <Edit className="h-4 w-4" />
              </button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
