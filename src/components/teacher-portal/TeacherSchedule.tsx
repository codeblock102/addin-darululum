
import { useState } from "react";
import { StudentSearch } from "@/components/student-progress/StudentSearch";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScheduleFilters } from "./schedule/ScheduleFilters";
import { ScheduleActions } from "./schedule/ScheduleActions";
import { ScheduleList } from "./schedule/ScheduleList";
import { useScheduleData } from "./schedule/useScheduleData";

interface TeacherScheduleProps {
  teacherId: string;
}

export const TeacherSchedule = ({ teacherId }: TeacherScheduleProps) => {
  const [selectedTab, setSelectedTab] = useState("upcoming");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState<string>("");
  
  const {
    schedules,
    isLoading,
    filters,
    setFilters,
    markCompleted,
    cancelRevision
  } = useScheduleData(teacherId, selectedStudentId, selectedTab);

  // Handle student selection from search component
  const handleStudentSelect = (studentId: string, studentName: string) => {
    setSelectedStudentId(studentId);
    setSelectedStudentName(studentName);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Revision Schedule</h2>
          <p className="text-muted-foreground">
            Schedule and manage revisions for your students
          </p>
        </div>
        <ScheduleActions tab={selectedTab} />
      </div>

      <StudentSearch 
        onStudentSelect={handleStudentSelect}
        selectedStudentId={selectedStudentId}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Revision Schedules</CardTitle>
          <CardDescription>
            {selectedStudentName 
              ? `Viewing schedules for ${selectedStudentName}` 
              : "Viewing all student schedules"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue={selectedTab} value={selectedTab} onValueChange={setSelectedTab}>
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4">
              <TabsList>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>

              <ScheduleFilters
                filterPriority={filters.priority}
                setFilterPriority={(priority) => setFilters({...filters, priority})}
                searchQuery={filters.searchQuery}
                setSearchQuery={(query) => setFilters({...filters, searchQuery: query})}
              />
            </div>

            <TabsContent value="upcoming">
              <ScheduleList 
                schedules={schedules} 
                isLoading={isLoading}
                selectedStudentName={selectedStudentName}
                onComplete={markCompleted}
                onCancel={cancelRevision}
              />
            </TabsContent>

            <TabsContent value="completed">
              <ScheduleList 
                schedules={schedules} 
                isLoading={isLoading}
                selectedStudentName={selectedStudentName}
                onComplete={markCompleted}
                onCancel={cancelRevision}
              />
            </TabsContent>

            <TabsContent value="cancelled">
              <ScheduleList 
                schedules={schedules} 
                isLoading={isLoading}
                selectedStudentName={selectedStudentName}
                onComplete={markCompleted}
                onCancel={cancelRevision}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
