
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { MasteryLevelGrid } from "./MasteryLevelGrid";
import { RevisionSchedule } from "./RevisionSchedule";
import { RevisionStats } from "./RevisionStats";
import { RevisionTabs } from "./RevisionTabs";
import { DhorBookProps } from "../progress/types";
import { JuzRevision } from "@/types/progress";
import { NewRevisionDialog } from "./NewRevisionDialog";

export const DhorBook = ({ studentId, studentName }: DhorBookProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch juz revisions
  const {
    data: revisionsArray = [],
    isLoading: revisionsLoading
  } = useQuery({
    queryKey: ['student-juz-revisions', studentId],
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
            memorization_quality
          `)
          .eq('student_id', studentId)
          .order('revision_date', { ascending: false });
        
        if (error) throw error;
        return data as JuzRevision[];
      } catch (error) {
        console.error("Error fetching revisions:", error);
        return [];
      }
    }
  });

  // Fetch mastery data
  const { data: masteryData } = useQuery({
    queryKey: ['student-juz-mastery', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('juz_mastery')
        .select('*')
        .eq('student_id', studentId)
        .order('juz_number', { ascending: true });

      if (error) {
        console.error("Error fetching mastery:", error);
        return [];
      }
      return data;
    }
  });

  // Fetch difficult ayahs
  const { data: difficultAyahs = [] } = useQuery({
    queryKey: ['student-difficult-ayahs', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('difficult_ayahs')
        .select('*')
        .eq('student_id', studentId)
        .order('surah_number', { ascending: true });

      if (error) {
        console.error("Error fetching difficult ayahs:", error);
        return [];
      }
      return data;
    }
  });

  // Fetch revision schedule
  const { data: revisionSchedule = [] } = useQuery({
    queryKey: ['student-revision-schedule', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revision_schedule')
        .select('*')
        .eq('student_id', studentId)
        .order('juz_number', { ascending: true });

      if (error) {
        console.error("Error fetching revision schedule:", error);
        return [];
      }
      return data;
    }
  });

  const totalRevisions = revisionsArray?.length || 0;
  const excellentRevisions = revisionsArray?.filter(rev => rev.memorization_quality === 'excellent').length || 0;
  const goodRevisions = revisionsArray?.filter(rev => rev.memorization_quality === 'good').length || 0;
  const averageRevisions = revisionsArray?.filter(rev => rev.memorization_quality === 'average').length || 0;
  const needsWorkRevisions = revisionsArray?.filter(rev => rev.memorization_quality === 'needsWork').length || 0;
  const horribleRevisions = revisionsArray?.filter(rev => rev.memorization_quality === 'horrible').length || 0;

  const handleRevisionSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['student-juz-revisions', studentId] });
    queryClient.invalidateQueries({ queryKey: ['student-juz-mastery', studentId] });
    setIsDialogOpen(false);
  };

  if (revisionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Student: {studentName}</h2>

      <RevisionStats
        totalRevisions={totalRevisions}
        excellentRevisions={excellentRevisions}
        goodRevisions={goodRevisions}
        averageRevisions={averageRevisions}
        needsWorkRevisions={needsWorkRevisions}
        horribleRevisions={horribleRevisions}
      />

      <RevisionTabs
        revisions={revisionsArray}
        difficultAyahs={difficultAyahs}
        studentId={studentId}
        onOpenNewRevisionDialog={() => setIsDialogOpen(true)}
      />

      <RevisionSchedule
        studentId={studentId}
        revisionSchedule={revisionSchedule}
      />

      <NewRevisionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        studentId={studentId}
        onSuccess={handleRevisionSuccess}
      />
    </div>
  );
};
