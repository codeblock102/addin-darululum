
// Import the correct components and fix the rpc call issue
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EditDifficultAyahDialog } from "./EditDifficultAyahDialog";
import { NewDifficultAyahDialog } from "./NewDifficultAyahDialog";
import { DifficultAyah } from "@/types/progress";

interface DifficultAyahsListProps {
  ayahs: DifficultAyah[];
  studentId: string;
}

export const DifficultAyahsList = ({ ayahs, studentId }: DifficultAyahsListProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [selectedAyah, setSelectedAyah] = useState<DifficultAyah | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const removeAyah = useMutation({
    mutationFn: async (ayahId: string) => {
      try {
        // Use a direct update query instead of RPC
        const { error } = await supabase
          .from('difficult_ayahs')
          .update({ status: 'resolved' })
          .eq('id', ayahId);
        
        if (error) throw error;
        return ayahId;
      } catch (error) {
        console.error("Error removing difficult ayah:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['student-difficult-ayahs', studentId]
      });
      toast({
        title: "Success",
        description: "Difficult Ayah marked as resolved",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resolve Difficult Ayah",
        variant: "destructive",
      });
    }
  });

  const handleEdit = (ayah: DifficultAyah) => {
    setSelectedAyah(ayah);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (ayahId: string) => {
    if (confirm("Are you sure you want to mark this ayah as resolved?")) {
      removeAyah.mutate(ayahId);
    }
  };

  const handleAddNew = () => {
    setIsNewDialogOpen(true);
  };

  if (ayahs.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={handleAddNew}>Add Difficult Ayah</Button>
        </div>
        <Card className="p-8 text-center">
          <p className="text-gray-500">No difficult ayahs recorded for this student.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleAddNew}>Add Difficult Ayah</Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Surah</TableHead>
            <TableHead>Ayah</TableHead>
            <TableHead>Juz</TableHead>
            <TableHead>Revisions</TableHead>
            <TableHead>Last Revised</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ayahs.map((ayah) => (
            <TableRow key={ayah.id}>
              <TableCell className="font-medium">{ayah.surah_number}</TableCell>
              <TableCell>{ayah.ayah_number}</TableCell>
              <TableCell>{ayah.juz_number}</TableCell>
              <TableCell>{ayah.revision_count}</TableCell>
              <TableCell>
                {ayah.last_revised ? new Date(ayah.last_revised).toLocaleDateString() : 'Never'}
              </TableCell>
              <TableCell>
                <div className="max-w-[200px] truncate" title={ayah.notes || ''}>
                  {ayah.notes || '-'}
                </div>
              </TableCell>
              <TableCell className="text-right flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(ayah)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(ayah.id)}>
                  <Trash className="h-4 w-4 text-red-500" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedAyah && (
        <EditDifficultAyahDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          ayah={selectedAyah}
          studentId={studentId}
        />
      )}

      <NewDifficultAyahDialog
        open={isNewDialogOpen}
        onOpenChange={setIsNewDialogOpen}
        studentId={studentId}
      />
    </div>
  );
};
