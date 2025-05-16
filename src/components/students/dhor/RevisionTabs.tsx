
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RevisionsList } from './RevisionsList';
import { DifficultAyahList } from './DifficultAyahList';
import { Loader2 } from 'lucide-react';
import { JuzRevision } from '@/types/progress';
import { useIsMobile } from "@/hooks/use-mobile";

interface RevisionTabsProps {
  studentId: string;
  studentName: string;
  juzRevisions: JuzRevision[];
  loading: boolean;
  onAddJuzRevision?: () => void;
}

export function RevisionTabs({ studentId, studentName, juzRevisions, loading, onAddJuzRevision }: RevisionTabsProps) {
  const [activeTab, setActiveTab] = useState("revisions");
  const isMobile = useIsMobile();

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className={`mb-4 grid w-full ${isMobile ? "grid-cols-2" : "grid-cols-3"}`}>
        <TabsTrigger value="revisions" className="text-xs sm:text-sm px-1 sm:px-4">Revisions</TabsTrigger>
        {!isMobile && <TabsTrigger value="schedule" className="text-xs sm:text-sm px-1 sm:px-4">Schedule</TabsTrigger>}
        <TabsTrigger value="difficult" className="text-xs sm:text-sm px-1 sm:px-4">Difficult Ayahs</TabsTrigger>
      </TabsList>
      
      <TabsContent value="revisions" className="mt-0">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <RevisionsList 
            revisions={juzRevisions} 
            studentId={studentId}
            studentName={studentName}
            onAddRevision={onAddJuzRevision}
          />
        )}
      </TabsContent>
      
      {!isMobile && (
        <TabsContent value="schedule" className="mt-0">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Coming Soon: Student Schedule</p>
          </div>
        </TabsContent>
      )}
      
      <TabsContent value="difficult" className="mt-0">
        <DifficultAyahList studentId={studentId} />
      </TabsContent>
    </Tabs>
  );
}
