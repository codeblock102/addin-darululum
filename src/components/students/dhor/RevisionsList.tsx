
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { RevisionsListProps } from "@/types/progress";

export const RevisionsList = ({ 
  revisions, 
  studentId, 
  studentName,
  onAddRevision 
}: RevisionsListProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Revisions History</h3>
        <Button onClick={onAddRevision} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Revision
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Juz</TableHead>
              <TableHead>Quality</TableHead>
              <TableHead>Teacher Notes</TableHead>
              <TableHead>Teacher</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {revisions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No revisions recorded yet
                </TableCell>
              </TableRow>
            ) : (
              revisions.map((revision) => (
                <TableRow key={revision.id}>
                  <TableCell>
                    {format(new Date(revision.revision_date), 'PP')}
                  </TableCell>
                  <TableCell>Juz {revision.juz_revised}</TableCell>
                  <TableCell>
                    <span className={`capitalize ${
                      revision.memorization_quality === 'excellent' ? 'text-green-600' :
                      revision.memorization_quality === 'good' ? 'text-blue-600' :
                      revision.memorization_quality === 'average' ? 'text-yellow-600' :
                      revision.memorization_quality === 'needsWork' ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {revision.memorization_quality}
                    </span>
                  </TableCell>
                  <TableCell>{revision.teacher_notes || '-'}</TableCell>
                  <TableCell>{revision.teacher?.name || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
