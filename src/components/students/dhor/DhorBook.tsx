
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";
import { RevisionsList } from "./RevisionsList";
import { DifficultAyahsList } from "./DifficultAyahsList";
import { RevisionSchedule } from "./RevisionSchedule";
import { RevisionStats } from "./RevisionStats";
import { NewRevisionDialog } from "./NewRevisionDialog";
import { DhorBookProps } from "../progress/types";

export const DhorBook = ({ studentId, studentName }: DhorBookProps) => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch student revisions
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
          teachers:teacher_id (name)
        `)
        .eq('student_id', studentId)
        .order('revision_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch student mastery levels for all juz
  const { data: masteryLevels, isLoading: masteryLoading } = useQuery({
    queryKey: ['student-mastery', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('juz_mastery')
        .select('*')
        .eq('student_id', studentId);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch difficult ayahs
  const { data: difficultAyahs, isLoading: ayahsLoading } = useQuery({
    queryKey: ['student-difficult-ayahs', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('difficult_ayahs')
        .select('*')
        .eq('student_id', studentId)
        .order('date_added', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch revision schedule
  const { data: schedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ['student-revision-schedule', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revision_schedule')
        .select('*')
        .eq('student_id', studentId)
        .order('scheduled_date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });
  
  // Calculate revision stats
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

  // Handle dialog
  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  if (revisionsLoading || masteryLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dhor Book for {studentName}</h2>
        <Button onClick={handleOpenDialog}>
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
      
      <Tabs defaultValue="revisions">
        <TabsList>
          <TabsTrigger value="revisions">Past Revisions</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="difficult">Difficult Ayahs</TabsTrigger>
          <TabsTrigger value="mastery">Mastery Levels</TabsTrigger>
        </TabsList>
        
        <TabsContent value="revisions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Revision History</CardTitle>
            </CardHeader>
            <CardContent>
              <RevisionsList revisions={revisions || []} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="schedule" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Revision Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {scheduleLoading ? (
                <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <RevisionSchedule 
                  schedule={schedule || []} 
                  studentId={studentId}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="difficult" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Difficult Ayahs</CardTitle>
            </CardHeader>
            <CardContent>
              {ayahsLoading ? (
                <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <DifficultAyahsList 
                  ayahs={difficultAyahs || []} 
                  studentId={studentId}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="mastery" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Juz Mastery Levels</CardTitle>
            </CardHeader>
            <CardContent>
              {masteryLoading ? (
                <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => {
                    const juzMastery = masteryLevels?.find(m => m.juz_number === juz);
                    
                    return (
                      <Card key={juz} className={`p-4 ${
                        juzMastery?.mastery_level === 'mastered' ? 'bg-green-50 border-green-200' :
                        juzMastery?.mastery_level === 'memorized' ? 'bg-blue-50 border-blue-200' :
                        juzMastery?.mastery_level === 'in_progress' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="font-medium">Juz {juz}</div>
                        <div className="text-sm text-gray-500">
                          Status: {juzMastery?.mastery_level ? (
                            juzMastery.mastery_level === 'mastered' ? 'Mastered' :
                            juzMastery.mastery_level === 'memorized' ? 'Memorized' :
                            juzMastery.mastery_level === 'in_progress' ? 'In Progress' :
                            'Not Started'
                          ) : 'Not Started'}
                        </div>
                        {juzMastery?.last_revision_date && (
                          <div className="text-xs text-gray-500 mt-1">
                            Last revised: {new Date(juzMastery.last_revision_date).toLocaleDateString()}
                          </div>
                        )}
                        {juzMastery?.revision_count > 0 && (
                          <div className="text-xs text-gray-500">
                            Revisions: {juzMastery.revision_count}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <NewRevisionDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        studentId={studentId}
        studentName={studentName}
      />
    </div>
  );
};
