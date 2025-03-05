
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyStudents } from "./MyStudents";
import { ProgressRecording } from "./ProgressRecording";
import { TeacherSchedule } from "./TeacherSchedule";
import { CalendarDays, LineChart, Users } from "lucide-react";

interface Teacher {
  id: string;
  name: string;
  subject: string;
  experience: string;
  email?: string;
  bio?: string;
  phone?: string;
}

interface TeacherDashboardProps {
  teacher: Teacher;
}

interface SummaryData {
  studentsCount: number;
  recentProgressEntries: number;
  todayClasses: number;
}

// Simple type for Supabase query results to avoid deep type instantiation
interface SupabaseQueryResult {
  data: any[] | null;
  error: any | null;
}

export const TeacherDashboard = ({ teacher }: TeacherDashboardProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data: summaryData } = useQuery({
    queryKey: ['teacher-summary', teacher.id],
    queryFn: async (): Promise<SummaryData> => {
      // Cast the query results to avoid deep type instantiation
      const studentsResponse = await supabase
        .from('students_teachers')
        .select('id')
        .eq('teacher_id', teacher.id) as SupabaseQueryResult;
      
      if (studentsResponse.error) {
        console.error('Error fetching assigned students:', studentsResponse.error);
      }
      
      const progressResponse = await supabase
        .from('progress')
        .select('id')
        .eq('teacher_id', teacher.id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) as SupabaseQueryResult;
      
      if (progressResponse.error) {
        console.error('Error fetching recent progress:', progressResponse.error);
      }
      
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const classesResponse = await supabase
        .from('schedules')
        .select('id')
        .eq('teacher_id', teacher.id)
        .eq('day_of_week', today) as SupabaseQueryResult;
      
      if (classesResponse.error) {
        console.error('Error fetching today classes:', classesResponse.error);
      }
      
      return {
        studentsCount: studentsResponse.data?.length || 0,
        recentProgressEntries: progressResponse.data?.length || 0,
        todayClasses: classesResponse.data?.length || 0
      };
    }
  });
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {teacher.name}</h1>
        <p className="text-muted-foreground">
          Teacher Portal - {teacher.subject} | Experience: {teacher.experience}
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData?.studentsCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total students assigned to you
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Progress</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData?.recentProgressEntries || 0}</div>
            <p className="text-xs text-muted-foreground">
              Progress entries in the last 7 days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData?.todayClasses || 0}</div>
            <p className="text-xs text-muted-foreground">
              Classes scheduled for today
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">My Students</TabsTrigger>
          <TabsTrigger value="progress">Record Progress</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Teaching Schedule</CardTitle>
              <CardDescription>
                Your upcoming classes for the week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeacherSchedule teacherId={teacher.id} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="students" className="space-y-4 mt-6">
          <MyStudents teacherId={teacher.id} />
        </TabsContent>
        
        <TabsContent value="progress" className="space-y-4 mt-6">
          <ProgressRecording teacherId={teacher.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
