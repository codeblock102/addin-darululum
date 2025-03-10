
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";
import { useState } from "react";
import { EditProgressDialog } from "./EditProgressDialog";

interface Progress {
  id: string;
  student_id: string;
  current_surah: number;
  current_juz: number;
  start_ayat: number;
  end_ayat: number;
  verses_memorized: number;
  date: string;
  memorization_quality?: 'excellent' | 'good' | 'average' | 'needsWork' | 'horrible';
  notes?: string;
  teacher_notes?: string;
  contributor_name?: string;
  contributor_id?: string;
}

interface StudentProgressListProps {
  progress: Progress[];
}

export const StudentProgressList = ({ progress }: StudentProgressListProps) => {
  const [editingProgress, setEditingProgress] = useState<Progress | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEditClick = (entry: Progress) => {
    setEditingProgress(entry);
    setIsEditDialogOpen(true);
  };

  if (progress.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">No progress entries found for this student.</p>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Verses</TableHead>
              <TableHead>Quality</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Contributor</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {progress.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  {entry.date ? new Date(entry.date).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell>
                  <div className="font-medium">Surah {entry.current_surah || '—'}</div>
                  <div className="text-xs text-gray-500">
                    Juz {entry.current_juz || '—'}, Ayat {entry.start_ayat || '—'}-{entry.end_ayat || '—'}
                  </div>
                </TableCell>
                <TableCell>{entry.verses_memorized || 0}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    entry.memorization_quality === 'excellent' ? 'bg-green-100 text-green-800' :
                    entry.memorization_quality === 'good' ? 'bg-blue-100 text-blue-800' :
                    entry.memorization_quality === 'average' ? 'bg-yellow-100 text-yellow-800' :
                    entry.memorization_quality === 'needsWork' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {entry.memorization_quality || 'Not rated'}
                  </span>
                </TableCell>
                <TableCell>
                  {entry.notes ? (
                    <div className="max-w-[200px] truncate" title={entry.notes}>
                      {entry.notes}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">No notes</span>
                  )}
                  {entry.teacher_notes && (
                    <div className="max-w-[200px] truncate text-xs text-blue-600 mt-1" title={entry.teacher_notes}>
                      Teacher: {entry.teacher_notes}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {entry.contributor_name ? (
                    <span className="text-sm text-gray-600">
                      {entry.contributor_name}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">Unknown</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(entry)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">Edit entry</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <EditProgressDialog 
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        progressEntry={editingProgress}
      />
    </>
  );
};
