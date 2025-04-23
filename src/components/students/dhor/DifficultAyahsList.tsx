import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Plus, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DifficultAyah } from "@/types/progress";
import { NewDifficultAyahDialog } from "./NewDifficultAyahDialog";
import { EditDifficultAyahDialog } from "./EditDifficultAyahDialog";

interface DifficultAyahsListProps {
  ayahs: DifficultAyah[];
  studentId: string;
}

export const DifficultAyahsList = ({ ayahs, studentId }: DifficultAyahsListProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAyah, setSelectedAyah] = useState<DifficultAyah | null>(null);
  
  const markAsResolved = useMutation({
    mutationFn: async (ayahId: string) => {
      try {
        const { error } = await supabase
          .rpc('mark_ayah_resolved', { ayah_id_param: ayahId })
        
        if (error) throw error;
        return ayahId;
      } catch (error) {
        console.error("Error updating ayah status:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['student-difficult-ayahs', studentId]
      });
      toast({
        title: "Success",
        description: "Ayah marked as resolved",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update ayah status",
        variant: "destructive",
      });
      console.error(error);
    }
  });
  
  const handleMarkResolved = (ayahId: string) => {
    markAsResolved.mutate(ayahId);
  };
  
  const handleEditAyah = (ayah: DifficultAyah) => {
    setSelectedAyah(ayah);
    setEditDialogOpen(true);
  };
  
  const activeAyahs = ayahs.filter(ayah => ayah.status === 'active');
  
  const refreshData = () => {
    queryClient.invalidateQueries({
      queryKey: ['student-difficult-ayahs', studentId]
    });
  };
  
  if (activeAyahs.length === 0) {
    return (
      <div>
        <div className="flex justify-end mb-4">
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Difficult Ayah
          </Button>
        </div>
        
        <Card className="p-8 text-center">
          <p className="text-gray-500">No difficult ayahs recorded for this student.</p>
        </Card>
        
        <NewDifficultAyahDialog
          studentId={studentId}
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
        />
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Difficult Ayah
        </Button>
      </div>
    
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Revisions</TableHead>
            <TableHead>Last Revised</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activeAyahs.map((ayah) => (
            <TableRow key={ayah.id}>
              <TableCell>
                <div>
                  <div className="font-medium">Surah {ayah.surah_number}, Ayah {ayah.ayah_number}</div>
                  <div className="text-xs text-gray-500">Juz {ayah.juz_number}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-[200px] truncate" title={ayah.notes}>
                  {ayah.notes || 'No notes'}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{ayah.revision_count}</Badge>
              </TableCell>
              <TableCell>
                {ayah.last_revised ? new Date(ayah.last_revised).toLocaleDateString() : 'Never'}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditAyah(ayah)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkResolved(ayah.id)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <NewDifficultAyahDialog
        studentId={studentId}
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />
      
      <EditDifficultAyahDialog
        difficultAyah={selectedAyah}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={refreshData}
      />
    </div>
  );
};
