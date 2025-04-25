
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Schedule } from "@/types/progress";
import { RevisionsList } from './RevisionsList';
import { DifficultAyahList } from './DifficultAyahList';
import { Loader2 } from 'lucide-react';

interface RevisionTabsProps {
  studentId: string;
  studentName: string;
  juzRevisions: any[];
  loading: boolean;
  onAddJuzRevision: () => void;
}

export function RevisionTabs({ studentId, studentName, juzRevisions, loading, onAddJuzRevision }: RevisionTabsProps) {
  const [activeTab, setActiveTab] = useState("revisions");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="mb-4 grid grid-cols-3">
        <TabsTrigger value="revisions">Revisions</TabsTrigger>
        <TabsTrigger value="schedule">Schedule</TabsTrigger>
        <TabsTrigger value="difficult">Difficult Ayahs</TabsTrigger>
      </TabsList>
      
      <TabsContent value="revisions">
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
      
      <TabsContent value="schedule">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Coming Soon: Student Schedule</p>
        </div>
      </TabsContent>
      
      <TabsContent value="difficult">
        <DifficultAyahList studentId={studentId} />
      </TabsContent>
    </Tabs>
  );
}
