import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Pencil, Users, Trash2 } from "lucide-react";
import { ClassFormData } from "@/components/classes/validation/classFormSchema.ts";

interface ClassTableProps {
  classes: (Partial<ClassFormData> & {
    id: string;
    teachers?: { id: string; name: string }[];
    studentCount?: number;
  })[];
  onEdit: (
    classItem: Partial<ClassFormData> & {
      id: string;
      teachers?: { id: string; name: string }[];
    }
  ) => void;
  onEnroll: (classItem: Partial<ClassFormData> & { id: string }) => void;
  onDelete: (classItem: Partial<ClassFormData> & { id: string }) => void;
}

export const ClassTable = ({
  classes,
  onEdit,
  onEnroll,
  onDelete,
}: ClassTableProps) => {
  return (
    <div className="overflow-hidden">
      {/* Card list for mobile and tablets */}
      <div className="lg:hidden space-y-3 p-4">
        {classes.length === 0 ? (
          <Card className="border border-gray-200 bg-white">
            <CardContent className="p-4 text-center text-gray-600">
              No classes found.
            </CardContent>
          </Card>
        ) : (
          classes.map((classItem) => (
            <Card key={classItem.id} className="border border-gray-200 bg-white">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{classItem.name}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                      {classItem.subject && (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          {classItem.subject}
                        </Badge>
                      )}
                      {classItem.section && (
                        <span className="px-2 py-0.5 rounded-md border border-gray-200 text-gray-700 bg-gray-50 text-xs">
                          {classItem.section}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-gray-700">
                      <span className="font-medium">Teachers:</span>
                      <span className="ml-1 text-gray-600">
                        {classItem.teachers?.map((t) => t.name).join(", ") || "N/A"}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      <span>Students: {classItem.studentCount ?? 0}</span>
                      <span className="ml-3">Capacity: {classItem.capacity ?? "-"}</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1">
                    <button
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
                      onClick={() => onEdit(classItem)}
                      title="Edit class"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
                      onClick={() => onEnroll(classItem)}
                      title="Manage students"
                    >
                      <Users className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600"
                      onClick={() => onDelete(classItem)}
                      title="Delete class"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Table for large screens */}
      <Table className="hidden lg:table">
        <TableHeader className="bg-gray-50/60">
          <TableRow>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-400 py-4 px-4">Class Name</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-400 py-4 px-4">Teacher</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-400 py-4 px-4">Subject</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-400 py-4 px-4">Section</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-400 py-4 px-4">Students</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-400 py-4 px-4">Capacity</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-400 py-4 px-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                No classes found.
              </TableCell>
            </TableRow>
          ) : (
            classes.map((classItem) => (
              <TableRow
                key={classItem.id}
                className="hover:bg-green-50/30 cursor-pointer transition-colors duration-100"
              >
                <TableCell className="py-4 px-4 font-medium text-gray-900">{classItem.name}</TableCell>
                <TableCell className="py-4 px-4 text-gray-700">
                  {classItem.teachers?.map((t) => t.name).join(", ") || "N/A"}
                </TableCell>
                <TableCell className="py-4 px-4">{classItem.subject || "N/A"}</TableCell>
                <TableCell className="py-4 px-4">{classItem.section || "N/A"}</TableCell>
                <TableCell className="py-4 px-4">{classItem.studentCount}</TableCell>
                <TableCell className="py-4 px-4">{classItem.capacity}</TableCell>
                <TableCell className="py-4 px-4">
                  <div className="flex items-center gap-1">
                    <button
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
                      onClick={() => onEdit(classItem)}
                      title="Edit class"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
                      onClick={() => onEnroll(classItem)}
                      title="Manage students"
                    >
                      <Users className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600"
                      onClick={() => onDelete(classItem)}
                      title="Delete class"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
