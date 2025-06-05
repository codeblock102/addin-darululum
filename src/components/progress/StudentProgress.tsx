import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { Loader2 } from "lucide-react";

interface StudentProgressProps {
  studentId: string;
}

export const StudentProgress = ({ studentId }: StudentProgressProps) => {
  const { data: progress, isLoading } = useQuery({
    queryKey: ['student-progress', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('progress')
        .select(`
          *,
          students(name)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: revisions } = useQuery({
    queryKey: ['student-revisions', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('juz_revisions')
        .select('*')
        .eq('student_id', studentId)
        .order('revision_date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{progress?.students?.name} - Current Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Current Surah</p>
              <p className="text-2xl font-bold">{progress?.current_surah}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Current Juz</p>
              <p className="text-2xl font-bold">{progress?.current_juz}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Verses Memorized</p>
              <p className="text-2xl font-bold">{progress?.verses_memorized}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Completed Juz</p>
              <p className="text-2xl font-bold">{progress?.completed_juz}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Revisions History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {revisions?.map((revision) => (
              <div
                key={revision.id}
                className="flex items-center justify-between border-b pb-2 last:border-0"
              >
                <div>
                  <p className="font-medium">Juz {revision.juz_revised}</p>
                  <p className="text-sm text-muted-foreground">
                    {revision.teacher_notes}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{new Date(revision.revision_date).toLocaleDateString()}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    revision.memorization_quality === 'excellent' ? 'bg-green-100 text-green-800' :
                    revision.memorization_quality === 'good' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {revision.memorization_quality}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
