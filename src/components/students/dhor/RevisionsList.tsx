import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";
import { EditRevisionDialog } from "./EditRevisionDialog";
import { RevisionsListProps } from "@/types/progress";

interface Revision {
  id: string;
  student_id: string;
  juz_revised: number;
  revision_date: string;
  teacher_notes?: string;
  memorization_quality?: 'excellent' | 'good' | 'average' | 'needsWork' | 'horrible';
  teachers?: {
    name: string;
  };
  teacher_id?: string;
}

export const RevisionsList = ({
  revisions,
  studentId,
  studentName,
  onAddRevision
}: RevisionsListProps) => {
  const [editingRevision, setEditingRevision] = useState<Revision | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEditClick = (revision: Revision) => {
    setEditingRevision(revision);
    setIsEditDialogOpen(true);
  };

  if (revisions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">No revisions found for this student.</p>
      </Card>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Juz</TableHead>
            <TableHead>Quality</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Teacher</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {revisions.map((revision) => (
            <TableRow key={revision.id}>
              <TableCell>
                {revision.revision_date ? new Date(revision.revision_date).toLocaleDateString() : 'N/A'}
              </TableCell>
              <TableCell className="font-medium">
                Juz {revision.juz_revised}
              </TableCell>
              <TableCell>
                <Badge variant={
                  revision.memorization_quality === 'excellent' ? 'default' :
                  revision.memorization_quality === 'good' ? 'secondary' :
                  revision.memorization_quality === 'average' ? 'outline' :
                  revision.memorization_quality === 'needsWork' ? 'destructive' :
                  'destructive'
                }>
                  {revision.memorization_quality || 'Not rated'}
                </Badge>
              </TableCell>
              <TableCell>
                {revision.teacher_notes ? (
                  <div className="max-w-[200px] truncate" title={revision.teacher_notes}>
                    {revision.teacher_notes}
                  </div>
                ) : (
                  <span className="text-gray-400 text-sm">No notes</span>
                )}
              </TableCell>
              <TableCell>
                {revision.teachers?.name ? (
                  <span className="text-sm text-gray-600">
                    {revision.teachers.name}
                  </span>
                ) : (
                  <span className="text-gray-400 text-sm">Unknown</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditClick(revision)}
                  className="h-8 w-8 p-0"
                >
                  <Edit2 className="h-4 w-4" />
                  <span className="sr-only">Edit revision</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <EditRevisionDialog 
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        revision={editingRevision}
      />
    </>
  );
};
