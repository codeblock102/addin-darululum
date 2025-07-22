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
import { ClassFormData } from "@/components/classes/validation/classFormSchema.ts";

interface ClassTableProps {
  classes: (Partial<ClassFormData> & {
    id: string;
    teachers?: { id: string; name: string }[];
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
      <Table>
        <TableHeader className="bg-primary/5">
          <TableRow>
            <TableHead>Class Name</TableHead>
            <TableHead>Teacher</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Section</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
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