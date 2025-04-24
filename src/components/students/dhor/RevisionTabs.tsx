
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { RevisionsList } from "./RevisionsList";
import { DifficultAyahsList } from "./DifficultAyahsList";
import { RevisionSchedule } from "./RevisionSchedule";
import { MasteryLevelGrid } from "./MasteryLevelGrid";
import { JuzRevision, JuzMastery, DifficultAyah, RevisionScheduleItem } from "@/types/progress";

interface RevisionTabsProps {
  revisions: JuzRevision[];
  masteryLevels: JuzMastery[];
  difficultAyahs: DifficultAyah[];
  schedule: RevisionScheduleItem[];
  studentId: string;
  masteryLoading: boolean;
  scheduleLoading: boolean;
  ayahsLoading: boolean;
}

export const RevisionTabs = ({
  revisions,
  masteryLevels,
  difficultAyahs,
  schedule,
  studentId,
  masteryLoading,
  scheduleLoading,
  ayahsLoading,
}: RevisionTabsProps) => {
  return (
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
            <RevisionsList revisions={revisions} />
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
                schedule={schedule} 
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
                ayahs={difficultAyahs} 
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
            <MasteryLevelGrid 
              masteryLevels={masteryLevels}
              masteryLoading={masteryLoading}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
