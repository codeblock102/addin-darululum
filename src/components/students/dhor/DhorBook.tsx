
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { NewRevisionDialog } from "./NewRevisionDialog";
import { RevisionStats } from "./RevisionStats";
import { RevisionTabs } from "./RevisionTabs";
import { DhorBookProps } from "../progress/types";

export const DhorBook = ({ studentId, studentName }: DhorBookProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: revisions, isLoading: revisionsLoading } = useQuery({
    queryKey: ['student-revisions', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('juz_revisions')
        .select(`
          id,
          student_id,
          juz_revised,
          revision_date,
          teacher_notes,
          memorization_quality,
          teacher_id,
          teachers (
            name
          )
        `)
        .eq('student_id', studentId)
        .order('revision_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: masteryLevels, isLoading: masteryLoading } = useQuery({
    queryKey: ['student-mastery', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('juz_mastery')
        .select('*')
        .eq('student_id', studentId);
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: difficultAyahs, isLoading: ayahsLoading } = useQuery({
    queryKey: ['student-difficult-ayahs', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('difficult_ayahs')
        .select('*')
        .eq('student_id', studentId)
        .eq('status', 'active');
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: schedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ['student-revision-schedule', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revision_schedule')
        .select('*')
        .eq('student_id', studentId)
        .neq('status', 'completed');
      
      if (error) throw error;
      return data || [];
    },
  });

  if (revisionsLoading || masteryLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const completedRevisions = revisions?.filter(
    rev => rev.memorization_quality === 'excellent' || rev.memorization_quality === 'good'
  ).length || 0;
  
  const needsImprovementRevisions = revisions?.filter(
    rev => rev.memorization_quality === 'needsWork' || rev.memorization_quality === 'horrible'
  ).length || 0;
  
  const totalRevisions = revisions?.length || 0;
  
  const revisionCompletionRate = totalRevisions > 0 
    ? Math.round((completedRevisions / totalRevisions) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dhor Book for {studentName}</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Revision
        </Button>
      </div>

      <RevisionStats 
        totalRevisions={totalRevisions}
        completedRevisions={completedRevisions}
        needsImprovementRevisions={needsImprovementRevisions}
        completionRate={revisionCompletionRate}
      />
      
      <RevisionTabs
        revisions={revisions || []}
        masteryLevels={masteryLevels || []}
        difficultAyahs={difficultAyahs || []}
        schedule={schedule || []}
        studentId={studentId}
        masteryLoading={masteryLoading}
        scheduleLoading={scheduleLoading}
        ayahsLoading={ayahsLoading}
      />
      
      <NewRevisionDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        studentId={studentId}
        studentName={studentName}
        onSuccess={() => {
          queryClient.invalidateQueries({
            queryKey: ['student-revisions', studentId]
          });
          queryClient.invalidateQueries({
            queryKey: ['student-mastery', studentId]
          });
        }}
      />
    </div>
  );
};
