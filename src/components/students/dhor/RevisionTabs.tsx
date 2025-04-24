
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RevisionsList } from "./RevisionsList";
import { DifficultAyahsList } from "./DifficultAyahsList";
import { JuzRevision, DifficultAyah } from "@/types/progress";

interface RevisionTabsProps {
  revisions: JuzRevision[];
  difficultAyahs: DifficultAyah[];
  studentId: string;
  onOpenNewRevisionDialog: () => void;
}

export const RevisionTabs = ({
  revisions,
  difficultAyahs,
  studentId,
  onOpenNewRevisionDialog
}: RevisionTabsProps) => {
  return (
    <Tabs defaultValue="revisions" className="mt-6">
      <TabsList className="mb-4">
        <TabsTrigger value="revisions">Revisions History</TabsTrigger>
        <TabsTrigger value="difficult-ayahs">Difficult Ayahs</TabsTrigger>
      </TabsList>

      <TabsContent value="revisions">
        <RevisionsList 
          revisions={revisions}
          studentId={studentId}
          onAddRevision={onOpenNewRevisionDialog} 
        />
      </TabsContent>

      <TabsContent value="difficult-ayahs">
        <DifficultAyahsList 
          ayahs={difficultAyahs} 
          studentId={studentId} 
        />
      </TabsContent>
    </Tabs>
  );
}
