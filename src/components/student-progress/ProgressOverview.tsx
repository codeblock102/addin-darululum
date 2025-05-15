import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/types/progress";

interface ProgressOverviewProps {
  studentName: string;
  progressData: Progress[];
  sabaqParaData?: any[];
  juzRevisionsData?: any[];
}

export const ProgressOverview = ({ 
  studentName, 
  progressData,
  sabaqParaData,
  juzRevisionsData
}: ProgressOverviewProps) => {
  const latestProgress = progressData && progressData.length > 0 ? progressData[progressData.length - 1] : null;

  // Calculate total verses memorized
  const totalVersesMemorized = progressData.reduce((sum, entry) => {
    return sum + (entry.verses_memorized || 0);
  }, 0);

  // Calculate completed juz
  const completedJuzCount = latestProgress && latestProgress.completed_juz 
    ? (Array.isArray(latestProgress.completed_juz) 
        ? latestProgress.completed_juz.length 
        : typeof latestProgress.completed_juz === 'number' 
          ? latestProgress.completed_juz 
          : 0)
    : 0;

  // Calculate revision metrics
  const totalRevisions = juzRevisionsData?.length || 0;
  const recentRevisionQuality = juzRevisionsData && juzRevisionsData.length > 0
    ? juzRevisionsData[0].memorization_quality
    : 'N/A';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{studentName}'s Progress Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {latestProgress ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Current Surah</p>
              <p className="text-2xl font-bold">{latestProgress.current_surah || 'N/A'}</p>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Current Juz</p>
              <p className="text-2xl font-bold">{latestProgress.current_juz || 'N/A'}</p>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Total Verses</p>
              <p className="text-2xl font-bold">{totalVersesMemorized}</p>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Completed Juz</p>
              <p className="text-2xl font-bold">{completedJuzCount}</p>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Memorization Quality</p>
              <p className="text-xl font-bold capitalize">{latestProgress.memorization_quality || 'N/A'}</p>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Tajweed Level</p>
              <p className="text-xl font-bold">{latestProgress.tajweed_level || 'N/A'}</p>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Total Revisions</p>
              <p className="text-xl font-bold">{totalRevisions}</p>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Recent Quality</p>
              <p className="text-xl font-bold capitalize">{recentRevisionQuality}</p>
            </div>
          </div>
        ) : (
          <p className="text-center py-4 text-muted-foreground">No progress data available for this student</p>
        )}
      </CardContent>
    </Card>
  );
};
