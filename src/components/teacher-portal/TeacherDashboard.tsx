
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyStudents } from "./MyStudents";
import { ProgressRecording } from "./ProgressRecording";
import { TeacherSchedule } from "./TeacherSchedule";
import { TeacherMessages } from "./TeacherMessages";
import { TeacherProfile } from "./TeacherProfile";
import { TeacherGrading } from "./TeacherGrading";
import { TeacherAnalytics } from "./TeacherAnalytics";
import { CalendarDays, LineChart, Users, MessageSquare, Settings, GraduationCap, BarChart } from "lucide-react";

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

export const TeacherDashboard = ({ teacher }: TeacherDashboardProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data: summaryData } = useQuery({
    queryKey: ['teacher-summary', teacher.id],
    queryFn: async (): Promise<SummaryData> => {
      // Using destructuring to avoid deep type instantiation
      const { data: studentsData, error: studentsError } = await supabase
        .from('students_teachers')
        .select('id')
        .eq('teacher_id', teacher.id);
      
      if (studentsError) {
        console.error('Error fetching assigned students:', studentsError);
      }
      
      const { data: progressData, error: progressError } = await supabase
        .from('progress')
        .select('id')
        .eq('teacher_id', teacher.id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      
      if (progressError) {
        console.error('Error fetching recent progress:', progressError);
      }
      
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const { data: classesData, error: classesError } = await supabase
        .from('schedules')
        .select('id')
        .eq('teacher_id', teacher.id)
        .eq('day_of_week', today);
      
      if (classesError) {
        console.error('Error fetching today classes:', classesError);
      }
      
      return {
        studentsCount: studentsData?.length || 0,
        recentProgressEntries: progressData?.length || 0,
        todayClasses: classesData?.length || 0
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
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="grading">Grading</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
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
        
        <TabsContent value="grading" className="space-y-4 mt-6">
          <TeacherGrading teacherId={teacher.id} />
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4 mt-6">
          <TeacherAnalytics teacherId={teacher.id} />
        </TabsContent>
        
        <TabsContent value="messages" className="space-y-4 mt-6">
          <TeacherMessages teacherId={teacher.id} teacherName={teacher.name} />
        </TabsContent>
        
        <TabsContent value="profile" className="space-y-4 mt-6">
          <TeacherProfile teacher={teacher} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
