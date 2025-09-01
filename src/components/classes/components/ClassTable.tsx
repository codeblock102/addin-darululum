import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
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
    <div className="rounded-md border shadow-sm overflow-hidden">
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
                  <div className="shrink-0 flex flex-col gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit(classItem)}>
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onEnroll(classItem)}>
                      Manage
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => onDelete(classItem)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Table for large screens */}
      <Table className="hidden lg:table">
        <TableHeader className="bg-primary/5">
          <TableRow>
            <TableHead>Class Name</TableHead>
            <TableHead>Teacher</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Section</TableHead>
            <TableHead>Students</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No classes found.
              </TableCell>
            </TableRow>
          ) : (
            classes.map((classItem) => (
              <TableRow key={classItem.id}>
                <TableCell>{classItem.name}</TableCell>
                <TableCell>
                  {classItem.teachers?.map((t) => t.name).join(", ") || "N/A"}
                </TableCell>
                <TableCell>{classItem.subject || "N/A"}</TableCell>
                <TableCell>{classItem.section || "N/A"}</TableCell>
                <TableCell>{classItem.studentCount}</TableCell>
                <TableCell>{classItem.capacity}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(classItem)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEnroll(classItem)}
                    >
                      Manage Students
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(classItem)}
                    >
                      Delete
                    </Button>
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