import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, Clock, MoreVertical, Plus, RefreshCw } from 'lucide-react';
import { NewDifficultAyahDialog } from './NewDifficultAyahDialog';
import { DifficultAyah, EditDifficultAyahDialogProps } from '@/types/progress';
import { EditDifficultAyahDialog } from './EditDifficultAyahDialog';
import { useQueryClient } from "@tanstack/react-query";

interface DifficultAyahsListProps {
  ayahs: DifficultAyah[];
  studentId: string;
}

export const DifficultAyahsList: React.FC<DifficultAyahsListProps> = ({ ayahs, studentId }) => {
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAyah, setSelectedAyah] = useState<DifficultAyah | null>(null);
  const queryClient = useQueryClient();

  const handleEditAyah = (ayah: DifficultAyah) => {
    setSelectedAyah(ayah);
    setEditDialogOpen(true);
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'Not revised';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'pending': 
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'resolved':
        return <RefreshCw className="h-4 w-4 text-green-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h3 className="text-lg font-medium">Difficult Ayahs</h3>
        <Button size="sm" onClick={() => setNewDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Difficult Ayah
        </Button>
      </div>

      {ayahs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No difficult ayahs recorded yet.
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Surah:Ayah</TableHead>
                <TableHead>Juz</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Revised</TableHead>
                <TableHead>Revision Count</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ayahs.map((ayah) => (
                <TableRow key={ayah.id}>
                  <TableCell className="font-medium">
                    {ayah.surah_number}:{ayah.ayah_number}
                  </TableCell>
                  <TableCell>{ayah.juz_number}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {getStatusIcon(ayah.status)}
                      <span className="ml-2 capitalize">{ayah.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(ayah.last_revised)}</TableCell>
                  <TableCell>{ayah.revision_count}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditAyah(ayah)}>
                          Edit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <NewDifficultAyahDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        studentId={studentId}
      />

      {selectedAyah && (
        <EditDifficultAyahDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          difficultAyah={selectedAyah}
          studentId={studentId}
          onSuccess={() => queryClient.invalidateQueries(['student-difficult-ayahs', studentId])}
        />
      )}
    </div>
  );
};
