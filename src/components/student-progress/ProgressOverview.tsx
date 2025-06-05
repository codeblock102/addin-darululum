import React from 'react';
import { Card, CardContent } from "@/components/ui/card.tsx";
import { DailyActivityEntry } from "@/types/dhor-book.ts";
import { Tables } from "@/integrations/supabase/types.ts";

export interface ProgressOverviewProps {
  studentName: string;
  progressData: DailyActivityEntry[];
  sabaqParaData: Tables<"sabaq_para">[];
  juzRevisionsData: Tables<"juz_revisions">[];
}

export const ProgressOverview = ({ 
  studentName, 
  progressData, 
  sabaqParaData, 
  juzRevisionsData 
}: ProgressOverviewProps) => {
  // This is a new component that we need to create to match the props being passed
  // You can implement the actual content based on your requirements
  
  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-xl font-semibold mb-4 text-foreground">{studentName}'s Progress Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-muted/30 rounded-md">
            <h3 className="font-medium mb-2">Progress</h3>
            <p>{progressData.length} entries</p>
          </div>
          
          <div className="p-4 bg-muted/30 rounded-md">
            <h3 className="font-medium mb-2">Sabaq Para</h3>
            <p>{sabaqParaData.length} entries</p>
          </div>
          
          <div className="p-4 bg-muted/30 rounded-md">
            <h3 className="font-medium mb-2">Juz Revisions</h3>
            <p>{juzRevisionsData.length} revisions</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
