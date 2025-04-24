
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
      try {
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
            teachers:teacher_id (
              name
            )
          `)
          .eq('student_id', studentId)
          .order('revision_date', { ascending: false });
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching revisions:", error);
        return [];
      }
    },
  });

  const { data: masteryLevels, isLoading: masteryLoading } = useQuery({
    queryKey: ['student-mastery', studentId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('juz_mastery')
          .select('*')
          .eq('student_id', studentId);
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching mastery levels:", error);
        return [];
      }
    },
  });

  const { data: difficultAyahs, isLoading: ayahsLoading } = useQuery({
    queryKey: ['student-difficult-ayahs', studentId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('difficult_ayahs')
          .select('*')
          .eq('student_id', studentId)
          .eq('status', 'active');
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching difficult ayahs:", error);
        return [];
      }
    },
  });

  const { data: schedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ['student-revision-schedule', studentId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('revision_schedule')
          .select('*')
          .eq('student_id', studentId)
          .neq('status', 'completed');
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching revision schedule:", error);
        return [];
      }
    },
  });

  if (revisionsLoading || masteryLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If revisions is not an array or empty, use an empty array for calculations
  const revisionsArray = Array.isArray(revisions) ? revisions : [];

  const completedRevisions = revisionsArray.filter(
    rev => rev.memorization_quality === 'excellent' || rev.memorization_quality === 'good'
  ).length || 0;
  
  const needsImprovementRevisions = revisionsArray.filter(
    rev => rev.memorization_quality === 'needsWork' || rev.memorization_quality === 'horrible'
  ).length || 0;
  
  const totalRevisions = revisionsArray.length || 0;
  
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
        revisions={revisionsArray}
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
