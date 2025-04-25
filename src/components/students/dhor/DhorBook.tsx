
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RevisionTabs } from "./RevisionTabs";
import { NewRevisionDialog } from "./NewRevisionDialog";

interface DhorBookProps {
  studentId: string;
  studentName: string;
}

export const DhorBook = ({ studentId, studentName }: DhorBookProps) => {
  const [isNewRevisionDialogOpen, setIsNewRevisionDialogOpen] = useState(false);

  const { data: studentData, isLoading: isStudentLoading } = useQuery({
    queryKey: ['student', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (error) {
        console.error("Error fetching student:", error);
        return null;
      }
      return data;
    },
  });

  const { data: difficultAyahs, isLoading, refetch } = useQuery({
    queryKey: ['difficult-ayahs', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('difficult_ayahs')
        .select('*')
        .eq('student_id', studentId)
        .order('surah_number', { ascending: true })
        .order('ayah_number', { ascending: true });

      if (error) {
        console.error("Error fetching difficult ayahs:", error);
        return [];
      }
      return data;
    },
  });

  const { data: juzRevisions, isLoading: isRevisionsLoading } = useQuery({
    queryKey: ['juz-revisions', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('juz_revisions')
        .select('*')
        .eq('student_id', studentId)
        .order('revision_date', { ascending: false });

      if (error) {
        console.error("Error fetching juz revisions:", error);
        return [];
      }
      return data;
    },
  });

  const onRevisionSuccess = () => {
    refetch();
  };

  if (isLoading || isStudentLoading || isRevisionsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <h2 className="text-2xl font-bold">Dhor Book</h2>
        <Badge variant="secondary">
          {studentName}
        </Badge>
      </div>
      <p className="text-muted-foreground">
        Here you can track revisions and difficult ayahs for the student.
      </p>

      <ScrollArea className="h-[500px] w-full rounded-md border">
        <RevisionTabs
          studentId={studentId}
          studentName={studentName}
          juzRevisions={juzRevisions || []}
          loading={isRevisionsLoading}
          onAddJuzRevision={() => setIsNewRevisionDialogOpen(true)}
        />
      </ScrollArea>
      
      <NewRevisionDialog
        open={isNewRevisionDialogOpen}
        onOpenChange={setIsNewRevisionDialogOpen}
        studentId={studentId}
        studentName={studentName}
        onSuccess={onRevisionSuccess}
      />
    </div>
  );
};
